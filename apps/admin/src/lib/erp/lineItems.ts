// Parses the repeating line-item rows a quote or invoice form submits, shared so both documents price identically.

import { ActionError } from '../actionError'
import { parseRupeesToPaise } from './money'
import { areaSqFt, lineAmountPaise } from './tax'

export type ParsedLineItem = {
  position: number
  description: string
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
    const description = String(formData.get(`items[${index}][description]`) ?? '').trim()
    if (!description) continue

    const width = numberOrNull(formData.get(`items[${index}][width_ft]`))
    const height = numberOrNull(formData.get(`items[${index}][height_ft]`))
    const unit = String(formData.get(`items[${index}][unit]`) ?? 'sq ft').trim() || 'sq ft'
    const ratePaise = parseRupeesToPaise(String(formData.get(`items[${index}][rate]`) ?? ''))
    const productId = String(formData.get(`items[${index}][product_id]`) ?? '').trim()

    // Width and height, when both given, define the quantity; otherwise the typed quantity stands.
    const explicitQuantity = numberOrNull(formData.get(`items[${index}][quantity]`))
    const quantity =
      width !== null && height !== null && width > 0 && height > 0
        ? areaSqFt(width, height)
        : (explicitQuantity ?? 1)

    if (quantity < 0) {
      throw new ActionError(`Line ${items.length + 1}: quantity cannot be negative`)
    }

    if (ratePaise < 0) {
      throw new ActionError(`Line ${items.length + 1}: rate cannot be negative`)
    }

    items.push({
      position: items.length,
      description,
      width_ft: width,
      height_ft: height,
      quantity,
      unit,
      rate_paise: ratePaise,
      amount_paise: lineAmountPaise(quantity, ratePaise),
      product_id: productId || null,
    })
  }

  if (items.length === 0) {
    throw new ActionError('Add at least one line with a description')
  }

  return items
}
