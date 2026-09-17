import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import MediaManagerClient from './MediaManagerClient'

export default async function AdminMediaPage() {
  const supabase = await createClient()
  await requireRole('owner', 'sales')

  const { data: media, error } = await supabase
    .from('page_media')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching page_media:', error)
  }

  return <MediaManagerClient initialMedia={media || []} />
}
