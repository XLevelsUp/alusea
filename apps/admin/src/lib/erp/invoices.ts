// How an invoice's payment state is shown. Overdue is not a status the admin uses: a late invoice is simply still unpaid.

import type { PaymentStatus } from '@/lib/supabase/types'

export type InvoiceDisplayStatus = Exclude<PaymentStatus, 'overdue'>

export function displayStatus(status: PaymentStatus): InvoiceDisplayStatus {
  return status === 'overdue' ? 'unpaid' : status
}

export const INVOICE_STATUS: Record<InvoiceDisplayStatus, { label: string; style: string }> = {
  draft: { label: 'Draft', style: 'bg-gray-100 text-gray-600' },
  unpaid: { label: 'Unpaid', style: 'bg-blue-50 text-blue-700' },
  part_paid: { label: 'Part paid', style: 'bg-amber-50 text-amber-700' },
  paid: { label: 'Paid', style: 'bg-green-50 text-green-700' },
  cancelled: { label: 'Cancelled', style: 'bg-gray-100 text-gray-400' },
}
