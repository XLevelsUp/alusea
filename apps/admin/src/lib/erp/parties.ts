// Vendor types, shared by the party form, the list filter and the server action so the three cannot disagree.

import type { VendorType } from '@/lib/supabase/types'

export const VENDOR_TYPES: { value: VendorType; label: string }[] = [
  { value: 'local', label: 'Local' },
  { value: 'import_export', label: 'Import / Export' },
]

export const VENDOR_TYPE_LABELS: Record<VendorType, string> = {
  local: 'Local',
  import_export: 'Import / Export',
}

export function isVendorType(value: string): value is VendorType {
  return value === 'local' || value === 'import_export'
}

// What adding a party hands back, so a form that created one in passing can select it straight away.
export type AddedParty = {
  id: string
  name: string
  isClient: boolean
  isVendor: boolean
  stateCode: string
  stateName: string
  gstin: string
}
