// GST computation for the v1 scope: one rate for the whole document, no HSN/SAC, no per-line rates.
// Pure functions with no database access, so the rules are unit-testable and the same code serves quotes and invoices.

import { percentOf, roundToRupee, sumPaise } from './money.ts'

export type TaxBreakdown = {
  subtotalPaise: number
  igstPaise: number
  cgstPaise: number
  sgstPaise: number
  taxTotalPaise: number
  roundingPaise: number
  totalPaise: number
  isInterState: boolean
}

export type TaxInput = {
  lineAmountsPaise: readonly number[]
  isGstApplicable: boolean
  gstRatePercent: number
  companyStateCode: string
  partyStateCode: string
}

// Different states means IGST; the same state means CGST plus SGST. An unknown party state is treated as intra-state, which is the safer default: it keeps the tax at home rather than wrongly claiming an inter-state supply.
export function isInterStateSupply(companyStateCode: string, partyStateCode: string): boolean {
  const company = companyStateCode.trim()
  const party = partyStateCode.trim()

  if (!company || !party) return false
  return company !== party
}

export function computeTax(input: TaxInput): TaxBreakdown {
  const subtotal = sumPaise(input.lineAmountsPaise)
  const interState = isInterStateSupply(input.companyStateCode, input.partyStateCode)

  if (!input.isGstApplicable) {
    const { rounded, adjustment } = roundToRupee(subtotal)
    return {
      subtotalPaise: subtotal,
      igstPaise: 0,
      cgstPaise: 0,
      sgstPaise: 0,
      taxTotalPaise: 0,
      roundingPaise: adjustment,
      totalPaise: rounded,
      isInterState: interState,
    }
  }

  const taxTotal = percentOf(subtotal, input.gstRatePercent)

  // CGST and SGST are half each. The halves are split so they always sum back to the total, rather than rounding each independently and drifting a paise.
  const cgst = interState ? 0 : Math.round(taxTotal / 2)
  const sgst = interState ? 0 : taxTotal - cgst
  const igst = interState ? taxTotal : 0

  const { rounded, adjustment } = roundToRupee(subtotal + taxTotal)

  return {
    subtotalPaise: subtotal,
    igstPaise: igst,
    cgstPaise: cgst,
    sgstPaise: sgst,
    taxTotalPaise: taxTotal,
    roundingPaise: adjustment,
    totalPaise: rounded,
    isInterState: interState,
  }
}

// Fabrication is priced by area: width and height in feet give square feet, rounded to two places as the trade does.
export function areaSqFt(widthFt: number, heightFt: number): number {
  if (!Number.isFinite(widthFt) || !Number.isFinite(heightFt)) return 0
  return Math.round(widthFt * heightFt * 100) / 100
}

export function lineAmountPaise(quantity: number, ratePaise: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(ratePaise)) return 0
  return Math.round(quantity * ratePaise)
}
