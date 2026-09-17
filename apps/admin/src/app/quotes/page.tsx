import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import type { QuoteStatus } from "@/lib/supabase/types";

const STATUS_STYLES: Record<QuoteStatus, string> = {
  draft: "bg-gray-100 text-gray-600",
  sent: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
  expired: "bg-amber-50 text-amber-700",
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "draft", label: "Drafts" },
  { key: "sent", label: "Sent" },
  { key: "accepted", label: "Accepted" },
];

export default async function QuotesPage(props: { searchParams: Promise<{ filter?: string }> }) {
  await requireRole("owner", "accounts", "sales");

  const searchParams = await props.searchParams;
  const filter = searchParams?.filter ?? "all";

  const supabase = await createClient();
  const statuses: QuoteStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];
  const statusFilter = statuses.find((status) => status === filter);

  let request = supabase.from("quotes").select("*").order("issue_date", { ascending: false });
  if (statusFilter) request = request.eq("status", statusFilter);

  const { data: quotes } = await request;

  const partyIds = [...new Set((quotes ?? []).map((quote) => quote.party_id))];
  const { data: parties } = partyIds.length
    ? await supabase.from("parties").select("id, name").in("id", partyIds)
    : { data: [] };

  const nameById = new Map((parties ?? []).map((party) => [party.id, party.name]));

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Quotations</h1>
          <p className="text-gray-500 mt-2">Price a job, send it, then turn an accepted quote into an invoice.</p>
        </div>
        <Link
          href="/quotes/new"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
        >
          + New Quotation
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((tab) => (
          <Link
            key={tab.key}
            href={`/quotes?filter=${tab.key}`}
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quotes?.map((quote) => (
                <tr key={quote.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <Link href={`/quotes/${quote.id}`} className="font-mono text-xs font-semibold text-[#A67C52] hover:underline">
                      {quote.quote_number ?? "Draft"}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-900">{nameById.get(quote.party_id) ?? "—"}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(quote.issue_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[quote.status]}`}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-900 text-right font-semibold">{formatPaise(quote.total_paise)}</td>
                </tr>
              ))}
              {(!quotes || quotes.length === 0) && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No quotations here yet.
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
