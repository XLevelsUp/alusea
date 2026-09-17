import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const PREVIEWS = [
  {
    label: "Tax Invoice — same state",
    description: "CGST and SGST split, as used for a client in your own state.",
    href: "/settings/documents/preview?template=invoice&gst=true",
  },
  {
    label: "Tax Invoice — other state",
    description: "IGST as a single line, as used for a client outside your state.",
    href: "/settings/documents/preview?template=invoice&gst=true&interstate=true",
  },
  {
    label: "Invoice without GST",
    description: "The GST toggle switched off, so no tax block appears.",
    href: "/settings/documents/preview?template=invoice&gst=false",
  },
  {
    label: "Payslip",
    description: "A monthly-salary employee with overtime and a bonus.",
    href: "/settings/documents/preview?template=payslip",
  },
];

export default async function DocumentSettingsPage() {
  await requireRole("owner");

  const supabase = await createClient();
  const { data: company } = await supabase
    .from("company_profile")
    .select("legal_name, gstin, state_code, bank_account_number, invoice_terms")
    .eq("id", 1)
    .single();

  const missing = [
    { label: "Legal name", filled: !!company?.legal_name, why: "printed as the supplier on every document" },
    { label: "State", filled: !!company?.state_code, why: "decides IGST versus CGST plus SGST" },
    { label: "GSTIN", filled: !!company?.gstin, why: "required on a tax invoice" },
    { label: "Bank details", filled: !!company?.bank_account_number, why: "tells clients where to pay" },
    { label: "Terms & conditions", filled: !!company?.invoice_terms, why: "printed at the foot of invoices" },
  ];

  const incomplete = missing.filter((item) => !item.filled);

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Document Templates</h1>
        <p className="text-gray-500 mt-2">
          Preview how invoices, quotations and payslips will look, using your real company details.
        </p>
      </div>

      {incomplete.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-900 mb-2">
            Company details still needed
          </h2>
          <p className="text-sm text-amber-800 mb-3">
            Previews will render, but these will be blank on a real document.
          </p>
          <ul className="text-sm text-amber-800 space-y-1 list-disc pl-5">
            {incomplete.map((item) => (
              <li key={item.label}>
                <span className="font-semibold">{item.label}</span> — {item.why}
              </li>
            ))}
          </ul>
          <a
            href="/settings/company"
            className="inline-block mt-4 text-xs font-bold uppercase tracking-wider text-amber-900 underline"
          >
            Fill in company details
          </a>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">Previews</h2>
          <p className="text-xs text-gray-400 mt-1">
            Each opens a sample PDF in a new tab. Nothing is saved and no document number is consumed.
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {PREVIEWS.map((preview) => (
            <div key={preview.href} className="p-5 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900 text-sm">{preview.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{preview.description}</p>
              </div>
              <a
                href={preview.href}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
              >
                Open PDF
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-3">How documents are stored</h2>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>Issued documents are rendered once and kept in a private storage bucket, separate from website images.</li>
          <li>They are never public. A link is signed on request and expires after ten minutes.</li>
          <li>Invoices and quotations are readable by owner, accounts and sales; payslips only by owner and HR.</li>
          <li>Reissuing a document replaces its file rather than leaving copies behind.</li>
        </ul>
      </div>
    </div>
  );
}
