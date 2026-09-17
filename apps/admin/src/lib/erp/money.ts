// All money in the ERP is integer paise. Float rupees accumulate rounding error that surfaces as invoices whose lines do not sum to their total, and payslips off by a rupee.
// Convert at the edges only: parse on input, format on output, integers everywhere between.

export const PAISE_PER_RUPEE = 100

// Parses user input into paise. Accepts "1,500.50", "1500.5", "₹1500" and blank.
export function parseRupeesToPaise(input: string | number | null | undefined): number {
  if (input === null || input === undefined || input === '') return 0

  const cleaned = String(input).replace(/[₹,\s]/g, '')
  if (cleaned === '' || cleaned === '-') return 0

  const value = Number(cleaned)
  if (!Number.isFinite(value)) {
    throw new Error(`Not a valid amount: ${input}`)
  }

  return Math.round(value * PAISE_PER_RUPEE)
}

// Plain decimal string for input fields: 150050 -> "1500.50".
export function paiseToRupeeString(paise: number): string {
  const sign = paise < 0 ? '-' : ''
  const abs = Math.abs(Math.round(paise))
  return `${sign}${Math.floor(abs / PAISE_PER_RUPEE)}.${String(abs % PAISE_PER_RUPEE).padStart(2, '0')}`
}

// Display format with Indian digit grouping: 150050 -> "₹1,500.50".
// currency 'none' omits the symbol; 'ascii' writes "Rs." for PDFs, where the built-in Helvetica has no glyph for ₹ and renders a wrong character instead.
export function formatPaise(
  paise: number,
  options: { symbol?: boolean; currency?: 'symbol' | 'ascii' | 'none' } = {}
): string {
  const { symbol = true, currency = symbol ? 'symbol' : 'none' } = options

  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.round(paise) / PAISE_PER_RUPEE)

  if (currency === 'none') return formatted
  if (currency === 'ascii') return `Rs. ${formatted}`
  return `₹${formatted}`
}

// Money as it should appear inside a generated PDF.
export function formatPaisePdf(paise: number): string {
  return formatPaise(paise, { currency: 'ascii' })
}

// Percentage of an amount, rounded half-up to the nearest paise. Used for GST.
export function percentOf(paise: number, ratePercent: number): number {
  return Math.round((paise * ratePercent) / 100)
}

export function sumPaise(values: readonly number[]): number {
  return values.reduce((total, value) => total + Math.round(value), 0)
}

// Rounds to the nearest rupee and returns both the rounded total and the adjustment, so an invoice can show the rounding line explicitly.
export function roundToRupee(paise: number): { rounded: number; adjustment: number } {
  const rounded = Math.round(paise / PAISE_PER_RUPEE) * PAISE_PER_RUPEE
  return { rounded, adjustment: rounded - paise }
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen',
]

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function twoDigitsToWords(n: number): string {
  if (n < 20) return ONES[n]
  const tens = TENS[Math.floor(n / 10)]
  const ones = ONES[n % 10]
  return ones ? `${tens} ${ones}` : tens
}

function threeDigitsToWords(n: number): string {
  const hundreds = Math.floor(n / 100)
  const rest = n % 100
  const parts: string[] = []
  if (hundreds) parts.push(`${ONES[hundreds]} Hundred`)
  if (rest) parts.push(twoDigitsToWords(rest))
  return parts.join(' ')
}

// Indian numbering for invoice PDFs: crore, lakh, thousand — not millions.
function integerToWords(n: number): string {
  if (n === 0) return 'Zero'

  const parts: string[] = []
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const rest = n % 1000

  if (crore) parts.push(`${integerToWords(crore)} Crore`)
  if (lakh) parts.push(`${twoDigitsToWords(lakh)} Lakh`)
  if (thousand) parts.push(`${twoDigitsToWords(thousand)} Thousand`)
  if (rest) parts.push(threeDigitsToWords(rest))

  return parts.join(' ')
}

// "Rupees One Thousand Five Hundred and Fifty Paise Only" — the line Indian invoices are expected to carry.
export function paiseToWords(paise: number): string {
  const negative = paise < 0
  const abs = Math.abs(Math.round(paise))
  const rupees = Math.floor(abs / PAISE_PER_RUPEE)
  const remainder = abs % PAISE_PER_RUPEE

  const parts: string[] = [`Rupees ${integerToWords(rupees)}`]
  if (remainder) parts.push(`and ${twoDigitsToWords(remainder)} Paise`)
  parts.push('Only')

  return `${negative ? 'Minus ' : ''}${parts.join(' ')}`
}
