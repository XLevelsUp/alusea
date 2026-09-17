import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeBasePaise,
  computePayslip,
  computeRunTotals,
  toPeriodMonth,
  formatPeriod,
  calendarDaysInMonth,
  STANDARD_DAYS_IN_MONTH,
} from './payroll.ts'

describe('computeBasePaise — monthly staff', () => {
  test('the worked example from the plan', () => {
    // 30,000 a month, 26 of 30 days worked, gives 26,000.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 26 })
    assert.equal(base, 2600000)
  })

  test('a full month pays the whole salary', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 30 })
    assert.equal(base, 3000000)
  })

  test('no days worked pays nothing', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 0 })
    assert.equal(base, 0)
  })

  test('uses a fixed 30-day divisor regardless of month length', () => {
    // February and January must pay the same for the same days worked.
    const february = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 20 })
    const january = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 20 })
    assert.equal(february, january)
    assert.equal(february, 2000000)
  })

  test('31 days worked can exceed the monthly salary', () => {
    // A deliberate consequence of the fixed divisor, not a bug: 31 days paid at 1/30 each.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 31 })
    assert.equal(base, 3100000)
  })

  test('half days are supported', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 26.5 })
    assert.equal(base, 2650000)
  })

  test('the result is always whole paise', () => {
    // 33,333.33 a month over 30 days is not a clean division.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3333333, daysWorked: 17 })
    assert.equal(Number.isInteger(base), true)
  })
})

describe('computeBasePaise — daily staff', () => {
  test('rate times days', () => {
    // 800 a day for 24 days.
    const base = computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24 })
    assert.equal(base, 1920000)
  })

  test('the 30-day divisor does not apply', () => {
    // This is the mistake worker_type exists to prevent: 800 a day must not become 800 a month.
    const daily = computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 30 })
    const monthly = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 80000, daysWorked: 30 })
    assert.equal(daily, 2400000)
    assert.equal(monthly, 80000)
    assert.notEqual(daily, monthly)
  })

  test('half days are supported', () => {
    const base = computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24.5 })
    assert.equal(base, 1960000)
  })
})

describe('computeBasePaise — bad input', () => {
  test('a negative amount is treated as zero rather than paying backwards', () => {
    assert.equal(computeBasePaise({ workerType: 'monthly', enteredAmountPaise: -5000, daysWorked: 26 }), 0)
  })

  test('negative days are treated as zero', () => {
    assert.equal(computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: -3 }), 0)
  })

  test('NaN days do not produce a NaN payslip', () => {
    assert.equal(computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: Number.NaN }), 0)
  })
})

describe('computePayslip', () => {
  test('adds overtime and bonus to the base', () => {
    const slip = computePayslip({
      workerType: 'monthly',
      enteredAmountPaise: 3000000,
      daysWorked: 26,
      overtimePaise: 150000,
      bonusPaise: 200000,
    })

    assert.equal(slip.basePaise, 2600000)
    assert.equal(slip.overtimePaise, 150000)
    assert.equal(slip.bonusPaise, 200000)
    assert.equal(slip.grossPaise, 2950000)
  })

  test('net equals gross, since this scope has no deductions', () => {
    const slip = computePayslip({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 26 })
    assert.equal(slip.netPaise, slip.grossPaise)
  })

  test('components always sum exactly to the gross', () => {
    // The invariant the database CHECK constraint also enforces.
    const cases = [
      { workerType: 'monthly' as const, enteredAmountPaise: 3333333, daysWorked: 17, overtimePaise: 12345, bonusPaise: 777 },
      { workerType: 'daily' as const, enteredAmountPaise: 83333, daysWorked: 23.5, overtimePaise: 1, bonusPaise: 99999 },
      { workerType: 'monthly' as const, enteredAmountPaise: 1, daysWorked: 1 },
      { workerType: 'monthly' as const, enteredAmountPaise: 99999999, daysWorked: 30.5 },
    ]

    for (const input of cases) {
      const slip = computePayslip(input)
      assert.equal(
        slip.basePaise + slip.overtimePaise + slip.bonusPaise,
        slip.grossPaise,
        `components did not sum for ${JSON.stringify(input)}`
      )
    }
  })

  test('missing overtime and bonus count as zero', () => {
    const slip = computePayslip({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24 })
    assert.equal(slip.overtimePaise, 0)
    assert.equal(slip.bonusPaise, 0)
    assert.equal(slip.grossPaise, slip.basePaise)
  })

  test('negative overtime cannot reduce pay', () => {
    const slip = computePayslip({
      workerType: 'monthly',
      enteredAmountPaise: 3000000,
      daysWorked: 30,
      overtimePaise: -500000,
    })
    assert.equal(slip.overtimePaise, 0)
    assert.equal(slip.grossPaise, 3000000)
  })

  test('the explanation says how the base was worked out', () => {
    const monthly = computePayslip({ workerType: 'monthly', enteredAmountPaise: 3000000, daysWorked: 26 })
    assert.match(monthly.baseExplanation, /30-day month, 26 days worked/)

    const daily = computePayslip({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24 })
    assert.match(daily.baseExplanation, /24 days at the daily rate/)
  })
})

describe('computeRunTotals', () => {
  test('sums a run', () => {
    const totals = computeRunTotals([
      { grossPaise: 2600000, netPaise: 2600000 },
      { grossPaise: 1920000, netPaise: 1920000 },
      { grossPaise: 3000000, netPaise: 3000000 },
    ])

    assert.equal(totals.employeeCount, 3)
    assert.equal(totals.totalGrossPaise, 7520000)
    assert.equal(totals.totalNetPaise, 7520000)
  })

  test('an empty run totals zero', () => {
    const totals = computeRunTotals([])
    assert.equal(totals.employeeCount, 0)
    assert.equal(totals.totalNetPaise, 0)
  })
})

describe('period helpers', () => {
  test('a period is the first of its month', () => {
    assert.equal(toPeriodMonth(new Date(2026, 8, 17)), '2026-09-01')
  })

  test('single-digit months are padded', () => {
    assert.equal(toPeriodMonth(new Date(2026, 0, 31)), '2026-01-01')
  })

  test('formats a period for display', () => {
    assert.match(formatPeriod('2026-09-01'), /September 2026/)
  })

  test('knows real month lengths, even though pay uses 30', () => {
    assert.equal(calendarDaysInMonth('2026-02-01'), 28)
    assert.equal(calendarDaysInMonth('2024-02-01'), 29)
    assert.equal(calendarDaysInMonth('2026-09-01'), 30)
    assert.equal(calendarDaysInMonth('2026-01-01'), 31)
  })

  test('the pay divisor is 30 regardless of the calendar', () => {
    assert.equal(STANDARD_DAYS_IN_MONTH, 30)
  })
})
