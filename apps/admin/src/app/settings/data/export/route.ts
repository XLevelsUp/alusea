// Full-table CSV backup. Paise columns are converted to rupees so the file is readable outside this application.

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { paiseToRupeeString } from '@/lib/erp/money'

// An allowlist rather than a free-text table name, so the parameter cannot be pointed at anything else.
const EXPORTABLE = [
  'parties',
  'quotes',
  'invoices',
  'payments',
  'expenses',
  'employees',
  'payroll_runs',
  'payslips',
] as const

type Exportable = (typeof EXPORTABLE)[number]

function isExportable(value: string): value is Exportable {
  return (EXPORTABLE as readonly string[]).includes(value)
}

// A leading =, +, - or @ makes Excel treat a cell as a formula, so those are neutralised.
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '""'

  const text =
    typeof value === 'object' ? JSON.stringify(value) : String(value)
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  await requireRole('owner')

  const table = new URL(request.url).searchParams.get('table') ?? ''

  if (!isExportable(table)) {
    return new Response('Unknown table.', { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from(table).select('*')

  if (error) {
    return new Response('Could not build the export.', { status: 500 })
  }

  const rows = data ?? []

  if (rows.length === 0) {
    return new Response('﻿No rows\r\n', {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${table}.csv"`,
      },
    })
  }

  const columns = Object.keys(rows[0] as Record<string, unknown>)

  const lines = [
    // Paise columns are relabelled, since the values below them are rupees.
    columns.map((column) => csvCell(column.replace(/_paise$/, '_rupees'))).join(','),
    ...rows.map((row) =>
      columns
        .map((column) => {
          const value = (row as Record<string, unknown>)[column]
          if (column.endsWith('_paise') && typeof value === 'number') {
            return csvCell(paiseToRupeeString(value))
          }
          return csvCell(value)
        })
        .join(',')
    ),
  ]

  // BOM so Excel opens the file as UTF-8 rather than mangling any non-ASCII text.
  const csv = `﻿${lines.join('\r\n')}\r\n`
  const stamp = new Date().toISOString().slice(0, 10)

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${table}-${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
