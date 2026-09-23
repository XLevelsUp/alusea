'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { assertRole } from '@/lib/auth/session'

async function requireUser() {
  await assertRole('owner', 'sales')
  return createClient()
}

export const approveComment = defineAction(async function approveComment(id: string, postSlug: string) {
  const supabase = await requireUser()

  const { error } = await supabase
    .from('blog_comments')
    .update({ status: 'approved' })
    .eq('id', id)

  if (error) {
    throw new ActionError('Could not approve comment')
  }

  revalidatePath(`/blog/${postSlug}`)
  revalidatePath('/blog/comments')
})

export const rejectComment = defineAction(async function rejectComment(id: string, postSlug: string) {
  const supabase = await requireUser()

  const { error } = await supabase
    .from('blog_comments')
    .update({ status: 'rejected' })
    .eq('id', id)

  if (error) {
    throw new ActionError('Could not reject comment')
  }

  revalidatePath(`/blog/${postSlug}`)
  revalidatePath('/blog/comments')
})

export const deleteComment = defineAction(async function deleteComment(id: string, postSlug: string) {
  const supabase = await requireUser()

  const { error } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', id)

  if (error) {
    throw new ActionError('Could not delete comment')
  }

  revalidatePath(`/blog/${postSlug}`)
  revalidatePath('/blog/comments')
})
