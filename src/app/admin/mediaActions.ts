'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export async function addPageMedia(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const page        = formData.get('page') as string
  const section     = formData.get('section') as string
  const title       = formData.get('title') as string
  const description = formData.get('description') as string
  const actionText  = formData.get('action_text') as string
  const sortOrder   = parseInt(formData.get('sort_order') as string || '0', 10)
  const newUploadedUrl = formData.get('new_uploaded_url') as string
  if (!newUploadedUrl) {
    throw new Error('Please select and upload an image file')
  }

  const { error: insertError } = await supabase
    .from('page_media')
    .insert([{
      page,
      section,
      title,
      description,
      action_text: actionText || null,
      image_url: newUploadedUrl,
      sort_order: sortOrder,
    }])

  if (insertError) {
    console.error('Insert error:', insertError)
    throw new Error('Could not save media entry: ' + insertError.message)
  }

  revalidatePath('/admin/media')
  revalidatePath('/experience-center')
}

export async function deletePageMedia(id: string, imageUrl: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Delete from DB first
  const { error: deleteError } = await supabase
    .from('page_media')
    .delete()
    .eq('id', id)

  if (deleteError) throw new Error('Could not delete media entry')

  // Try to remove from storage (extract file path from URL)
  try {
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split('/alusea-assets/')
    if (pathParts.length > 1) {
      await supabase.storage.from('alusea-assets').remove([pathParts[1]])
    }
  } catch (e) {
    // Non-fatal: DB row already deleted
    console.warn('Could not remove file from storage:', e)
  }

  revalidatePath('/admin/media')
  revalidatePath('/experience-center')
}
