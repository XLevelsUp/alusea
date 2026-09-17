'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertRole, getProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { parseRupeesToPaise } from '@/lib/erp/money'
import { DOCUMENTS_BUCKET } from '@/lib/pdf/render'
import type { PaymentMethod } from '@/lib/supabase/types'

const APPROVERS = ['owner', 'accounts'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

// Anyone with an active profile can file an expense; approval is the restricted step.
async function requireSubmitter() {
  const profile = await getProfile()
  if (!profile) throw new Error('Unauthorized')
  return profile
}

function readExpenseFields(formData: FormData) {
  const description = text(formData, 'description')
  const categoryId = text(formData, 'category_id')

  if (!description) throw new Error('Description is required')
  if (!categoryId) throw new Error('Choose a category')

  const amountPaise = parseRupeesToPaise(text(formData, 'amount'))
  const taxPaise = parseRupeesToPaise(text(formData, 'tax'))

  if (amountPaise <= 0) throw new Error('Enter an amount greater than zero')
  if (taxPaise > amountPaise) {
    throw new Error('The GST portion cannot be more than the total amount')
  }

  return {
    spent_on: text(formData, 'spent_on') || new Date().toISOString().slice(0, 10),
    category_id: categoryId,
    party_id: text(formData, 'party_id') || null,
    description,
    amount_paise: amountPaise,
    tax_paise: taxPaise,
    payment_method: (text(formData, 'payment_method') || 'cash') as PaymentMethod,
    reference: text(formData, 'reference'),
    project_tag: text(formData, 'project_tag'),
    notes: text(formData, 'notes'),
  }
}

export async function addExpense(formData: FormData) {
  const profile = await requireSubmitter()

  const supabase = await createClient()
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert([{ ...readExpenseFields(formData), created_by: profile.id }])
    .select()
    .single()

  if (error || !expense) {
    throw new Error('Could not save the expense: ' + (error?.message ?? 'unknown error'))
  }

  revalidatePath('/expenses')
  redirect(`/expenses/${expense.id}`)
}

export async function updateExpense(formData: FormData) {
  const profile = await requireSubmitter()

  const id = text(formData, 'id')
  if (!id) throw new Error('Expense is required')

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('expenses')
    .select('status, created_by')
    .eq('id', id)
    .single()

  if (!existing) throw new Error('Expense not found')

  const isApprover = profile.role === 'owner' || profile.role === 'accounts'
  if (existing.status === 'approved' && !isApprover) {
    throw new Error('This expense has been approved and can no longer be edited')
  }

  const { error } = await supabase.from('expenses').update(readExpenseFields(formData)).eq('id', id)

  if (error) throw new Error('Could not update the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
}

export async function approveExpense(formData: FormData) {
  const profile = await assertRole(...APPROVERS)

  const id = text(formData, 'id')
  if (!id) throw new Error('Expense is required')

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

  if (error) throw new Error('Could not approve the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
}

export async function rejectExpense(formData: FormData) {
  await assertRole(...APPROVERS)

  const id = text(formData, 'id')
  const reason = text(formData, 'reason')
  if (!id) throw new Error('Expense is required')
  if (!reason) throw new Error('Give a reason, so the person who filed it knows what to fix')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ status: 'rejected', rejection_reason: reason, approved_at: null, approved_by: null })
    .eq('id', id)

  if (error) throw new Error('Could not reject the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
}

// Sends a rejected or draft expense back for approval.
export async function resubmitExpense(formData: FormData) {
  await requireSubmitter()

  const id = text(formData, 'id')
  if (!id) throw new Error('Expense is required')

  const supabase = await createClient()
  const { error } = await supabase
    .from('expenses')
    .update({ status: 'submitted', rejection_reason: '' })
    .eq('id', id)

  if (error) throw new Error('Could not resubmit the expense: ' + error.message)

  revalidatePath('/expenses')
  revalidatePath(`/expenses/${id}`)
}

export async function deleteExpense(formData: FormData) {
  await requireSubmitter()

  const id = text(formData, 'id')
  if (!id) throw new Error('Expense is required')

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)

  if (error) throw new Error('Could not delete the expense: ' + error.message)

  revalidatePath('/expenses')
  redirect('/expenses')
}

// Receipts go into the private documents bucket under the expenses prefix, so they inherit the same access rules as invoices.
export async function uploadReceipt(formData: FormData) {
  const profile = await requireSubmitter()

  const expenseId = text(formData, 'expense_id')
  const file = formData.get('receipt')

  if (!expenseId) throw new Error('Expense is required')
  if (!(file instanceof File) || file.size === 0) throw new Error('Choose a file to upload')

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Receipts must be smaller than 10 MB')
  }

  const safeName = file.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-80) || 'receipt'
  const path = `expenses/${expenseId}/${Date.now()}-${safeName}`

  const supabase = await createClient()
  const { error: uploadError } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (uploadError) throw new Error('Could not upload the receipt: ' + uploadError.message)

  const { error } = await supabase.from('expense_attachments').insert([
    {
      expense_id: expenseId,
      storage_path: path,
      file_name: file.name,
      content_type: file.type,
      size_bytes: file.size,
      created_by: profile.id,
    },
  ])

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([path])
    throw new Error('Could not record the receipt: ' + error.message)
  }

  revalidatePath(`/expenses/${expenseId}`)
}

export async function deleteReceipt(formData: FormData) {
  await requireSubmitter()

  const id = text(formData, 'id')
  const expenseId = text(formData, 'expense_id')
  if (!id) throw new Error('Receipt is required')

  const supabase = await createClient()
  const { data: attachment } = await supabase
    .from('expense_attachments')
    .select('storage_path')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('expense_attachments').delete().eq('id', id)
  if (error) throw new Error('Could not remove the receipt: ' + error.message)

  if (attachment?.storage_path) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([attachment.storage_path])
  }

  revalidatePath(`/expenses/${expenseId}`)
}
