import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseRupeesToPaise,
  paiseToRupeeString,
  formatPaise,
  formatPaisePdf,
  percentOf,
  sumPaise,
  roundToRupee,
  paiseToWords,
} from './money.ts'

describe('parseRupeesToPaise', () => {
  test('converts plain rupees', () => {
    assert.equal(parseRupeesToPaise('1500'), 150000)
    assert.equal(parseRupeesToPaise(1500), 150000)
  })

  test('keeps paise precision', () => {
    assert.equal(parseRupeesToPaise('1500.50'), 150050)
    assert.equal(parseRupeesToPaise('0.01'), 1)
  })

  test('strips currency symbols and separators', () => {
    assert.equal(parseRupeesToPaise('₹1,500.50'), 150050)
    assert.equal(parseRupeesToPaise(' 1 500 '), 150000)
  })

  test('treats blank as zero', () => {
    assert.equal(parseRupeesToPaise(''), 0)
    assert.equal(parseRupeesToPaise(null), 0)
    assert.equal(parseRupeesToPaise(undefined), 0)
  })

  test('rejects nonsense rather than silently returning zero', () => {
    assert.throws(() => parseRupeesToPaise('abc'))
  })

  test('avoids the float error that motivates integer paise', () => {
    // 0.1 + 0.2 === 0.30000000000000004 in float; via paise it is exact.
    assert.equal(parseRupeesToPaise('0.1') + parseRupeesToPaise('0.2'), 30)
  })
})

describe('paiseToRupeeString', () => {
  test('always shows two decimal places', () => {
    assert.equal(paiseToRupeeString(150000), '1500.00')
    assert.equal(paiseToRupeeString(150050), '1500.50')
    assert.equal(paiseToRupeeString(5), '0.05')
    assert.equal(paiseToRupeeString(0), '0.00')
  })

  test('handles negatives', () => {
    assert.equal(paiseToRupeeString(-150050), '-1500.50')
  })
})

describe('formatPaise', () => {
  test('groups by Indian convention, not thousands', () => {
    // 10,00,000 not 1,000,000
    assert.equal(formatPaise(100000000), '₹10,00,000.00')
  })

  test('can omit the symbol', () => {
    assert.equal(formatPaise(150050, { symbol: false }), '1,500.50')
  })

  test('ascii mode avoids the rupee sign for PDFs', () => {
    // Helvetica, the built-in PDF font, has no glyph for U+20B9 and renders a wrong character instead.
    const pdf = formatPaisePdf(150050)
    assert.equal(pdf, 'Rs. 1,500.50')
    assert.equal(pdf.includes('₹'), false)
  })

  test('every PDF amount is Latin-1 safe', () => {
    for (const paise of [0, 1, 99, 150050, 100000000, -150050]) {
      for (const char of formatPaisePdf(paise)) {
        assert.ok(char.charCodeAt(0) < 256, `${char} is outside Latin-1 in ${formatPaisePdf(paise)}`)
      }
    }
  })
})

describe('percentOf', () => {
  test('computes GST at the usual rates', () => {
    assert.equal(percentOf(100000, 18), 18000)
    assert.equal(percentOf(100000, 5), 5000)
  })

  test('rounds to whole paise', () => {
    // 1 paise at 18% is 0.18 paise, which must not stay fractional.
    assert.equal(percentOf(1, 18), 0)
    assert.equal(percentOf(333, 18), 60)
    assert.equal(Number.isInteger(percentOf(12345, 18)), true)
  })
})

describe('sumPaise', () => {
  test('sums line items exactly', () => {
    assert.equal(sumPaise([10050, 20025, 30025]), 60100)
  })

  test('empty list is zero', () => {
    assert.equal(sumPaise([]), 0)
  })
})

describe('roundToRupee', () => {
  test('rounds up and reports the adjustment', () => {
    const { rounded, adjustment } = roundToRupee(150060)
    assert.equal(rounded, 150100)
    assert.equal(adjustment, 40)
  })

  test('rounds down with a negative adjustment', () => {
    const { rounded, adjustment } = roundToRupee(150040)
    assert.equal(rounded, 150000)
    assert.equal(adjustment, -40)
  })

  test('exact rupees need no adjustment', () => {
    const { rounded, adjustment } = roundToRupee(150000)
    assert.equal(rounded, 150000)
    assert.equal(adjustment, 0)
  })
})

describe('paiseToWords', () => {
  test('writes whole rupees', () => {
    assert.equal(paiseToWords(150000), 'Rupees One Thousand Five Hundred Only')
  })

  test('includes paise when present', () => {
    assert.equal(paiseToWords(150050), 'Rupees One Thousand Five Hundred and Fifty Paise Only')
  })

  test('uses lakhs and crores, not millions', () => {
    assert.equal(paiseToWords(10000000), 'Rupees One Lakh Only')
    assert.equal(paiseToWords(1000000000), 'Rupees One Crore Only')
    assert.equal(paiseToWords(1250000000), 'Rupees One Crore Twenty Five Lakh Only')
  })

  test('handles the teens correctly', () => {
    assert.equal(paiseToWords(1500), 'Rupees Fifteen Only')
    assert.equal(paiseToWords(1900), 'Rupees Nineteen Only')
  })

  test('zero reads as zero', () => {
    assert.equal(paiseToWords(0), 'Rupees Zero Only')
  })

  test('a realistic invoice total', () => {
    assert.equal(
      paiseToWords(24557900),
      'Rupees Two Lakh Forty Five Thousand Five Hundred Seventy Nine Only'
    )
  })
})
