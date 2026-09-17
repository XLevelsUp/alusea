import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise, paiseToWords } from "@/lib/erp/money";
import QuoteActions from "./QuoteActions";
import { setQuoteStatus, convertQuoteToInvoice, regenerateQuotePdf, deleteQuote } from "../actions";

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireRole("owner", "accounts", "sales");
  const { id } = await params;

  const supabase = await createClient();
  const [{ data: quote }, { data: items }, { data: invoices }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("position"),
    supabase.from("invoices").select("id, invoice_number").eq("quote_id", id).limit(1),
  ]);

  if (!quote) notFound();

  const { data: party } = await supabase.from("parties").select("*").eq("id", quote.party_id).single();

  const canEdit = profile.role === "owner" || profile.role === "sales";
  const canConvert = profile.role === "owner" || profile.role === "accounts" || profile.role === "sales";
  const linkedInvoice = invoices?.[0];

  return (
    <div className="p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Link href="/quotes" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
            ← Back to Quotations
          </Link>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black mt-2">
            {quote.quote_number ?? "Draft Quotation"}
          </h1>
          <span className="inline-block mt-2 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600">
            {quote.status}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          {canEdit && (
            <Link
              href={`/quotes/${id}/edit`}
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
            >
              Edit
            </Link>
          )}
          {quote.pdf_path && (
            <a
              href={`/quotes/${id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
            >
              Open PDF
            </a>
          )}
        </div>
      </div>

      {linkedInvoice && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-blue-900">
            Invoiced as{" "}
            <Link href={`/invoices/${linkedInvoice.id}`} className="font-semibold underline">
              {linkedInvoice.invoice_number ?? "a draft invoice"}
            </Link>
          </p>
        </div>
      )}

      <div className="mb-6">
        <QuoteActions
          quoteId={id}
          status={quote.status}
          hasPdf={!!quote.pdf_path}
          canEdit={canEdit}
          canConvert={canConvert}
          alreadyInvoiced={!!linkedInvoice}
          setStatus={setQuoteStatus}
          convert={convertQuoteToInvoice}
          regenerate={regenerateQuotePdf}
          remove={deleteQuote}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <p className="text-xs uppercase tracking-wider text-gray-400 mb-2">Quoted to</p>
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
            <span className="text-gray-500">Date</span>
            <span className="text-gray-900">{formatDate(quote.issue_date)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Valid until</span>
            <span className="text-gray-900">{formatDate(quote.valid_until)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
              <span className="text-gray-900">{formatPaise(quote.subtotal_paise)}</span>
            </div>
            {quote.igst_paise > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">IGST @ {Number(quote.gst_rate)}%</span>
                <span className="text-gray-900">{formatPaise(quote.igst_paise)}</span>
              </div>
            )}
            {quote.cgst_paise > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">CGST @ {Number(quote.gst_rate) / 2}%</span>
                  <span className="text-gray-900">{formatPaise(quote.cgst_paise)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">SGST @ {Number(quote.gst_rate) / 2}%</span>
                  <span className="text-gray-900">{formatPaise(quote.sgst_paise)}</span>
                </div>
              </>
            )}
            {quote.rounding_paise !== 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Rounding</span>
                <span className="text-gray-400">{formatPaise(quote.rounding_paise)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 mt-2 border-t border-gray-300">
              <span className="font-bold uppercase text-sm tracking-wide text-gray-900">Total</span>
              <span className="font-bold text-lg text-gray-900">{formatPaise(quote.total_paise)}</span>
            </div>
            <p className="text-xs text-gray-400 pt-3 border-t border-gray-100 mt-3">
              {paiseToWords(quote.total_paise)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
