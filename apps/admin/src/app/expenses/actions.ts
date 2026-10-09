'use server'

import { todayInIndia } from '@/lib/erp/dates'
import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertRole, getProfile } from '@/lib/auth/session'
import { isOwnerLevel } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { parseRupeesToPaise } from '@/lib/erp/money'
import { DOCUMENTS_BUCKET } from '@/lib/pdf/render'
import { receiptFileProblem } from '@/lib/erp/receipts'
import { isPaidBy } from '@/lib/erp/expenses'
import type { PaymentMethod } from '@/lib/supabase/types'

const APPROVERS = ['owner', 'accounts'] as const

const CLEARED_SETTLEMENT = { paid_at: null, paid_by_user: null, reimbursed_at: null, reimbursed_by: null }

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

// Anyone with an active profile can file an expense; approval is the restricted step.
async function requireSubmitter() {
  const profile = await getProfile()
  if (!profile) throw new ActionError('Unauthorized')
  return profile
}

function readExpenseFields(formData: FormData) {
  const description = text(formData, 'description')
  const categoryId = text(formData, 'category_id')

  if (!description) throw new ActionError('Description is required')
  if (!categoryId) throw new ActionError('Choose a category')

  const amountPaise = parseRupeesToPaise(text(formData, 'amount'))
  const taxPaise = parseRupeesToPaise(text(formData, 'tax'))

  if (amountPaise <= 0) throw new ActionError('Enter an amount greater than zero')
  if (taxPaise > amountPaise) {
    throw new ActionError('The GST portion cannot be more than the total amount')
  }

  // Whose money was used: the company's, or a person's own, which the company then owes back.
  const paidByInput = text(formData, 'paid_by') || 'company'
  if (!isPaidBy(paidByInput)) throw new ActionError('Choose who paid for this expense')
  const paidByName = paidByInput === 'person' ? text(formData, 'paid_by_name') : ''
  if (paidByInput === 'person' && !paidByName) {
    throw new ActionError('Enter the name of the person who paid, so they can be paid back')
  }

  return {
    paid_by: paidByInput,
    paid_by_name: paidByName,
    spent_on: text(formData, 'spent_on') || todayInIndia(),
    category_id: categoryId,
    party_id: text(formData, 'party_id') || null,
    client_id: text(formData, 'client_id') || null,
    description,
    amount_paise: amountPaise,
    tax_paise: taxPaise,
    payment_method: (text(formData, 'payment_method') || 'cash') as PaymentMethod,
    reference: text(formData, 'reference'),
    project_tag: text(formData, 'project_tag'),
    notes: text(formData, 'notes'),
  }
}

// An empty file input still submits a zero-byte File, which means "no receipt", not an invalid one.
function readReceiptFile(formData: FormData): File | null {
  const file = formData.get('receipt')
  if (!(file instanceof File) || file.size === 0) return null

  const problem = receiptFileProblem(file)
  if (problem) throw new ActionError(problem)
  return file
}

type Supabase = Awaited<ReturnType<typeof createClient>>

// Receipts go into the private documents bucket under the expenses prefix, so they inherit the same access rules as invoices.
async function storeReceipt(supabase: Supabase, expenseId: string, file: File, uploaderId: string) {
  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80) || 'receipt'
  const path = `expenses/${expenseId}/${Date.now()}-${safeName}`

  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (uploadError) throw new ActionError('Could not upload the receipt: ' + uploadError.message)

  const { error } = await supabase.from('expense_attachments').insert([
    {
      expense_id: expenseId,
      storage_path: path,
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      created_by: uploaderId,
    },
  ])

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
    throw new ActionError('Could not record the receipt: ' + error.message)
  }
}

export const addExpense = defineAction(async function addExpense(formData: FormData) {
  const profile = await requireSubmitter()

  // Both are validated before anything is written, so a bad receipt never leaves a half-saved expense.
  const fields = readExpenseFields(formData)
  const receipt = readReceiptFile(formData)

  const supabase = await createClient()
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert([{ ...fields, created_by: profile.id }])
    .select()
    .single()

  if (error || !expense) {
    throw new ActionError('Could not save the expense: ' + (error?.message ?? 'unknown error'))
  }

  if (receipt) {
    try {
      await storeReceipt(supabase, expense.id, receipt, profile.id)
    } catch (e) {
      // The expense is removed again so retrying the form does not create a duplicate.
      await supabase.from('expenses').delete().eq('id', expense.id)
      throw e
    }
  }

  revalidatePath('/expenses')
  // Filed from the Finances dialog, the form stays where it is instead of opening the new expense.
  if (text(formData, 'stay') === 'finances') {
    revalidatePath('/finances')
    return
  }
  redirect(`/expenses/${expense.id}`)
})

export const updateExpense = defineAction(async function updateExpense(formData: FormData) {
  const profile = await requireSubmitter()

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Expense is required')

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('expenses')
    .select('status, created_by, paid_by')
    .eq('id', id)
    .single()

  if (!existing) throw new ActionError('Expense not found')

  const isApprover = isOwnerLevel(profile.role) || profile.role === 'accounts'
  if (existing.status === 'approved' && !isApprover) {
    throw new ActionError('This expense has been approved and can no longer be edited')
  }

  const fields = readExpenseFields(formData)
  // Switching between company-paid and person-paid changes which step applies, so any recorded settlement no longer fits.
  const settlementReset = fields.paid_by !== existing.paid_by ? CLEARED_SETTLEMENT : {}

  const { error } = await supabase.from('expenses').update({ ...fields, ...settlementReset }).eq('id', id)

  if (error) throw new ActionError('Could not update the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
})

export const approveExpense = defineAction(async function approveExpense(formData: FormData) {
  const profile = await assertRole(...APPROVERS)

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Expense is required')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: profile.id,
      rejection_reason: '',
    })
    .eq('id', id)

  if (error) throw new ActionError('Could not approve the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  revalidatePath('/finances')
  revalidatePath('/dashboard')
})

// Approves several waiting expenses in one go; anything no longer waiting is left untouched.
export const approveExpenses = defineAction(async function approveExpenses(formData: FormData) {
  const profile = await assertRole(...APPROVERS)

  const ids = text(formData, 'ids').split(',').filter(Boolean)
  if (ids.length === 0) throw new ActionError('There is nothing to approve')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: profile.id,
      rejection_reason: '',
    })
    .in('id', ids)
    .eq('status', 'submitted')

  if (error) throw new ActionError('Could not approve the expenses: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath('/finances')
  revalidatePath('/dashboard')
})

export const rejectExpense = defineAction(async function rejectExpense(formData: FormData) {
  await assertRole(...APPROVERS)

  const id = text(formData, 'id')
  const reason = text(formData, 'reason')
  if (!id) throw new ActionError('Expense is required')
  if (!reason) throw new ActionError('Give a reason, so the person who filed it knows what to fix')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    // An expense that is no longer approved cannot still count as paid or reimbursed.
    .update({ status: 'rejected', rejection_reason: reason, approved_at: null, approved_by: null, ...CLEARED_SETTLEMENT })
    .eq('id', id)

  if (error) throw new ActionError('Could not reject the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
  revalidatePath('/finances')
  revalidatePath('/dashboard')
})

// Loads an expense for a settlement step, which only an approved expense can take.
async function approvedExpense(id: string) {
  if (!id) throw new ActionError('Expense is required')

  const supabase = await createClient()
  const { data: expense } = await supabase.from('expenses').select('status, paid_by').eq('id', id).single()

  if (!expense) throw new ActionError('Expense not found')
  if (expense.status !== 'approved') throw new ActionError('Approve the expense before recording its payment')

  return { supabase, expense }
}

// Company-paid: records that the bill itself has been settled, by whom and when.
export const markExpensePaid = defineAction(async function markExpensePaid(formData: FormData) {
  const profile = await assertRole(...APPROVERS)
  const id = text(formData, 'id')
  const { supabase, expense } = await approvedExpense(id)

  if (expense.paid_by !== 'company') {
    throw new ActionError('This expense was paid by a person. Mark it as paid back instead.')
  }

  const { error } = await supabase
    .from('expenses')
    .update({ paid_at: new Date().toISOString(), paid_by_user: profile.id })
    .eq('id', id)

  if (error) throw new ActionError('Could not mark the expense as paid: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
})

// Person-paid: records that the company has paid that person back, by whom and when.
export const markExpenseReimbursed = defineAction(async function markExpenseReimbursed(formData: FormData) {
  const profile = await assertRole(...APPROVERS)
  const id = text(formData, 'id')
  const { supabase, expense } = await approvedExpense(id)

  if (expense.paid_by !== 'person') {
    throw new ActionError('This expense was paid by the company, so there is nobody to pay back.')
  }

  const { error } = await supabase
    .from('expenses')
    .update({ reimbursed_at: new Date().toISOString(), reimbursed_by: profile.id })
    .eq('id', id)

  if (error) throw new ActionError('Could not mark the expense as paid back: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
})

// Takes back a paid or reimbursed mark made by mistake.
export const undoExpenseSettlement = defineAction(async function undoExpenseSettlement(formData: FormData) {
  await assertRole(...APPROVERS)
  const id = text(formData, 'id')
  if (!id) throw new ActionError('Expense is required')

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').update(CLEARED_SETTLEMENT).eq('id', id)

  if (error) throw new ActionError('Could not undo: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
})

// Sends a rejected or draft expense back for approval.
export const resubmitExpense = defineAction(async function resubmitExpense(formData: FormData) {
  await requireSubmitter()

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Expense is required')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ status: 'submitted', rejection_reason: '' })
    .eq('id', id)

  if (error) throw new ActionError('Could not resubmit the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
})

export const deleteExpense = defineAction(async function deleteExpense(formData: FormData) {
  await requireSubmitter()

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Expense is required')

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) throw new ActionError('Could not delete the expense: ' + error.message)

  revalidatePath('/expenses')
  redirect('/expenses')
})

export const uploadReceipt = defineAction(async function uploadReceipt(formData: FormData) {
  const profile = await requireSubmitter()

  const expenseId = text(formData, 'expense_id')
  if (!expenseId) throw new ActionError('Expense is required')

  const file = readReceiptFile(formData)
  if (!file) throw new ActionError('Choose a file to upload')

  const supabase = await createClient()
  await storeReceipt(supabase, expenseId, file, profile.id)

  revalidatePath(`/expenses/${expenseId}`)
})

export const deleteReceipt = defineAction(async function deleteReceipt(formData: FormData) {
  await requireSubmitter()

  const id = text(formData, 'id')
  const expenseId = text(formData, 'expense_id')
  if (!id) throw new ActionError('Receipt is required')

  const supabase = await createClient()
  const { data: attachment } = await supabase
    .from('expense_attachments')
    .select('storage_path')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('expense_attachments').delete().eq('id', id)
  if (error) throw new ActionError('Could not remove the receipt: ' + error.message)

  if (attachment?.storage_path) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([attachment.storage_path])
  }

  revalidatePath(`/expenses/${expenseId}`)
})
