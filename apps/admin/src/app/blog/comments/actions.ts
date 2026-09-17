'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertRole } from '@/lib/auth/session'

async function requireUser() {
  await assertRole('owner', 'sales')
  return createClient()
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
  revalidatePath('/blog/comments')
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
  revalidatePath('/blog/comments')
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
  revalidatePath('/blog/comments')
}
