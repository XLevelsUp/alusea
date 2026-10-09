// Parses the repeating line-item rows a quote or invoice form submits, shared so both documents price identically.

import { ActionError } from '../actionError'
import { isKnownHsnCode } from './hsn'
import { parseRupeesToPaise } from './money'
import { lineAmountPaise } from './tax'

export type ParsedLineItem = {
  position: number
  description: string
  hsn_code: string
  width_ft: number | null
  height_ft: number | null
  quantity: number
  unit: string
  rate_paise: number
  amount_paise: number
  product_id: string | null
}

function numberOrNull(value: FormDataEntryValue | null): number | null {
  const text = String(value ?? '').trim()
  if (!text) return null
  const parsed = Number(text)
  return Number.isFinite(parsed) ? parsed : null
}

// Rows arrive as items[0][description], items[1][description] and so on, so the index is read from the field name rather than assumed contiguous.
export function parseLineItems(formData: FormData): ParsedLineItem[] {
  const indices = new Set<number>()

  for (const key of formData.keys()) {
    const match = key.match(/^items\[(\d+)\]\[/)
    if (match) indices.add(Number(match[1]))
  }

  const items: ParsedLineItem[] = []

  for (const index of [...indices].sort((a, b) => a - b)) {
    const field = (name: string) => String(formData.get(`items[${index}][${name}]`) ?? '').trim()

    const description = field('description')
    if (!description) continue

    const line = items.length + 1
    const hsnCode = field('hsn_code')
    const unit = field('unit')
    const ratePaise = parseRupeesToPaise(field('rate'))

    // Every figure is taken as typed: width and height are recorded for reference and never change the quantity.
    const quantity = numberOrNull(formData.get(`items[${index}][quantity]`)) ?? 1

    // The amount is whatever was typed; only a blank amount falls back to quantity times rate.
    const amountInput = field('amount')
    const amountPaise = amountInput ? parseRupeesToPaise(amountInput) : lineAmountPaise(quantity, ratePaise)

    if (hsnCode && !isKnownHsnCode(hsnCode)) throw new ActionError(`Line ${line}: choose an HSN code from the list`)
    if (quantity < 0) throw new ActionError(`Line ${line}: quantity cannot be negative`)
    if (ratePaise < 0) throw new ActionError(`Line ${line}: rate cannot be negative`)
    if (amountPaise < 0) throw new ActionError(`Line ${line}: amount cannot be negative`)

    items.push({
      position: items.length,
      description,
      hsn_code: hsnCode,
      width_ft: numberOrNull(formData.get(`items[${index}][width_ft]`)),
      height_ft: numberOrNull(formData.get(`items[${index}][height_ft]`)),
      quantity,
      unit,
      rate_paise: ratePaise,
      amount_paise: amountPaise,
      // Lines are typed by hand now, so nothing links them to a catalogue product.
      product_id: null,
    })
  }

  if (items.length === 0) {
    throw new ActionError('Add at least one line with a description')
  }

  return items
}
