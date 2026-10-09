// Redirects to a short-lived signed URL for an employee's Aadhaar scan; the file itself is never public.

import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'
import { createSignedUrl } from '@/lib/pdf/render'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  await requireRole('owner', 'hr')

  const { id } = await params
  const supabase = await createClient()
  const { data: employee } = await supabase.from('employees').select('aadhaar_path').eq('id', id).single()

  if (!employee?.aadhaar_path) {
    return new Response('No Aadhaar card on file for this employee.', { status: 404 })
  }

  const signedUrl = await createSignedUrl(employee.aadhaar_path)

  if (!signedUrl) {
    return new Response('Could not open the Aadhaar card.', { status: 502 })
  }

  redirect(signedUrl)
}
