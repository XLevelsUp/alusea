'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return supabase
}

export async function approveComment(id: string, postSlug: string) {
  const supabase = await requireUser()

  const { error } = await supabase
    .from('blog_comments')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    throw new Error('Could not approve comment')
  }

  revalidatePath(`/blog/${postSlug}`)
  revalidatePath('/admin/blog/comments')
}

export async function rejectComment(id: string, postSlug: string) {
  const supabase = await requireUser()

  const { error } = await supabase
    .from('blog_comments')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) {
    throw new Error('Could not reject comment')
  }

  revalidatePath(`/blog/${postSlug}`)
  revalidatePath('/admin/blog/comments')
}

export async function deleteComment(id: string, postSlug: string) {
  const supabase = await requireUser()

  const { error } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Could not delete comment')
  }

  revalidatePath(`/blog/${postSlug}`)
  revalidatePath('/admin/blog/comments')
}
