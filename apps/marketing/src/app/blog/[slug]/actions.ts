'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function submitComment(formData: FormData) {
  const postId = formData.get('post_id') as string
  const postSlug = formData.get('post_slug') as string
  const name = (formData.get('name') as string)?.trim()
  const email = (formData.get('email') as string)?.trim()
  const message = (formData.get('message') as string)?.trim()

  if (!postId || !postSlug) throw new Error('Missing post reference')
  if (!name) throw new Error('Name is required')
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('A valid email is required')
  if (!message || message.trim().length < 3) throw new Error('Message is required')

  const supabase = await createClient()

  // status is never trusted from the client — every new comment starts
  // pending and only appears publicly once approved from /admin/blog/comments
  const { error } = await supabase.from('blog_comments').insert([
    { post_id: postId, name, email, message, status: 'pending' },
  ])

  if (error) {
    console.error(error)
    throw new Error('Could not submit comment: ' + error.message)
  }

  revalidatePath(`/blog/${postSlug}`)
}
