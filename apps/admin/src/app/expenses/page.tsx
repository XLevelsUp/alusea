import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import type { ExpenseStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<ExpenseStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  submitted: "bg-blue-50 text-blue-700",
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

const FILTERS: { key: string; label: string }[] = [
  { key: "all", label: "All" },
  { key: "submitted", label: "Awaiting approval" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

function firstOfMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export default async function ExpensesPage(props: {
  searchParams: Promise<{ status?: string; category?: string; from?: string; to?: string }>;
}) {
  const profile = await requireProfile();
  const searchParams = await props.searchParams;

  const status = searchParams?.status ?? "all";
  const categoryId = searchParams?.category ?? "";
  const from = searchParams?.from ?? firstOfMonth();
  const to = searchParams?.to ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  let request = supabase
    .from("expenses")
    .select("*")
    .gte("spent_on", from)
    .lte("spent_on", to)
    .order("spent_on", { ascending: false });

  const statuses: ExpenseStatus[] = ["draft", "submitted", "approved", "rejected"];
  const statusFilter = statuses.find((value) => value === status);
  if (statusFilter) request = request.eq("status", statusFilter);
  if (categoryId) request = request.eq("category_id", categoryId);

  const [{ data: expenses }, { data: categories }] = await Promise.all([
    request,
    supabase.from("expense_categories").select("id, name").eq("is_active", true).order("sort_order"),
  ]);

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]));

  const rows = expenses ?? [];
  const approvedTotal = rows
    .filter((row) => row.status === "approved")
    .reduce((total, row) => total + row.amount_paise, 0);
  const pendingTotal = rows
    .filter((row) => row.status === "submitted")
    .reduce((total, row) => total + row.amount_paise, 0);
  const gstTotal = rows
    .filter((row) => row.status === "approved")
    .reduce((total, row) => total + row.tax_paise, 0);

  const canApprove = profile.role === "owner" || profile.role === "accounts";
  const exportQuery = new URLSearchParams({ from, to, ...(categoryId ? { category: categoryId } : {}) }).toString();

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Expenses</h1>
          <p className="text-gray-500 mt-2">
            {canApprove ? "Everything the business has spent." : "Expenses you have filed."}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/expenses/export?${exportQuery}`}
            className="inline-flex items-center justify-center px-4 py-3 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
          >
            Export CSV
          </a>
          <Link
            href="/expenses/new"
            className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
          >
            + Add Expense
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Approved in range</p>
          <p className="text-2xl font-bold text-matte-black">{formatPaise(approvedTotal)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Awaiting approval</p>
          <p className={`text-2xl font-bold ${pendingTotal > 0 ? "text-blue-700" : "text-matte-black"}`}>
            {formatPaise(pendingTotal)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">GST paid</p>
          <p className="text-2xl font-bold text-matte-black">{formatPaise(gstTotal)}</p>
        </div>
      </div>

      <form className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6" action="/expenses">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="from">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              defaultValue={from}
              className="rounded px-3 py-2 bg-gray-50 border border-gray-200 w-full text-black text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="to">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              defaultValue={to}
              className="rounded px-3 py-2 bg-gray-50 border border-gray-200 w-full text-black text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="category">
              Category
            </label>
            <select
              id="category"
              name="category"
              defaultValue={categoryId}
              className="rounded px-3 py-2 bg-gray-50 border border-gray-200 w-full text-black text-sm"
            >
              <option value="">All categories</option>
              {categories?.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1" htmlFor="status">
              Status
            </label>
            <select
              id="status"
              name="status"
              defaultValue={status}
              className="rounded px-3 py-2 bg-gray-50 border border-gray-200 w-full text-black text-sm"
            >
              {FILTERS.map((filter) => (
                <option key={filter.key} value={filter.key}>
                  {filter.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-matte-black text-white text-xs font-bold uppercase tracking-wider rounded cursor-pointer hover:bg-black transition-colors"
          >
            Apply
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-600 whitespace-nowrap">
                    {new Date(expense.spent_on).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="p-4">
                    <Link href={`/expenses/${expense.id}`} className="text-sm font-medium text-gray-900 hover:text-[#A67C52]">
                      {expense.description}
                    </Link>
                    {expense.project_tag && (
                      <span className="block text-xs text-gray-400">{expense.project_tag}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600">{categoryById.get(expense.category_id) ?? "—"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[expense.status]
                      }`}
                    >
                      {expense.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <span className="font-semibold text-gray-900">{formatPaise(expense.amount_paise)}</span>
                    {expense.tax_paise > 0 && (
                      <span className="block text-xs text-gray-400">incl. {formatPaise(expense.tax_paise)} GST</span>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No expenses in this range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
