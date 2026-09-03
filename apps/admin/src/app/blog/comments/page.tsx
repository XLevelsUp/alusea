import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import CommentModerationRow from './CommentModerationRow'

export default async function AdminBlogCommentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: comments } = await supabase
    .from('blog_comments')
    .select('id, name, email, message, status, created_at, blog_posts(slug, title)')
    .order('created_at', { ascending: false })

  const pending = comments?.filter((c) => c.status === 'pending') || [];
  const others = comments?.filter((c) => c.status !== 'pending') || [];

  return (
    <div className="p-8 max-w-6xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Comment Moderation</h1>
          <p className="text-gray-500 mt-2">Approve or reject visitor comments before they appear on the blog.</p>
        </div>
        <Link href="/blog" className="text-sm text-gray-500 hover:text-matte-black transition-colors">
          ← Back to Blog List
        </Link>
      </div>

      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-3">
            Pending Approval ({pending.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commenter</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {pending.map((comment: any) => (
                    <CommentModerationRow key={comment.id} comment={comment} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">
          All Other Comments
        </h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Commenter</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {others.map((comment: any) => (
                  <CommentModerationRow key={comment.id} comment={comment} />
                ))}
                {others.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No comments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
