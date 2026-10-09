import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { AADHAAR_MAX_BYTES, aadhaarFileProblem } from './aadhaar.ts'

const file = (name: string, type: string, size: number) => ({ name, type, size })

describe('aadhaarFileProblem', () => {
  test('accepts images and PDFs within the limit', () => {
    assert.equal(aadhaarFileProblem(file('card.jpg', 'image/jpeg', 500_000)), null)
    assert.equal(aadhaarFileProblem(file('card.png', 'image/png', 1_000_000)), null)
    assert.equal(aadhaarFileProblem(file('card.webp', 'image/webp', 1_000_000)), null)
    assert.equal(aadhaarFileProblem(file('e-aadhaar.pdf', 'application/pdf', 1_000_000)), null)
  })

  test('accepts a file exactly at the limit', () => {
    assert.equal(aadhaarFileProblem(file('card.jpg', 'image/jpeg', AADHAAR_MAX_BYTES)), null)
  })

  test('rejects a file one byte over the limit', () => {
    assert.match(aadhaarFileProblem(file('card.jpg', 'image/jpeg', AADHAAR_MAX_BYTES + 1)) ?? '', /2 MB or smaller/)
  })

  test('rejects other file types', () => {
    assert.match(aadhaarFileProblem(file('card.heic', 'image/heic', 100)) ?? '', /JPG, PNG, WebP or PDF/)
    assert.match(aadhaarFileProblem(file('card.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 100)) ?? '', /JPG, PNG, WebP or PDF/)
  })

  test('falls back to the extension when the browser reports no type', () => {
    assert.equal(aadhaarFileProblem(file('scan.JPG', '', 100)), null)
    assert.match(aadhaarFileProblem(file('scan.exe', '', 100)) ?? '', /JPG, PNG, WebP or PDF/)
  })
})
