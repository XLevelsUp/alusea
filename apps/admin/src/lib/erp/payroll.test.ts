import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  computeBasePaise,
  computePayslip,
  computeRunTotals,
  toPeriodMonth,
  formatPeriod,
  calendarDaysInMonth,
  lastCompletedMonth,
  SALARY_DIVISOR_DAYS,
} from './payroll.ts'

// 25,000 a month is 819.67 a day at salary ÷ 30.5.
const SALARY = 2500000

describe('computeBasePaise — monthly staff', () => {
  test('one day of pay is the salary divided by 30.5', () => {
    assert.equal(SALARY_DIVISOR_DAYS, 30.5)
  })

  test('a 30-day month with 4 Sundays, every working day worked', () => {
    // 26 worked + 4 Sundays = 30 paid days: 25,000 ÷ 30.5 × 30 = 24,590.16.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26, sundays: 4 })
    assert.equal(base, 2459016)
  })

  test('a 31-day month pays a little more than the salary', () => {
    // 27 worked + 4 Sundays = 31 paid days: 25,000 ÷ 30.5 × 31 = 25,409.84.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 27, sundays: 4 })
    assert.equal(base, 2540984)
  })

  test('a 31-day month with 5 Sundays pays the same as one with 4', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26, sundays: 5 })
    assert.equal(base, 2540984)
  })

  test('February pays for 28 days', () => {
    // 24 worked + 4 Sundays = 28 paid days: 25,000 ÷ 30.5 × 28 = 22,950.82.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 24, sundays: 4 })
    assert.equal(base, 2295082)
  })

  test('each day absent costs one day of pay; the Sundays are still paid', () => {
    const full = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26, sundays: 4 })
    const twoAbsent = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 24, sundays: 4 })
    assert.equal(twoAbsent, 2295082)
    assert.equal(full - twoAbsent, 163934) // two days at 819.67
  })

  test('a mid-month joiner is paid their days worked plus the Sundays since joining', () => {
    // Joined 6 August 2026: 22 working days and 4 Sundays remain, so 26 paid days = 21,311.48.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 22, sundays: 4 })
    assert.equal(base, 2131148)
  })

  test('no days worked pays nothing, not even the Sundays', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 0, sundays: 4 })
    assert.equal(base, 0)
  })

  test('half days are supported', () => {
    // 25.5 worked + 4 Sundays = 29.5 paid days.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 25.5, sundays: 4 })
    assert.equal(base, Math.round((SALARY / 30.5) * 29.5))
  })

  test('the result is always whole paise', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 3333333, daysWorked: 17, sundays: 4 })
    assert.equal(Number.isInteger(base), true)
  })
})

describe('computeBasePaise — daily staff', () => {
  test('rate times days', () => {
    // 800 a day for 24 days.
    const base = computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24 })
    assert.equal(base, 1920000)
  })

  test('Sundays are not added for daily staff', () => {
    const base = computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24, sundays: 4 })
    assert.equal(base, 1920000)
  })

  test('half days are supported', () => {
    const base = computeBasePaise({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 12.5 })
    assert.equal(base, 1000000)
  })
})

describe('computeBasePaise — bad input', () => {
  test('a negative amount is treated as zero rather than paying backwards', () => {
    assert.equal(computeBasePaise({ workerType: 'monthly', enteredAmountPaise: -5000, daysWorked: 10, sundays: 4 }), 0)
  })

  test('negative days are treated as zero', () => {
    assert.equal(computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: -3, sundays: 4 }), 0)
  })

  test('NaN days do not produce a NaN payslip', () => {
    assert.equal(computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: Number.NaN, sundays: 4 }), 0)
  })

  test('a missing Sunday count pays the days worked alone', () => {
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26 })
    assert.equal(base, Math.round((SALARY / 30.5) * 26))
  })
})

describe('computePayslip', () => {
  test('adds overtime and bonus to the base', () => {
    const slip = computePayslip({
      workerType: 'monthly',
      enteredAmountPaise: SALARY,
      daysWorked: 26,
      sundays: 4,
      overtimePaise: 150000,
      bonusPaise: 200000,
    })
    assert.equal(slip.basePaise, 2459016)
    assert.equal(slip.grossPaise, 2459016 + 150000 + 200000)
  })

  test('net equals gross, since this scope has no deductions', () => {
    const slip = computePayslip({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26, sundays: 4, bonusPaise: 50000 })
    assert.equal(slip.netPaise, slip.grossPaise)
  })

  test('components always sum exactly to the gross', () => {
    for (const daysWorked of [1, 7.5, 13, 22, 26]) {
      const slip = computePayslip({
        workerType: 'monthly',
        enteredAmountPaise: 3333333,
        daysWorked,
        sundays: 4,
        overtimePaise: 12345,
        bonusPaise: 6789,
      })
      assert.equal(slip.basePaise + slip.overtimePaise + slip.bonusPaise, slip.grossPaise)
    }
  })

  test('reports the Sundays it paid', () => {
    assert.equal(computePayslip({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26, sundays: 4 }).paidSundays, 4)
    assert.equal(computePayslip({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 0, sundays: 4 }).paidSundays, 0)
    assert.equal(computePayslip({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24, sundays: 4 }).paidSundays, 0)
  })

  test('missing overtime and bonus count as zero', () => {
    const slip = computePayslip({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 10 })
    assert.equal(slip.overtimePaise, 0)
    assert.equal(slip.bonusPaise, 0)
    assert.equal(slip.grossPaise, 800000)
  })

  test('negative overtime cannot reduce pay', () => {
    const slip = computePayslip({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 10, overtimePaise: -50000 })
    assert.equal(slip.overtimePaise, 0)
    assert.equal(slip.grossPaise, 800000)
  })

  test('the explanation says how the base was worked out', () => {
    const monthly = computePayslip({ workerType: 'monthly', enteredAmountPaise: SALARY, daysWorked: 26, sundays: 4 })
    assert.equal(monthly.baseExplanation, '26 days worked + 4 Sundays, at salary ÷ 30.5 a day')

    const daily = computePayslip({ workerType: 'daily', enteredAmountPaise: 80000, daysWorked: 24 })
    assert.equal(daily.baseExplanation, '24 days at the daily rate')
  })
})

describe('computeRunTotals', () => {
  test('sums a run', () => {
    const totals = computeRunTotals([
      { grossPaise: 2459016, netPaise: 2459016 },
      { grossPaise: 1920000, netPaise: 1920000 },
    ])
    assert.equal(totals.employeeCount, 2)
    assert.equal(totals.totalGrossPaise, 4379016)
    assert.equal(totals.totalNetPaise, 4379016)
  })

  test('an empty run totals zero', () => {
    assert.deepEqual(computeRunTotals([]), { employeeCount: 0, totalGrossPaise: 0, totalNetPaise: 0 })
  })
})

describe('period helpers', () => {
  test('a period is the first of its month', () => {
    assert.equal(toPeriodMonth(new Date(2026, 10, 17)), '2026-11-01')
  })

  test('single-digit months are padded', () => {
    assert.equal(toPeriodMonth(new Date(2026, 3, 5)), '2026-04-01')
  })

  test('formats a period for display', () => {
    assert.equal(formatPeriod('2026-11-01'), 'November 2026')
  })

  test('knows real month lengths', () => {
    assert.equal(calendarDaysInMonth('2026-11-01'), 30)
    assert.equal(calendarDaysInMonth('2026-10-01'), 31)
    assert.equal(calendarDaysInMonth('2027-02-01'), 28)
    assert.equal(calendarDaysInMonth('2028-02-01'), 29)
  })
})

describe('lastCompletedMonth', () => {
  test('is the month before today, whatever the day', () => {
    assert.equal(lastCompletedMonth('2026-10-13'), '2026-09')
    assert.equal(lastCompletedMonth('2026-10-01'), '2026-09')
    assert.equal(lastCompletedMonth('2026-10-31'), '2026-09')
  })

  test('steps back over the new year', () => {
    assert.equal(lastCompletedMonth('2027-01-05'), '2026-12')
  })

  test('the month in progress and later months compare as not yet allowed', () => {
    const last = lastCompletedMonth('2026-10-13')
    assert.equal('2026-10' > last, true)
    assert.equal('2026-11' > last, true)
    assert.equal('2026-09' > last, false)
    assert.equal('2026-08' > last, false)
  })
})
