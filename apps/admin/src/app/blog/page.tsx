import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { deleteBlogPost } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import CommentsPanel from './comments/CommentsPanel'
import DeleteButton from '@/components/DeleteButton'
import PageTabs from '@/components/PageTabs'
import { Button } from '@/components/ui/button'

const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://www.alusea.in'

export default async function AdminBlogPage() {
  const supabase = await createClient()
  await requireRole('owner', 'sales')

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, featured_image_url, category, author, published_at')
    .order('published_at', { ascending: false })

  const { count: pendingCommentsCount } = await supabase
    .from('blog_comments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  const newPostButton = (
    <Button asChild variant="brand">
      <Link href="/blog/new">+ New Post</Link>
    </Button>
  )

  const postsPanel = (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <p className="text-gray-500">Write, edit, and publish articles for the Alusea blog.</p>
        {newPostButton}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Published</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {posts?.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 align-top w-32">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                      <Image src={post.featured_image_url} alt={post.title} fill className="object-cover" sizes="96px" />
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#A67C52] uppercase mb-1 tracking-wider">{post.category}</span>
                      <span className="font-bold text-gray-900 mb-1">{post.title}</span>
                      <span className="text-xs text-gray-500">by {post.author} — /blog/{post.slug}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top text-xs text-gray-500">
                    {post.published_at ? new Date(post.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild variant="outline" size="sm">
                        <a href={`${MARKETING_URL}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">View</a>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/blog/${post.id}/edit`}>Edit</Link>
                      </Button>
                      <DeleteButton id={post.id} itemLabel="blog post" name={post.title} deleteAction={deleteBlogPost} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!posts || posts.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No blog posts yet.
                    <div className="mt-4">{newPostButton}</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto w-full relative">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-matte-black">Blog</h1>
        <p className="text-gray-500 mt-2">Articles on the website, and the comments visitors leave on them.</p>
      </div>

      <PageTabs
        tabs={[
          { key: 'posts', label: 'Posts', content: postsPanel },
          { key: 'comments', label: 'Comments', badge: pendingCommentsCount ?? 0, content: <CommentsPanel /> },
        ]}
      />
    </div>
  )
}
