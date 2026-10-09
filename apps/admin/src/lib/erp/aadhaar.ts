// The one Aadhaar upload rule, shared by the form (instant feedback) and the server action (the check that actually counts).

export const AADHAAR_MAX_BYTES = 2 * 1024 * 1024

export const AADHAAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

// For the file picker's accept attribute; extensions as well as types, since some phones report scans with an empty type.
export const AADHAAR_ACCEPT = '.jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf'

export const AADHAAR_HINT = 'JPG, PNG, WebP or PDF, up to 2 MB. A masked Aadhaar is enough and safer to keep.'

// Returns what is wrong with the file, or null when it can be uploaded.
export function aadhaarFileProblem(file: { size: number; type: string; name: string }): string | null {
  const extensionOk = /\.(jpe?g|png|webp|pdf)$/i.test(file.name)
  if (!AADHAAR_TYPES.includes(file.type) && !(file.type === '' && extensionOk)) {
    return 'Aadhaar card must be a JPG, PNG, WebP or PDF file'
  }
  if (file.size > AADHAAR_MAX_BYTES) {
    return `Aadhaar card must be 2 MB or smaller (this file is ${(file.size / (1024 * 1024)).toFixed(1)} MB)`
  }
  return null
}
