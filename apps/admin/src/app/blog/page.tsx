import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deleteBlogPost } from './actions'
import Image from 'next/image'
import Link from 'next/link'
import DeleteBlogPostButton from './DeleteBlogPostButton'

const MARKETING_URL = process.env.NEXT_PUBLIC_MARKETING_URL || 'https://www.alusea.in'

export default async function AdminBlogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, slug, title, featured_image_url, category, author, published_at')
    .order('published_at', { ascending: false })

  const { count: pendingCommentsCount } = await supabase
    .from('blog_comments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Blog Management</h1>
          <p className="text-gray-500 mt-2">Write, edit, and publish articles for the Alusea blog.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/blog/comments"
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-gray-700 text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-gray-100 transition-colors"
          >
            Moderate Comments
          </Link>
          <Link
            href="/blog/new"
            className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
          >
            + New Post
          </Link>
        </div>
      </div>

      {/* POST LIST */}
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
                      <a href={`${MARKETING_URL}/blog/${post.slug}`} target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-gray-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-gray-200 hover:bg-gray-50 rounded transition-colors">
                        View
                      </a>
                      <Link href={`/blog/${post.id}/edit`} className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-blue-200 hover:bg-blue-50 rounded transition-colors">
                        Edit
                      </Link>
                      <DeleteBlogPostButton id={post.id} deleteAction={deleteBlogPost} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!posts || posts.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No blog posts yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!!pendingCommentsCount && pendingCommentsCount > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          You have {pendingCommentsCount} comment{pendingCommentsCount === 1 ? '' : 's'} awaiting moderation.{' '}
          <Link href="/blog/comments" className="text-[#A67C52] font-semibold hover:underline">
            Review them
          </Link>
        </p>
      )}
    </div>
  )
}
