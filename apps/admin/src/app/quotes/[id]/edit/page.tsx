import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadDocumentFormData } from "@/lib/erp/formData";
import DocumentForm from "@/components/erp/DocumentForm";
import { toEditorLines } from "@/components/erp/LineItemsEditor";
import { updateQuote } from "../../actions";

export default async function EditQuotePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("owner", "sales");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: quote }, { data: items }] = await Promise.all([
    supabase.from("quotes").select("*").eq("id", id).single(),
    supabase.from("quote_items").select("*").eq("quote_id", id).order("position"),
  ]);

  if (!quote) notFound();

  const { parties, companyStateCode } = await loadDocumentFormData();

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Edit Quotation</h1>
          {quote.quote_number && <p className="text-gray-500 mt-2 font-mono text-sm">{quote.quote_number}</p>}
        </div>
        <Link href={`/quotes/${id}`} className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Quotation
        </Link>
      </div>

      <DocumentForm
        kind="quote"
        documentId={id}
        parties={parties}
        companyStateCode={companyStateCode}
        initial={{
          partyId: quote.party_id,
          issueDate: quote.issue_date,
          secondDate: quote.valid_until ?? "",
          isGstApplicable: quote.is_gst_applicable,
          gstRate: Number(quote.gst_rate),
          notes: quote.notes,
          lines: toEditorLines(items ?? []),
        }}
        save={updateQuote}
        cancelUrl={`/quotes/${id}`}
      />
    </div>
  );
}
