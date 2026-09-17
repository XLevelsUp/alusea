import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise, paiseToWords } from "@/lib/erp/money";
import InvoiceActions from "./InvoiceActions";
import PaymentPanel from "./PaymentPanel";
import {
  issueInvoice,
  cancelInvoice,
  regenerateInvoicePdf,
  deleteDraftInvoice,
  recordPayment,
  deletePayment,
} from "../actions";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("owner", "accounts", "sales");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: invoice }, { data: items }, { data: payments }, { data: balance }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
    supabase.from("payments").select("*").eq("invoice_id", id).order("paid_on", { ascending: false }),
    supabase.from("invoice_balances").select("*").eq("invoice_id", id).single(),
  ]);

  if (!invoice) notFound();

  const { data: party } = await supabase.from("parties").select("*").eq("id", invoice.party_id).single();

  const canWrite = profile.role === "owner" || profile.role === "accounts";
  const isDraft = invoice.status === "draft";
  const balancePaise = balance?.balance_paise ?? invoice.total_paise;
  const paidPaise = balance?.paid_paise ?? 0;

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/invoices" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Invoices
          </Link>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black mt-2">
            {invoice.invoice_number ?? "Draft Invoice"}
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                invoice.status === "issued"
                  ? "bg-green-50 text-green-700"
                  : invoice.status === "cancelled"
                    ? "bg-red-50 text-red-700"
                    : "bg-gray-100 text-gray-600"
              }`}
            >
              {invoice.status}
            </span>
            {!invoice.is_gst_applicable && (
              <span className="text-xs text-gray-500">No GST on this invoice</span>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          {isDraft && canWrite && (
            <Link
              href={`/invoices/${id}/edit`}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          )}
          {invoice.pdf_path && (
            <a
              href={`/invoices/${id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
            >
              Open PDF
            </a>
          )}
        </div>
      </div>

      {invoice.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-red-900">
            Cancelled on {formatDate(invoice.cancelled_at)}
          </p>
          <p className="text-sm text-red-800 mt-1">{invoice.cancellation_reason}</p>
        </div>
      )}

      <div className="mb-6">
        <InvoiceActions
          invoiceId={id}
          status={invoice.status}
          hasPdf={!!invoice.pdf_path}
          canWrite={canWrite}
          issue={issueInvoice}
          cancel={cancelInvoice}
          regenerate={regenerateInvoicePdf}
          deleteDraft={deleteDraftInvoice}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Billed to</p>
          <p className="font-bold text-gray-900">{party?.name ?? "—"}</p>
          {party?.billing_city && (
            <p className="text-sm text-gray-600">
              {[party.billing_city, party.billing_state].filter(Boolean).join(", ")}
            </p>
          )}
          {party?.gstin && <p className="text-sm text-gray-600 font-mono text-xs mt-1">GSTIN: {party.gstin}</p>}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Issued</span>
            <span className="text-gray-900">{formatDate(invoice.issue_date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Due</span>
            <span className="text-gray-900">{formatDate(invoice.due_date)}</span>
          </div>
          {invoice.place_of_supply_state && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Place of supply</span>
              <span className="text-gray-900">{invoice.place_of_supply_state}</span>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Qty</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Rate</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items?.map((item) => (
                <tr key={item.id}>
                  <td className="p-4 text-sm text-gray-900">
                    {item.description}
                    {item.width_ft && item.height_ft && (
                      <span className="block text-xs text-gray-400">
                        {item.width_ft} ft × {item.height_ft} ft
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600 text-right whitespace-nowrap">
                    {Number(item.quantity)} {item.unit}
                  </td>
                  <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(item.rate_paise)}</td>
                  <td className="p-4 text-sm text-gray-900 text-right">{formatPaise(item.amount_paise)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-100">
          <div className="ml-auto max-w-sm space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span className="text-gray-900">{formatPaise(invoice.subtotal_paise)}</span>
            </div>
            {invoice.igst_paise > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IGST @ {Number(invoice.gst_rate)}%</span>
                <span className="text-gray-900">{formatPaise(invoice.igst_paise)}</span>
              </div>
            )}
            {invoice.cgst_paise > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CGST @ {Number(invoice.gst_rate) / 2}%</span>
                  <span className="text-gray-900">{formatPaise(invoice.cgst_paise)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SGST @ {Number(invoice.gst_rate) / 2}%</span>
                  <span className="text-gray-900">{formatPaise(invoice.sgst_paise)}</span>
                </div>
              </>
            )}
            {invoice.rounding_paise !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rounding</span>
                <span className="text-gray-400">{formatPaise(invoice.rounding_paise)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-gray-300">
              <span className="font-bold uppercase text-sm tracking-wide text-gray-900">Total</span>
              <span className="font-bold text-lg text-gray-900">{formatPaise(invoice.total_paise)}</span>
            </div>
            {paidPaise > 0 && (
              <>
                <div className="flex justify-between text-sm pt-1">
                  <span className="text-gray-500">Paid</span>
                  <span className="text-green-700">{formatPaise(paidPaise)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>Balance</span>
                  <span className="text-gray-900">{formatPaise(balancePaise)}</span>
                </div>
              </>
            )}
            <p className="text-xs text-gray-400 pt-3 border-t border-gray-100 mt-3">
              {paiseToWords(invoice.total_paise)}
            </p>
          </div>
        </div>
      </div>

      {invoice.status !== "draft" && (
        <PaymentPanel
          invoiceId={id}
          payments={(payments ?? []).map((payment) => ({
            id: payment.id,
            paidOn: payment.paid_on,
            amountPaise: payment.amount_paise,
            method: payment.method,
            reference: payment.reference,
          }))}
          balancePaise={balancePaise}
          canWrite={canWrite}
          isIssued={invoice.status === "issued"}
          record={recordPayment}
          remove={deletePayment}
        />
      )}
    </div>
  );
}
