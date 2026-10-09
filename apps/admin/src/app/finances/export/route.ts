// CSV export of the P&L and GST summaries, in rupees rather than paise since a person reads them.

import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { paiseToRupeeString } from '@/lib/erp/money'
import { formatPeriod } from '@/lib/erp/payroll'

// A leading =, +, - or @ makes Excel treat a cell as a formula, so those are neutralised.
function csvCell(value: string | number | null | undefined): string {
  const text = String(value ?? '')
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}

function toCsv(header: string[], rows: (string | number)[][]): string {
  const lines = [header.map(csvCell).join(','), ...rows.map((row) => row.map(csvCell).join(','))]
  // BOM so Excel opens the file as UTF-8 rather than mangling any non-ASCII text.
  return `﻿${lines.join('\r\n')}\r\n`
}

export async function GET(request: Request) {
  await requireRole('owner', 'accounts')

  const report = new URL(request.url).searchParams.get('report') ?? 'pnl'
  const supabase = await createClient()

  if (report === 'gst') {
    const { data } = await supabase
      .from('gst_summary_monthly')
      .select('*')
      .order('period_month', { ascending: true })

    const csv = toCsv(
      ['Month', 'Taxable sales', 'Output tax', 'Input tax', 'Net tax payable'],
      (data ?? []).map((row) => [
        formatPeriod(row.period_month),
        paiseToRupeeString(row.taxable_sales_paise),
        paiseToRupeeString(row.output_tax_paise),
        paiseToRupeeString(row.input_tax_paise),
        paiseToRupeeString(row.net_tax_paise),
      ])
    )

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="gst-summary.csv"',
        'Cache-Control': 'no-store',
      },
    })
  }

  const { data } = await supabase
    .from('profit_and_loss_monthly')
    .select('*')
    .order('period_month', { ascending: true })

  const csv = toCsv(
    ['Month', 'Revenue', 'Expenses', 'Payroll', 'Profit', 'Output tax', 'Input tax'],
    (data ?? []).map((row) => [
      formatPeriod(row.period_month),
      paiseToRupeeString(row.revenue_paise),
      paiseToRupeeString(row.expenses_paise),
      paiseToRupeeString(row.payroll_paise),
      paiseToRupeeString(row.profit_paise),
      paiseToRupeeString(row.output_tax_paise),
      paiseToRupeeString(row.input_tax_paise),
    ])
  )

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="profit-and-loss.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
