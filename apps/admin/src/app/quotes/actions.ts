'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { computeTax } from '@/lib/erp/tax'
import { parseLineItems } from '@/lib/erp/lineItems'
import { allocateDocumentNumber } from '@/lib/erp/numbering'
import { renderAndStore } from '@/lib/pdf/render'
import { InvoiceDocument } from '@/lib/pdf/templates/InvoiceDocument'
import type { QuoteStatus } from '@/lib/supabase/types'

const SALES = ['owner', 'sales'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function computeTotals(formData: FormData, partyId: string) {
  const supabase = await createClient()

  const [{ data: company }, { data: party }] = await Promise.all([
    supabase.from('company_profile').select('state_code, default_gst_rate').eq('id', 1).single(),
    supabase.from('parties').select('*').eq('id', partyId).single(),
  ])

  if (!party) throw new ActionError('Select a client for this quotation')

  const items = parseLineItems(formData)
  const isGstApplicable = formData.get('is_gst_applicable') === 'on'
  const gstRate = Number(text(formData, 'gst_rate') || String(company?.default_gst_rate ?? 18))

  if (!Number.isFinite(gstRate) || gstRate < 0 || gstRate > 100) {
    throw new ActionError('GST rate must be between 0 and 100')
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

export const createQuote = defineAction(async function createQuote(formData: FormData) {
  const profile = await assertRole(...SALES)

  const partyId = text(formData, 'party_id')
  if (!partyId) throw new ActionError('Select a client')

  const { items, tax, isGstApplicable, gstRate } = await computeTotals(formData, partyId)

  const supabase = await createClient()
  const { data: quote, error } = await supabase
    .from('quotes')
    .insert([
      {
        party_id: partyId,
        issue_date: text(formData, 'issue_date') || new Date().toISOString().slice(0, 10),
        valid_until: text(formData, 'valid_until') || null,
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

  if (error || !quote) {
    throw new ActionError('Could not create quotation: ' + (error?.message ?? 'unknown error'))
  }

  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(items.map((item) => ({ ...item, quote_id: quote.id })))

  if (itemsError) {
    await supabase.from('quotes').delete().eq('id', quote.id)
    throw new ActionError('Could not save quotation lines: ' + itemsError.message)
  }

  revalidatePath('/quotes')
  redirect(`/quotes/${quote.id}`)
})

export const updateQuote = defineAction(async function updateQuote(formData: FormData) {
  await assertRole(...SALES)

  const id = text(formData, 'id')
  const partyId = text(formData, 'party_id')
  if (!id) throw new ActionError('Quotation is required')
  if (!partyId) throw new ActionError('Select a client')

  const { items, tax, isGstApplicable, gstRate } = await computeTotals(formData, partyId)

  const supabase = await createClient()
  const { error } = await supabase
    .from('quotes')
    .update({
      party_id: partyId,
      issue_date: text(formData, 'issue_date') || new Date().toISOString().slice(0, 10),
      valid_until: text(formData, 'valid_until') || null,
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

  if (error) throw new ActionError('Could not update quotation: ' + error.message)

  await supabase.from('quote_items').delete().eq('quote_id', id)
  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(items.map((item) => ({ ...item, quote_id: id })))

  if (itemsError) throw new ActionError('Could not save quotation lines: ' + itemsError.message)

  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
})

// A quotation is not a legal record, so it keeps a simple status flow rather than the invoice's freeze-on-issue rule.
export const setQuoteStatus = defineAction(async function setQuoteStatus(formData: FormData) {
  await assertRole(...SALES)

  const id = text(formData, 'id')
  const status = text(formData, 'status') as QuoteStatus
  if (!id) throw new ActionError('Quotation is required')

  const allowed: QuoteStatus[] = ['draft', 'sent', 'accepted', 'rejected', 'expired']
  if (!allowed.includes(status)) throw new ActionError('Unknown status')

  const supabase = await createClient()

  // Sending allocates the number, so a quotation the client sees always carries one.
  const patch: { status: QuoteStatus; quote_number?: string } = { status }

  if (status === 'sent') {
    const { data: existing } = await supabase.from('quotes').select('quote_number, issue_date').eq('id', id).single()
    if (existing && !existing.quote_number) {
      patch.quote_number = await allocateDocumentNumber('quote', new Date(existing.issue_date))
    }
  }

  const { error } = await supabase.from('quotes').update(patch).eq('id', id)
  if (error) throw new ActionError('Could not update status: ' + error.message)

  if (status === 'sent') {
    try {
      await renderQuotePdf(id)
    } catch {
      // The status change stands; the PDF can be regenerated from the detail page.
    }
  }

  revalidatePath('/quotes')
  revalidatePath(`/quotes/${id}`)
})

async function renderQuotePdf(id: string) {
  const supabase = await createClient()
  const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).single()
  if (!quote || !quote.quote_number) return

  const [{ data: company }, { data: party }, { data: items }] = await Promise.all([
    supabase.from('company_profile').select('*').eq('id', 1).single(),
    supabase.from('parties').select('*').eq('id', quote.party_id).single(),
    supabase.from('quote_items').select('*').eq('quote_id', id).order('position'),
  ])

  if (!company || !party || !items) return

  const { path } = await renderAndStore({
    document: InvoiceDocument({
      title: 'Quotation',
      documentNumber: quote.quote_number,
      issueDate: formatDate(quote.issue_date),
      dueDate: quote.valid_until ? formatDate(quote.valid_until) : undefined,
      company,
      party,
      lines: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit: item.unit,
        ratePaise: item.rate_paise,
        amountPaise: item.amount_paise,
      })),
      subtotalPaise: quote.subtotal_paise,
      tax: {
        applicable: quote.is_gst_applicable,
        ratePercent: Number(quote.gst_rate),
        igstPaise: quote.igst_paise,
        cgstPaise: quote.cgst_paise,
        sgstPaise: quote.sgst_paise,
      },
      roundingPaise: quote.rounding_paise,
      totalPaise: quote.total_paise,
      notes: quote.notes,
    }),
    kind: 'quotes',
    id,
    documentNumber: quote.quote_number,
  })

  await supabase.from('quotes').update({ pdf_path: path }).eq('id', id)
}

export const regenerateQuotePdf = defineAction(async function regenerateQuotePdf(formData: FormData) {
  await assertRole(...SALES)
  const id = text(formData, 'id')
  if (!id) throw new ActionError('Quotation is required')

  await renderQuotePdf(id)
  revalidatePath(`/quotes/${id}`)
})

// Copies the quotation into a draft invoice. The invoice is a fresh document: it recomputes nothing and takes no number until it is issued.
export const convertQuoteToInvoice = defineAction(async function convertQuoteToInvoice(formData: FormData) {
  const profile = await assertRole('owner', 'accounts', 'sales')

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Quotation is required')

  const supabase = await createClient()
  const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).single()
  if (!quote) throw new ActionError('Quotation not found')

  const { data: existing } = await supabase.from('invoices').select('id').eq('quote_id', id).limit(1)
  if (existing && existing.length > 0) {
    redirect(`/invoices/${existing[0].id}`)
  }

  const { data: items } = await supabase.from('quote_items').select('*').eq('quote_id', id).order('position')
  if (!items || items.length === 0) throw new ActionError('This quotation has no lines')

  const { data: party } = await supabase
    .from('parties')
    .select('payment_terms_days')
    .eq('id', quote.party_id)
    .single()

  const issueDate = new Date().toISOString().slice(0, 10)
  let dueDate: string | null = null
  if (party && party.payment_terms_days > 0) {
    const due = new Date(issueDate)
    due.setDate(due.getDate() + party.payment_terms_days)
    dueDate = due.toISOString().slice(0, 10)
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert([
      {
        party_id: quote.party_id,
        quote_id: quote.id,
        issue_date: issueDate,
        due_date: dueDate,
        is_gst_applicable: quote.is_gst_applicable,
        gst_rate: quote.gst_rate,
        subtotal_paise: quote.subtotal_paise,
        igst_paise: quote.igst_paise,
        cgst_paise: quote.cgst_paise,
        sgst_paise: quote.sgst_paise,
        rounding_paise: quote.rounding_paise,
        total_paise: quote.total_paise,
        notes: quote.notes,
        created_by: profile.id,
      },
    ])
    .select()
    .single()

  if (error || !invoice) {
    throw new ActionError('Could not create the invoice: ' + (error?.message ?? 'unknown error'))
  }

  const { error: itemsError } = await supabase.from('invoice_items').insert(
    items.map((item) => ({
      invoice_id: invoice.id,
      position: item.position,
      description: item.description,
      width_ft: item.width_ft,
      height_ft: item.height_ft,
      quantity: item.quantity,
      unit: item.unit,
      rate_paise: item.rate_paise,
      amount_paise: item.amount_paise,
      product_id: item.product_id,
    }))
  )

  if (itemsError) {
    await supabase.from('invoices').delete().eq('id', invoice.id)
    throw new ActionError('Could not copy the lines across: ' + itemsError.message)
  }

  if (quote.status !== 'accepted') {
    await supabase.from('quotes').update({ status: 'accepted' }).eq('id', id)
  }

  revalidatePath('/quotes')
  revalidatePath('/invoices')
  redirect(`/invoices/${invoice.id}`)
})

export const deleteQuote = defineAction(async function deleteQuote(formData: FormData) {
  await assertRole(...SALES)

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Quotation is required')

  const supabase = await createClient()
  const { error } = await supabase.from('quotes').delete().eq('id', id).eq('status', 'draft')

  if (error) throw new ActionError('Could not delete quotation: ' + error.message)

  revalidatePath('/quotes')
  redirect('/quotes')
})
