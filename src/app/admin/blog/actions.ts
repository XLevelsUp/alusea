'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'

export type BlogSubsection = {
  heading: string
  body_html: string
}

export type BlogSection = {
  heading: string
  body_html: string
  subsections: BlogSubsection[]
}

export type BlogQA = {
  question: string
  answer: string
}

export type BlogCtaButton = {
  label: string
  href: string
}

export type BlogCta = {
  intro: string
  buttons: BlogCtaButton[]
}

export type ImageFit = 'cover' | 'contain'

function readImageFit(formData: FormData, field: string): ImageFit {
  return formData.get(field) === 'contain' ? 'contain' : 'cover'
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

async function requireUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }
  return supabase
}

function readPostFields(formData: FormData) {
  const title = (formData.get('title') as string)?.trim()
  const slugInput = (formData.get('slug') as string)?.trim()
  const slug = slugInput ? slugify(slugInput) : slugify(title || '')

  const featuredImageUrl = formData.get('featured_image_url') as string
  const featuredImageAlt = (formData.get('featured_image_alt') as string)?.trim()
  const featuredImageFit = readImageFit(formData, 'featured_image_fit')

  const category = formData.get('category') as string
  const tagsRaw = (formData.get('tags') as string) || ''
  const tags = tagsRaw.split(',').map((t) => t.trim()).filter(Boolean)
  const author = ((formData.get('author') as string)?.trim()) || 'Alusea Team'
  const readingTimeMinutes = parseInt((formData.get('reading_time_minutes') as string) || '5', 10)

  const publishedDateInput = (formData.get('published_at') as string)?.trim()
  const publishedAt = publishedDateInput ? new Date(publishedDateInput).toISOString() : new Date().toISOString()
  if (publishedDateInput && isNaN(new Date(publishedDateInput).getTime())) {
    throw new Error('Invalid published date')
  }

  const introHtml = formData.get('intro_html') as string

  const secondImageUrl = (formData.get('second_image_url') as string)?.trim() || null
  const secondImageAlt = (formData.get('second_image_alt') as string)?.trim() || null
  const secondImageFit = readImageFit(formData, 'second_image_fit')

  let sections: BlogSection[] = []
  try {
    sections = JSON.parse((formData.get('sections_json') as string) || '[]')
  } catch {
    throw new Error('Invalid sections data')
  }

  let qa: BlogQA[] = []
  try {
    qa = JSON.parse((formData.get('qa_json') as string) || '[]')
  } catch {
    throw new Error('Invalid Q&A data')
  }

  let cta: BlogCta = { intro: '', buttons: [] }
  try {
    cta = JSON.parse((formData.get('cta_json') as string) || '{}')
  } catch {
    throw new Error('Invalid CTA data')
  }

  if (!title) throw new Error('Title is required')
  if (!slug) throw new Error('Slug could not be generated — please provide a title or slug')
  if (!featuredImageUrl) throw new Error('Featured image is required')
  if (!featuredImageAlt) throw new Error('Featured image alt text is required')
  if (!category) throw new Error('Category is required')
  if (!introHtml || introHtml === '<p></p>') throw new Error('Introduction is required')

  return {
    title,
    slug,
    featured_image_url: featuredImageUrl,
    featured_image_alt: featuredImageAlt,
    featured_image_fit: featuredImageFit,
    category,
    tags,
    author,
    reading_time_minutes: Number.isFinite(readingTimeMinutes) ? readingTimeMinutes : 5,
    published_at: publishedAt,
    intro_html: introHtml,
    second_image_url: secondImageUrl,
    second_image_alt: secondImageAlt,
    second_image_fit: secondImageFit,
    sections,
    qa,
    cta,
  }
}

export async function addBlogPost(formData: FormData) {
  const supabase = await requireUser()
  const fields = readPostFields(formData)

  const { error } = await supabase.from('blog_posts').insert([fields])

  if (error) {
    if (error.code === '23505') {
      throw new Error('A post with this slug already exists — choose a different title or slug')
    }
    console.error(error)
    throw new Error('Could not add blog post: ' + error.message)
  }

  revalidatePath('/blog')
  revalidatePath('/admin/blog')
}

export async function updateBlogPost(formData: FormData) {
  const supabase = await requireUser()
  const id = formData.get('id') as string
  if (!id) throw new Error('Missing post id')

  const fields = readPostFields(formData)

  const { error } = await supabase
    .from('blog_posts')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      throw new Error('A post with this slug already exists — choose a different title or slug')
    }
    console.error(error)
    throw new Error('Could not update blog post: ' + error.message)
  }

  revalidatePath('/blog')
  revalidatePath(`/blog/${fields.slug}`)
  revalidatePath('/admin/blog')
}

export async function deleteBlogPost(id: string) {
  const supabase = await requireUser()

  const { error } = await supabase.from('blog_posts').delete().eq('id', id)

  if (error) {
    throw new Error('Could not delete blog post')
  }

  revalidatePath('/blog')
  revalidatePath('/admin/blog')
}
