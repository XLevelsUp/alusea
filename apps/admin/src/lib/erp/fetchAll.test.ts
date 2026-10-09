import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { fetchAll } from './fetchAll.ts'

// A stand-in for a table of `total` rows that hands back whatever range is asked for, and records each request.
function table(total: number) {
  const calls: [number, number][] = []
  const page = async (from: number, to: number) => {
    calls.push([from, to])
    const data = Array.from({ length: Math.max(0, Math.min(to, total - 1) - from + 1) }, (_, index) => from + index)
    return { data, error: null }
  }
  return { page, calls }
}

describe('fetchAll', () => {
  test('a short list takes one request', async () => {
    const { page, calls } = table(7)
    const { data } = await fetchAll(page, 10)
    assert.equal(data.length, 7)
    assert.deepEqual(calls, [[0, 9]])
  })

  test('a long list is read chunk by chunk with nothing lost or repeated', async () => {
    const { page, calls } = table(25)
    const { data } = await fetchAll(page, 10)
    assert.deepEqual(data, Array.from({ length: 25 }, (_, index) => index))
    assert.deepEqual(calls, [[0, 9], [10, 19], [20, 29]])
  })

  test('a list that exactly fills its chunks asks once more to be sure it is finished', async () => {
    const { page, calls } = table(20)
    const { data } = await fetchAll(page, 10)
    assert.equal(data.length, 20)
    assert.equal(calls.length, 3)
  })

  test('an empty table gives an empty list', async () => {
    const { data } = await fetchAll(table(0).page, 10)
    assert.deepEqual(data, [])
  })

  test('a failed request throws rather than returning part of the list', async () => {
    const failing = async () => ({ data: null, error: { message: 'permission denied' } })
    await assert.rejects(fetchAll(failing, 10), /permission denied/)
  })
})
