import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { todayInIndia } from './dates.ts'

describe('todayInIndia', () => {
  test('early morning in India is already the new day, though UTC is still on the old one', () => {
    // 2:00 on 6 October in India is 20:30 on 5 October in UTC.
    assert.equal(todayInIndia(new Date('2026-10-05T20:30:00Z')), '2026-10-06')
  })

  test('the afternoon is the same day in both', () => {
    assert.equal(todayInIndia(new Date('2026-10-05T09:00:00Z')), '2026-10-05')
  })

  test('the last minute before midnight in India has not rolled over', () => {
    assert.equal(todayInIndia(new Date('2026-10-05T18:29:00Z')), '2026-10-05')
  })
})
