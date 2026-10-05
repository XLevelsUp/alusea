import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { RECEIPT_MAX_BYTES, receiptFileProblem } from './receipts.ts'

const file = (name: string, type: string, size: number) => ({ name, type, size })

describe('receiptFileProblem', () => {
  test('accepts any image type and PDFs within the limit', () => {
    assert.equal(receiptFileProblem(file('bill.jpg', 'image/jpeg', 500_000)), null)
    assert.equal(receiptFileProblem(file('bill.heic', 'image/heic', 3_000_000)), null)
    assert.equal(receiptFileProblem(file('bill.pdf', 'application/pdf', 1_000_000)), null)
  })

  test('accepts a file exactly at the limit and rejects one byte over', () => {
    assert.equal(receiptFileProblem(file('bill.jpg', 'image/jpeg', RECEIPT_MAX_BYTES)), null)
    assert.match(receiptFileProblem(file('bill.jpg', 'image/jpeg', RECEIPT_MAX_BYTES + 1)) ?? '', /10 MB or smaller/)
  })

  test('rejects files that are neither an image nor a PDF', () => {
    assert.match(receiptFileProblem(file('bill.xlsx', 'application/vnd.ms-excel', 100)) ?? '', /image or a PDF/)
    assert.match(receiptFileProblem(file('bill.exe', '', 100)) ?? '', /image or a PDF/)
  })

  test('falls back to the extension when the browser reports no type', () => {
    assert.equal(receiptFileProblem(file('scan.JPG', '', 100)), null)
    assert.equal(receiptFileProblem(file('scan.pdf', '', 100)), null)
  })
})
