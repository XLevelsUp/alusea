"use client";

import { useMemo } from "react";
import { DownloadIcon } from "lucide-react";
import { BarBreakdown, CHART_BRONZE, CHART_GREEN, CHART_GREY, CHART_RED, ProfitChart, TrendChart } from "@/components/erp/charts/FinanceCharts";
import { Button } from "@/components/ui/button";
import type { BreakdownItem } from "@/lib/erp/charts";
import { PAYMENT_METHOD_LABELS, SOURCE_LABELS, inRange } from "@/lib/erp/finance";
import { formatPaise } from "@/lib/erp/money";
import { Empty, Section, TH } from "./parts";
import type { ExpenseRow, GstReportRow, LedgerRow, MonthlyReportRow } from "./types";

type Range = { from: string | null; to: string | null };

function monthName(periodMonth: string): string {
  return new Date(`${periodMonth}T00:00:00`).toLocaleDateString("en-IN", { month: "long", year: "numeric" });
}

function shortMonth(periodMonth: string): string {
  return new Date(`${periodMonth}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

// Adds up amounts under whatever label each row falls into, ready for a breakdown chart.
function sumBy<T extends { amount_paise: number }>(rows: T[], labelOf: (row: T) => string): BreakdownItem[] {
  const map = new Map<string, number>();
  for (const row of rows) map.set(labelOf(row), (map.get(labelOf(row)) ?? 0) + row.amount_paise);
  return [...map.entries()].map(([label, value]) => ({ label, value }));
}

function ExportButton({ report }: { report: "pnl" | "gst" }) {
  return (
    <Button asChild size="sm" variant="outline">
      <a href={`/finances/export?report=${report}`}>
        <DownloadIcon aria-hidden="true" />
        Export CSV
      </a>
    </Button>
  );
}

// Month-by-month charts, breakdowns for the selected period, then the two reports that used to be the Reports page.
export default function AnalyticsTab({
  pnl,
  gst,
  ledger,
  expenses,
  range,
}: {
  pnl: MonthlyReportRow[];
  gst: GstReportRow[];
  ledger: LedgerRow[];
  expenses: ExpenseRow[];
  range: Range;
}) {
  const breakdowns = useMemo(() => {
    const moved = ledger.filter((row) => inRange(row.entry_date, range));
    const spent = expenses.filter((row) => inRange(row.spent_on, range));
    return {
      expenseCategory: sumBy(spent, (row) => row.categoryName),
      incomeClient: sumBy(moved.filter((row) => row.source === "invoice_payment"), (row) => row.partyName || "Client not recorded"),
      paymentMode: sumBy(moved.filter((row) => row.method), (row) => PAYMENT_METHOD_LABELS[row.method ?? ""] ?? "Other"),
      movementType: sumBy(moved, (row) => SOURCE_LABELS[row.source]),
    };
  }, [ledger, expenses, range]);

  const pnlTotals = pnl.reduce(
    (sum, row) => ({
      revenue: sum.revenue + row.revenue_paise,
      expenses: sum.expenses + row.expenses_paise,
      payroll: sum.payroll + row.payroll_paise,
      profit: sum.profit + row.profit_paise,
    }),
    { revenue: 0, expenses: 0, payroll: 0, profit: 0 }
  );

  // The reports arrive newest first; charts read left to right in time, over the last twelve months.
  const pnlChart = [...pnl].slice(0, 12).reverse();
  const gstChart = [...gst].slice(0, 12).reverse();

  return (
    <div>
      {pnlChart.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
          <Section title="Profit by month" description="Last 12 months. Profit above the line, loss below it.">
            <ProfitChart rows={pnlChart.map((row) => ({ key: row.period_month, label: shortMonth(row.period_month), profit: row.profit_paise }))} />
          </Section>
          <Section title="Revenue against costs" description="Last 12 months. Revenue next to expenses plus payroll, both net of GST.">
            <TrendChart
              label="Revenue against expenses and payroll for each month"
              rows={pnlChart.map((row) => ({
                key: row.period_month,
                label: shortMonth(row.period_month),
                values: [row.revenue_paise, row.expenses_paise + row.payroll_paise],
              }))}
              series={[
                { label: "Revenue", colour: CHART_GREEN },
                { label: "Expenses + payroll", colour: CHART_RED },
              ]}
            />
          </Section>
        </div>
      )}

      {gstChart.length > 0 && (
        <Section title="GST by month" description="Last 12 months. Tax charged on sales against tax paid on purchases.">
          <TrendChart
            label="Output tax against input tax for each month"
            rows={gstChart.map((row) => ({
              key: row.period_month,
              label: shortMonth(row.period_month),
              values: [row.output_tax_paise, row.input_tax_paise],
            }))}
            series={[
              { label: "Output tax (charged)", colour: CHART_BRONZE },
              { label: "Input tax (paid)", colour: CHART_GREY },
            ]}
          />
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
        <Section title="Expenses by category" description="Approved expenses in the selected period.">
          <BarBreakdown items={breakdowns.expenseCategory} emptyText="No approved expenses in this period." />
        </Section>
        <Section title="Income by client" description="Payments received in the selected period.">
          <BarBreakdown items={breakdowns.incomeClient} emptyText="No client payments in this period." />
        </Section>
        <Section title="Payment mode" description="Client payments and expenses in the selected period; payroll and capital do not record one.">
          <BarBreakdown items={breakdowns.paymentMode} emptyText="No payments or expenses in this period." />
        </Section>
        <Section title="Money moved by type" description="Everything on the ledger in the selected period, in and out together.">
          <BarBreakdown items={breakdowns.movementType} emptyText="Nothing moved in this period." />
        </Section>
      </div>

      <Section
        title="Profit and loss"
        description="Revenue is net of GST charged, expenses net of GST paid, so neither counts tax as income or cost."
        action={<ExportButton report="pnl" />}
      >
        {pnl.length === 0 ? (
          <Empty>Nothing to report yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={TH}>Month</th>
                  <th className={`${TH} text-right`}>Revenue</th>
                  <th className={`${TH} text-right`}>Expenses</th>
                  <th className={`${TH} text-right`}>Payroll</th>
                  <th className={`${TH} text-right`}>Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pnl.map((row) => (
                  <tr key={row.period_month} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-900">{monthName(row.period_month)}</td>
                    <td className="p-4 text-sm text-right text-gray-900">{formatPaise(row.revenue_paise)}</td>
                    <td className="p-4 text-sm text-right text-gray-600">{formatPaise(row.expenses_paise)}</td>
                    <td className="p-4 text-sm text-right text-gray-600">{formatPaise(row.payroll_paise)}</td>
                    <td className={`p-4 text-sm text-right font-semibold ${row.profit_paise < 0 ? "text-red-600" : "text-gray-900"}`}>
                      {formatPaise(row.profit_paise)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t border-gray-200">
                  <td className="p-4 text-sm font-bold uppercase tracking-wide text-gray-900">Total</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(pnlTotals.revenue)}</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(pnlTotals.expenses)}</td>
                  <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(pnlTotals.payroll)}</td>
                  <td className={`p-4 text-right font-bold ${pnlTotals.profit < 0 ? "text-red-600" : "text-gray-900"}`}>
                    {formatPaise(pnlTotals.profit)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Section>

      <Section
        title="GST summary"
        description="Output tax charged against input tax paid. Hand this to your accountant to verify rather than filing from it directly."
        action={<ExportButton report="gst" />}
      >
        {gst.length === 0 ? (
          <Empty>Nothing to report yet.</Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className={TH}>Month</th>
                  <th className={`${TH} text-right`}>Taxable sales</th>
                  <th className={`${TH} text-right`}>Output tax</th>
                  <th className={`${TH} text-right`}>Input tax</th>
                  <th className={`${TH} text-right`}>Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {gst.map((row) => (
                  <tr key={row.period_month} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-900">{monthName(row.period_month)}</td>
                    <td className="p-4 text-sm text-right text-gray-900">{formatPaise(row.taxable_sales_paise)}</td>
                    <td className="p-4 text-sm text-right text-gray-900">{formatPaise(row.output_tax_paise)}</td>
                    <td className="p-4 text-sm text-right text-gray-600">{formatPaise(row.input_tax_paise)}</td>
                    <td className="p-4 text-sm text-right font-semibold text-gray-900">{formatPaise(row.net_tax_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>
    </div>
  );
}
