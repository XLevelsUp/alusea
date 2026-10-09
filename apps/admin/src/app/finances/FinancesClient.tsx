"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUrlState } from "@/hooks/use-url-state";
import { PERIODS, type PeriodKey } from "@/lib/erp/finance";
import AnalyticsTab from "./AnalyticsTab";
import CapitalTab from "./CapitalTab";
import ExpensesTab from "./ExpensesTab";
import IncomeTab from "./IncomeTab";
import LedgerTab from "./LedgerTab";
import OverviewTab from "./OverviewTab";
import type {
  CapitalRow,
  ExpenseFormOptions,
  ExpenseRow,
  GstReportRow,
  InvoiceRow,
  LedgerRow,
  MonthlyReportRow,
  PartyOption,
  PendingEntry,
  WaitingExpense,
} from "./types";

export type FinanceTab = "overview" | "ledger" | "income" | "expenses" | "capital" | "analytics";

const TAB_LABELS: Record<FinanceTab, string> = {
  overview: "Overview",
  ledger: "General Ledger",
  income: "Client Income",
  expenses: "Expenses",
  capital: "Capital Inflow",
  analytics: "Analytics",
};

const TRIGGER =
  "h-auto flex-none rounded-none border-0 px-4 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 data-[state=active]:text-[#A67C52] after:bg-[#A67C52] group-data-horizontal/tabs:after:bottom-[-1px]";

// The period applies to the tabs that are about a span of time; Capital shows its full history.
const PERIOD_TABS: FinanceTab[] = ["overview", "ledger", "income", "expenses", "analytics"];

type Props = {
  initialTab: FinanceTab;
  // Chosen on the server from the address, which also decides how much history was loaded.
  period: PeriodKey;
  range: { from: string | null; to: string | null };
  // The ledger balance carried in from before the loaded rows.
  openingPaise: number;
  canEdit: boolean;
  ledger: LedgerRow[];
  pending: PendingEntry[];
  capital: CapitalRow[];
  invoices: InvoiceRow[];
  expenses: ExpenseRow[];
  waitingExpenses: WaitingExpense[];
  expenseForm: ExpenseFormOptions;
  parties: PartyOption[];
  clients: PartyOption[];
  pnl: MonthlyReportRow[];
  gst: GstReportRow[];
};

// Every tab gets the chosen period's data up front, so switching tabs never waits; changing the period fetches just that span.
export default function FinancesClient(props: Props) {
  // The tab lives in the address, so a refresh or coming back from an invoice returns to the same view.
  const [tab, setTab] = useUrlState<FinanceTab>("tab", props.initialTab, { allowed: Object.keys(TAB_LABELS) as FinanceTab[], always: true });
  const range = props.range;

  const router = useRouter();
  const [isLoading, startLoading] = useTransition();
  // Shown at once in the dropdown while the server loads the new span.
  const [period, setPeriodShown] = useState<PeriodKey>(props.period);

  function setPeriod(next: PeriodKey) {
    setPeriodShown(next);
    const query = new URLSearchParams(window.location.search);
    query.set("period", next);
    // Replace rather than push, so changing the period does not pile up steps behind the Back button.
    startLoading(() => router.replace(`/finances?${query}`, { scroll: false }));
  }

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as FinanceTab)} className="gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200">
        <TabsList variant="line" className="h-auto justify-start gap-0 rounded-none p-0 flex-wrap">
          {(Object.keys(TAB_LABELS) as FinanceTab[]).map((key) => (
            <TabsTrigger key={key} value={key} className={TRIGGER}>
              {TAB_LABELS[key]}
              {key === "ledger" && props.pending.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-100 px-1.5 text-[11px] text-amber-800">{props.pending.length}</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
        {PERIOD_TABS.includes(tab) && (
          <label className="flex items-center gap-2 pb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            {isLoading && <Loader2Icon className="size-3.5 animate-spin" aria-label="Loading" />}
            Period
            <NativeSelect value={period} onChange={(e) => setPeriod(e.target.value as PeriodKey)} size="sm" className="w-48 normal-case tracking-normal">
              {PERIODS.map((option) => (
                <NativeSelectOption key={option.key} value={option.key}>
                  {option.label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </label>
        )}
      </div>

      <TabsContent value="overview">
        <OverviewTab ledger={props.ledger} invoices={props.invoices} expenses={props.expenses} range={range} />
      </TabsContent>
      <TabsContent value="ledger">
        <LedgerTab
          ledger={props.ledger}
          pending={props.pending}
          invoices={props.invoices}
          parties={props.parties}
          range={range}
          openingPaise={props.openingPaise}
          canEdit={props.canEdit}
        />
      </TabsContent>
      <TabsContent value="income">
        <IncomeTab ledger={props.ledger} invoices={props.invoices} clients={props.clients} range={range} />
      </TabsContent>
      <TabsContent value="expenses">
        <ExpensesTab
          expenses={props.expenses}
          waiting={props.waitingExpenses}
          formOptions={props.expenseForm}
          range={range}
          canEdit={props.canEdit}
        />
      </TabsContent>
      <TabsContent value="capital">
        <CapitalTab capital={props.capital} canEdit={props.canEdit} />
      </TabsContent>
      <TabsContent value="analytics">
        <AnalyticsTab pnl={props.pnl} gst={props.gst} ledger={props.ledger} expenses={props.expenses} range={range} />
      </TabsContent>
    </Tabs>
  );
}
