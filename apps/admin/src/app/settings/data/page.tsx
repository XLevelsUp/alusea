import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { financialYearOf } from "@/lib/erp/numbering";

const BACKUP_TABLES = [
  { key: "parties", label: "Clients & vendors" },
  { key: "quotes", label: "Quotations" },
  { key: "invoices", label: "Invoices" },
  { key: "payments", label: "Payments" },
  { key: "expenses", label: "Expenses" },
  { key: "employees", label: "Employees" },
  { key: "payroll_runs", label: "Payroll runs" },
  { key: "payslips", label: "Payslips" },
];

export default async function DataSettingsPage() {
  await requireRole("owner");

  const supabase = await createClient();
  const [{ data: issues }, { data: series }] = await Promise.all([
    supabase.from("integrity_issues").select("*"),
    supabase.from("document_series").select("*").order("financial_year", { ascending: false }),
  ]);

  const problems = issues ?? [];
  const currentYear = financialYearOf(new Date());
  const currentSeries = (series ?? []).filter((row) => row.financial_year === currentYear);

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Data Health</h1>
        <p className="text-gray-500 mt-2">Consistency checks, backups, and the financial-year position.</p>
      </div>

      <div
        className={`rounded-xl border p-6 mb-6 ${
          problems.length === 0 ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
        }`}
      >
        <h2
          className={`text-sm font-bold uppercase tracking-wider mb-2 ${
            problems.length === 0 ? "text-green-900" : "text-red-900"
          }`}
        >
          {problems.length === 0 ? "Everything reconciles" : `${problems.length} issue${problems.length === 1 ? "" : "s"} found`}
        </h2>

        {problems.length === 0 ? (
          <p className="text-sm text-green-800">
            Invoice line items sum to their totals, payslip components sum to their gross, payroll runs match their
            payslips, and no invoice is overpaid.
          </p>
        ) : (
          <>
            <p className="text-sm text-red-800 mb-4">
              These records disagree with themselves. Each one is worth opening before it reaches a client or an
              accountant.
            </p>
            <ul className="space-y-2">
              {problems.map((problem, index) => (
                <li key={`${problem.record_id}-${index}`} className="text-sm text-red-900">
                  <span className="font-semibold capitalize">{problem.record_type.replace("_", " ")}</span>
                  {problem.reference ? ` ${problem.reference}` : ""} — {problem.issue}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Backup</h2>
        <p className="text-xs text-gray-400 mb-5">
          Download any table as CSV. These are your records in a form that outlives this application.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BACKUP_TABLES.map((table) => (
            <a
              key={table.key}
              href={`/settings/data/export?table=${table.key}`}
              className="px-3 py-2 border border-gray-200 text-gray-600 text-xs font-semibold rounded hover:bg-gray-50 transition-colors text-center"
            >
              {table.label}
            </a>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-4">
          Supabase also takes its own database backups. This export is for handing data to someone else, not a
          replacement for those.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-1">Financial year</h2>
        <p className="text-xs text-gray-400 mb-5">
          Currently {currentYear}. Counters restart automatically on 1 April, carrying each prefix forward.
        </p>

        {currentSeries.length > 0 ? (
          <div className="space-y-2">
            {currentSeries.map((row) => (
              <div key={row.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{row.doc_type.replace("_", " ")}</span>
                <span className="font-mono text-xs">
                  {row.prefix}/{row.financial_year} · {row.last_number} issued
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No documents issued this financial year yet.</p>
        )}

        <Link
          href="/settings/numbering"
          className="inline-block mt-5 text-xs font-bold uppercase tracking-wider text-[#A67C52] hover:underline"
        >
          Numbering settings →
        </Link>
      </div>
    </div>
  );
}
