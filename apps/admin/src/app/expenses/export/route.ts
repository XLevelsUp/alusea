// CSV export of expenses for the accountant. Rupee amounts here, not paise, since this is read by a person and by Excel.

import { requireProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { paiseToRupeeString } from '@/lib/erp/money'

// A leading =, +, - or @ makes Excel treat a cell as a formula, so those are neutralised.
function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? '')
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  await requireProfile()

  const url = new URL(request.url)
  const from = url.searchParams.get('from') ?? '1900-01-01'
  const to = url.searchParams.get('to') ?? new Date().toISOString().slice(0, 10)
  const categoryId = url.searchParams.get('category')

  const supabase = await createClient()

  let query = supabase
    .from('expenses')
    .select('*')
    .gte('spent_on', from)
    .lte('spent_on', to)
    .order('spent_on', { ascending: true })

  if (categoryId) query = query.eq('category_id', categoryId)

  const { data: expenses, error } = await query

  if (error) {
    return new Response('Could not build the export.', { status: 500 })
  }

  const rows = expenses ?? []
  const categoryIds = [...new Set(rows.map((row) => row.category_id))]
  const partyIds = [...new Set(rows.map((row) => row.party_id).filter((id): id is string => !!id))]

  const [{ data: categories }, { data: parties }] = await Promise.all([
    categoryIds.length
      ? supabase.from('expense_categories').select('id, name').in('id', categoryIds)
      : Promise.resolve({ data: [] }),
    partyIds.length
      ? supabase.from('parties').select('id, name').in('id', partyIds)
      : Promise.resolve({ data: [] }),
  ])

  const categoryById = new Map((categories ?? []).map((category) => [category.id, category.name]))
  const partyById = new Map((parties ?? []).map((party) => [party.id, party.name]))

  const header = [
    'Date',
    'Description',
    'Category',
    'Vendor',
    'Amount',
    'GST',
    'Net of GST',
    'Paid by',
    'Reference',
    'Project',
    'Status',
    'Notes',
  ]

  const lines = [
    header.map(csvCell).join(','),
    ...rows.map((row) =>
      [
        row.spent_on,
        row.description,
        categoryById.get(row.category_id) ?? '',
        row.party_id ? (partyById.get(row.party_id) ?? '') : '',
        paiseToRupeeString(row.amount_paise),
        paiseToRupeeString(row.tax_paise),
        paiseToRupeeString(row.amount_paise - row.tax_paise),
        row.payment_method.replace('_', ' '),
        row.reference,
        row.project_tag,
        row.status,
        row.notes,
      ]
        .map(csvCell)
        .join(',')
    ),
  ]

  // BOM so Excel opens the file as UTF-8 rather than mangling any non-ASCII text.
  const csv = `﻿${lines.join('\r\n')}\r\n`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="expenses-${from}-to-${to}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
