"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRightIcon, PlusIcon } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { inRange } from "@/lib/erp/finance";
import { formatPaise } from "@/lib/erp/money";
import ExpenseForm from "../expenses/ExpenseForm";
import { addExpense } from "../expenses/actions";
import { Bar, Empty, Section, Tile } from "./parts";
import type { ExpenseFormOptions, ExpenseRow, WaitingExpense } from "./types";

type Range = { from: string | null; to: string | null };

function groupBy(rows: ExpenseRow[], key: (row: ExpenseRow) => string): [string, number][] {
  const map = new Map<string, number>();
  for (const row of rows) map.set(key(row), (map.get(key(row)) ?? 0) + row.amount_paise);
  return [...map.entries()].sort((a, b) => b[1] - a[1]);
}

// Finances shows what was spent in totals only; the expenses themselves are listed, approved and settled on the Expenses page.
export default function ExpensesTab({
  expenses,
  waiting,
  formOptions,
  range,
  canEdit,
}: {
  expenses: ExpenseRow[];
  waiting: WaitingExpense[];
  formOptions: ExpenseFormOptions;
  range: Range;
  canEdit: boolean;
}) {
  const inPeriod = useMemo(() => expenses.filter((row) => inRange(row.spent_on, range)), [expenses, range]);
  const total = inPeriod.reduce((sum, row) => sum + row.amount_paise, 0);

  const byCategory = groupBy(inPeriod, (row) => row.categoryName);
  const byVendor = groupBy(inPeriod, (row) => row.vendorName || "No vendor recorded").slice(0, 10);

  // What the company owes people is about today, so it ignores the period.
  const owed = expenses.filter((row) => row.owed);
  const owedTotal = owed.reduce((sum, row) => sum + row.amount_paise, 0);
  const waitingTotal = waiting.reduce((sum, row) => sum + row.amount_paise, 0);

  // Each line opens the Expenses page already filtered to those expenses, from the beginning so none are missed.
  const followUps = [
    { key: "waiting", label: "Waiting for approval", count: waiting.length, paise: waitingTotal, href: "/expenses?status=submitted&from=2000-01-01" },
    { key: "owed", label: "To pay back to people", count: owed.length, paise: owedTotal, href: "/expenses?payment=to_reimburse&from=2000-01-01" },
  ].filter((item) => item.count > 0);

  return (
    <div>
      <div className="flex justify-end gap-3 mb-4">
        <Button asChild variant="outline">
          <Link href="/expenses">Open Expenses</Link>
        </Button>
        {canEdit && (
          <FormDialog
            title="Add expense"
            description="It is filed for approval, and counts in Finances once approved."
            trigger={
              <Button type="button" variant="brand">
                <PlusIcon aria-hidden="true" />
                Add Expense
              </Button>
            }
          >
            <ExpenseForm {...formOptions} save={addExpense} stayOn="finances" canAddParty />
          </FormDialog>
        )}
      </div>

      <section aria-label="Expense totals" className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Tile label="Approved spend" paise={total} tone="bad" note={`${inPeriod.length} approved expenses in the period`} />
        <Tile label="Owed to people" paise={owedTotal} tone={owedTotal > 0 ? "warn" : undefined} note={`${owed.length} waiting to be paid back`} />
      </section>

      {followUps.length > 0 && (
        <Section title="Needs attention" description="Handled on the Expenses page; each line opens it filtered to those expenses.">
          <ul className="divide-y">
            {followUps.map((item) => (
              <li key={item.key}>
                <Link href={item.href} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:bg-gray-50">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#A67C52]/10 text-sm font-bold text-[#A67C52]">
                    {item.count}
                  </span>
                  <span className="flex-1 text-sm font-medium text-gray-900">{item.label}</span>
                  <span className="text-sm font-semibold text-gray-700">{formatPaise(item.paise)}</span>
                  <ChevronRightIcon className="size-4 text-gray-500" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
        <Section title="By category">
          {byCategory.length === 0 ? (
            <Empty>No approved expenses in this period.</Empty>
          ) : (
            <ul className="p-5 space-y-3">
              {byCategory.map(([name, paise]) => (
                <Bar key={name} label={name} paise={paise} max={byCategory[0][1]} />
              ))}
            </ul>
          )}
        </Section>
        <Section title="Top vendors">
          {byVendor.length === 0 ? (
            <Empty>No approved expenses in this period.</Empty>
          ) : (
            <ul className="p-5 space-y-3">
              {byVendor.map(([name, paise]) => (
                <Bar key={name} label={name} paise={paise} max={byVendor[0][1]} colour="bg-gray-400" />
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
