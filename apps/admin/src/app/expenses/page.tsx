import { todayInIndia } from "@/lib/erp/dates";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/session";
import { isOwnerLevel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import type { ExpenseStatus } from "@/lib/supabase/types";
import { EXPENSE_STATUS_LABELS, SETTLEMENT, settlementOf } from "@/lib/erp/expenses";
import { fetchAll } from "@/lib/erp/fetchAll";
import { SelectField, TextField } from "@/components/form-fields";
import AutoFilterForm from "@/components/AutoFilterForm";
import Pagination, { PAGE_SIZE } from "@/components/Pagination";
import SortHeader from "@/components/SortHeader";
import { SearchSelectField } from "@/components/SearchSelect";
import { NativeSelectOption } from "@/components/ui/native-select";
import { ApproveAllButton, ExpenseRowActions } from "./ExpenseRowActions";

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
  return `${todayInIndia().slice(0, 8)}01`;
}

export default async function ExpensesPage(props: {
  searchParams: Promise<{ status?: string; category?: string; client?: string; payment?: string; from?: string; to?: string; page?: string; sort?: string; dir?: string }>;
}) {
  const profile = await requireProfile();
  const searchParams = await props.searchParams;

  const status = searchParams?.status ?? "all";
  const categoryId = searchParams?.category ?? "";
  const clientId = searchParams?.client ?? "";
  const payment = searchParams?.payment ?? "all";
  // A client's history is the point of the client filter, so it starts from the beginning rather than this month.
  const from = searchParams?.from ?? (clientId ? "2000-01-01" : firstOfMonth());
  const to = searchParams?.to ?? todayInIndia();

  const supabase = await createClient();

  const statuses: ExpenseStatus[] = ["draft", "submitted", "approved", "rejected"];
  const statusFilter = statuses.find((value) => value === status);

  // Built per chunk, since the totals below need every expense in the range, not just the first thousand.
  const expensesInRange = (first: number, last: number) => {
    let request = supabase
      .from("expenses")
      .select("*")
      .gte("spent_on", from)
      .lte("spent_on", to)
      .order("spent_on", { ascending: false })
      .order("id");

    if (statusFilter) request = request.eq("status", statusFilter);
    if (categoryId) request = request.eq("category_id", categoryId);
    if (clientId) request = request.eq("client_id", clientId);
    return request.range(first, last);
  };

  const [{ data: expenses }, { data: categories }, { data: clients }] = await Promise.all([
    fetchAll(expensesInRange),
    supabase.from("expense_categories").select("id, name").eq("is_active", true).order("sort_order"),
    // Inactive clients stay listed, so an old client's expenses can still be found.
    supabase.from("parties").select("id, name").eq("is_client", true).order("name"),
  ]);

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]));
  const clientById = new Map((clients ?? []).map((client) => [client.id, client.name]));

  const allRows = expenses ?? [];
  // Paid and reimbursed are worked out from each expense rather than stored as a status, so this filter runs here, not in the query.
  const rows = allRows.filter((row) => {
    if (payment === "all") return true;
    const settlement = settlementOf(row);
    if (payment === "settled") return settlement === "paid" || settlement === "reimbursed";
    return settlement === payment;
  });

  // Sorting is done here on the rows already loaded: newest first unless a column heading was clicked.
  const SORTS = ["date", "description", "amount"] as const;
  const sort = SORTS.find((key) => key === searchParams?.sort) ?? "date";
  const dir = searchParams?.dir === "asc" ? "asc" : "desc";
  rows.sort((a, b) => {
    const order =
      sort === "amount" ? a.amount_paise - b.amount_paise : sort === "description" ? a.description.localeCompare(b.description, "en-IN") : a.spent_on.localeCompare(b.spent_on);
    return dir === "asc" ? order : -order;
  });
  const filterParams = { from, to, status, payment, ...(categoryId ? { category: categoryId } : {}), ...(clientId ? { client: clientId } : {}) };
  // Clicking the sorted column flips it; another column starts A to Z for text and largest or newest first otherwise.
  const sortHref = (key: (typeof SORTS)[number]) =>
    `/expenses?${new URLSearchParams({ ...filterParams, sort: key, dir: sort === key ? (dir === "asc" ? "desc" : "asc") : key === "description" ? "asc" : "desc" })}`;
  const directionOf = (key: (typeof SORTS)[number]) => (sort === key ? dir : null);

  // The totals use every matching row; only the table is cut into pages.
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const page = Math.min(pageCount, Math.max(1, Math.floor(Number(searchParams?.page)) || 1));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const pageHref = (target: number) =>
    `/expenses?${new URLSearchParams({ ...filterParams, sort, dir, page: String(target) })}`;

  const toReimburse = allRows.filter((row) => settlementOf(row) === "to_reimburse");
  const toReimburseTotal = toReimburse.reduce((total, row) => total + row.amount_paise, 0);

  // Approved spend per category, largest first, for the breakdown under the totals.
  const byCategory = new Map<string, number>();
  for (const row of rows) {
    if (row.status !== "approved") continue;
    byCategory.set(row.category_id, (byCategory.get(row.category_id) ?? 0) + row.amount_paise);
  }
  const breakdown = [...byCategory.entries()]
    .map(([id, paise]) => ({ id, name: categoryById.get(id) ?? "Uncategorised", paise }))
    .sort((a, b) => b.paise - a.paise);
  const breakdownMax = Math.max(1, ...breakdown.map((entry) => entry.paise));

  const approvedTotal = rows
    .filter((row) => row.status === "approved")
    .reduce((total, row) => total + row.amount_paise, 0);
  const waitingRows = rows.filter((row) => row.status === "submitted");
  const pendingTotal = waitingRows.reduce((total, row) => total + row.amount_paise, 0);
  const gstTotal = rows
    .filter((row) => row.status === "approved")
    .reduce((total, row) => total + row.tax_paise, 0);

  const canApprove = isOwnerLevel(profile.role) || profile.role === "accounts";
  const exportQuery = new URLSearchParams({ from, to, ...(categoryId ? { category: categoryId } : {}) }).toString();
  const newExpenseHref = clientId ? `/expenses/new?client=${clientId}` : "/expenses/new";

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Expenses</h1>
          <p className="text-gray-500 mt-2">
            {canApprove ? "Everything the business has spent." : "Expenses you have filed."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <a href={`/expenses/export?${exportQuery}`}>Export CSV</a>
          </Button>
          <Button asChild variant="brand">
            <Link href={newExpenseHref}>
              <PlusIcon aria-hidden="true" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Owed to people</p>
          <p className={`text-2xl font-bold ${toReimburseTotal > 0 ? "text-amber-700" : "text-matte-black"}`}>
            {formatPaise(toReimburseTotal)}
          </p>
          <p className="text-xs text-gray-500 mt-1">{toReimburse.length} to pay back</p>
        </div>
      </div>

      {breakdown.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-4">Approved spend by category</h2>
          <ul className="space-y-3">
            {breakdown.map((entry) => (
              <li key={entry.id}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{entry.name}</span>
                  <span className="font-semibold text-gray-900">{formatPaise(entry.paise)}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-[#A67C52]" style={{ width: `${Math.max(2, (entry.paise / breakdownMax) * 100)}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <AutoFilterForm className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 pb-3 mb-6" action="/expenses">
        <input type="hidden" name="sort" value={sort} />
        <input type="hidden" name="dir" value={dir} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <TextField label="From" name="from" type="date" defaultValue={from} />
          <TextField label="To" name="to" type="date" defaultValue={to} />
          <SelectField label="Category" name="category" defaultValue={categoryId}>
            <NativeSelectOption value="">All categories</NativeSelectOption>
            {categories?.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </SelectField>
          {(clients?.length ?? 0) > 0 && (
            <SearchSelectField
              label="Client"
              name="client"
              defaultValue={clientId}
              emptyLabel="All clients"
              options={(clients ?? []).map((client) => ({ value: client.id, label: client.name }))}
            />
          )}
          <SelectField label="Status" name="status" defaultValue={status}>
            {FILTERS.map((filter) => (
              <NativeSelectOption key={filter.key} value={filter.key}>
                {filter.label}
              </NativeSelectOption>
            ))}
          </SelectField>
          <SelectField label="Payment" name="payment" defaultValue={payment}>
            <NativeSelectOption value="all">Any</NativeSelectOption>
            <NativeSelectOption value="to_pay">To pay</NativeSelectOption>
            <NativeSelectOption value="to_reimburse">To pay back</NativeSelectOption>
            <NativeSelectOption value="settled">Paid or paid back</NativeSelectOption>
          </SelectField>
        </div>
      </AutoFilterForm>

      {canApprove && waitingRows.length > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <p className="text-sm text-gray-600">
            {waitingRows.length} expenses in this list are waiting for approval, {formatPaise(pendingTotal)} in total.
          </p>
          <ApproveAllButton ids={waitingRows.map((row) => row.id)} totalPaise={pendingTotal} />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <SortHeader label="Date" className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider" direction={directionOf("date")} href={sortHref("date")} />
                <SortHeader label="Description" className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider" direction={directionOf("description")} href={sortHref("description")} />
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Client</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <SortHeader label="Amount" align="right" className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider" direction={directionOf("amount")} href={sortHref("amount")} />
                {canApprove && <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageRows.map((expense) => (
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
                    {/* The Category and Client columns are hidden on a phone, so both are shown here instead. */}
                    <span className="block text-xs text-gray-500 md:hidden">
                      {categoryById.get(expense.category_id) ?? "—"}
                      {expense.client_id && clientById.has(expense.client_id) && ` · ${clientById.get(expense.client_id)}`}
                    </span>
                    {expense.project_tag && (
                      <span className="block text-xs text-gray-500">{expense.project_tag}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-gray-600 hidden md:table-cell">{categoryById.get(expense.category_id) ?? "—"}</td>
                  <td className="p-4 text-sm text-gray-600 hidden md:table-cell">
                    {expense.client_id && clientById.has(expense.client_id) ? (
                      <Link href={`/parties/${expense.client_id}`} className="hover:text-[#A67C52]">
                        {clientById.get(expense.client_id)}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[expense.status]
                      }`}
                    >
                      {EXPENSE_STATUS_LABELS[expense.status]}
                    </span>
                    {(() => {
                      const settlement = settlementOf(expense);
                      return settlement ? (
                        <span className={`inline-block mt-1 ml-1 px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${SETTLEMENT[settlement].style}`}>
                          {SETTLEMENT[settlement].label}
                        </span>
                      ) : null;
                    })()}
                    {expense.paid_by === "person" && (
                      <span className="block text-xs text-gray-500 mt-1">Paid by {expense.paid_by_name}</span>
                    )}
                  </td>
                  <td className="p-4 text-sm text-right">
                    <span className="font-semibold text-gray-900">{formatPaise(expense.amount_paise)}</span>
                    {expense.tax_paise > 0 && (
                      <span className="block text-xs text-gray-500">incl. {formatPaise(expense.tax_paise)} GST</span>
                    )}
                  </td>
                  {canApprove && (
                    <td className="p-4 text-right whitespace-nowrap">
                      <ExpenseRowActions
                        expenseId={expense.id}
                        status={expense.status}
                        settlement={settlementOf(expense)}
                        payeeName={expense.paid_by_name || "them"}
                      />
                    </td>
                  )}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={canApprove ? 7 : 6} className="p-8 text-center text-gray-500">
                    {clientId ? "No expenses recorded for this client in this range." : "No expenses in this range."}
                    <div className="mt-4">
                      <Button asChild variant="brand">
                        <Link href={newExpenseHref}>
                          <PlusIcon aria-hidden="true" />
                          Add Expense
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination page={page} total={rows.length} noun="expenses" hrefFor={pageHref} />
      </div>
    </div>
  );
}
