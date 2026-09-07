import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import BlogPostForm from '../../BlogPostForm'

export default async function EditBlogPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

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
        <BlogPostForm initialData={post} categories={categories?.map((c) => c.name) || []} cancelUrl="/blog" />
      </div>
    </div>
  )
}
