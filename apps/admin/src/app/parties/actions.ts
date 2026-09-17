'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { isValidGstin, isValidPan, stateNameForCode } from '@/lib/erp/states'

const ERP_WRITERS = ['owner', 'accounts', 'sales'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

function readPartyFields(formData: FormData) {
  const name = text(formData, 'name')
  if (!name) {
    throw new Error('Name is required')
  }

  const isClient = formData.get('is_client') === 'on'
  const isVendor = formData.get('is_vendor') === 'on'
  if (!isClient && !isVendor) {
    throw new Error('A party must be a client, a vendor, or both')
  }

  const gstin = text(formData, 'gstin').toUpperCase()
  const pan = text(formData, 'pan').toUpperCase()
  const stateCode = text(formData, 'billing_state_code')

  if (gstin && !isValidGstin(gstin)) {
    throw new Error('GSTIN must be 15 characters in the standard format, for example 33ABCDE1234F1Z5')
  }

  if (pan && !isValidPan(pan)) {
    throw new Error('PAN must be 10 characters in the standard format, for example ABCDE1234F')
  }

  // The state code drives IGST versus CGST+SGST, so a GSTIN disagreeing with the selected state would produce wrong tax.
  if (gstin && stateCode && gstin.slice(0, 2) !== stateCode) {
    throw new Error(`GSTIN starts with state code ${gstin.slice(0, 2)} but the selected state is ${stateCode}`)
  }

  const terms = Number(text(formData, 'payment_terms_days') || '0')
  if (!Number.isFinite(terms) || terms < 0) {
    throw new Error('Payment terms must be zero or more days')
  }

  return {
    name,
    display_name: text(formData, 'display_name'),
    is_client: isClient,
    is_vendor: isVendor,
    contact_person: text(formData, 'contact_person'),
    phone: text(formData, 'phone'),
    email: text(formData, 'email'),
    billing_address_line1: text(formData, 'billing_address_line1'),
    billing_address_line2: text(formData, 'billing_address_line2'),
    billing_city: text(formData, 'billing_city'),
    billing_state: stateNameForCode(stateCode),
    billing_state_code: stateCode,
    billing_pincode: text(formData, 'billing_pincode'),
    gstin,
    pan,
    payment_terms_days: terms,
    notes: text(formData, 'notes'),
  }
}

export async function addParty(formData: FormData) {
  const profile = await assertRole(...ERP_WRITERS)

  const supabase = await createClient()
  const { error } = await supabase
    .from('parties')
    .insert([{ ...readPartyFields(formData), created_by: profile.id }])

  if (error) {
    throw new Error('Could not add party: ' + error.message)
  }

  revalidatePath('/parties')
}

export async function updateParty(formData: FormData) {
  await assertRole(...ERP_WRITERS)

  const id = text(formData, 'id')
  if (!id) throw new Error('Party is required')

  const supabase = await createClient()
  const { error } = await supabase.from('parties').update(readPartyFields(formData)).eq('id', id)

  if (error) {
    throw new Error('Could not update party: ' + error.message)
  }

  revalidatePath('/parties')
}

// Parties are deactivated rather than deleted, so invoices and expenses keep a valid reference.
export async function setPartyActive(formData: FormData) {
  await assertRole(...ERP_WRITERS)

  const id = text(formData, 'id')
  const isActive = text(formData, 'is_active') === 'true'
  if (!id) throw new Error('Party is required')

  const supabase = await createClient()
  const { error } = await supabase.from('parties').update({ is_active: isActive }).eq('id', id)

  if (error) {
    throw new Error('Could not update party: ' + error.message)
  }

  revalidatePath('/parties')
}
