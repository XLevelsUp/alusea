import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import type { PaymentStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  unpaid: "bg-blue-50 text-blue-700",
  part_paid: "bg-amber-50 text-amber-700",
  paid: "bg-green-50 text-green-700",
  overdue: "bg-red-50 text-red-700",
  cancelled: "bg-gray-100 text-gray-400",
};

const STATUS_LABELS: Record<PaymentStatus, string> = {
  draft: "Draft",
  unpaid: "Unpaid",
  part_paid: "Part paid",
  paid: "Paid",
  overdue: "Overdue",
  cancelled: "Cancelled",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "unpaid", label: "Unpaid" },
  { key: "overdue", label: "Overdue" },
  { key: "paid", label: "Paid" },
];

export default async function InvoicesPage(props: { searchParams: Promise<{ filter?: string }> }) {
  await requireRole("owner", "accounts", "sales");

  const searchParams = await props.searchParams;
  const filter = searchParams?.filter ?? "all";

  const supabase = await createClient();
  const { data: balances } = await supabase
    .from("invoice_balances")
    .select("*")
    .order("issue_date", { ascending: false });

  const partyIds = [...new Set((balances ?? []).map((row) => row.party_id))];
  const { data: parties } = partyIds.length
    ? await supabase.from("parties").select("id, name").in("id", partyIds)
    : { data: [] };

  const nameById = new Map((parties ?? []).map((party) => [party.id, party.name]));

  const rows = (balances ?? []).filter((row) => {
    if (filter === "all") return true;
    if (filter === "unpaid") return row.payment_status === "unpaid" || row.payment_status === "part_paid";
    return row.payment_status === filter;
  });

  // Receivables exclude drafts and cancelled invoices, since neither is money owed.
  const outstanding = (balances ?? [])
    .filter((row) => row.payment_status === "unpaid" || row.payment_status === "part_paid" || row.payment_status === "overdue")
    .reduce((total, row) => total + row.balance_paise, 0);

  const overdue = (balances ?? [])
    .filter((row) => row.payment_status === "overdue")
    .reduce((total, row) => total + row.balance_paise, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Invoices</h1>
          <p className="text-gray-500 mt-2">Issue invoices, record payments, and track what is owed.</p>
        </div>
        <Link
          href="/invoices/new"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
        >
          + New Invoice
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Outstanding</p>
          <p className="text-2xl font-bold text-matte-black">{formatPaise(outstanding)}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Overdue</p>
          <p className={`text-2xl font-bold ${overdue > 0 ? "text-red-600" : "text-matte-black"}`}>
            {formatPaise(overdue)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Invoices</p>
          <p className="text-2xl font-bold text-matte-black">{balances?.length ?? 0}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((tab) => (
          <Link
            key={tab.key}
            href={`/invoices?filter=${tab.key}`}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${
              filter === tab.key ? "bg-matte-black text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Number</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Total</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.invoice_id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <Link href={`/invoices/${row.invoice_id}`} className="font-mono text-xs font-semibold text-[#A67C52] hover:underline">
                      {row.invoice_number ?? "Draft"}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{nameById.get(row.party_id) ?? "—"}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(row.issue_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    {row.days_overdue && row.days_overdue > 0 ? (
                      <span className="block text-xs text-red-600">{row.days_overdue} days overdue</span>
                    ) : null}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        STATUS_STYLES[row.payment_status]
                      }`}
                    >
                      {STATUS_LABELS[row.payment_status]}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-900 text-right">{formatPaise(row.total_paise)}</td>
                  <td className="p-4 text-sm text-right font-semibold">
                    {row.payment_status === "cancelled" ? "—" : formatPaise(row.balance_paise)}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No invoices here yet.
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
