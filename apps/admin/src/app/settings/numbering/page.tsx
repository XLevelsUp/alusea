import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DOC_TYPE_LABELS, peekDocumentNumber, financialYearOf, type DocType } from "@/lib/erp/numbering";

export default async function NumberingSettingsPage() {
  await requireRole("owner");

  const supabase = await createClient();
  const { data: series } = await supabase
    .from("document_series")
    .select("*")
    .order("financial_year", { ascending: false })
    .order("doc_type", { ascending: true });

  const currentYear = financialYearOf(new Date());
  const docTypes = Object.keys(DOC_TYPE_LABELS) as DocType[];
  const previews = await Promise.all(
    docTypes.map(async (docType) => ({ docType, preview: await peekDocumentNumber(docType) }))
  );

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Document Numbering</h1>
        <p className="text-gray-500 mt-2">
          Numbers are allocated automatically when a document is issued. They cannot be typed or edited.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Next numbers</h2>
        <p className="text-xs text-gray-400 mb-5">What the next document of each type will be given, in {currentYear}.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {previews.map(({ docType, preview }) => (
            <div key={docType} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
              <p className="text-xs text-gray-500 mb-2">{DOC_TYPE_LABELS[docType]}</p>
              <p className="font-mono text-sm font-semibold text-matte-black">{preview ?? "—"}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">All series</h2>
          <p className="text-xs text-gray-400 mt-1">One per document type per financial year.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Document type</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Financial year</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Prefix</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Issued so far</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {series?.map((row) => (
                <tr key={row.id} className={row.financial_year === currentYear ? "" : "opacity-60"}>
                  <td className="p-4 text-sm text-gray-900">
                    {DOC_TYPE_LABELS[row.doc_type as DocType] ?? row.doc_type}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {row.financial_year}
                    {row.financial_year === currentYear && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-[#A67C52]">Current</span>
                    )}
                  </td>
                  <td className="p-4 text-sm font-mono text-gray-600">{row.prefix}</td>
                  <td className="p-4 text-sm text-gray-900 text-right font-semibold">{row.last_number}</td>
                </tr>
              ))}
              {(!series || series.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No series yet. They are created automatically when the first document is issued.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-3">How numbering works</h2>
        <ul className="text-sm text-gray-600 space-y-2 list-disc pl-5">
          <li>
            The format is <span className="font-mono text-xs">PREFIX/YEAR/NUMBER</span>, for example{" "}
            <span className="font-mono text-xs">ALU/{currentYear}/0001</span>.
          </li>
          <li>The counter restarts at 0001 each 1 April, so the financial year is legible from any number.</li>
          <li>GST and non-GST invoices use separate series, which keeps them easy to separate at filing time.</li>
          <li>
            Numbers are allocated by the database, so two people issuing invoices at the same moment can never receive
            the same number.
          </li>
          <li>
            A cancelled invoice keeps its number and is marked cancelled. Numbers are never reused, so the series stays
            gapless.
          </li>
        </ul>
      </div>
    </div>
  );
}
