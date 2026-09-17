import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadDocumentFormData } from "@/lib/erp/formData";
import DocumentForm from "@/components/erp/DocumentForm";
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

  const { parties, products, companyStateCode } = await loadDocumentFormData();

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Edit Quotation</h1>
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
        products={products}
        companyStateCode={companyStateCode}
        initial={{
          partyId: quote.party_id,
          issueDate: quote.issue_date,
          secondDate: quote.valid_until ?? "",
          isGstApplicable: quote.is_gst_applicable,
          gstRate: Number(quote.gst_rate),
          notes: quote.notes,
          lines: (items ?? []).map((item) => ({
            key: item.id,
            description: item.description,
            widthFt: item.width_ft?.toString() ?? "",
            heightFt: item.height_ft?.toString() ?? "",
            quantity: item.quantity.toString(),
            unit: item.unit,
            rate: (item.rate_paise / 100).toFixed(2),
            productId: item.product_id ?? "",
          })),
        }}
        save={updateQuote}
        cancelUrl={`/quotes/${id}`}
      />
    </div>
  );
}
