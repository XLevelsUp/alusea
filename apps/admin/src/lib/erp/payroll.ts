// Payroll computation. Pure functions with no database access, because this is the one place in the codebase where a silent bug pays a real person the wrong amount.
// Monthly staff: salary ÷ 30.5 is one day's pay, and they are paid for the days they worked plus the month's Sundays. Daily staff: rate × days. No statutory deductions.

export type WorkerType = 'monthly' | 'daily'

// One day's pay for monthly staff is the monthly salary divided by this, in every month.
export const SALARY_DIVISOR_DAYS = 30.5

export type PayslipInput = {
  workerType: WorkerType
  // Monthly salary for monthly staff, daily rate for daily staff.
  enteredAmountPaise: number
  daysWorked: number
  // Sundays in the month (from the joining date, for a new joiner). Paid to monthly staff on top of the days worked.
  sundays?: number
  overtimePaise?: number
  bonusPaise?: number
}

export type PayslipComputation = {
  basePaise: number
  overtimePaise: number
  bonusPaise: number
  grossPaise: number
  netPaise: number
  // The Sundays actually paid: none for daily staff, and none for someone who did not work at all that month.
  paidSundays: number
  // Human-readable working, shown on the payslip so the figure explains itself.
  baseExplanation: string
}

function nonNegative(value: number | undefined): number {
  if (!Number.isFinite(value) || value === undefined || value < 0) return 0
  return Math.round(value)
}

function daysWorkedOf(input: PayslipInput): number {
  return Number.isFinite(input.daysWorked) ? Math.max(0, input.daysWorked) : 0
}

// Sundays are a paid weekly off for monthly staff, but only in a month they actually worked in.
export function paidSundaysOf(input: PayslipInput): number {
  if (input.workerType !== 'monthly' || daysWorkedOf(input) === 0) return 0
  return nonNegative(input.sundays)
}

export function computeBasePaise(input: PayslipInput): number {
  const amount = nonNegative(input.enteredAmountPaise)
  const days = daysWorkedOf(input)

  if (input.workerType === 'daily') {
    return Math.round(amount * days)
  }

  // Rounding happens once, on the whole base, so the components always sum exactly to the gross.
  return Math.round((amount / SALARY_DIVISOR_DAYS) * (days + paidSundaysOf(input)))
}

export function computePayslip(input: PayslipInput): PayslipComputation {
  const base = computeBasePaise(input)
  const overtime = nonNegative(input.overtimePaise)
  const bonus = nonNegative(input.bonusPaise)
  const gross = base + overtime + bonus
  const paidSundays = paidSundaysOf(input)

  const baseExplanation =
    input.workerType === 'daily'
      ? `${input.daysWorked} days at the daily rate`
      : `${input.daysWorked} days worked + ${paidSundays} Sundays, at salary ÷ ${SALARY_DIVISOR_DAYS} a day`

  return {
    basePaise: base,
    overtimePaise: overtime,
    bonusPaise: bonus,
    grossPaise: gross,
    // No statutory deductions in this scope, so net equals gross.
    netPaise: gross,
    paidSundays,
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

// The newest month payroll may be run for, as YYYY-MM: the month before today's. A month still in progress has days not yet worked.
export function lastCompletedMonth(today: string): string {
  const year = Number(today.slice(0, 4))
  const month = Number(today.slice(5, 7))
  return month === 1 ? `${year - 1}-12` : `${year}-${String(month - 1).padStart(2, '0')}`
}

export function formatPeriod(periodMonth: string): string {
  const date = new Date(`${periodMonth}T00:00:00`)
  if (Number.isNaN(date.getTime())) return periodMonth
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

export type MonthDays = {
  // Sundays, the paid weekly off.
  sundays: number
  // Every other day: the most days anyone can have worked.
  workingDays: number
}

// Counts a month's Sundays and working days. For someone who joined during the month, only the days from their joining date onward count.
export function monthDays(periodMonth: string, joiningDate?: string | null): MonthDays {
  const first = new Date(`${periodMonth}T00:00:00`)
  if (Number.isNaN(first.getTime())) return { sundays: 0, workingDays: 0 }

  const year = first.getFullYear()
  const month = first.getMonth()
  const joined = joiningDate ? joiningDate.slice(0, 10) : ''
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`

  let sundays = 0
  let workingDays = 0
  for (let day = 1; day <= calendarDaysInMonth(periodMonth); day += 1) {
    // Dates in YYYY-MM-DD form compare correctly as plain text.
    if (joined && `${prefix}${String(day).padStart(2, '0')}` < joined) continue
    if (new Date(year, month, day).getDay() === 0) sundays += 1
    else workingDays += 1
  }
  return { sundays, workingDays }
}

export function sundaysInMonth(periodMonth: string): number {
  return monthDays(periodMonth).sundays
}

export function workingDaysInMonth(periodMonth: string): number {
  return monthDays(periodMonth).workingDays
}

export function calendarDaysInMonth(periodMonth: string): number {
  const date = new Date(`${periodMonth}T00:00:00`)
  if (Number.isNaN(date.getTime())) return 30
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}
