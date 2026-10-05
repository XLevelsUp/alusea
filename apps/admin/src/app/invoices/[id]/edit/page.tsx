import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { loadDocumentFormData } from "@/lib/erp/formData";
import DocumentForm from "@/components/erp/DocumentForm";
import { toEditorLines } from "@/components/erp/LineItemsEditor";
import { updateInvoice } from "../../actions";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole("owner", "accounts");

  const { id } = await params;
  const supabase = await createClient();

  const [{ data: invoice }, { data: items }] = await Promise.all([
    supabase.from("invoices").select("*").eq("id", id).single(),
    supabase.from("invoice_items").select("*").eq("invoice_id", id).order("position"),
  ]);

  if (!invoice) notFound();

  // An issued invoice is frozen, so editing it is not offered at all.
  if (invoice.status !== "draft") {
    redirect(`/invoices/${id}`);
  }

  const { parties, companyStateCode } = await loadDocumentFormData();

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Edit Draft Invoice</h1>
          <p className="text-gray-500 mt-2">Still a draft, so nothing has been numbered yet.</p>
        </div>
        <Link href={`/invoices/${id}`} className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Invoice
        </Link>
      </div>

      <DocumentForm
        kind="invoice"
        documentId={id}
        parties={parties}
        companyStateCode={companyStateCode}
        initial={{
          partyId: invoice.party_id,
          issueDate: invoice.issue_date,
          secondDate: invoice.due_date ?? "",
          isGstApplicable: invoice.is_gst_applicable,
          gstRate: Number(invoice.gst_rate),
          notes: invoice.notes,
          lines: toEditorLines(items ?? []),
        }}
        save={updateInvoice}
        cancelUrl={`/invoices/${id}`}
      />
    </div>
  );
}
