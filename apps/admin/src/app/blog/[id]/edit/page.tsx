import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BlogPostForm from '../../BlogPostForm'
import type { BlogPostRow } from '@/lib/supabase/types'

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  await requireRole('owner', 'sales')

  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) {
    notFound()
  }

  const { data: categories } = await supabase
    .from('blog_categories')
    .select('name')
    .order('sort_order', { ascending: true })

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Edit Blog Post</h1>
        <Link href="/blog" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Blog List
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <BlogPostForm initialData={post as BlogPostRow} categories={categories?.map((c) => c.name) || []} cancelUrl="/blog" />
      </div>
    </div>
  )
}
