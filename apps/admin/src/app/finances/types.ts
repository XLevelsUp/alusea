// Shapes the Finances page hands from the server to its tabs. Money is in paise throughout.

import type { CapitalKind, LedgerCategory, PaymentMethod } from '@/lib/supabase/types'
import type { Direction, Source } from '@/lib/erp/finance'

export type LedgerRow = {
  key: string
  entry_date: string
  direction: Direction
  source: Source
  description: string
  partyId: string | null
  partyName: string
  amount_paise: number
  // Where the row came from, so it can be opened; capital and manual entries live only in Finances.
  href: string | null
  recordId: string
  parentId: string | null
  // How the money moved; only client payments and expenses record one.
  method: PaymentMethod | null
  // Whether input credit can be claimed on this line at all: only expenses and manual money-out entries.
  claimable: boolean
  // The GST claim tick: true once the input credit on this purchase has been claimed.
  gstClaim: boolean
}

export type PendingEntry = {
  id: string
  entry_date: string
  direction: Direction
  category: LedgerCategory
  description: string
  partyName: string
  amount_paise: number
  gst_claim: boolean
}

export type CapitalRow = {
  id: string
  received_on: string
  source: string
  kind: CapitalKind
  amount_paise: number
  notes: string
}

export type InvoiceRow = {
  id: string
  number: string | null
  partyId: string
  partyName: string
  issue_date: string
  total_paise: number
  paid_paise: number
  balance_paise: number
}

export type ExpenseRow = {
  id: string
  spent_on: string
  description: string
  amount_paise: number
  categoryName: string
  vendorName: string
  paidBy: 'company' | 'person'
  paidByName: string
  owed: boolean
}

// An expense filed but not yet approved, so it is not in the ledger or any total yet.
export type WaitingExpense = {
  id: string
  spent_on: string
  description: string
  amount_paise: number
  categoryName: string
}

// The dropdown lists the Add Expense form needs.
export type ExpenseFormOptions = { categories: PartyOption[]; vendors: PartyOption[]; clients: PartyOption[] }

export type MonthlyReportRow = {
  period_month: string
  revenue_paise: number
  expenses_paise: number
  payroll_paise: number
  profit_paise: number
}

export type GstReportRow = {
  period_month: string
  taxable_sales_paise: number
  output_tax_paise: number
  input_tax_paise: number
  net_tax_paise: number
}

export type PartyOption = { id: string; name: string }
