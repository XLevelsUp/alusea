// What has happened to an expense's money since approval, derived from its settlement columns rather than stored as a status.

export type PaidBy = 'company' | 'person'

export type Settlement = 'to_pay' | 'paid' | 'to_reimburse' | 'reimbursed'

type SettlementFields = {
  status: string
  paid_by: PaidBy
  paid_at: string | null
  reimbursed_at: string | null
}

// Null until the expense is approved: there is nothing to settle before that.
export function settlementOf(expense: SettlementFields): Settlement | null {
  if (expense.status !== 'approved') return null
  if (expense.paid_by === 'person') return expense.reimbursed_at ? 'reimbursed' : 'to_reimburse'
  return expense.paid_at ? 'paid' : 'to_pay'
}

export const SETTLEMENT: Record<Settlement, { label: string; style: string }> = {
  to_pay: { label: 'To pay', style: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', style: 'bg-green-50 text-green-700' },
  to_reimburse: { label: 'To pay back', style: 'bg-amber-50 text-amber-700' },
  reimbursed: { label: 'Paid back', style: 'bg-green-50 text-green-700' },
}

export function isPaidBy(value: string): value is PaidBy {
  return value === 'company' || value === 'person'
}

// The words shown for each status, so the badge, the filter and the detail page all say the same thing.
export const EXPENSE_STATUS_LABELS: Record<'draft' | 'submitted' | 'approved' | 'rejected', string> = {
  draft: 'Draft',
  submitted: 'Awaiting approval',
  approved: 'Approved',
  rejected: 'Rejected',
}
