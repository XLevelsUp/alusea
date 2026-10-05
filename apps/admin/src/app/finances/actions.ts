'use server'

import { todayInIndia } from '@/lib/erp/dates'
import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { parseRupeesToPaise } from '@/lib/erp/money'
import { CAPITAL_KINDS, LEDGER_CATEGORIES } from '@/lib/erp/finance'
import type { CapitalKind, LedgerCategory, LedgerDirection } from '@/lib/supabase/types'

// Finances is changed by owners and developers only; accounts can read it but every action here refuses them.
const FINANCE_WRITERS = ['owner'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

function amount(formData: FormData): number {
  const paise = parseRupeesToPaise(text(formData, 'amount'))
  if (paise <= 0) throw new ActionError('Enter an amount greater than zero')
  return paise
}

function date(formData: FormData, field: string): string {
  return text(formData, field) || todayInIndia()
}

function done() {
  revalidatePath('/finances')
  revalidatePath('/dashboard')
}

// ============================================================
// CAPITAL INFLOW
// ============================================================
function readCapital(formData: FormData) {
  const source = text(formData, 'source')
  if (!source) throw new ActionError('Say where the money came from')

  const kind = text(formData, 'kind')
  if (!CAPITAL_KINDS.some((option) => option.value === kind)) throw new ActionError('Choose the type of capital')

  return {
    received_on: date(formData, 'received_on'),
    source,
    kind: kind as CapitalKind,
    amount_paise: amount(formData),
    notes: text(formData, 'notes'),
  }
}

export const addCapitalInflow = defineAction(async function addCapitalInflow(formData: FormData) {
  const profile = await assertRole(...FINANCE_WRITERS)

  const supabase = await createClient()
  const { error } = await supabase.from('capital_inflows').insert([{ ...readCapital(formData), created_by: profile.id }])
  if (error) throw new ActionError('Could not record the capital: ' + error.message)

  done()
})

export const updateCapitalInflow = defineAction(async function updateCapitalInflow(formData: FormData) {
  await assertRole(...FINANCE_WRITERS)

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Capital entry is required')

  const supabase = await createClient()
  const { error } = await supabase.from('capital_inflows').update(readCapital(formData)).eq('id', id)
  if (error) throw new ActionError('Could not update the capital: ' + error.message)

  done()
})

export const deleteCapitalInflow = defineAction(async function deleteCapitalInflow(id: string) {
  await assertRole(...FINANCE_WRITERS)
  if (!id) throw new ActionError('Capital entry is required')

  const supabase = await createClient()
  const { error } = await supabase.from('capital_inflows').delete().eq('id', id)
  if (error) throw new ActionError('Could not delete the capital: ' + error.message)

  done()
})

// ============================================================
// MANUAL LEDGER ENTRIES
// ============================================================
// A new entry waits for approval before it counts, as in the reference.
export const addLedgerEntry = defineAction(async function addLedgerEntry(formData: FormData) {
  const profile = await assertRole(...FINANCE_WRITERS)

  const direction = text(formData, 'direction')
  if (direction !== 'in' && direction !== 'out') throw new ActionError('Choose money in or money out')

  const category = text(formData, 'category')
  if (!LEDGER_CATEGORIES.some((option) => option.value === category)) throw new ActionError('Choose a category')

  const description = text(formData, 'description')
  if (!description) throw new ActionError('Describe what this entry is for')

  const supabase = await createClient()
  const { error } = await supabase.from('ledger_entries').insert([
    {
      entry_date: date(formData, 'entry_date'),
      direction: direction as LedgerDirection,
      category: category as LedgerCategory,
      description,
      party_id: text(formData, 'party_id') || null,
      amount_paise: amount(formData),
      // Input credit only exists on money spent, so the tick is ignored on money in.
      gst_claim: direction === 'out' && text(formData, 'gst_claim') === 'on',
      created_by: profile.id,
    },
  ])
  if (error) throw new ActionError('Could not add the entry: ' + error.message)

  done()
})

// The GST claim tick on a ledger line: a single yes/no saved on the expense or manual entry the line came from.
export const toggleGstClaim = defineAction(async function toggleGstClaim(formData: FormData) {
  await assertRole(...FINANCE_WRITERS)

  const id = text(formData, 'id')
  const source = text(formData, 'source')
  if (!id) throw new ActionError('Entry is required')
  if (source !== 'expense' && source !== 'manual') throw new ActionError('GST can only be claimed on an expense or a manual entry')

  const claimed = text(formData, 'claimed') === 'true'
  const supabase = await createClient()
  const { error } =
    source === 'expense'
      ? await supabase.from('expenses').update({ gst_claim: claimed }).eq('id', id)
      : await supabase.from('ledger_entries').update({ gst_claim: claimed }).eq('id', id).eq('direction', 'out')
  if (error) throw new ActionError('Could not update the GST claim: ' + error.message)

  done()
})

export const approveLedgerEntry = defineAction(async function approveLedgerEntry(id: string) {
  const profile = await assertRole(...FINANCE_WRITERS)
  if (!id) throw new ActionError('Entry is required')

  const supabase = await createClient()
  const { error } = await supabase
    .from('ledger_entries')
    .update({ status: 'approved', approved_at: new Date().toISOString(), approved_by: profile.id })
    .eq('id', id)
  if (error) throw new ActionError('Could not approve the entry: ' + error.message)

  done()
})

export const deleteLedgerEntry = defineAction(async function deleteLedgerEntry(id: string) {
  await assertRole(...FINANCE_WRITERS)
  if (!id) throw new ActionError('Entry is required')

  const supabase = await createClient()
  const { error } = await supabase.from('ledger_entries').delete().eq('id', id)
  if (error) throw new ActionError('Could not delete the entry: ' + error.message)

  done()
})
