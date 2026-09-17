// Redirects to a freshly signed URL for a stored receipt. RLS on expense_attachments decides visibility, so a staff member can only reach their own.

import { redirect } from 'next/navigation'
import { requireProfile } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createSignedUrl } from '@/lib/pdf/render'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> }
) {
  await requireProfile()

  const { id, attachmentId } = await params
  const supabase = await createClient()
  const { data: attachment } = await supabase
    .from('expense_attachments')
    .select('storage_path')
    .eq('id', attachmentId)
    .eq('expense_id', id)
    .single()

  if (!attachment?.storage_path) {
    return new Response('Receipt not found.', { status: 404 })
  }

  const signedUrl = await createSignedUrl(attachment.storage_path)

  if (!signedUrl) {
    return new Response('Could not open the receipt.', { status: 502 })
  }

  redirect(signedUrl)
}
