'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { isValidGstin, isValidPan, stateNameForCode } from '@/lib/erp/states'

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

export const updateCompanyProfile = defineAction(async function updateCompanyProfile(formData: FormData) {
  await assertRole('owner')

  const gstin = text(formData, 'gstin').toUpperCase()
  const pan = text(formData, 'pan').toUpperCase()
  const stateCode = text(formData, 'state_code')
  const legalName = text(formData, 'legal_name')

  if (!legalName) {
    throw new ActionError('Legal name is required — it prints on every invoice')
  }

  if (gstin && !isValidGstin(gstin)) {
    throw new ActionError('GSTIN must be 15 characters in the standard format, for example 33ABCDE1234F1Z5')
  }

  if (pan && !isValidPan(pan)) {
    throw new ActionError('PAN must be 10 characters in the standard format, for example ABCDE1234F')
  }

  // A GSTIN starts with its own state code, so a mismatch means one of the two fields is wrong.
  if (gstin && stateCode && gstin.slice(0, 2) !== stateCode) {
    throw new ActionError(`GSTIN starts with state code ${gstin.slice(0, 2)} but the selected state is ${stateCode}`)
  }

  const rate = Number(text(formData, 'default_gst_rate') || '18')
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new ActionError('Default GST rate must be between 0 and 100')
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('company_profile')
    .update({
      legal_name: legalName,
      trade_name: text(formData, 'trade_name'),
      address_line1: text(formData, 'address_line1'),
      address_line2: text(formData, 'address_line2'),
      city: text(formData, 'city'),
      state: stateNameForCode(stateCode),
      state_code: stateCode,
      pincode: text(formData, 'pincode'),
      phone: text(formData, 'phone'),
      email: text(formData, 'email'),
      website: text(formData, 'website'),
      gstin,
      pan,
      bank_name: text(formData, 'bank_name'),
      bank_account_name: text(formData, 'bank_account_name'),
      bank_account_number: text(formData, 'bank_account_number'),
      bank_ifsc: text(formData, 'bank_ifsc').toUpperCase(),
      bank_branch: text(formData, 'bank_branch'),
      invoice_terms: text(formData, 'invoice_terms'),
      invoice_footer: text(formData, 'invoice_footer'),
      default_gst_rate: rate,
    })
    .eq('id', 1)

  if (error) {
    throw new ActionError('Could not save company details: ' + error.message)
  }

  revalidatePath('/settings/company')
})
