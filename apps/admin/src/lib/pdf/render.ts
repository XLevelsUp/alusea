// Renders a react-pdf document to a buffer and stores it in the private alusea-documents bucket.
// Server-only: the renderer pulls in Node stream internals, so importing this from a Client Component breaks the build.

import 'server-only'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import type { ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server'

export const DOCUMENTS_BUCKET = 'alusea-documents'

// The first path segment decides who can read the file, per the storage policies in 20260104000000.
export type DocumentKind = 'invoices' | 'quotes' | 'expenses' | 'payslips'

// Signed URLs are short-lived: the link is handed to a user who has already passed a role check, not published.
const SIGNED_URL_TTL_SECONDS = 60 * 10

export async function renderPdfToBuffer(document: ReactElement<DocumentProps>): Promise<Buffer> {
  return renderToBuffer(document)
}

// Storage keys allow no slashes or spaces, and a document number contains both.
export function toStorageFilename(documentNumber: string): string {
  const safe = documentNumber.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '')
  return `${safe || 'document'}.pdf`
}

export function storagePath(kind: DocumentKind, id: string, documentNumber: string): string {
  return `${kind}/${id}/${toStorageFilename(documentNumber)}`
}

export type StoredDocument = {
  path: string
  signedUrl: string | null
}

// Renders, uploads, and returns a signed URL. Upsert so reissuing a document replaces the file rather than accumulating copies.
export async function renderAndStore({
  document,
  kind,
  id,
  documentNumber,
}: {
  document: ReactElement<DocumentProps>
  kind: DocumentKind
  id: string
  documentNumber: string
}): Promise<StoredDocument> {
  const buffer = await renderPdfToBuffer(document)
  const path = storagePath(kind, id, documentNumber)

  const supabase = await createClient()
  const { error } = await supabase.storage.from(DOCUMENTS_BUCKET).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: true,
  })

  if (error) {
    throw new Error(`Could not store the PDF: ${error.message}`)
  }

  return { path, signedUrl: await createSignedUrl(path) }
}

export async function createSignedUrl(path: string, expiresIn = SIGNED_URL_TTL_SECONDS): Promise<string | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage.from(DOCUMENTS_BUCKET).createSignedUrl(path, expiresIn)

  if (error) return null
  return data?.signedUrl ?? null
}

// Streams a PDF straight back to the browser, for previews that should not persist anything.
export async function pdfResponse(
  document: ReactElement<DocumentProps>,
  filename: string,
  disposition: 'inline' | 'attachment' = 'inline'
): Promise<Response> {
  const buffer = await renderPdfToBuffer(document)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${disposition}; filename="${toStorageFilename(filename)}"`,
      'Cache-Control': 'no-store',
    },
  })
}
