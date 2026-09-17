// Shared look for every generated document, so invoices, quotes and payslips read as one family.
// Values mirror the admin UI palette in globals.css; react-pdf needs plain hex, not CSS variables.

import { StyleSheet } from '@react-pdf/renderer'

export const COLORS = {
  text: '#111111',
  muted: '#6B7280',
  faint: '#9CA3AF',
  accent: '#A67C52',
  border: '#E5E7EB',
  headerBg: '#F9FAFB',
  white: '#FFFFFF',
} as const

// react-pdf ships Helvetica, so no font file is fetched at render time. A remote font would make PDF generation depend on network access.
export const FONT = 'Helvetica'
export const FONT_BOLD = 'Helvetica-Bold'

export const styles = StyleSheet.create({
  page: {
    fontFamily: FONT,
    fontSize: 9,
    color: COLORS.text,
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 36,
    lineHeight: 1.4,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
    paddingBottom: 12,
    marginBottom: 16,
  },
  companyName: {
    fontFamily: FONT_BOLD,
    fontSize: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  companyMeta: {
    fontSize: 8,
    color: COLORS.muted,
  },
  logo: {
    width: 90,
    height: 36,
    objectFit: 'contain',
  },

  docTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'right',
    marginBottom: 4,
  },
  docNumber: {
    fontSize: 9,
    color: COLORS.accent,
    textAlign: 'right',
    fontFamily: FONT_BOLD,
  },
  docMeta: {
    fontSize: 8,
    color: COLORS.muted,
    textAlign: 'right',
  },

  partyRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
  },
  partyBlock: {
    flex: 1,
  },
  partyLabel: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.faint,
    marginBottom: 4,
  },
  partyName: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 8,
    color: COLORS.muted,
  },

  table: {
    marginBottom: 12,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontFamily: FONT_BOLD,
    fontSize: 7,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: COLORS.muted,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 8.5,
  },

  totalsBlock: {
    marginLeft: 'auto',
    width: '48%',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  totalLabel: {
    fontSize: 8.5,
    color: COLORS.muted,
  },
  totalValue: {
    fontSize: 8.5,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.text,
    marginTop: 4,
    paddingTop: 6,
  },
  grandTotalLabel: {
    fontFamily: FONT_BOLD,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  grandTotalValue: {
    fontFamily: FONT_BOLD,
    fontSize: 11,
  },

  amountInWords: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    fontSize: 8.5,
  },
  amountInWordsLabel: {
    fontSize: 7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.faint,
    marginBottom: 2,
  },

  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontFamily: FONT_BOLD,
    fontSize: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 8,
    color: COLORS.muted,
  },

  footer: {
    position: 'absolute',
    bottom: 24,
    left: 36,
    right: 36,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7,
    color: COLORS.faint,
  },
})

// Right-aligned money cells need their own style objects, since react-pdf does not cascade text-align onto children.
export const alignRight = { textAlign: 'right' as const }
export const bold = { fontFamily: FONT_BOLD }
