"use client";

import { useMemo } from "react";
import { CHART_GREEN, CHART_RED, TrendChart } from "@/components/erp/charts/FinanceCharts";
import { SOURCE_LABELS, inRange, monthlyTotals, totals, type Source } from "@/lib/erp/finance";
import { Bar, Section, Tile } from "./parts";
import type { ExpenseRow, InvoiceRow, LedgerRow } from "./types";

type Range = { from: string | null; to: string | null };

function monthLabel(month: string): string {
  return new Date(`${month}-01T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
}

export default function OverviewTab({
  ledger,
  invoices,
  expenses,
  range,
}: {
  ledger: LedgerRow[];
  invoices: InvoiceRow[];
  expenses: ExpenseRow[];
  range: Range;
}) {
  const inPeriod = useMemo(() => ledger.filter((row) => inRange(row.entry_date, range)), [ledger, range]);
  const sum = totals(inPeriod);

  // Outstanding and owed are about now, not the period: they are what is still unsettled today.
  const outstanding = invoices.reduce((total, row) => total + row.balance_paise, 0);
  const owed = expenses.filter((row) => row.owed).reduce((total, row) => total + row.amount_paise, 0);

  const months = monthlyTotals(ledger, 12);

  const bySource = (direction: "in" | "out") => {
    const map = new Map<Source, number>();
    for (const row of inPeriod) {
      if (row.direction !== direction) continue;
      map.set(row.source, (map.get(row.source) ?? 0) + row.amount_paise);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };
  const moneyIn = bySource("in");
  const moneyOut = bySource("out");

  return (
    <div>
      <section aria-label="Totals for the period" className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <Tile label="Money in" paise={sum.inPaise} tone="good" />
        <Tile label="Money out" paise={sum.outPaise} tone="bad" />
        <Tile label="Net" paise={sum.netPaise} tone={sum.netPaise < 0 ? "bad" : undefined} note={sum.netPaise < 0 ? "More went out than came in" : undefined} />
      </section>
      <section aria-label="Still unsettled" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Tile label="Clients still owe" paise={outstanding} tone={outstanding > 0 ? "warn" : undefined} note="Unpaid balance on issued invoices, as of today" />
        <Tile label="Owed to people" paise={owed} tone={owed > 0 ? "warn" : undefined} note="Expenses paid personally and not yet paid back" />
      </section>

      <Section title="Last 12 months" description="Money in against money out, month by month.">
        <TrendChart
          label="Money in and money out over the last 12 months"
          rows={months.map((month) => ({ key: month.month, label: monthLabel(month.month), values: [month.inPaise, month.outPaise] }))}
          series={[
            { label: "Money in", colour: CHART_GREEN },
            { label: "Money out", colour: CHART_RED },
          ]}
        />
      </Section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Section title="Where money came from" description="For the selected period.">
          {moneyIn.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">Nothing came in during this period.</p>
          ) : (
            <ul className="p-5 space-y-3">
              {moneyIn.map(([source, paise]) => (
                <Bar key={source} label={SOURCE_LABELS[source]} paise={paise} max={moneyIn[0][1]} colour="bg-green-500" />
              ))}
            </ul>
          )}
        </Section>
        <Section title="Where money went" description="For the selected period.">
          {moneyOut.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">Nothing went out during this period.</p>
          ) : (
            <ul className="p-5 space-y-3">
              {moneyOut.map(([source, paise]) => (
                <Bar key={source} label={SOURCE_LABELS[source]} paise={paise} max={moneyOut[0][1]} colour="bg-red-400" />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
