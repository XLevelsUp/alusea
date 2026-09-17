// Payroll computation. Pure functions with no database access, because this is the one place in the codebase where a silent bug pays a real person the wrong amount.
// Scope per docs/erp-implementation-plan.md: fixed 30-day divisor, flat overtime and bonus, no statutory deductions.

export type WorkerType = 'monthly' | 'daily'

// Monthly staff are prorated against a fixed 30 days rather than the actual month length, so a February day is worth the same as a January day.
export const STANDARD_DAYS_IN_MONTH = 30

export type PayslipInput = {
  workerType: WorkerType
  // Monthly salary for monthly staff, daily rate for daily staff.
  enteredAmountPaise: number
  daysWorked: number
  daysInPeriod?: number
  overtimePaise?: number
  bonusPaise?: number
}

export type PayslipComputation = {
  basePaise: number
  overtimePaise: number
  bonusPaise: number
  grossPaise: number
  netPaise: number
  // Human-readable working, shown on the payslip so the figure explains itself.
  baseExplanation: string
}

function nonNegative(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined || value < 0) return 0
  return Math.round(value)
}

export function computeBasePaise(input: PayslipInput): number {
  const amount = nonNegative(input.enteredAmountPaise)
  const days = Number.isFinite(input.daysWorked) ? Math.max(0, input.daysWorked) : 0

  if (input.workerType === 'daily') {
    return Math.round(amount * days)
  }

  const divisor = input.daysInPeriod && input.daysInPeriod > 0 ? input.daysInPeriod : STANDARD_DAYS_IN_MONTH

  // Rounding happens once, on the prorated base, so the components always sum exactly to the gross.
  return Math.round((amount / divisor) * days)
}

export function computePayslip(input: PayslipInput): PayslipComputation {
  const base = computeBasePaise(input)
  const overtime = nonNegative(input.overtimePaise)
  const bonus = nonNegative(input.bonusPaise)
  const gross = base + overtime + bonus

  const divisor = input.daysInPeriod && input.daysInPeriod > 0 ? input.daysInPeriod : STANDARD_DAYS_IN_MONTH

  const baseExplanation =
    input.workerType === 'daily'
      ? `${input.daysWorked} days at the daily rate`
      : `${divisor}-day month, ${input.daysWorked} days worked`

  return {
    basePaise: base,
    overtimePaise: overtime,
    bonusPaise: bonus,
    grossPaise: gross,
    // No statutory deductions in this scope, so net equals gross.
    netPaise: gross,
    baseExplanation,
  }
}

export type RunTotals = {
  employeeCount: number
  totalGrossPaise: number
  totalNetPaise: number
}

export function computeRunTotals(payslips: readonly { grossPaise: number; netPaise: number }[]): RunTotals {
  return {
    employeeCount: payslips.length,
    totalGrossPaise: payslips.reduce((sum, slip) => sum + slip.grossPaise, 0),
    totalNetPaise: payslips.reduce((sum, slip) => sum + slip.netPaise, 0),
  }
}

// Payroll periods are whole months, stored as the first of the month.
export function toPeriodMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

export function formatPeriod(periodMonth: string): string {
  const date = new Date(`${periodMonth}T00:00:00`)
  if (Number.isNaN(date.getTime())) return periodMonth
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export function calendarDaysInMonth(periodMonth: string): number {
  const date = new Date(`${periodMonth}T00:00:00`)
  if (Number.isNaN(date.getTime())) return STANDARD_DAYS_IN_MONTH
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}
