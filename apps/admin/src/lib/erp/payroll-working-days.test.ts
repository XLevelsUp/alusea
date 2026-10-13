import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeBasePaise, monthDays, sundaysInMonth, workingDaysInMonth } from './payroll.ts'

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

describe('monthDays for someone who joined during the month', () => {
  test('counts only from the joining date', () => {
    // August 2026 has Sundays on the 2nd, 9th, 16th, 23rd and 30th. From the 6th: 26 days left, 4 of them Sundays.
    assert.deepEqual(monthDays('2026-08-01', '2026-08-06'), { sundays: 4, workingDays: 22 })
  })

  test('joining on a Sunday counts that Sunday', () => {
    assert.deepEqual(monthDays('2026-08-01', '2026-08-09'), { sundays: 4, workingDays: 19 })
  })

  test('someone who joined in an earlier month gets the whole month', () => {
    assert.deepEqual(monthDays('2026-08-01', '2025-03-15'), { sundays: 5, workingDays: 26 })
  })

  test('someone who joins after the month has nothing in it', () => {
    assert.deepEqual(monthDays('2026-08-01', '2026-09-03'), { sundays: 0, workingDays: 0 })
  })

  test('no joining date means the whole month', () => {
    assert.deepEqual(monthDays('2026-08-01', null), { sundays: 5, workingDays: 26 })
    assert.deepEqual(monthDays('2026-08-01'), { sundays: 5, workingDays: 26 })
  })

  test('a joining date with a time part is read by its date', () => {
    assert.deepEqual(monthDays('2026-08-01', '2026-08-06T10:30:00+05:30'), { sundays: 4, workingDays: 22 })
  })
})

describe('a full month of attendance', () => {
  test('pays for every calendar day at salary ÷ 30.5', () => {
    for (const month of ['2026-10-01', '2026-11-01', '2027-02-01', '2027-06-01']) {
      const { sundays, workingDays } = monthDays(month)
      const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 2500000, daysWorked: workingDays, sundays })
      assert.equal(base, Math.round((2500000 / 30.5) * (workingDays + sundays)), month)
    }
  })

  test('a new joiner working every remaining day is paid from the joining date to the month end', () => {
    const { sundays, workingDays } = monthDays('2026-08-01', '2026-08-06')
    const base = computeBasePaise({ workerType: 'monthly', enteredAmountPaise: 2500000, daysWorked: workingDays, sundays })
    assert.equal(base, 2131148) // 26 paid days at 819.67
  })
})
