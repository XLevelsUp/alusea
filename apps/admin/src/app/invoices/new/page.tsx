import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { loadDocumentFormData } from "@/lib/erp/formData";
import DocumentForm from "@/components/erp/DocumentForm";
import { createInvoice } from "../actions";

export default async function NewInvoicePage() {
  await requireRole("owner", "accounts");

  const { parties, products, companyStateCode, defaultGstRate } = await loadDocumentFormData();

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">New Invoice</h1>
          <p className="text-gray-500 mt-2">Saved as a draft. It takes a number only when you issue it.</p>
        </div>
        <Link href="/invoices" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Invoices
        </Link>
      </div>

      {parties.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
          <p className="text-gray-600 mb-4">You need at least one client before raising an invoice.</p>
          <Link
            href="/parties?add=true"
            className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors"
          >
            Add a client
          </Link>
        </div>
      ) : (
        <DocumentForm
          kind="invoice"
          parties={parties}
          products={products}
          companyStateCode={companyStateCode}
          initial={{
            partyId: "",
            issueDate: new Date().toISOString().slice(0, 10),
            secondDate: "",
            isGstApplicable: true,
            gstRate: defaultGstRate,
            notes: "",
            lines: [],
          }}
          save={createInvoice}
          cancelUrl="/invoices"
        />
      )}
    </div>
  );
}
