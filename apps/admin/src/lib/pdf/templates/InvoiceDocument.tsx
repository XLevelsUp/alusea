// Invoice and quotation template. Shaped for the v1 scope in docs/erp-implementation-plan.md: one GST rate for the whole document, no HSN/SAC columns.
// Tax amounts are passed in already computed and frozen, never recalculated here, so reprinting an old invoice shows the tax actually charged.

import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, alignRight, bold } from '../theme'
import {
  Letterhead,
  PartyBlocks,
  TotalRow,
  GrandTotal,
  AmountInWords,
  BankDetails,
  TermsBlock,
  DocumentFooter,
  joinNonEmpty,
  type PartyBlockData,
} from '../components'
import { formatPaisePdf, paiseToWords } from '@/lib/erp/money'
import type { CompanyProfile, Party } from '@/lib/supabase/types'

export type InvoiceLine = {
  description: string
  quantity: number
  unit: string
  ratePaise: number
  amountPaise: number
}

export type InvoiceTax = {
  applicable: boolean
  ratePercent: number
  // Set for a client in another state; cgst and sgst stay zero in that case, and vice versa.
  igstPaise: number
  cgstPaise: number
  sgstPaise: number
}

export type InvoiceDocumentData = {
  title: string
  documentNumber: string
  issueDate: string
  dueDate?: string
  company: CompanyProfile
  party: Party
  lines: InvoiceLine[]
  subtotalPaise: number
  tax: InvoiceTax
  roundingPaise: number
  totalPaise: number
  notes?: string
  isCancelled?: boolean
}

const COLUMNS = {
  sno: '6%',
  description: '42%',
  qty: '12%',
  rate: '18%',
  amount: '22%',
} as const

function partyFromRecord(party: Party): PartyBlockData {
  return {
    name: party.name,
    lines: [
      party.contact_person,
      joinNonEmpty([party.billing_address_line1, party.billing_address_line2]),
      joinNonEmpty([party.billing_city, party.billing_state, party.billing_pincode], ' '),
      joinNonEmpty([party.phone, party.email], ' · '),
    ],
    gstin: party.gstin || undefined,
  }
}

export function InvoiceDocument(data: InvoiceDocumentData) {
  const { company, party, lines, tax } = data
  const isInterState = tax.applicable && tax.igstPaise > 0

  const meta = [{ label: 'Date', value: data.issueDate }]
  if (data.dueDate) meta.push({ label: 'Due', value: data.dueDate })
  if (party.billing_state) meta.push({ label: 'Place of supply', value: party.billing_state })

  return (
    <Document title={`${data.title} ${data.documentNumber}`} author={company.legal_name || 'Alusea'}>
      <Page size="A4" style={styles.page}>
        <Letterhead company={company} title={data.title} number={data.documentNumber} meta={meta} />

        {data.isCancelled && (
          <View style={{ marginBottom: 12, padding: 6, borderWidth: 1, borderColor: '#DC2626' }}>
            <Text style={[bold, { color: '#DC2626', fontSize: 11, textAlign: 'center', letterSpacing: 2 }]}>
              CANCELLED
            </Text>
          </View>
        )}

        <PartyBlocks
          blocks={[
            { label: 'Billed to', party: partyFromRecord(party) },
          ]}
        />

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: COLUMNS.sno }]}>#</Text>
            <Text style={[styles.tableHeaderCell, { width: COLUMNS.description }]}>Description</Text>
            <Text style={[styles.tableHeaderCell, { width: COLUMNS.qty }, alignRight]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, { width: COLUMNS.rate }, alignRight]}>Rate</Text>
            <Text style={[styles.tableHeaderCell, { width: COLUMNS.amount }, alignRight]}>Amount</Text>
          </View>

          {lines.map((line, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableCell, { width: COLUMNS.sno }]}>{index + 1}</Text>
              <Text style={[styles.tableCell, { width: COLUMNS.description }]}>{line.description}</Text>
              <Text style={[styles.tableCell, { width: COLUMNS.qty }, alignRight]}>
                {line.quantity} {line.unit}
              </Text>
              <Text style={[styles.tableCell, { width: COLUMNS.rate }, alignRight]}>{formatPaisePdf(line.ratePaise)}</Text>
              <Text style={[styles.tableCell, { width: COLUMNS.amount }, alignRight]}>
                {formatPaisePdf(line.amountPaise)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock}>
          <TotalRow label="Subtotal" paise={data.subtotalPaise} />

          {tax.applicable && isInterState && (
            <TotalRow label={`IGST @ ${tax.ratePercent}%`} paise={tax.igstPaise} />
          )}
          {tax.applicable && !isInterState && (
            <>
              <TotalRow label={`CGST @ ${tax.ratePercent / 2}%`} paise={tax.cgstPaise} />
              <TotalRow label={`SGST @ ${tax.ratePercent / 2}%`} paise={tax.sgstPaise} />
            </>
          )}

          {data.roundingPaise !== 0 && <TotalRow label="Rounding" paise={data.roundingPaise} muted />}

          <GrandTotal label="Total" paise={data.totalPaise} />
        </View>

        <AmountInWords words={paiseToWords(data.totalPaise)} />

        {!tax.applicable && (
          <Text style={[styles.bodyText, { marginTop: 8 }]}>GST is not applicable on this document.</Text>
        )}

        {data.notes ? <TermsBlock title="Notes" body={data.notes} /> : null}
        <TermsBlock title="Terms & Conditions" body={company.invoice_terms} />
        <BankDetails company={company} />

        <View style={[styles.section, { alignItems: 'flex-end', marginTop: 28 }]}>
          <Text style={[styles.bodyText, { marginBottom: 28 }]}>For {company.legal_name || company.trade_name}</Text>
          <Text style={styles.bodyText}>Authorised Signatory</Text>
        </View>

        <DocumentFooter note={company.invoice_footer} />
      </Page>
    </Document>
  )
}
