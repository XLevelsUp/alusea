// Loads the dashboard's headline counts and its "waiting on you" queue in one parallel round of head-only count queries.

import { createClient } from '@/lib/supabase/server'
import { todayInIndia } from '@/lib/erp/dates'
import { fetchAll } from '@/lib/erp/fetchAll'

export type WaitingItem = {
  key: string
  label: string
  count: number
  // Optional rupee total, shown beside the count when the queue is about money.
  amountPaise?: number
  href: string
}

export type DashboardData = {
  clients: number
  vendors: number
  products: number
  // Unpaid balance on issued invoices as of today, and how many invoices it is spread over.
  outstanding: { paise: number; count: number }
  // All three include GST, so billed and spent compare directly with money actually received.
  thisMonth: { billedPaise: number; collectedPaise: number; spentPaise: number }
  waiting: WaitingItem[]
}

export function currentPeriodMonth(): string {
  return `${todayInIndia().slice(0, 8)}01`
}

export async function loadDashboard(): Promise<DashboardData> {
  const supabase = await createClient()
  const count = { count: 'exact' as const, head: true }
  const month = currentPeriodMonth()

  const [
    pnl,
    collections,
    clients,
    vendors,
    products,
    submittedExpenses,
    owedExpenses,
    pendingEntries,
    draftInvoices,
    draftRuns,
    approvedRuns,
    unpaid,
  ] = await Promise.all([
    supabase.from('profit_and_loss_monthly').select('*').eq('period_month', month).maybeSingle(),
    supabase.from('collections_monthly').select('collected_paise').eq('period_month', month).maybeSingle(),
    supabase.from('parties').select('id', count).eq('is_client', true).eq('is_active', true),
    supabase.from('parties').select('id', count).eq('is_vendor', true).eq('is_active', true),
    supabase.from('products').select('id', count),
    // Amounts are needed for the rupee total, so this one fetches the column rather than a bare count.
    supabase.from('expenses').select('amount_paise').eq('status', 'submitted'),
    supabase.from('expenses').select('amount_paise').eq('status', 'approved').eq('paid_by', 'person').is('reimbursed_at', null),
    supabase.from('ledger_entries').select('id', count).eq('status', 'pending'),
    supabase.from('invoices').select('id', count).eq('status', 'draft'),
    supabase.from('payroll_runs').select('id', count).eq('status', 'draft'),
    supabase.from('payroll_runs').select('id', count).eq('status', 'approved'),
    fetchAll((first, last) =>
      supabase.from('invoice_balances').select('invoice_id, balance_paise').eq('status', 'issued').gt('balance_paise', 0).order('invoice_id').range(first, last)
    ),
  ])

  const expenseRows = submittedExpenses.data ?? []
  const owedRows = owedExpenses.data ?? []

  return {
    clients: clients.count ?? 0,
    vendors: vendors.count ?? 0,
    products: products.count ?? 0,
    outstanding: { paise: unpaid.data.reduce((sum, row) => sum + row.balance_paise, 0), count: unpaid.data.length },
    thisMonth: {
      billedPaise: (pnl.data?.revenue_paise ?? 0) + (pnl.data?.output_tax_paise ?? 0),
      collectedPaise: collections.data?.collected_paise ?? 0,
      spentPaise: (pnl.data?.expenses_paise ?? 0) + (pnl.data?.input_tax_paise ?? 0) + (pnl.data?.payroll_paise ?? 0),
    },
    waiting: [
      {
        key: 'expenses',
        label: 'Expenses to approve',
        count: expenseRows.length,
        amountPaise: expenseRows.reduce((sum, row) => sum + row.amount_paise, 0),
        // The expenses list defaults to this month, so the link opens the full history of anything still waiting.
        href: '/expenses?status=submitted&from=2000-01-01',
      },
      {
        key: 'reimburse',
        label: 'Expenses to pay back',
        count: owedRows.length,
        amountPaise: owedRows.reduce((sum, row) => sum + row.amount_paise, 0),
        href: '/expenses?payment=to_reimburse&from=2000-01-01',
      },
      { key: 'ledger', label: 'Ledger entries to approve', count: pendingEntries.count ?? 0, href: '/finances?tab=ledger' },
      { key: 'draft-invoices', label: 'Draft invoices to issue', count: draftInvoices.count ?? 0, href: '/invoices?filter=draft' },
      { key: 'payroll-approve', label: 'Payroll runs to approve', count: draftRuns.count ?? 0, href: '/payroll' },
      { key: 'payroll-pay', label: 'Payroll runs to pay', count: approvedRuns.count ?? 0, href: '/payroll' },
    ],
  }
}
