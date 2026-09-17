'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { computeTax } from '@/lib/erp/tax'
import { parseLineItems } from '@/lib/erp/lineItems'
import { parseRupeesToPaise } from '@/lib/erp/money'
import { allocateDocumentNumber } from '@/lib/erp/numbering'
import { renderAndStore } from '@/lib/pdf/render'
import { InvoiceDocument } from '@/lib/pdf/templates/InvoiceDocument'
import type { PaymentMethod } from '@/lib/supabase/types'

const ACCOUNTS = ['owner', 'accounts'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Totals are always recomputed server-side from the lines; a client-supplied total is never trusted.
async function computeTotals(formData: FormData, partyId: string) {
  const supabase = await createClient()

  const [{ data: company }, { data: party }] = await Promise.all([
    supabase.from('company_profile').select('state_code, default_gst_rate').eq('id', 1).single(),
    supabase.from('parties').select('*').eq('id', partyId).single(),
  ])

  if (!party) throw new Error('Select a client for this document')

  const items = parseLineItems(formData)
  const isGstApplicable = formData.get('is_gst_applicable') === 'on'
  const gstRate = Number(text(formData, 'gst_rate') || String(company?.default_gst_rate ?? 18))

  if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
    throw new Error('GST rate must be between 0 and 100')
  }

  const tax = computeTax({
    lineAmountsPaise: items.map((item) => item.amount_paise),
    isGstApplicable,
    gstRatePercent: gstRate,
    companyStateCode: company?.state_code ?? '',
    partyStateCode: party.billing_state_code,
  })

  return { items, party, tax, isGstApplicable, gstRate }
}

export async function createInvoice(formData: FormData) {
  const profile = await assertRole(...ACCOUNTS)

  const partyId = text(formData, 'party_id')
  if (!partyId) throw new Error('Select a client')

  const { items, party, tax, isGstApplicable, gstRate } = await computeTotals(formData, partyId)

  const issueDate = text(formData, 'issue_date') || new Date().toISOString().slice(0, 10)
  const dueDateInput = text(formData, 'due_date')

  // Falls back to the client's agreed payment terms when no explicit due date is given.
  let dueDate: string | null = dueDateInput || null
  if (!dueDate && party.payment_terms_days > 0) {
    const due = new Date(issueDate)
    due.setDate(due.getDate() + party.payment_terms_days)
    dueDate = due.toISOString().slice(0, 10)
  }

  const supabase = await createClient()
  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert([
      {
        party_id: partyId,
        quote_id: text(formData, 'quote_id') || null,
        issue_date: issueDate,
        due_date: dueDate,
        is_gst_applicable: isGstApplicable,
        gst_rate: gstRate,
        subtotal_paise: tax.subtotalPaise,
        igst_paise: tax.igstPaise,
        cgst_paise: tax.cgstPaise,
        sgst_paise: tax.sgstPaise,
        rounding_paise: tax.roundingPaise,
        total_paise: tax.totalPaise,
        notes: text(formData, 'notes'),
        created_by: profile.id,
      },
    ])
    .select()
    .single()

  if (error || !invoice) {
    throw new Error('Could not create invoice: ' + (error?.message ?? 'unknown error'))
  }

  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(items.map((item) => ({ ...item, invoice_id: invoice.id })))

  if (itemsError) {
    // Roll back the header so a half-written invoice is not left behind.
    await supabase.from('invoices').delete().eq('id', invoice.id)
    throw new Error('Could not save invoice lines: ' + itemsError.message)
  }

  revalidatePath('/invoices')
  redirect(`/invoices/${invoice.id}`)
}

export async function updateInvoice(formData: FormData) {
  await assertRole(...ACCOUNTS)

  const id = text(formData, 'id')
  const partyId = text(formData, 'party_id')
  if (!id) throw new Error('Invoice is required')
  if (!partyId) throw new Error('Select a client')

  const supabase = await createClient()
  const { data: existing } = await supabase.from('invoices').select('status').eq('id', id).single()

  if (!existing) throw new Error('Invoice not found')
  if (existing.status !== 'draft') {
    throw new Error('Only a draft can be edited. Cancel this invoice and raise a new one.')
  }

  const { items, tax, isGstApplicable, gstRate } = await computeTotals(formData, partyId)

  const { error } = await supabase
    .from('invoices')
    .update({
      party_id: partyId,
      issue_date: text(formData, 'issue_date') || new Date().toISOString().slice(0, 10),
      due_date: text(formData, 'due_date') || null,
      is_gst_applicable: isGstApplicable,
      gst_rate: gstRate,
      subtotal_paise: tax.subtotalPaise,
      igst_paise: tax.igstPaise,
      cgst_paise: tax.cgstPaise,
      sgst_paise: tax.sgstPaise,
      rounding_paise: tax.roundingPaise,
      total_paise: tax.totalPaise,
      notes: text(formData, 'notes'),
    })
    .eq('id', id)

  if (error) throw new Error('Could not update invoice: ' + error.message)

  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  const { error: itemsError } = await supabase
    .from('invoice_items')
    .insert(items.map((item) => ({ ...item, invoice_id: id })))

  if (itemsError) throw new Error('Could not save invoice lines: ' + itemsError.message)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

// Allocates the number, freezes the document, and renders the PDF. This is the point of no return.
export async function issueInvoice(formData: FormData) {
  await assertRole(...ACCOUNTS)

  const id = text(formData, 'id')
  if (!id) throw new Error('Invoice is required')

  const supabase = await createClient()
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()

  if (!invoice) throw new Error('Invoice not found')
  if (invoice.status !== 'draft') throw new Error('This invoice has already been issued')

  const [{ data: company }, { data: party }, { data: items }] = await Promise.all([
    supabase.from('company_profile').select('*').eq('id', 1).single(),
    supabase.from('parties').select('*').eq('id', invoice.party_id).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('position'),
  ])

  if (!company) throw new Error('Company profile is missing. Fill in Settings, Company Details first.')
  if (!party) throw new Error('Client not found')
  if (!items || items.length === 0) throw new Error('Add at least one line before issuing')

  if (!company.legal_name) {
    throw new Error('Set your legal name in Settings, Company Details before issuing invoices')
  }

  // GST and non-GST invoices use separate series, which keeps them easy to separate at filing time.
  const docType = invoice.is_gst_applicable ? 'invoice' : 'invoice_nogst'
  const invoiceNumber = await allocateDocumentNumber(docType, new Date(invoice.issue_date))

  const { error } = await supabase
    .from('invoices')
    .update({
      invoice_number: invoiceNumber,
      status: 'issued',
      issued_at: new Date().toISOString(),
      place_of_supply_state: party.billing_state,
      place_of_supply_code: party.billing_state_code,
      // Frozen so a later edit to the client record cannot change what this invoice says.
      party_snapshot: party,
    })
    .eq('id', id)

  if (error) throw new Error('Could not issue invoice: ' + error.message)

  try {
    const { path } = await renderAndStore({
      document: InvoiceDocument({
        title: invoice.is_gst_applicable ? 'Tax Invoice' : 'Invoice',
        documentNumber: invoiceNumber,
        issueDate: formatDate(invoice.issue_date),
        dueDate: invoice.due_date ? formatDate(invoice.due_date) : undefined,
        company,
        party,
        lines: items.map((item) => ({
          description: item.description,
          quantity: Number(item.quantity),
          unit: item.unit,
          ratePaise: item.rate_paise,
          amountPaise: item.amount_paise,
        })),
        subtotalPaise: invoice.subtotal_paise,
        tax: {
          applicable: invoice.is_gst_applicable,
          ratePercent: Number(invoice.gst_rate),
          igstPaise: invoice.igst_paise,
          cgstPaise: invoice.cgst_paise,
          sgstPaise: invoice.sgst_paise,
        },
        roundingPaise: invoice.rounding_paise,
        totalPaise: invoice.total_paise,
        notes: invoice.notes,
      }),
      kind: 'invoices',
      id,
      documentNumber: invoiceNumber,
    })

    await supabase.from('invoices').update({ pdf_path: path }).eq('id', id)
  } catch {
    // The invoice is issued and numbered regardless; a failed render is recoverable from the detail page.
  }

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

export async function regenerateInvoicePdf(formData: FormData) {
  await assertRole(...ACCOUNTS)

  const id = text(formData, 'id')
  if (!id) throw new Error('Invoice is required')

  const supabase = await createClient()
  const { data: invoice } = await supabase.from('invoices').select('*').eq('id', id).single()
  if (!invoice || !invoice.invoice_number) throw new Error('Only an issued invoice has a PDF')

  const [{ data: company }, { data: party }, { data: items }] = await Promise.all([
    supabase.from('company_profile').select('*').eq('id', 1).single(),
    supabase.from('parties').select('*').eq('id', invoice.party_id).single(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('position'),
  ])

  if (!company || !party || !items) throw new Error('Could not load the invoice for rendering')

  const { path } = await renderAndStore({
    document: InvoiceDocument({
      title: invoice.is_gst_applicable ? 'Tax Invoice' : 'Invoice',
      documentNumber: invoice.invoice_number,
      issueDate: formatDate(invoice.issue_date),
      dueDate: invoice.due_date ? formatDate(invoice.due_date) : undefined,
      company,
      party,
      lines: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        ratePaise: item.rate_paise,
        amountPaise: item.amount_paise,
      })),
      subtotalPaise: invoice.subtotal_paise,
      tax: {
        applicable: invoice.is_gst_applicable,
        ratePercent: Number(invoice.gst_rate),
        igstPaise: invoice.igst_paise,
        cgstPaise: invoice.cgst_paise,
        sgstPaise: invoice.sgst_paise,
      },
      roundingPaise: invoice.rounding_paise,
      totalPaise: invoice.total_paise,
      notes: invoice.notes,
      isCancelled: invoice.status === 'cancelled',
    }),
    kind: 'invoices',
    id,
    documentNumber: invoice.invoice_number,
  })

  await supabase.from('invoices').update({ pdf_path: path }).eq('id', id)
  revalidatePath(`/invoices/${id}`)
}

// Cancels rather than deletes, so the number stays in the series and the audit trail survives.
export async function cancelInvoice(formData: FormData) {
  await assertRole(...ACCOUNTS)

  const id = text(formData, 'id')
  const reason = text(formData, 'reason')
  if (!id) throw new Error('Invoice is required')
  if (!reason) throw new Error('Give a reason for cancelling — it stays on the record')

  const supabase = await createClient()
  const { data: paid } = await supabase.from('payments').select('id').eq('invoice_id', id).limit(1)

  if (paid && paid.length > 0) {
    throw new Error('This invoice has payments recorded. Remove them before cancelling.')
  }

  const { error } = await supabase
    .from('invoices')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancellation_reason: reason })
    .eq('id', id)

  if (error) throw new Error('Could not cancel invoice: ' + error.message)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${id}`)
}

export async function deleteDraftInvoice(formData: FormData) {
  await assertRole(...ACCOUNTS)

  const id = text(formData, 'id')
  if (!id) throw new Error('Invoice is required')

  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id).eq('status', 'draft')

  if (error) throw new Error('Could not delete draft: ' + error.message)

  revalidatePath('/invoices')
  redirect('/invoices')
}

export async function recordPayment(formData: FormData) {
  const profile = await assertRole(...ACCOUNTS)

  const invoiceId = text(formData, 'invoice_id')
  const amountPaise = parseRupeesToPaise(text(formData, 'amount'))

  if (!invoiceId) throw new Error('Invoice is required')
  if (amountPaise <= 0) throw new Error('Enter an amount greater than zero')

  const supabase = await createClient()
  const { data: balance } = await supabase
    .from('invoice_balances')
    .select('balance_paise, status')
    .eq('invoice_id', invoiceId)
    .single()

  if (!balance) throw new Error('Invoice not found')
  if (balance.status !== 'issued') throw new Error('Only an issued invoice can take payments')

  if (amountPaise > balance.balance_paise) {
    throw new Error('That is more than the outstanding balance on this invoice')
  }

  const { error } = await supabase.from('payments').insert([
    {
      invoice_id: invoiceId,
      paid_on: text(formData, 'paid_on') || new Date().toISOString().slice(0, 10),
      amount_paise: amountPaise,
      method: (text(formData, 'method') || 'bank_transfer') as PaymentMethod,
      reference: text(formData, 'reference'),
      notes: text(formData, 'notes'),
      created_by: profile.id,
    },
  ])

  if (error) throw new Error('Could not record payment: ' + error.message)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
}

export async function deletePayment(formData: FormData) {
  await assertRole(...ACCOUNTS)

  const id = text(formData, 'id')
  const invoiceId = text(formData, 'invoice_id')
  if (!id) throw new Error('Payment is required')

  const supabase = await createClient()
  const { error } = await supabase.from('payments').delete().eq('id', id)

  if (error) throw new Error('Could not remove payment: ' + error.message)

  revalidatePath('/invoices')
  revalidatePath(`/invoices/${invoiceId}`)
}
