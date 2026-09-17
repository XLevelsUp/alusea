// Loads the dashboard figures. Every query runs under the caller's RLS, so a role that cannot see payroll simply gets nothing back rather than an error.

import { createClient } from '@/lib/supabase/server'
import type { AgeingBucket } from '@/lib/supabase/types'

export function currentPeriodMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
}

export function previousPeriodMonth(): string {
  const now = new Date()
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-01`
}

export const AGEING_LABELS: Record<AgeingBucket, string> = {
  current: 'Not yet due',
  '1_30': '1–30 days',
  '31_60': '31–60 days',
  '61_90': '61–90 days',
  over_90: 'Over 90 days',
}

export const AGEING_ORDER: AgeingBucket[] = ['current', '1_30', '31_60', '61_90', 'over_90']

export type DashboardData = {
  thisMonth: {
    revenuePaise: number
    collectedPaise: number
    expensesPaise: number
    payrollPaise: number
    profitPaise: number
  }
  lastMonth: {
    revenuePaise: number
    profitPaise: number
  }
  receivables: {
    totalPaise: number
    overduePaise: number
    buckets: { bucket: AgeingBucket; totalPaise: number; count: number }[]
  }
  pendingExpensesPaise: number
  draftInvoiceCount: number
  topCategories: { name: string; totalPaise: number }[]
  trend: { periodMonth: string; revenuePaise: number; expensesPaise: number; payrollPaise: number; profitPaise: number }[]
}

export async function loadDashboard(): Promise<DashboardData> {
  const supabase = await createClient()
  const thisMonth = currentPeriodMonth()
  const lastMonth = previousPeriodMonth()

  // Six months back, so the trend has enough points to be worth reading.
  const trendStart = new Date()
  trendStart.setMonth(trendStart.getMonth() - 5)
  const trendFrom = `${trendStart.getFullYear()}-${String(trendStart.getMonth() + 1).padStart(2, '0')}-01`

  const [
    { data: pnl },
    { data: collections },
    { data: ageing },
    { data: pendingExpenses },
    { count: draftInvoiceCount },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from('profit_and_loss_monthly')
      .select('*')
      .gte('period_month', trendFrom)
      .order('period_month', { ascending: true }),
    supabase.from('collections_monthly').select('*').eq('period_month', thisMonth).maybeSingle(),
    supabase.from('receivables_ageing').select('*'),
    supabase.from('expenses').select('amount_paise').eq('status', 'submitted'),
    supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('expense_monthly_summary').select('*').eq('period_month', thisMonth),
  ])

  const rows = pnl ?? []
  const current = rows.find((row) => row.period_month === thisMonth)
  const previous = rows.find((row) => row.period_month === lastMonth)

  const ageingRows = ageing ?? []
  const buckets = AGEING_ORDER.map((bucket) => {
    const matching = ageingRows.filter((row) => row.ageing_bucket === bucket)
    return {
      bucket,
      count: matching.length,
      totalPaise: matching.reduce((sum, row) => sum + row.balance_paise, 0),
    }
  }).filter((entry) => entry.count > 0)

  return {
    thisMonth: {
      revenuePaise: current?.revenue_paise ?? 0,
      collectedPaise: collections?.collected_paise ?? 0,
      expensesPaise: current?.expenses_paise ?? 0,
      payrollPaise: current?.payroll_paise ?? 0,
      profitPaise: current?.profit_paise ?? 0,
    },
    lastMonth: {
      revenuePaise: previous?.revenue_paise ?? 0,
      profitPaise: previous?.profit_paise ?? 0,
    },
    receivables: {
      totalPaise: ageingRows.reduce((sum, row) => sum + row.balance_paise, 0),
      // "Overdue" excludes invoices not yet due, which is the figure worth chasing.
      overduePaise: ageingRows
        .filter((row) => row.ageing_bucket !== 'current')
        .reduce((sum, row) => sum + row.balance_paise, 0),
      buckets,
    },
    pendingExpensesPaise: (pendingExpenses ?? []).reduce((sum, row) => sum + row.amount_paise, 0),
    draftInvoiceCount: draftInvoiceCount ?? 0,
    topCategories: (categories ?? [])
      .map((row) => ({ name: row.category_name, totalPaise: row.total_paise }))
      .sort((a, b) => b.totalPaise - a.totalPaise)
      .slice(0, 5),
    trend: rows.map((row) => ({
      periodMonth: row.period_month,
      revenuePaise: row.revenue_paise,
      expensesPaise: row.expenses_paise,
      payrollPaise: row.payroll_paise,
      profitPaise: row.profit_paise,
    })),
  }
}
