import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { computeTax, isInterStateSupply, areaSqFt, lineAmountPaise } from './tax.ts'

describe('isInterStateSupply', () => {
  test('different states are inter-state', () => {
    assert.equal(isInterStateSupply('33', '27'), true)
  })

  test('the same state is intra-state', () => {
    assert.equal(isInterStateSupply('33', '33'), false)
  })

  test('a missing party state falls back to intra-state', () => {
    // Safer default: keeps the tax at home rather than wrongly claiming an inter-state supply.
    assert.equal(isInterStateSupply('33', ''), false)
    assert.equal(isInterStateSupply('', '27'), false)
  })

  test('whitespace does not make two identical states look different', () => {
    assert.equal(isInterStateSupply(' 33 ', '33'), false)
  })
})

describe('computeTax — intra-state', () => {
  const base = {
    lineAmountsPaise: [10000000],
    isGstApplicable: true,
    gstRatePercent: 18,
    companyStateCode: '33',
    partyStateCode: '33',
  }

  test('splits into CGST and SGST', () => {
    const result = computeTax(base)
    assert.equal(result.isInterState, false)
    assert.equal(result.igstPaise, 0)
    assert.equal(result.cgstPaise, 900000)
    assert.equal(result.sgstPaise, 900000)
  })

  test('the halves sum back to the tax total', () => {
    // An odd tax total must not lose or gain a paise in the split.
    const result = computeTax({ ...base, lineAmountsPaise: [33333] })
    assert.equal(result.cgstPaise + result.sgstPaise, result.taxTotalPaise)
  })

  test('total is subtotal plus tax, rounded to the rupee', () => {
    const result = computeTax(base)
    assert.equal(result.totalPaise, 11800000)
    assert.equal(result.roundingPaise, 0)
  })
})

describe('computeTax — inter-state', () => {
  const base = {
    lineAmountsPaise: [10000000],
    isGstApplicable: true,
    gstRatePercent: 18,
    companyStateCode: '33',
    partyStateCode: '27',
  }

  test('uses IGST alone', () => {
    const result = computeTax(base)
    assert.equal(result.isInterState, true)
    assert.equal(result.igstPaise, 1800000)
    assert.equal(result.cgstPaise, 0)
    assert.equal(result.sgstPaise, 0)
  })

  test('the total matches the intra-state total for the same rate', () => {
    // Only the split differs; the client pays the same either way.
    const inter = computeTax(base)
    const intra = computeTax({ ...base, partyStateCode: '33' })
    assert.equal(inter.totalPaise, intra.totalPaise)
  })
})

describe('computeTax — GST switched off', () => {
  test('charges no tax at all', () => {
    const result = computeTax({
      lineAmountsPaise: [10000000],
      isGstApplicable: false,
      gstRatePercent: 18,
      companyStateCode: '33',
      partyStateCode: '27',
    })

    assert.equal(result.taxTotalPaise, 0)
    assert.equal(result.igstPaise, 0)
    assert.equal(result.cgstPaise, 0)
    assert.equal(result.sgstPaise, 0)
    assert.equal(result.totalPaise, 10000000)
  })

  test('the rate is ignored rather than applied', () => {
    const off = computeTax({
      lineAmountsPaise: [777777],
      isGstApplicable: false,
      gstRatePercent: 28,
      companyStateCode: '33',
      partyStateCode: '33',
    })
    assert.equal(off.taxTotalPaise, 0)
  })
})

describe('computeTax — rounding', () => {
  test('rounds the grand total and reports the adjustment', () => {
    // 1,234.56 at 18% gives 1,456.78, which rounds up by 22 paise.
    const result = computeTax({
      lineAmountsPaise: [123456],
      isGstApplicable: true,
      gstRatePercent: 18,
      companyStateCode: '33',
      partyStateCode: '33',
    })

    assert.equal(result.subtotalPaise, 123456)
    assert.equal(result.taxTotalPaise, 22222)
    assert.equal(result.totalPaise % 100, 0)
    assert.equal(result.totalPaise, result.subtotalPaise + result.taxTotalPaise + result.roundingPaise)
  })

  test('the stored figures always reconcile', () => {
    // The invariant every invoice must satisfy: parts sum to the whole.
    for (const amount of [1, 99, 100, 12345, 999999, 10000001]) {
      const result = computeTax({
        lineAmountsPaise: [amount],
        isGstApplicable: true,
        gstRatePercent: 18,
        companyStateCode: '33',
        partyStateCode: '33',
      })

      const parts =
        result.subtotalPaise +
        result.igstPaise +
        result.cgstPaise +
        result.sgstPaise +
        result.roundingPaise

      assert.equal(parts, result.totalPaise, `failed reconciling for ${amount}`)
    }
  })
})

describe('computeTax — multiple lines', () => {
  test('sums line amounts before taxing', () => {
    const result = computeTax({
      lineAmountsPaise: [7862500, 9280000, 2500000],
      isGstApplicable: true,
      gstRatePercent: 18,
      companyStateCode: '33',
      partyStateCode: '33',
    })

    assert.equal(result.subtotalPaise, 19642500)
    assert.equal(result.taxTotalPaise, 3535650)
  })

  test('an empty document totals zero', () => {
    const result = computeTax({
      lineAmountsPaise: [],
      isGstApplicable: true,
      gstRatePercent: 18,
      companyStateCode: '33',
      partyStateCode: '33',
    })
    assert.equal(result.totalPaise, 0)
  })
})

describe('areaSqFt', () => {
  test('multiplies width by height', () => {
    assert.equal(areaSqFt(5, 4), 20)
  })

  test('keeps two decimal places', () => {
    assert.equal(areaSqFt(4.5, 3.25), 14.63)
  })

  test('non-numeric input is zero rather than NaN', () => {
    assert.equal(areaSqFt(Number.NaN, 4), 0)
  })
})

describe('lineAmountPaise', () => {
  test('quantity times rate, rounded to paise', () => {
    assert.equal(lineAmountPaise(42.5, 185000), 7862500)
  })

  test('fractional areas do not leave sub-paise amounts', () => {
    assert.equal(Number.isInteger(lineAmountPaise(14.63, 145000)), true)
  })
})
