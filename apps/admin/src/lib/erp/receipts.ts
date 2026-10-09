// The one receipt upload rule, shared by the forms (instant feedback) and the server actions (the check that actually counts).

export const RECEIPT_MAX_BYTES = 10 * 1024 * 1024

export const RECEIPT_ACCEPT = 'image/*,application/pdf'

export const RECEIPT_HINT = 'A photo or PDF of the bill, up to 10 MB.'

// Returns what is wrong with the file, or null when it can be uploaded.
export function receiptFileProblem(file: { size: number; type: string; name: string }): string | null {
  // Some phones report scans with an empty type, so the extension is the fallback.
  const typeOk = file.type.startsWith('image/') || file.type === 'application/pdf'
  const extensionOk = /\.(jpe?g|png|webp|gif|heic|heif|pdf)$/i.test(file.name)
  if (!typeOk && !(file.type === '' && extensionOk)) {
    return 'Receipts must be an image or a PDF'
  }
  if (file.size > RECEIPT_MAX_BYTES) {
    return `Receipts must be 10 MB or smaller (this file is ${(file.size / (1024 * 1024)).toFixed(1)} MB)`
  }
  return null
}
