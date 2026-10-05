// Labels, periods and totals for the Finances module. Pure and free of app imports, so it is unit-testable in plain Node.

export type Direction = 'in' | 'out'
export type Source = 'invoice_payment' | 'expense' | 'payroll' | 'capital' | 'manual'

export const SOURCE_LABELS: Record<Source, string> = {
  invoice_payment: 'Client payment',
  expense: 'Expense',
  payroll: 'Payroll',
  capital: 'Capital',
  manual: 'Manual entry',
}

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  upi: 'UPI',
  cheque: 'Cheque',
  card: 'Card',
  other: 'Other',
}

export const LEDGER_CATEGORIES = [
  { value: 'opening_balance', label: 'Opening balance' },
  { value: 'bank_charges', label: 'Bank charges' },
  { value: 'owner_drawings', label: 'Owner drawings' },
  { value: 'loan_repayment', label: 'Loan repayment' },
  { value: 'interest', label: 'Interest' },
  { value: 'refund', label: 'Refund' },
  { value: 'other', label: 'Other' },
] as const

export const CAPITAL_KINDS = [
  { value: 'owner_capital', label: 'Owner capital' },
  { value: 'loan', label: 'Loan' },
  { value: 'investment', label: 'Investment' },
  { value: 'other', label: 'Other' },
] as const

export type PeriodKey = 'this_month' | 'last_month' | 'this_fy' | 'last_fy' | 'all'

export const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'this_month', label: 'This month' },
  { key: 'last_month', label: 'Last month' },
  { key: 'this_fy', label: 'This financial year' },
  { key: 'last_fy', label: 'Last financial year' },
  { key: 'all', label: 'All time' },
]

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// Inclusive date range as YYYY-MM-DD strings, or null for no limit. The financial year runs 1 April to 31 March.
export function periodRange(key: PeriodKey, today: Date = new Date()): { from: string | null; to: string | null } {
  const year = today.getFullYear()
  const month = today.getMonth()
  const fyStart = month >= 3 ? year : year - 1

  switch (key) {
    case 'this_month':
      return { from: iso(new Date(year, month, 1)), to: iso(new Date(year, month + 1, 0)) }
    case 'last_month':
      return { from: iso(new Date(year, month - 1, 1)), to: iso(new Date(year, month, 0)) }
    case 'this_fy':
      return { from: iso(new Date(fyStart, 3, 1)), to: iso(new Date(fyStart + 1, 2, 31)) }
    case 'last_fy':
      return { from: iso(new Date(fyStart - 1, 3, 1)), to: iso(new Date(fyStart, 2, 31)) }
    default:
      return { from: null, to: null }
  }
}

export function inRange(date: string, range: { from: string | null; to: string | null }): boolean {
  if (range.from && date < range.from) return false
  if (range.to && date > range.to) return false
  return true
}

// How many months the "last 12 months" chart shows, which sets the least history Finances must always load.
export const TREND_MONTHS = 12

// The earliest date Finances needs rows from: the start of the chosen period or of the trend chart, whichever is older.
// Null means everything, which only "All time" asks for.
export function earliestNeeded(range: { from: string | null }, today: Date = new Date()): string | null {
  if (!range.from) return null
  const trendStart = iso(new Date(today.getFullYear(), today.getMonth() - (TREND_MONTHS - 1), 1))
  return range.from < trendStart ? range.from : trendStart
}

export type Movement = { entry_date: string; direction: Direction; amount_paise: number }

export function totals(rows: readonly Movement[]): { inPaise: number; outPaise: number; netPaise: number } {
  let inPaise = 0
  let outPaise = 0
  for (const row of rows) {
    if (row.direction === 'in') inPaise += row.amount_paise
    else outPaise += row.amount_paise
  }
  return { inPaise, outPaise, netPaise: inPaise - outPaise }
}

// Running balance after each movement, oldest first; same-day movements keep their given order.
// `openingPaise` is the balance carried in from movements older than the ones given, when only part of the ledger was loaded.
export function withRunningBalance<T extends Movement>(rows: readonly T[], openingPaise = 0): (T & { balancePaise: number })[] {
  const sorted = [...rows].sort((a, b) => (a.entry_date < b.entry_date ? -1 : a.entry_date > b.entry_date ? 1 : 0))
  let balance = openingPaise
  return sorted.map((row) => {
    balance += row.direction === 'in' ? row.amount_paise : -row.amount_paise
    return { ...row, balancePaise: balance }
  })
}

// Money in and out per month for the last `count` months ending with the month of `today`, oldest first, including empty months.
export function monthlyTotals(
  rows: readonly Movement[],
  count: number,
  today: Date = new Date()
): { month: string; inPaise: number; outPaise: number }[] {
  const months = Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  })
  const byMonth = new Map(months.map((month) => [month, { month, inPaise: 0, outPaise: 0 }]))

  for (const row of rows) {
    const bucket = byMonth.get(row.entry_date.slice(0, 7))
    if (!bucket) continue
    if (row.direction === 'in') bucket.inPaise += row.amount_paise
    else bucket.outPaise += row.amount_paise
  }

  return months.map((month) => byMonth.get(month)!)
}
