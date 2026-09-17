import Link from "next/link";
import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import ExpenseActions from "./ExpenseActions";
import ReceiptPanel from "./ReceiptPanel";
import {
  approveExpense,
  rejectExpense,
  resubmitExpense,
  deleteExpense,
  uploadReceipt,
  deleteReceipt,
} from "../actions";
import type { ExpenseStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function ExpenseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: expense }, { data: receipts }] = await Promise.all([
    supabase.from("expenses").select("*").eq("id", id).single(),
    supabase.from("expense_attachments").select("*").eq("expense_id", id).order("created_at"),
  ]);

  if (!expense) notFound();

  const [{ data: category }, { data: vendor }] = await Promise.all([
    supabase.from("expense_categories").select("name").eq("id", expense.category_id).single(),
    expense.party_id
      ? supabase.from("parties").select("name").eq("id", expense.party_id).single()
      : Promise.resolve({ data: null }),
  ]);

  const canApprove = profile.role === "owner" || profile.role === "accounts";
  const isOwnEntry = expense.created_by === profile.id;
  const canEdit = canApprove || (isOwnEntry && expense.status !== "approved");

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/expenses" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Expenses
          </Link>
          <h1 className="text-2xl font-bold text-matte-black mt-2">{expense.description}</h1>
          <span
            className={`inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
              STATUS_STYLES[expense.status]
            }`}
          >
            {expense.status}
          </span>
        </div>

        {canEdit && (
          <Link
            href={`/expenses/${id}/edit`}
            className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
        )}
      </div>

      {expense.status === "rejected" && expense.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-900">Rejected</p>
          <p className="text-sm text-red-800 mt-1">{expense.rejection_reason}</p>
        </div>
      )}

      <div className="mb-6">
        <ExpenseActions
          expenseId={id}
          status={expense.status}
          canApprove={canApprove}
          canEdit={canEdit}
          approve={approveExpense}
          reject={rejectExpense}
          resubmit={resubmitExpense}
          remove={deleteExpense}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between items-start mb-6 pb-6 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount</p>
            <p className="text-3xl font-bold text-matte-black">{formatPaise(expense.amount_paise)}</p>
            {expense.tax_paise > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Includes {formatPaise(expense.tax_paise)} GST · net {formatPaise(expense.amount_paise - expense.tax_paise)}
              </p>
            )}
          </div>
        </div>

        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-gray-500">Date</dt>
            <dd className="text-gray-900">{formatDate(expense.spent_on)}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Category</dt>
            <dd className="text-gray-900">{category?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Vendor</dt>
            <dd className="text-gray-900">{vendor?.name ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-gray-500">Paid by</dt>
            <dd className="text-gray-900 capitalize">{expense.payment_method.replace("_", " ")}</dd>
          </div>
          {expense.reference && (
            <div>
              <dt className="text-gray-500">Reference</dt>
              <dd className="text-gray-900">{expense.reference}</dd>
            </div>
          )}
          {expense.project_tag && (
            <div>
              <dt className="text-gray-500">Project</dt>
              <dd className="text-gray-900">{expense.project_tag}</dd>
            </div>
          )}
          {expense.approved_at && (
            <div>
              <dt className="text-gray-500">Approved</dt>
              <dd className="text-gray-900">{formatDate(expense.approved_at)}</dd>
            </div>
          )}
          {expense.notes && (
            <div className="sm:col-span-2">
              <dt className="text-gray-500">Notes</dt>
              <dd className="text-gray-900">{expense.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      <ReceiptPanel
        expenseId={id}
        canEdit={canEdit}
        upload={uploadReceipt}
        remove={deleteReceipt}
        receipts={(receipts ?? []).map((receipt) => ({
          id: receipt.id,
          fileName: receipt.file_name,
          sizeBytes: receipt.size_bytes,
        }))}
      />
    </div>
  );
}
