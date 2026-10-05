import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { earliestNeeded, inRange, monthlyTotals, periodRange, totals, withRunningBalance } from './finance.ts'

// 5 October 2026, inside financial year 2026-27.
const TODAY = new Date(2026, 9, 5)

describe('periodRange', () => {
  test('this month and last month', () => {
    assert.deepEqual(periodRange('this_month', TODAY), { from: '2026-10-01', to: '2026-10-31' })
    assert.deepEqual(periodRange('last_month', TODAY), { from: '2026-09-01', to: '2026-09-30' })
  })

  test('last month from January reaches back into the previous year', () => {
    assert.deepEqual(periodRange('last_month', new Date(2027, 0, 10)), { from: '2026-12-01', to: '2026-12-31' })
  })

  test('financial years run April to March', () => {
    assert.deepEqual(periodRange('this_fy', TODAY), { from: '2026-04-01', to: '2027-03-31' })
    assert.deepEqual(periodRange('last_fy', TODAY), { from: '2025-04-01', to: '2026-03-31' })
  })

  test('in February the financial year is the one that started the April before', () => {
    assert.deepEqual(periodRange('this_fy', new Date(2027, 1, 15)), { from: '2026-04-01', to: '2027-03-31' })
  })

  test('all time has no limits', () => {
    assert.deepEqual(periodRange('all', TODAY), { from: null, to: null })
  })
})

describe('inRange', () => {
  test('includes both ends of the range', () => {
    const range = { from: '2026-10-01', to: '2026-10-31' }
    assert.equal(inRange('2026-10-01', range), true)
    assert.equal(inRange('2026-10-31', range), true)
    assert.equal(inRange('2026-11-01', range), false)
    assert.equal(inRange('2026-09-30', range), false)
  })
})

describe('totals and running balance', () => {
  const rows = [
    { entry_date: '2026-10-03', direction: 'out' as const, amount_paise: 30000 },
    { entry_date: '2026-10-01', direction: 'in' as const, amount_paise: 100000 },
    { entry_date: '2026-10-02', direction: 'out' as const, amount_paise: 20000 },
  ]

  test('adds money in and money out separately', () => {
    assert.deepEqual(totals(rows), { inPaise: 100000, outPaise: 50000, netPaise: 50000 })
  })

  test('the running balance follows date order, not the order given', () => {
    const balances = withRunningBalance(rows).map((row) => [row.entry_date, row.balancePaise])
    assert.deepEqual(balances, [
      ['2026-10-01', 100000],
      ['2026-10-02', 80000],
      ['2026-10-03', 50000],
    ])
  })
})

describe('monthlyTotals', () => {
  test('returns every month in the window, including empty ones, oldest first', () => {
    const result = monthlyTotals(
      [
        { entry_date: '2026-10-02', direction: 'in', amount_paise: 500 },
        { entry_date: '2026-08-15', direction: 'out', amount_paise: 200 },
        { entry_date: '2025-01-01', direction: 'in', amount_paise: 999 },
      ],
      3,
      TODAY
    )
    assert.deepEqual(result, [
      { month: '2026-08', inPaise: 0, outPaise: 200 },
      { month: '2026-09', inPaise: 0, outPaise: 0 },
      { month: '2026-10', inPaise: 500, outPaise: 0 },
    ])
  })
})

describe('earliestNeeded', () => {
  test('a short period still loads the twelve months the trend chart shows', () => {
    assert.equal(earliestNeeded(periodRange('this_month', TODAY), TODAY), '2025-11-01')
  })

  test('a period reaching further back than the chart loads from its own start', () => {
    assert.equal(earliestNeeded(periodRange('last_fy', TODAY), TODAY), '2025-04-01')
  })

  test('all time loads everything', () => {
    assert.equal(earliestNeeded(periodRange('all', TODAY), TODAY), null)
  })
})

describe('withRunningBalance opening balance', () => {
  test('the balance starts from what was carried in', () => {
    const rows = withRunningBalance([{ entry_date: '2026-10-01', direction: 'out' as const, amount_paise: 300 }], 1000)
    assert.equal(rows[0].balancePaise, 700)
  })
})
