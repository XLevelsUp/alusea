'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { parseRupeesToPaise } from '@/lib/erp/money'
import { computePayslip, computeRunTotals, formatPeriod, STANDARD_DAYS_IN_MONTH } from '@/lib/erp/payroll'
import { renderAndStore } from '@/lib/pdf/render'
import { PayslipDocument } from '@/lib/pdf/templates/PayslipDocument'
import type { WorkerType } from '@/lib/supabase/types'

const HR = ['owner', 'hr'] as const

function text(formData: FormData, field: string): string {
  return String(formData.get(field) ?? '').trim()
}

// Creates the run and seeds a row per active employee, pre-filled from their stored default.
export const createPayrollRun = defineAction(async function createPayrollRun(formData: FormData) {
  const profile = await assertRole(...HR)

  const period = text(formData, 'period_month')
  if (!/^\d{4}-\d{2}$/.test(period)) {
    throw new ActionError('Choose a month')
  }

  const periodMonth = `${period}-01`
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('payroll_runs')
    .select('id')
    .eq('period_month', periodMonth)
    .maybeSingle()

  if (existing) {
    redirect(`/payroll/${existing.id}`)
  }

  const { data: employees } = await supabase
    .from('employees')
    .select('*')
    .eq('is_active', true)
    .order('employee_code')

  if (!employees || employees.length === 0) {
    throw new ActionError('Add at least one active employee before running payroll')
  }

  const { data: run, error } = await supabase
    .from('payroll_runs')
    .insert([{ period_month: periodMonth, days_in_period: STANDARD_DAYS_IN_MONTH, created_by: profile.id }])
    .select()
    .single()

  if (error || !run) {
    throw new ActionError('Could not create the payroll run: ' + (error?.message ?? 'unknown error'))
  }

  // Seeded with zero days worked, so nothing is paid until someone actually enters attendance.
  const payslips = employees.map((employee) => {
    const computed = computePayslip({
      workerType: employee.worker_type,
      enteredAmountPaise: employee.default_amount_paise,
      daysWorked: 0,
      daysInPeriod: STANDARD_DAYS_IN_MONTH,
    })

    return {
      run_id: run.id,
      employee_id: employee.id,
      employee_code: employee.employee_code,
      employee_name: employee.full_name,
      designation: employee.designation,
      worker_type: employee.worker_type,
      days_worked: 0,
      entered_amount_paise: employee.default_amount_paise,
      base_paise: computed.basePaise,
      overtime_paise: 0,
      bonus_paise: 0,
      gross_paise: computed.grossPaise,
      net_paise: computed.netPaise,
    }
  })

  const { error: slipError } = await supabase.from('payslips').insert(payslips)

  if (slipError) {
    await supabase.from('payroll_runs').delete().eq('id', run.id)
    throw new ActionError('Could not set up the payroll rows: ' + slipError.message)
  }

  await supabase
    .from('payroll_runs')
    .update({ employee_count: payslips.length, total_gross_paise: 0, total_net_paise: 0 })
    .eq('id', run.id)

  revalidatePath('/payroll')
  redirect(`/payroll/${run.id}`)
})

// Saves the whole entry grid in one go, recomputing every row server-side rather than trusting the numbers the browser sent.
export const savePayrollEntries = defineAction(async function savePayrollEntries(formData: FormData) {
  await assertRole(...HR)

  const runId = text(formData, 'run_id')
  if (!runId) throw new ActionError('Payroll run is required')

  const supabase = await createClient()
  const { data: run } = await supabase.from('payroll_runs').select('*').eq('id', runId).single()

  if (!run) throw new ActionError('Payroll run not found')
  if (run.status !== 'draft') throw new ActionError('This run has been approved and can no longer be edited')

  const { data: payslips } = await supabase.from('payslips').select('*').eq('run_id', runId)
  if (!payslips) throw new ActionError('Could not load the payroll rows')

  const updates = payslips.map((slip) => {
    const daysRaw = text(formData, `days[${slip.id}]`)
    const amountRaw = text(formData, `amount[${slip.id}]`)
    const overtimeRaw = text(formData, `overtime[${slip.id}]`)
    const bonusRaw = text(formData, `bonus[${slip.id}]`)

    const daysWorked = daysRaw ? Number(daysRaw) : 0
    if (!Number.isFinite(daysWorked) || daysWorked < 0 || daysWorked > 31) {
      throw new ActionError(`${slip.employee_name}: days worked must be between 0 and 31`)
    }

    const enteredAmount = parseRupeesToPaise(amountRaw)
    if (enteredAmount < 0) {
      throw new ActionError(`${slip.employee_name}: amount cannot be negative`)
    }

    const computed = computePayslip({
      workerType: slip.worker_type,
      enteredAmountPaise: enteredAmount,
      daysWorked,
      daysInPeriod: run.days_in_period,
      overtimePaise: parseRupeesToPaise(overtimeRaw),
      bonusPaise: parseRupeesToPaise(bonusRaw),
    })

    return {
      id: slip.id,
      days_worked: daysWorked,
      entered_amount_paise: enteredAmount,
      base_paise: computed.basePaise,
      overtime_paise: computed.overtimePaise,
      bonus_paise: computed.bonusPaise,
      gross_paise: computed.grossPaise,
      net_paise: computed.netPaise,
    }
  })

  for (const update of updates) {
    const { id, ...fields } = update
    const { error } = await supabase.from('payslips').update(fields).eq('id', id)
    if (error) throw new ActionError('Could not save a payroll row: ' + error.message)
  }

  const totals = computeRunTotals(
    updates.map((update) => ({ grossPaise: update.gross_paise, netPaise: update.net_paise }))
  )

  await supabase
    .from('payroll_runs')
    .update({
      total_gross_paise: totals.totalGrossPaise,
      total_net_paise: totals.totalNetPaise,
      employee_count: totals.employeeCount,
      notes: text(formData, 'notes'),
    })
    .eq('id', runId)

  // Updating a default is a separate, explicit choice, so a one-off month does not silently become the new salary.
  const defaultsToUpdate = payslips.filter((slip) => formData.get(`update_default[${slip.id}]`) === 'on')

  for (const slip of defaultsToUpdate) {
    const amount = parseRupeesToPaise(text(formData, `amount[${slip.id}]`))
    await supabase.from('employees').update({ default_amount_paise: amount }).eq('id', slip.employee_id)
  }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${runId}`)
})

export const approvePayrollRun = defineAction(async function approvePayrollRun(formData: FormData) {
  await assertRole(...HR)

  const runId = text(formData, 'run_id')
  if (!runId) throw new ActionError('Payroll run is required')

  const supabase = await createClient()
  const { data: run } = await supabase.from('payroll_runs').select('*').eq('id', runId).single()

  if (!run) throw new ActionError('Payroll run not found')
  if (run.status !== 'draft') throw new ActionError('This run has already been approved')

  const { data: payslips } = await supabase.from('payslips').select('*').eq('run_id', runId)

  if (!payslips || payslips.length === 0) {
    throw new ActionError('This run has no employees')
  }

  if (payslips.every((slip) => slip.days_worked === 0)) {
    throw new ActionError('No days worked have been entered, so this run would pay nothing')
  }

  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'approved', approved_at: new Date().toISOString() })
    .eq('id', runId)

  if (error) throw new ActionError('Could not approve the run: ' + error.message)

  try {
    await generatePayslipPdfs(runId)
  } catch {
    // Approval stands even if rendering fails; the PDFs can be regenerated from the run page.
  }

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${runId}`)
})

export const markPayrollPaid = defineAction(async function markPayrollPaid(formData: FormData) {
  await assertRole(...HR)

  const runId = text(formData, 'run_id')
  if (!runId) throw new ActionError('Payroll run is required')

  const supabase = await createClient()
  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', runId)
    .eq('status', 'approved')

  if (error) throw new ActionError('Could not mark the run paid: ' + error.message)

  revalidatePath('/payroll')
  revalidatePath(`/payroll/${runId}`)
})

async function generatePayslipPdfs(runId: string) {
  const supabase = await createClient()

  const [{ data: run }, { data: company }, { data: payslips }] = await Promise.all([
    supabase.from('payroll_runs').select('*').eq('id', runId).single(),
    supabase.from('company_profile').select('*').eq('id', 1).single(),
    supabase.from('payslips').select('*').eq('run_id', runId).order('employee_code'),
  ])

  if (!run || !company || !payslips) return

  const periodLabel = formatPeriod(run.period_month)

  for (const slip of payslips) {
    const { path } = await renderAndStore({
      document: PayslipDocument({
        documentNumber: `${slip.employee_code}/${run.period_month.slice(0, 7)}`,
        periodLabel,
        company,
        employee: {
          code: slip.employee_code,
          name: slip.employee_name,
          designation: slip.designation,
          workerType: slip.worker_type as WorkerType,
        },
        daysWorked: Number(slip.days_worked),
        daysInPeriod: run.days_in_period,
        enteredAmountPaise: slip.entered_amount_paise,
        basePaise: slip.base_paise,
        overtimePaise: slip.overtime_paise,
        bonusPaise: slip.bonus_paise,
        grossPaise: slip.gross_paise,
        netPaise: slip.net_paise,
      }),
      kind: 'payslips',
      id: slip.id,
      documentNumber: `${slip.employee_code}-${run.period_month.slice(0, 7)}`,
    })

    await supabase.from('payslips').update({ pdf_path: path }).eq('id', slip.id)
  }
}

export const regeneratePayslips = defineAction(async function regeneratePayslips(formData: FormData) {
  await assertRole(...HR)

  const runId = text(formData, 'run_id')
  if (!runId) throw new ActionError('Payroll run is required')

  await generatePayslipPdfs(runId)
  revalidatePath(`/payroll/${runId}`)
})

export const deletePayrollRun = defineAction(async function deletePayrollRun(formData: FormData) {
  await assertRole(...HR)

  const runId = text(formData, 'run_id')
  if (!runId) throw new ActionError('Payroll run is required')

  const supabase = await createClient()
  const { error } = await supabase.from('payroll_runs').delete().eq('id', runId).eq('status', 'draft')

  if (error) throw new ActionError('Could not delete the run: ' + error.message)

  revalidatePath('/payroll')
  redirect('/payroll')
})
