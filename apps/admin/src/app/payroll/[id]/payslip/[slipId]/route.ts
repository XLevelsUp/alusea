// Redirects to a freshly signed URL for a stored payslip. Restricted to owner and hr, matching the storage policy on the payslips prefix.

import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createSignedUrl } from '@/lib/pdf/render'

export async function GET(request: Request, { params }: { params: Promise<{ id: string; slipId: string }> }) {
  await requireRole('owner', 'hr')

  const { id, slipId } = await params
  const supabase = await createClient()
  const { data: payslip } = await supabase
    .from('payslips')
    .select('pdf_path')
    .eq('id', slipId)
    .eq('run_id', id)
    .single()

  if (!payslip?.pdf_path) {
    return new Response('This payslip has no PDF yet. Use Regenerate Payslips on the run.', { status: 404 })
  }

  const signedUrl = await createSignedUrl(payslip.pdf_path)

  if (!signedUrl) {
    return new Response('Could not open the payslip. Try regenerating it.', { status: 502 })
  }

  redirect(signedUrl)
}
