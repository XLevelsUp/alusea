import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { donutSegments, linePath, rankAndFold, xAt } from './charts.ts'

describe('rankAndFold', () => {
  test('sorts largest first without changing the list it was given', () => {
    const items = [
      { label: 'Fuel', value: 100 },
      { label: 'Glass', value: 900 },
      { label: 'Tools', value: 400 },
    ]
    assert.deepEqual(rankAndFold(items).map((item) => item.label), ['Glass', 'Tools', 'Fuel'])
    assert.equal(items[0].label, 'Fuel')
  })

  test('drops entries with nothing in them', () => {
    const folded = rankAndFold([
      { label: 'Fuel', value: 0 },
      { label: 'Glass', value: 500 },
      { label: 'Refund', value: -50 },
    ])
    assert.deepEqual(folded, [{ label: 'Glass', value: 500 }])
  })

  test('keeps everything when the list fits the limit', () => {
    const items = Array.from({ length: 6 }, (_, index) => ({ label: `C${index}`, value: index + 1 }))
    assert.equal(rankAndFold(items, 6).length, 6)
  })

  test('folds the tail into one Other entry that remembers what it holds', () => {
    const items = Array.from({ length: 9 }, (_, index) => ({ label: `C${index}`, value: (index + 1) * 10 }))
    const folded = rankAndFold(items, 6)
    const other = folded[6]

    assert.equal(folded.length, 7)
    assert.equal(other.label, 'Other (3)')
    assert.equal(other.value, 10 + 20 + 30)
    assert.deepEqual(other.otherItems?.map((item) => item.label), ['C2', 'C1', 'C0'])
  })

  test('folding never changes the grand total', () => {
    const items = Array.from({ length: 12 }, (_, index) => ({ label: `C${index}`, value: index * 7 + 3 }))
    const sum = (list: { value: number }[]) => list.reduce((total, item) => total + item.value, 0)
    assert.equal(sum(rankAndFold(items, 6)), sum(items))
  })
})

describe('donutSegments', () => {
  test('slices are percentages that start where the last one ended', () => {
    assert.deepEqual(donutSegments([50, 30, 20]), [
      { percent: 50, offset: 25 },
      { percent: 30, offset: -25 },
      { percent: 20, offset: -55 },
    ])
  })

  test('an empty total draws nothing rather than dividing by zero', () => {
    assert.deepEqual(donutSegments([0, 0]), [
      { percent: 0, offset: 25 },
      { percent: 0, offset: 25 },
    ])
  })
})

describe('linePath', () => {
  test('points sit at the centre of their slots', () => {
    assert.equal(xAt(0, 4), 12.5)
    assert.equal(xAt(3, 4), 87.5)
  })

  test('zero is the bottom of the plot and the maximum is the top', () => {
    assert.equal(linePath([0, 100], 100), 'M 25.00 100.00 L 75.00 0.00')
  })

  test('an all-zero series stays on the baseline', () => {
    assert.equal(linePath([0, 0], 0), 'M 25.00 100.00 L 75.00 100.00')
  })
})
