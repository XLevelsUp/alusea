// Payslip template. Shows the inputs alongside the computed figures, so a payslip explains itself: "30,000 / 30 x 26" rather than just a net amount.
// Values are passed in frozen from the payroll run, never recomputed, so a reprinted payslip cannot change.

import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, alignRight, bold, COLORS } from '../theme'
import { Letterhead, GrandTotal, AmountInWords, DocumentFooter, joinNonEmpty } from '../components'
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
  daysInPeriod: number
  enteredAmountPaise: number
  basePaise: number
  overtimePaise: number
  bonusPaise: number
  grossPaise: number
  netPaise: number
}

function EarningRow({ label, detail, paise }: { label: string; detail?: string; paise: number }) {
  return (
    <View style={styles.tableRow} wrap={false}>
      <View style={{ width: '60%' }}>
        <Text style={styles.tableCell}>{label}</Text>
        {detail ? <Text style={[styles.bodyText, { fontSize: 7 }]}>{detail}</Text> : null}
      </View>
      <Text style={[styles.tableCell, { width: '40%' }, alignRight]}>{formatPaisePdf(paise)}</Text>
    </View>
  )
}

export function PayslipDocument(data: PayslipDocumentData) {
  const { company, employee } = data

  const baseDetail =
    employee.workerType === 'monthly'
      ? `${formatPaisePdf(data.enteredAmountPaise)} / ${data.daysInPeriod} days x ${data.daysWorked} days worked`
      : `${formatPaisePdf(data.enteredAmountPaise)} per day x ${data.daysWorked} days worked`

  return (
    <Document title={`Payslip ${data.periodLabel} ${employee.name}`} author={company.legal_name || 'Alusea'}>
      <Page size="A4" style={styles.page}>
        <Letterhead
          company={company}
          title="Payslip"
          number={data.documentNumber}
          meta={[{ label: 'Period', value: data.periodLabel }]}
        />

        <View style={styles.partyRow}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Employee</Text>
            <Text style={styles.partyName}>{employee.name}</Text>
            {employee.code ? <Text style={styles.partyLine}>Employee code: {employee.code}</Text> : null}
            {employee.designation ? <Text style={styles.partyLine}>{employee.designation}</Text> : null}
            <Text style={styles.partyLine}>
              {employee.workerType === 'monthly' ? 'Monthly salary' : 'Daily rate'}
            </Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Attendance</Text>
            <Text style={styles.partyName}>
              {data.daysWorked} of {data.daysInPeriod} days
            </Text>
            <Text style={styles.partyLine}>{joinNonEmpty([data.periodLabel])}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, { width: '60%' }]}>Earnings</Text>
            <Text style={[styles.tableHeaderCell, { width: '40%' }, alignRight]}>Amount</Text>
          </View>

          <EarningRow
            label={employee.workerType === 'monthly' ? 'Salary for days worked' : 'Wages for days worked'}
            detail={baseDetail}
            paise={data.basePaise}
          />
          {data.overtimePaise > 0 && <EarningRow label="Overtime" paise={data.overtimePaise} />}
          {data.bonusPaise > 0 && <EarningRow label="Bonus / incentive" paise={data.bonusPaise} />}
        </View>

        <View style={styles.totalsBlock}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Gross pay</Text>
            <Text style={[styles.totalValue, alignRight]}>{formatPaisePdf(data.grossPaise)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: COLORS.faint }]}>Deductions</Text>
            <Text style={[styles.totalValue, alignRight, { color: COLORS.faint }]}>{formatPaisePdf(0)}</Text>
          </View>
          <GrandTotal label="Net pay" paise={data.netPaise} />
        </View>

        <AmountInWords words={paiseToWords(data.netPaise)} />

        <View style={styles.section}>
          <Text style={[styles.bodyText, { fontSize: 7 }]}>
            This payslip does not include statutory deductions such as PF, ESI, professional tax or TDS.
          </Text>
        </View>

        <View style={[styles.section, { alignItems: 'flex-end', marginTop: 28 }]}>
          <Text style={[styles.bodyText, { marginBottom: 28 }]}>For {company.legal_name || company.trade_name}</Text>
          <Text style={[styles.bodyText, bold]}>Authorised Signatory</Text>
        </View>

        <DocumentFooter note="This is a computer-generated payslip." />
      </Page>
    </Document>
  )
}
