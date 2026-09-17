import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { financialYearOf } from './financial-year.ts'

describe('financialYearOf', () => {
  test('April starts a new financial year', () => {
    assert.equal(financialYearOf(new Date(2026, 3, 1)), '2026-27')
  })

  test('March belongs to the year that started the previous April', () => {
    assert.equal(financialYearOf(new Date(2026, 2, 31)), '2025-26')
  })

  test('January to March stay in the earlier year', () => {
    assert.equal(financialYearOf(new Date(2027, 0, 15)), '2026-27')
    assert.equal(financialYearOf(new Date(2027, 1, 15)), '2026-27')
  })

  test('mid-year dates sit in the current year', () => {
    assert.equal(financialYearOf(new Date(2026, 8, 17)), '2026-27')
    assert.equal(financialYearOf(new Date(2026, 11, 31)), '2026-27')
  })

  test('crossing 1 April rolls the year over', () => {
    assert.equal(financialYearOf(new Date(2027, 2, 31)), '2026-27')
    assert.equal(financialYearOf(new Date(2027, 3, 1)), '2027-28')
  })

  test('a century boundary keeps two-digit padding', () => {
    assert.equal(financialYearOf(new Date(2099, 3, 1)), '2099-00')
  })
})
