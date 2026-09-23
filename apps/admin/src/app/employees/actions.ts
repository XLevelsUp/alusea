'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { parseRupeesToPaise } from '@/lib/erp/money'
import type { WorkerType } from '@/lib/supabase/types'

const HR = ['owner', 'hr'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

function readEmployeeFields(formData: FormData) {
  const code = text(formData, 'employee_code')
  const name = text(formData, 'full_name')
  const workerType = text(formData, 'worker_type')

  if (!code) throw new ActionError('Employee code is required')
  if (!name) throw new ActionError('Name is required')
  if (workerType !== 'monthly' && workerType !== 'daily') {
    throw new ActionError('Choose whether this person is on a monthly salary or a daily rate')
  }

  const amountPaise = parseRupeesToPaise(text(formData, 'default_amount'))
  if (amountPaise < 0) throw new ActionError('Amount cannot be negative')

  return {
    employee_code: code,
    full_name: name,
    designation: text(formData, 'designation'),
    worker_type: workerType as WorkerType,
    default_amount_paise: amountPaise,
    phone: text(formData, 'phone'),
    address: text(formData, 'address'),
    joining_date: text(formData, 'joining_date') || null,
    bank_account_name: text(formData, 'bank_account_name'),
    bank_account_number: text(formData, 'bank_account_number'),
    bank_ifsc: text(formData, 'bank_ifsc').toUpperCase(),
    notes: text(formData, 'notes'),
  }
}

export const addEmployee = defineAction(async function addEmployee(formData: FormData) {
  const profile = await assertRole(...HR)

  const supabase = await createClient()
  const { error } = await supabase
    .from('employees')
    .insert([{ ...readEmployeeFields(formData), created_by: profile.id }])

  if (error) {
    if (error.code === '23505') {
      throw new ActionError('That employee code is already in use')
    }
    throw new ActionError('Could not add employee: ' + error.message)
  }

  revalidatePath('/employees')
})

export const updateEmployee = defineAction(async function updateEmployee(formData: FormData) {
  await assertRole(...HR)

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Employee is required')

  const supabase = await createClient()
  const { error } = await supabase.from('employees').update(readEmployeeFields(formData)).eq('id', id)

  if (error) {
    if (error.code === '23505') {
      throw new ActionError('That employee code is already in use')
    }
    throw new ActionError('Could not update employee: ' + error.message)
  }

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
})

// Employees are deactivated rather than deleted, so their historical payslips keep a valid reference.
export const setEmployeeActive = defineAction(async function setEmployeeActive(formData: FormData) {
  await assertRole(...HR)

  const id = text(formData, 'id')
  const isActive = text(formData, 'is_active') === 'true'
  if (!id) throw new ActionError('Employee is required')

  const supabase = await createClient()
  const { error } = await supabase.from('employees').update({ is_active: isActive }).eq('id', id)

  if (error) throw new ActionError('Could not update employee: ' + error.message)

  revalidatePath('/employees')
  revalidatePath(`/employees/${id}`)
})
