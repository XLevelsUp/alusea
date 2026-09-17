import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { formatPaise } from "@/lib/erp/money";
import { formatPeriod } from "@/lib/erp/payroll";

export default async function ReportsPage() {
  await requireRole("owner", "accounts");

  const supabase = await createClient();
  const [{ data: pnl }, { data: gst }] = await Promise.all([
    supabase.from("profit_and_loss_monthly").select("*").order("period_month", { ascending: false }).limit(24),
    supabase.from("gst_summary_monthly").select("*").order("period_month", { ascending: false }).limit(24),
  ]);

  const pnlRows = pnl ?? [];
  const gstRows = gst ?? [];

  const pnlTotals = pnlRows.reduce(
    (totals, row) => ({
      revenue: totals.revenue + row.revenue_paise,
      expenses: totals.expenses + row.expenses_paise,
      payroll: totals.payroll + row.payroll_paise,
      profit: totals.profit + row.profit_paise,
    }),
    { revenue: 0, expenses: 0, payroll: 0, profit: 0 }
  );

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Reports</h1>
        <p className="text-gray-500 mt-2">Month by month, for the last two years.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">Profit and loss</h2>
            <p className="text-xs text-gray-400 mt-1">
              Revenue is net of GST charged, expenses net of GST paid, so neither counts tax as income or cost.
            </p>
          </div>
          <a
            href="/reports/export?report=pnl"
            className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
          >
            Export CSV
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Expenses</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Payroll</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pnlRows.map((row) => (
                <tr key={row.period_month} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-900">{formatPeriod(row.period_month)}</td>
                  <td className="p-4 text-sm text-right text-gray-900">{formatPaise(row.revenue_paise)}</td>
                  <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(row.expenses_paise)}</td>
                  <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(row.payroll_paise)}</td>
                  <td
                    className={`p-4 text-sm text-right font-semibold ${
                      row.profit_paise < 0 ? "text-red-600" : "text-gray-900"
                    }`}
                  >
                    {formatPaise(row.profit_paise)}
                  </td>
                </tr>
              ))}
              {pnlRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nothing to report yet.
                  </td>
                </tr>
              )}
            </tbody>
            {pnlRows.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="p-4 text-sm font-bold uppercase tracking-wide text-gray-900">Total</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(pnlTotals.revenue)}</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(pnlTotals.expenses)}</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(pnlTotals.payroll)}</td>
                  <td
                    className={`p-4 text-right font-bold ${pnlTotals.profit < 0 ? "text-red-600" : "text-gray-900"}`}
                  >
                    {formatPaise(pnlTotals.profit)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black">GST summary</h2>
            <p className="text-xs text-gray-400 mt-1">
              Output tax charged against input tax paid. Hand this to your accountant to verify rather than filing from it directly.
            </p>
          </div>
          <a
            href="/reports/export?report=gst"
            className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded hover:bg-gray-50 transition-colors"
          >
            Export CSV
          </a>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Month</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Taxable sales
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Output tax
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                  Input tax
                </th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Net</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {gstRows.map((row) => (
                <tr key={row.period_month} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 text-sm text-gray-900">{formatPeriod(row.period_month)}</td>
                  <td className="p-4 text-sm text-right text-gray-900">{formatPaise(row.taxable_sales_paise)}</td>
                  <td className="p-4 text-sm text-right text-gray-900">{formatPaise(row.output_tax_paise)}</td>
                  <td className="p-4 text-sm text-gray-600 text-right">{formatPaise(row.input_tax_paise)}</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(row.net_tax_paise)}</td>
                </tr>
              ))}
              {gstRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No GST activity yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-6">
        Figures come from issued invoices and approved expenses. Drafts, cancelled invoices and unapproved expenses are
        excluded. See <Link href="/expenses" className="underline">Expenses</Link> for the detail behind any month.
      </p>
    </div>
  );
}
