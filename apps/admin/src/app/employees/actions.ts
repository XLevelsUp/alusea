'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { parseRupeesToPaise } from '@/lib/erp/money'
import { aadhaarFileProblem } from '@/lib/erp/aadhaar'
import { DOCUMENTS_BUCKET } from '@/lib/pdf/render'
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

// An empty file input still submits a zero-byte File, which means "no new scan", not an invalid one.
function readAadhaarFile(formData: FormData): File | null {
  const file = formData.get('aadhaar')
  if (!(file instanceof File) || file.size === 0) return null

  const problem = aadhaarFileProblem(file)
  if (problem) throw new ActionError(problem)
  return file
}

const AADHAAR_REQUIRED = "Upload the employee's Aadhaar card before saving"

type Supabase = Awaited<ReturnType<typeof createClient>>

// Stored under employees/<id>/ in the private bucket, which only owner and HR can read.
async function uploadAadhaar(supabase: Supabase, employeeId: string, file: File) {
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z]/g, '') || 'jpg'
  const path = `employees/${employeeId}/aadhaar-${Date.now()}.${extension}`

  const { error } = await supabase.storage
    .from(DOCUMENTS_BUCKET)
    .upload(path, file, { contentType: file.type || 'application/octet-stream', upsert: false })

  if (error) throw new ActionError('Could not upload the Aadhaar card: ' + error.message)
  return path
}

function employeeWriteError(error: { code?: string; message: string }, verb: 'add' | 'update'): ActionError {
  if (error.code === '23505') return new ActionError('That employee code is already in use')
  return new ActionError(`Could not ${verb} employee: ` + error.message)
}

export const addEmployee = defineAction(async function addEmployee(formData: FormData) {
  const profile = await assertRole(...HR)

  // Validated before anything is uploaded, so a bad form never leaves a stray file behind.
  const fields = readEmployeeFields(formData)
  const aadhaar = readAadhaarFile(formData)
  if (!aadhaar) throw new ActionError(AADHAAR_REQUIRED)

  // The id is chosen here so the scan can be filed under it before the row exists.
  const id = crypto.randomUUID()
  const supabase = await createClient()
  const aadhaarPath = await uploadAadhaar(supabase, id, aadhaar)

  const { error } = await supabase.from('employees').insert([
    {
      id,
      ...fields,
      aadhaar_path: aadhaarPath,
      aadhaar_file_name: aadhaar.name,
      created_by: profile.id,
    },
  ])

  if (error) {
    await supabase.storage.from(DOCUMENTS_BUCKET).remove([aadhaarPath])
    throw employeeWriteError(error, 'add')
  }

  revalidatePath('/employees')
})

export const updateEmployee = defineAction(async function updateEmployee(formData: FormData) {
  await assertRole(...HR)

  const id = text(formData, 'id')
  if (!id) throw new ActionError('Employee is required')

  const fields = readEmployeeFields(formData)
  const aadhaar = readAadhaarFile(formData)

  const supabase = await createClient()

  if (!aadhaar) {
    // Employees added before the card was required must get one the next time they are edited.
    const { data: existing } = await supabase.from('employees').select('aadhaar_path').eq('id', id).single()
    if (!existing?.aadhaar_path) throw new ActionError(AADHAAR_REQUIRED)

    const { error } = await supabase.from('employees').update(fields).eq('id', id)
    if (error) throw employeeWriteError(error, 'update')
  } else {
    const { data: existing } = await supabase.from('employees').select('aadhaar_path').eq('id', id).single()
    const newPath = await uploadAadhaar(supabase, id, aadhaar)

    const { error } = await supabase
      .from('employees')
      .update({ ...fields, aadhaar_path: newPath, aadhaar_file_name: aadhaar.name })
      .eq('id', id)

    if (error) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([newPath])
      throw employeeWriteError(error, 'update')
    }

    // The old scan goes only once the row points at the new one, so a failed save never leaves the employee without a card.
    if (existing?.aadhaar_path) {
      await supabase.storage.from(DOCUMENTS_BUCKET).remove([existing.aadhaar_path])
    }
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
