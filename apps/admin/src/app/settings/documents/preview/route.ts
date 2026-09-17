// Renders a template with sample data so the PDF design can be iterated on before invoices and payroll exist.
// Uses the real company profile, so what you see here is what a client will receive.

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { pdfResponse } from '@/lib/pdf/render'
import { InvoiceDocument } from '@/lib/pdf/templates/InvoiceDocument'
import { PayslipDocument } from '@/lib/pdf/templates/PayslipDocument'
import { percentOf, roundToRupee, sumPaise } from '@/lib/erp/money'
import type { CompanyProfile, Party } from '@/lib/supabase/types'

function sampleParty(company: CompanyProfile, interState: boolean): Party {
  // A different state code forces the IGST branch, so both tax layouts are previewable.
  const stateCode = interState ? (company.state_code === '27' ? '29' : '27') : company.state_code

  return {
    id: 'sample',
    name: 'Sharma Constructions Pvt Ltd',
    display_name: '',
    is_client: true,
    is_vendor: false,
    contact_person: 'Rajesh Sharma',
    phone: '+91 98765 43210',
    email: 'accounts@sharmaconstructions.example',
    billing_address_line1: 'Plot 14, Industrial Estate',
    billing_address_line2: 'Phase II',
    billing_city: interState ? 'Mumbai' : company.city || 'Coimbatore',
    billing_state: interState ? 'Maharashtra' : company.state,
    billing_state_code: stateCode,
    billing_pincode: '400001',
    gstin: stateCode ? `${stateCode}ABCDE1234F1Z5` : '',
    pan: 'ABCDE1234F',
    payment_terms_days: 30,
    notes: '',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    created_by: null,
  }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export async function GET(request: Request) {
  await requireRole('owner')

  const url = new URL(request.url)
  const template = url.searchParams.get('template') ?? 'invoice'
  const withGst = url.searchParams.get('gst') !== 'false'
  const interState = url.searchParams.get('interstate') === 'true'

  const supabase = await createClient()
  const { data: company } = await supabase.from('company_profile').select('*').eq('id', 1).single()

  if (!company) {
    return new Response('Company profile not found. Run the Phase 2 migrations first.', { status: 404 })
  }

  const today = new Date()

  if (template === 'payslip') {
    return pdfResponse(
      PayslipDocument({
        documentNumber: 'SAMPLE',
        periodLabel: today.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
        company,
        employee: {
          code: 'EMP-001',
          name: 'Ramesh Kumar',
          designation: 'Site Supervisor',
          workerType: 'monthly',
        },
        daysWorked: 26,
        daysInPeriod: 30,
        enteredAmountPaise: 3000000,
        basePaise: 2600000,
        overtimePaise: 150000,
        bonusPaise: 200000,
        grossPaise: 2950000,
        netPaise: 2950000,
      }),
      'sample-payslip'
    )
  }

  const lines = [
    {
      description: 'Thermal break aluminium casement windows, powder coated, with double glazing',
      quantity: 42.5,
      unit: 'sq ft',
      ratePaise: 185000,
      amountPaise: 7862500,
    },
    {
      description: 'Sliding door system, 3 panel, with mosquito mesh',
      quantity: 64,
      unit: 'sq ft',
      ratePaise: 145000,
      amountPaise: 9280000,
    },
    {
      description: 'Installation and site finishing',
      quantity: 1,
      unit: 'job',
      ratePaise: 2500000,
      amountPaise: 2500000,
    },
  ]

  const subtotal = sumPaise(lines.map((line) => line.amountPaise))
  const ratePercent = Number(company.default_gst_rate) || 18
  const taxTotal = withGst ? percentOf(subtotal, ratePercent) : 0
  const { rounded, adjustment } = roundToRupee(subtotal + taxTotal)

  const dueDate = new Date(today)
  dueDate.setDate(dueDate.getDate() + 30)

  return pdfResponse(
    InvoiceDocument({
      title: 'Tax Invoice',
      documentNumber: `ALU/SAMPLE/0001`,
      issueDate: formatDate(today),
      dueDate: formatDate(dueDate),
      company,
      party: sampleParty(company, interState),
      lines,
      subtotalPaise: subtotal,
      tax: {
        applicable: withGst,
        ratePercent,
        igstPaise: withGst && interState ? taxTotal : 0,
        cgstPaise: withGst && !interState ? Math.round(taxTotal / 2) : 0,
        sgstPaise: withGst && !interState ? taxTotal - Math.round(taxTotal / 2) : 0,
      },
      roundingPaise: adjustment,
      totalPaise: rounded,
      notes: 'Sample document for checking the layout. No real invoice has been created.',
    }),
    'sample-invoice'
  )
}
