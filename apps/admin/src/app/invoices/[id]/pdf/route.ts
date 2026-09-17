// Redirects to a freshly signed URL for the stored invoice PDF, so the link in the UI never contains a credential that outlives the click.

import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createSignedUrl } from '@/lib/pdf/render'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('owner', 'accounts', 'sales')

  const { id } = await params
  const supabase = await createClient()
  const { data: invoice } = await supabase.from('invoices').select('pdf_path').eq('id', id).single()

  if (!invoice?.pdf_path) {
    return new Response('This invoice has no PDF yet. Issue it, or use Regenerate PDF.', { status: 404 })
  }

  const signedUrl = await createSignedUrl(invoice.pdf_path)

  if (!signedUrl) {
    return new Response('Could not open the PDF. Try regenerating it.', { status: 502 })
  }

  redirect(signedUrl)
}
