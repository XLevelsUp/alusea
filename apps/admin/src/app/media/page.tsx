import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MediaManagerClient from './MediaManagerClient'

export default async function AdminMediaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: media, error } = await supabase
    .from('page_media')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) {
    console.error('Error fetching page_media:', error)
  }

  return <MediaManagerClient initialMedia={media || []} />
}
