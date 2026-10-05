'use server'

import { ActionError, defineAction } from '@/lib/actions'
import { getProfile } from '@/lib/auth/session'
import { roleAllowed } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { formatPaise } from '@/lib/erp/money'

export type SearchResult = {
  group: 'Clients & vendors' | 'Invoices' | 'Expenses' | 'Employees'
  id: string
  title: string
  detail: string
  href: string
}

const PER_GROUP = 5

function shortDate(value: string): string {
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// One search across the records a person is allowed to open; each kind is skipped for roles that cannot see its pages.
export const globalSearch = defineAction(async function globalSearch(input: string): Promise<SearchResult[]> {
  const profile = await getProfile()
  if (!profile) throw new ActionError('Unauthorized')

  // Wildcards typed by hand are dropped, so a stray % cannot turn the search into "everything".
  const term = input.replace(/[%_\\]/g, ' ').trim()
  if (term.length < 2) return []
  const like = `%${term}%`

  const canSeeParties = roleAllowed(profile.role, ['owner', 'accounts', 'sales'])
  const canSeeEmployees = roleAllowed(profile.role, ['owner', 'hr'])
  const supabase = await createClient()

  const [parties, invoicesByNumber, expenses, employees] = await Promise.all([
    canSeeParties
      ? supabase.from('parties').select('id, name, is_client, is_vendor, billing_city').ilike('name', like).order('name').limit(PER_GROUP)
      : null,
    canSeeParties
      ? supabase
          .from('invoices')
          .select('id, invoice_number, party_id, issue_date, total_paise')
          .ilike('invoice_number', like)
          .order('issue_date', { ascending: false })
          .limit(PER_GROUP)
      : null,
    // Row-level rules already limit staff to the expenses they filed themselves.
    supabase
      .from('expenses')
      .select('id, description, spent_on, amount_paise, status')
      .ilike('description', like)
      .order('spent_on', { ascending: false })
      .limit(PER_GROUP),
    canSeeEmployees
      ? supabase.from('employees').select('id, full_name, employee_code, designation').ilike('full_name', like).order('full_name').limit(PER_GROUP)
      : null,
  ])

  const partyRows = parties?.data ?? []

  // A client's name should also find their invoices, so the newest invoices of the matched parties are added.
  const invoicesByParty =
    partyRows.length > 0
      ? await supabase
          .from('invoices')
          .select('id, invoice_number, party_id, issue_date, total_paise')
          .in('party_id', partyRows.map((party) => party.id))
          .order('issue_date', { ascending: false })
          .limit(PER_GROUP)
      : null

  const invoiceRows = [...(invoicesByNumber?.data ?? []), ...(invoicesByParty?.data ?? [])]
    .filter((invoice, index, all) => all.findIndex((other) => other.id === invoice.id) === index)
    .slice(0, PER_GROUP)

  // Invoices found by number may belong to parties the name search did not return, so their names are fetched separately.
  const missingPartyIds = invoiceRows.map((invoice) => invoice.party_id).filter((id) => !partyRows.some((party) => party.id === id))
  const { data: extraParties } = missingPartyIds.length
    ? await supabase.from('parties').select('id, name').in('id', missingPartyIds)
    : { data: [] }
  const partyName = new Map([...partyRows, ...(extraParties ?? [])].map((party) => [party.id, party.name]))

  return [
    ...partyRows.map((party): SearchResult => ({
      group: 'Clients & vendors',
      id: party.id,
      title: party.name,
      detail: [party.is_client && 'Client', party.is_vendor && 'Vendor', party.billing_city].filter(Boolean).join(' · '),
      href: `/parties/${party.id}`,
    })),
    ...invoiceRows.map((invoice): SearchResult => ({
      group: 'Invoices',
      id: invoice.id,
      title: `${invoice.invoice_number ?? 'Draft invoice'} — ${partyName.get(invoice.party_id) ?? 'Unknown client'}`,
      detail: `${shortDate(invoice.issue_date)} · ${formatPaise(invoice.total_paise)}`,
      href: `/invoices/${invoice.id}`,
    })),
    ...(expenses.data ?? []).map((expense): SearchResult => ({
      group: 'Expenses',
      id: expense.id,
      title: expense.description,
      detail: `${shortDate(expense.spent_on)} · ${formatPaise(expense.amount_paise)}`,
      href: `/expenses/${expense.id}`,
    })),
    ...(employees?.data ?? []).map((employee): SearchResult => ({
      group: 'Employees',
      id: employee.id,
      title: employee.full_name,
      detail: [employee.employee_code, employee.designation].filter(Boolean).join(' · '),
      href: `/employees/${employee.id}`,
    })),
  ]
})
