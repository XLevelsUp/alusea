import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeBasePaise, sundaysInMonth, workingDaysInMonth } from './payroll.ts'

describe('sundaysInMonth', () => {
  test('counts four Sundays in a month that has four', () => {
    assert.equal(sundaysInMonth('2026-10-01'), 4)
    assert.equal(sundaysInMonth('2027-06-01'), 4)
  })

  test('counts five Sundays when the month starts on one', () => {
    // 1 November 2026 is a Sunday, so the 1st, 8th, 15th, 22nd and 29th all fall on Sundays.
    assert.equal(sundaysInMonth('2026-11-01'), 5)
  })

  test('returns zero for a value that is not a date', () => {
    assert.equal(sundaysInMonth('not-a-date'), 0)
  })
})

describe('workingDaysInMonth', () => {
  test('is calendar days minus Sundays', () => {
    assert.equal(workingDaysInMonth('2027-06-01'), 26) // 30 days, 4 Sundays
    assert.equal(workingDaysInMonth('2026-10-01'), 27) // 31 days, 4 Sundays
    assert.equal(workingDaysInMonth('2026-11-01'), 25) // 30 days, 5 Sundays
    assert.equal(workingDaysInMonth('2027-02-01'), 24) // 28 days, 4 Sundays
  })

  test('handles a leap-year February', () => {
    assert.equal(workingDaysInMonth('2028-02-01'), 25) // 29 days, 4 Sundays
  })
})

describe('salary over working days', () => {
  test('working every working day pays exactly the monthly salary', () => {
    for (const month of ['2026-10-01', '2026-11-01', '2027-02-01', '2027-06-01']) {
      const days = workingDaysInMonth(month)
      const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 2600000, daysWorked: days, daysInPeriod: days })
      assert.equal(base, 2600000, month)
    }
  })

  test('a missed day costs one working day of salary', () => {
    // 26,000 over 26 working days is 1,000 a day, so 24 days worked pays 24,000.
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 2600000, daysWorked: 24, daysInPeriod: 26 })
    assert.equal(base, 2400000)
  })
})
