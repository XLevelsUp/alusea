// Payslip template, laid out as ruled boxes: company, employee details, earnings beside deductions, then net pay.
// Values are passed in frozen from the payroll run, never recomputed, so a reprinted payslip cannot change.

import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer'
import { styles, alignRight, bold, COLORS, FONT_BOLD } from '../theme'
import { DocumentFooter, joinNonEmpty } from '../components'
import { formatPaisePdf, paiseToWords } from '@/lib/erp/money'
import type { CompanyProfile } from '@/lib/supabase/types'

export type PayslipDocumentData = {
  documentNumber: string
  periodLabel: string
  company: CompanyProfile
  employee: {
    code: string
    name: string
    designation: string
    workerType: 'monthly' | 'daily'
  }
  daysWorked: number
  basePaise: number
  overtimePaise: number
  bonusPaise: number
  grossPaise: number
  netPaise: number
}

// A darker rule than the shared tables use, so the boxes read as one firm frame.
const RULE = '#9CA3AF'
const BAND = '#1F2937'

const box = StyleSheet.create({
  frame: { borderWidth: 1, borderColor: RULE, marginBottom: 10 },
  // The company box: who issued the payslip on the left, what it is on the right.
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12 },
  headTitle: { fontFamily: FONT_BOLD, fontSize: 16, letterSpacing: 3, textAlign: 'right', lineHeight: 1.2 },
  headPeriod: { fontSize: 9, textAlign: 'right', marginTop: 6 },
  headRef: { fontSize: 7.5, color: COLORS.muted, textAlign: 'right', marginTop: 2 },
  // The dark strip that names each box.
  band: { backgroundColor: BAND, paddingVertical: 5, paddingHorizontal: 8 },
  bandText: { fontFamily: FONT_BOLD, fontSize: 8, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.white },
  // Employee details: label and value cells, three across.
  detailRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: RULE },
  detailCell: { flex: 1, paddingVertical: 7, paddingHorizontal: 8, borderLeftWidth: 1, borderLeftColor: RULE },
  detailLabel: { fontSize: 6.5, letterSpacing: 0.8, textTransform: 'uppercase', color: COLORS.muted, marginBottom: 2 },
  detailValue: { fontFamily: FONT_BOLD, fontSize: 9.5 },
  // Earnings and deductions stand side by side at the same height.
  pair: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  column: { flex: 1, borderWidth: 1, borderColor: RULE },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  lineText: { fontSize: 9 },
  // The total row is pushed to the foot of its box, so both boxes close on the same line.
  totalLine: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingVertical: 7, paddingHorizontal: 8, backgroundColor: COLORS.headerBg, borderTopWidth: 1, borderTopColor: RULE },
  totalText: { fontFamily: FONT_BOLD, fontSize: 9 },
  // Net pay: the one figure the employee is looking for.
  net: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: BAND, paddingVertical: 12, paddingHorizontal: 12 },
  netLabel: { fontFamily: FONT_BOLD, fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.white },
  netValue: { fontFamily: FONT_BOLD, fontSize: 16, color: COLORS.white },
  words: { paddingVertical: 8, paddingHorizontal: 12 },
})

function Detail({ label, value, first }: { label: string; value: string; first?: boolean }) {
  return (
    <View style={[box.detailCell, first ? { borderLeftWidth: 0 } : {}]}>
      <Text style={box.detailLabel}>{label}</Text>
      <Text style={box.detailValue}>{value || '-'}</Text>
    </View>
  )
}

function Line({ label, paise }: { label: string; paise: number }) {
  return (
    <View style={box.line} wrap={false}>
      <Text style={box.lineText}>{label}</Text>
      <Text style={[box.lineText, alignRight]}>{formatPaisePdf(paise)}</Text>
    </View>
  )
}

export function PayslipDocument(data: PayslipDocumentData) {
  const { company, employee } = data
  const addressLine = joinNonEmpty([company.address_line1, company.address_line2])
  const cityLine = joinNonEmpty([company.city, company.state, company.pincode], ' ')
  const contactLine = joinNonEmpty([company.phone, company.email])

  return (
    <Document title={`Payslip ${data.periodLabel} ${employee.name}`} author={company.legal_name || 'Alusea'}>
      <Page size="A4" style={styles.page}>
        <View style={[box.frame, box.head]}>
          <View style={{ flex: 1.4 }}>
            {company.logo_url ? (
              // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, not an HTML img; it takes no alt prop
              <Image style={styles.logo} src={company.logo_url} />
            ) : (
              <Text style={[styles.companyName, { lineHeight: 1.2, marginBottom: 6 }]}>{company.trade_name || company.legal_name || 'Alusea'}</Text>
            )}
            {company.logo_url && company.legal_name ? (
              <Text style={[styles.companyMeta, bold, { marginTop: 4 }]}>{company.legal_name}</Text>
            ) : null}
            {addressLine ? <Text style={styles.companyMeta}>{addressLine}</Text> : null}
            {cityLine ? <Text style={styles.companyMeta}>{cityLine}</Text> : null}
            {contactLine ? <Text style={styles.companyMeta}>{contactLine}</Text> : null}
            {company.gstin ? <Text style={styles.companyMeta}>GSTIN: {company.gstin}</Text> : null}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={box.headTitle}>PAYSLIP</Text>
            <Text style={box.headPeriod}>For {data.periodLabel}</Text>
            <Text style={box.headRef}>Ref: {data.documentNumber}</Text>
          </View>
        </View>

        <View style={box.frame}>
          <View style={box.band}>
            <Text style={box.bandText}>Employee Details</Text>
          </View>
          <View style={[box.detailRow, { borderTopWidth: 0 }]}>
            <Detail first label="Employee Name" value={employee.name} />
            <Detail label="Employee Code" value={employee.code} />
            <Detail label="Designation" value={employee.designation} />
          </View>
          <View style={box.detailRow}>
            <Detail first label="Pay Period" value={data.periodLabel} />
            <Detail label="Days Worked" value={String(data.daysWorked)} />
            <Detail label="Pay Type" value={employee.workerType === 'monthly' ? 'Monthly salary' : 'Daily wages'} />
          </View>
        </View>

        <View style={box.pair}>
          <View style={box.column}>
            <View style={box.band}>
              <Text style={box.bandText}>Earnings</Text>
            </View>
            <Line label={employee.workerType === 'monthly' ? 'Salary' : 'Wages'} paise={data.basePaise} />
            <Line label="Overtime" paise={data.overtimePaise} />
            <Line label="Bonus / Incentive" paise={data.bonusPaise} />
            <View style={box.totalLine}>
              <Text style={box.totalText}>Gross Earnings</Text>
              <Text style={[box.totalText, alignRight]}>{formatPaisePdf(data.grossPaise)}</Text>
            </View>
          </View>

          <View style={box.column}>
            <View style={box.band}>
              <Text style={box.bandText}>Deductions</Text>
            </View>
            <View style={box.line}>
              <Text style={[box.lineText, { color: COLORS.muted }]}>No deductions</Text>
              <Text style={[box.lineText, alignRight, { color: COLORS.muted }]}>{formatPaisePdf(0)}</Text>
            </View>
            <View style={box.totalLine}>
              <Text style={box.totalText}>Total Deductions</Text>
              <Text style={[box.totalText, alignRight]}>{formatPaisePdf(data.grossPaise - data.netPaise)}</Text>
            </View>
          </View>
        </View>

        <View style={box.frame} wrap={false}>
          <View style={box.net}>
            <Text style={box.netLabel}>Net Pay</Text>
            <Text style={box.netValue}>{formatPaisePdf(data.netPaise)}</Text>
          </View>
          <View style={box.words}>
            <Text style={box.detailLabel}>Amount in words</Text>
            <Text style={{ fontSize: 9 }}>{paiseToWords(data.netPaise)}</Text>
          </View>
        </View>

        <Text style={[styles.bodyText, { fontSize: 7 }]}>
          This payslip does not include statutory deductions such as PF, ESI, professional tax or TDS.
        </Text>

        <DocumentFooter note="This is a computer-generated payslip and does not require a signature." />
      </Page>
    </Document>
  )
}
