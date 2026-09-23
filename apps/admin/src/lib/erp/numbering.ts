// Document numbers come from the database, never from application code. Allocating here would produce duplicate invoice numbers under concurrent use.

import { ActionError } from '@/lib/actionError'
import { createClient } from '@/lib/supabase/server'

export { financialYearOf } from './financial-year'

export const DOC_TYPES = {
  invoice: 'invoice',
  invoiceNoGst: 'invoice_nogst',
  quote: 'quote',
} as const

export type DocType = (typeof DOC_TYPES)[keyof typeof DOC_TYPES]

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  invoice: 'Invoice (with GST)',
  invoice_nogst: 'Invoice (without GST)',
  quote: 'Quotation',
}

// Consumes the next number. Call this only when the document is actually being issued: a rolled-back transaction leaves a gap rather than reusing it.
export async function allocateDocumentNumber(docType: DocType, date?: Date): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('allocate_document_number', {
    p_doc_type: docType,
    ...(date ? { p_date: date.toISOString().slice(0, 10) } : {}),
  })

  if (error || !data) {
    throw new ActionError('Could not allocate a document number: ' + (error?.message ?? 'no number returned'))
  }

  return data
}

// Shows what the next number would be without consuming it, for previews and drafts.
export async function peekDocumentNumber(docType: DocType, date?: Date): Promise<string | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('peek_document_number', {
    p_doc_type: docType,
    ...(date ? { p_date: date.toISOString().slice(0, 10) } : {}),
  })

  if (error) return null
  return data
}

