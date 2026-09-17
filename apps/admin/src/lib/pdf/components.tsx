// Document chrome shared by every PDF template: letterhead, party blocks, totals and footer.
// Kept separate from the templates so a change to the letterhead reaches invoices, quotes and payslips at once.

import { View, Text, Image } from '@react-pdf/renderer'
import { styles, alignRight, bold, COLORS } from './theme'
import { formatPaisePdf } from '@/lib/erp/money'
import type { CompanyProfile } from '@/lib/supabase/types'

export function joinNonEmpty(parts: (string | null | undefined)[], separator = ', '): string {
  return parts.filter((part) => part && part.trim()).join(separator)
}

export function Letterhead({
  company,
  title,
  number,
  meta,
}: {
  company: CompanyProfile
  title: string
  number?: string
  meta?: { label: string; value: string }[]
}) {
  const addressLine = joinNonEmpty([company.address_line1, company.address_line2])
  const cityLine = joinNonEmpty([company.city, company.state, company.pincode], ' ')

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        {company.logo_url ? (
          // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img; it takes no alt prop
          <Image style={styles.logo} src={company.logo_url} />
        ) : (
          <Text style={styles.companyName}>{company.trade_name || company.legal_name || 'Alusea'}</Text>
        )}
        {company.logo_url && company.legal_name ? (
          <Text style={[styles.companyMeta, bold, { marginTop: 4 }]}>{company.legal_name}</Text>
        ) : null}
        {addressLine ? <Text style={styles.companyMeta}>{addressLine}</Text> : null}
        {cityLine ? <Text style={styles.companyMeta}>{cityLine}</Text> : null}
        {joinNonEmpty([company.phone, company.email]) ? (
          <Text style={styles.companyMeta}>{joinNonEmpty([company.phone, company.email])}</Text>
        ) : null}
        {company.gstin ? <Text style={styles.companyMeta}>GSTIN: {company.gstin}</Text> : null}
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.docTitle}>{title}</Text>
        {number ? <Text style={styles.docNumber}>{number}</Text> : null}
        {meta?.map((row) => (
          <Text key={row.label} style={styles.docMeta}>
            {row.label}: {row.value}
          </Text>
        ))}
      </View>
    </View>
  )
}

export type PartyBlockData = {
  name: string
  lines: string[]
  gstin?: string
}

export function PartyBlocks({ blocks }: { blocks: { label: string; party: PartyBlockData }[] }) {
  return (
    <View style={styles.partyRow}>
      {blocks.map(({ label, party }) => (
        <View key={label} style={styles.partyBlock}>
          <Text style={styles.partyLabel}>{label}</Text>
          <Text style={styles.partyName}>{party.name || '—'}</Text>
          {party.lines.filter(Boolean).map((line, index) => (
            <Text key={index} style={styles.partyLine}>
              {line}
            </Text>
          ))}
          {party.gstin ? <Text style={styles.partyLine}>GSTIN: {party.gstin}</Text> : null}
        </View>
      ))}
    </View>
  )
}

export function TotalRow({ label, paise, muted }: { label: string; paise: number; muted?: boolean }) {
  return (
    <View style={styles.totalRow}>
      <Text style={[styles.totalLabel, muted ? { color: COLORS.faint } : {}]}>{label}</Text>
      <Text style={[styles.totalValue, alignRight]}>{formatPaisePdf(paise)}</Text>
    </View>
  )
}

export function GrandTotal({ label, paise }: { label: string; paise: number }) {
  return (
    <View style={styles.grandTotalRow}>
      <Text style={styles.grandTotalLabel}>{label}</Text>
      <Text style={[styles.grandTotalValue, alignRight]}>{formatPaisePdf(paise)}</Text>
    </View>
  )
}

export function AmountInWords({ words }: { words: string }) {
  return (
    <View style={styles.amountInWords}>
      <Text style={styles.amountInWordsLabel}>Amount in words</Text>
      <Text>{words}</Text>
    </View>
  )
}

export function BankDetails({ company }: { company: CompanyProfile }) {
  if (!company.bank_account_number && !company.bank_name) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Bank Details</Text>
      {company.bank_name ? <Text style={styles.bodyText}>Bank: {company.bank_name}</Text> : null}
      {company.bank_account_name ? <Text style={styles.bodyText}>Account name: {company.bank_account_name}</Text> : null}
      {company.bank_account_number ? <Text style={styles.bodyText}>Account number: {company.bank_account_number}</Text> : null}
      {joinNonEmpty([company.bank_ifsc, company.bank_branch], ' · ') ? (
        <Text style={styles.bodyText}>{joinNonEmpty([company.bank_ifsc, company.bank_branch], ' · ')}</Text>
      ) : null}
    </View>
  )
}

export function TermsBlock({ title, body }: { title: string; body: string }) {
  if (!body.trim()) return null

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.bodyText}>{body}</Text>
    </View>
  )
}

export function DocumentFooter({ note }: { note?: string }) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{note || ''}</Text>
      <Text style={styles.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  )
}
