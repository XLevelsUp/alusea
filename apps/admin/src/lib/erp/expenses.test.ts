import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { settlementOf } from './expenses.ts'

const expense = (over: Partial<Parameters<typeof settlementOf>[0]>) => ({
  status: 'approved',
  paid_by: 'company' as const,
  paid_at: null,
  reimbursed_at: null,
  ...over,
})

describe('settlementOf', () => {
  test('has nothing to settle until the expense is approved', () => {
    assert.equal(settlementOf(expense({ status: 'submitted' })), null)
    assert.equal(settlementOf(expense({ status: 'rejected', paid_by: 'person' })), null)
  })

  test('a company-paid expense waits to be paid, then is paid', () => {
    assert.equal(settlementOf(expense({})), 'to_pay')
    assert.equal(settlementOf(expense({ paid_at: '2026-10-01T00:00:00Z' })), 'paid')
  })

  test('a person-paid expense waits to be reimbursed, then is reimbursed', () => {
    assert.equal(settlementOf(expense({ paid_by: 'person' })), 'to_reimburse')
    assert.equal(settlementOf(expense({ paid_by: 'person', reimbursed_at: '2026-10-01T00:00:00Z' })), 'reimbursed')
  })

  test('a person-paid expense is not settled by a stray paid date', () => {
    assert.equal(settlementOf(expense({ paid_by: 'person', paid_at: '2026-10-01T00:00:00Z' })), 'to_reimburse')
  })
})
