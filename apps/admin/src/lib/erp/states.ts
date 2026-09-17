// GST state codes, the first two digits of a GSTIN. Comparing the company's code with the client's is what decides IGST versus CGST+SGST on an invoice.

export type StateOption = {
  code: string
  name: string
}

export const INDIAN_STATES: readonly StateOption[] = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
]

export function stateNameForCode(code: string): string {
  return INDIAN_STATES.find((state) => state.code === code)?.name ?? ''
}

// A GSTIN is 15 characters: 2-digit state code, 10-character PAN, entity number, 'Z', checksum.
const GSTIN_PATTERN = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/

export function isValidGstin(gstin: string): boolean {
  return GSTIN_PATTERN.test(gstin.trim().toUpperCase())
}

const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/

export function isValidPan(pan: string): boolean {
  return PAN_PATTERN.test(pan.trim().toUpperCase())
}

// The state code a GSTIN declares, so the form can flag a mismatch with the selected state.
export function stateCodeFromGstin(gstin: string): string {
  const trimmed = gstin.trim()
  return trimmed.length >= 2 ? trimmed.slice(0, 2) : ''
}
