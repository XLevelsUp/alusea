import { requireRole } from "@/lib/auth/session";
import { isOwnerLevel } from "@/lib/auth/roles";
import { createClient } from "@/lib/supabase/server";
import { loadExpenseFormData } from "@/lib/erp/expenseFormData";
import { todayInIndia } from "@/lib/erp/dates";
import { fetchAll } from "@/lib/erp/fetchAll";
import { PERIODS, earliestNeeded, periodRange } from "@/lib/erp/finance";
import { settlementOf } from "@/lib/erp/expenses";
import FinancesClient, { type FinanceTab } from "./FinancesClient";
import type { CapitalRow, ExpenseRow, InvoiceRow, LedgerRow, PendingEntry, WaitingExpense } from "./types";

const TABS: FinanceTab[] = ["overview", "ledger", "income", "expenses", "capital", "analytics"];

// Where each ledger row came from, so a line can be opened at its source.
function hrefFor(source: LedgerRow["source"], recordId: string, parentId: string | null): string | null {
  if (source === "invoice_payment" && parentId) return `/invoices/${parentId}`;
  if (source === "expense") return `/expenses/${recordId}`;
  if (source === "payroll") return `/payroll/${recordId}`;
  return null;
}

export default async function FinancesPage(props: { searchParams: Promise<{ tab?: string; period?: string }> }) {
  const profile = await requireRole("owner", "accounts");
  // Owners and developers change Finances; accounts can look but every control is hidden and every action refuses.
  const canEdit = isOwnerLevel(profile.role);

  const { tab, period: periodParam } = await props.searchParams;
  const initialTab = TABS.find((key) => key === tab) ?? "overview";

  // The period is read here, so only the months it covers (and the twelve the trend chart shows) are loaded.
  const period = PERIODS.find((option) => option.key === periodParam)?.key ?? "this_fy";
  const today = new Date(`${todayInIndia()}T00:00:00`);
  const range = periodRange(period, today);

  const supabase = await createClient();

  // Everything older than the loaded rows is summed in the database, so the running balance still starts from the right figure.
  let loadFrom = earliestNeeded(range, today);
  let openingPaise = 0;
  if (loadFrom) {
    const { data, error } = await supabase.rpc("ledger_balance_before", { p_before: loadFrom });
    // Without the function (its migration not yet applied) the page falls back to loading the whole ledger, as it did before.
    if (error) loadFrom = null;
    else openingPaise = data ?? 0;
  }
  const since = loadFrom;

  const [
    { data: ledger },
    { data: pending },
    { data: capital },
    { data: balances },
    { data: expenses },
    { data: categories },
    { data: parties },
    { data: pnl },
    { data: gst },
    { data: payments },
    { data: waiting },
    expenseForm,
    { data: claims },
  ] = await Promise.all([
    // Every row in the loaded span is read: the running balance and totals would be wrong if rows past the first thousand were dropped.
    fetchAll((first, last) => {
      const rows = supabase.from("general_ledger").select("*");
      return (since ? rows.gte("entry_date", since) : rows).order("entry_date", { ascending: false }).order("entry_key").range(first, last);
    }),
    supabase.from("ledger_entries").select("*").eq("status", "pending").order("entry_date", { ascending: false }),
    supabase.from("capital_inflows").select("*").order("received_on", { ascending: false }),
    // Invoices issued in the loaded span, plus any older one that is still unpaid, since those are owed today.
    fetchAll((first, last) => {
      const rows = supabase.from("invoice_balances").select("*").eq("status", "issued");
      return (since ? rows.or(`balance_paise.gt.0,issue_date.gte.${since}`) : rows).order("issue_date", { ascending: false }).order("invoice_id").range(first, last);
    }),
    // Expenses in the loaded span, plus any older one a person has not been paid back for, since that is owed today.
    fetchAll((first, last) => {
      const rows = supabase
        .from("expenses")
        .select("id, spent_on, description, amount_paise, category_id, party_id, status, payment_method, gst_claim, paid_by, paid_by_name, paid_at, reimbursed_at")
        .eq("status", "approved");
      return (since ? rows.or(`spent_on.gte.${since},and(paid_by.eq.person,reimbursed_at.is.null)`) : rows)
        .order("spent_on", { ascending: false })
        .order("id")
        .range(first, last);
    }),
    supabase.from("expense_categories").select("id, name"),
    fetchAll((first, last) => supabase.from("parties").select("id, name, is_client, is_vendor, is_active").order("name").order("id").range(first, last)),
    supabase.from("profit_and_loss_monthly").select("*").order("period_month", { ascending: false }).limit(24),
    supabase.from("gst_summary_monthly").select("*").order("period_month", { ascending: false }).limit(24),
    fetchAll((first, last) => {
      const rows = supabase.from("payments").select("id, method");
      return (since ? rows.gte("paid_on", since) : rows).order("id").range(first, last);
    }),
    supabase
      .from("expenses")
      .select("id, spent_on, description, amount_paise, category_id")
      .eq("status", "submitted")
      .order("spent_on", { ascending: false }),
    loadExpenseFormData(),
    supabase.from("ledger_entries").select("id").eq("status", "approved").eq("gst_claim", true),
  ]);

  const partyName = new Map((parties ?? []).map((party) => [party.id, party.name]));
  const categoryName = new Map((categories ?? []).map((category) => [category.id, category.name]));

  // The ledger view does not carry the payment mode, so it is looked up from the record each line came from.
  const paymentMethod = new Map((payments ?? []).map((payment) => [payment.id, payment.method]));
  const expenseMethod = new Map((expenses ?? []).map((expense) => [expense.id, expense.payment_method]));
  const methodFor = (source: LedgerRow["source"], recordId: string) =>
    (source === "invoice_payment" ? paymentMethod.get(recordId) : source === "expense" ? expenseMethod.get(recordId) : null) ?? null;

  // The ledger view does not carry the GST claim tick either, so it is read from the expense or manual entry behind each line.
  const claimed = new Set([
    ...(claims ?? []).map((entry) => entry.id),
    ...(expenses ?? []).filter((expense) => expense.gst_claim).map((expense) => expense.id),
  ]);

  const ledgerRows: LedgerRow[] = (ledger ?? []).map((row) => ({
    key: row.entry_key,
    entry_date: row.entry_date,
    direction: row.direction,
    source: row.source,
    description: row.description,
    partyId: row.party_id,
    partyName: (row.party_id && partyName.get(row.party_id)) || "",
    amount_paise: row.amount_paise,
    href: hrefFor(row.source, row.record_id, row.parent_id),
    recordId: row.record_id,
    parentId: row.parent_id,
    method: methodFor(row.source, row.record_id),
    claimable: row.direction === "out" && (row.source === "expense" || row.source === "manual"),
    gstClaim: claimed.has(row.record_id),
  }));

  const pendingRows: PendingEntry[] = (pending ?? []).map((row) => ({
    id: row.id,
    entry_date: row.entry_date,
    direction: row.direction,
    category: row.category,
    description: row.description,
    partyName: (row.party_id && partyName.get(row.party_id)) || "",
    amount_paise: row.amount_paise,
    gst_claim: row.gst_claim,
  }));

  const capitalRows: CapitalRow[] = (capital ?? []).map((row) => ({
    id: row.id,
    received_on: row.received_on,
    source: row.source,
    kind: row.kind,
    amount_paise: row.amount_paise,
    notes: row.notes,
  }));

  const invoiceRows: InvoiceRow[] = (balances ?? []).map((row) => ({
    id: row.invoice_id,
    number: row.invoice_number,
    partyId: row.party_id,
    partyName: partyName.get(row.party_id) ?? "—",
    issue_date: row.issue_date,
    total_paise: row.total_paise,
    paid_paise: row.paid_paise,
    balance_paise: row.balance_paise,
  }));

  const expenseRows: ExpenseRow[] = (expenses ?? []).map((row) => ({
    id: row.id,
    spent_on: row.spent_on,
    description: row.description,
    amount_paise: row.amount_paise,
    categoryName: categoryName.get(row.category_id) ?? "Uncategorised",
    vendorName: (row.party_id && partyName.get(row.party_id)) || "",
    paidBy: row.paid_by,
    paidByName: row.paid_by_name,
    owed: settlementOf(row) === "to_reimburse",
  }));

  const waitingRows: WaitingExpense[] = (waiting ?? []).map((row) => ({
    id: row.id,
    spent_on: row.spent_on,
    description: row.description,
    amount_paise: row.amount_paise,
    categoryName: categoryName.get(row.category_id) ?? "Uncategorised",
  }));

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Finances</h1>
        <p className="text-gray-500 mt-2">
          Every rupee in and out, in one place.{!canEdit && " You can view everything here; only an owner can make changes."}
        </p>
      </div>

      <FinancesClient
        initialTab={initialTab}
        period={period}
        range={range}
        openingPaise={openingPaise}
        canEdit={canEdit}
        ledger={ledgerRows}
        pending={pendingRows}
        capital={capitalRows}
        invoices={invoiceRows}
        expenses={expenseRows}
        waitingExpenses={waitingRows}
        expenseForm={expenseForm}
        parties={(parties ?? []).filter((party) => party.is_active).map((party) => ({ id: party.id, name: party.name }))}
        clients={(parties ?? []).filter((party) => party.is_client).map((party) => ({ id: party.id, name: party.name }))}
        pnl={pnl ?? []}
        gst={gst ?? []}
      />
    </div>
  );
}
