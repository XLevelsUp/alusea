import { createClient } from '@/lib/supabase/server'
import CommentModerationRow from './CommentModerationRow'

const TH = 'p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider'

function CommentTableHead() {
  return (
    <thead>
      <tr className="bg-gray-50 border-b border-gray-100">
        <th className={TH}>Commenter</th>
        <th className={TH}>Message</th>
        <th className={TH}>Date</th>
        <th className={TH}>Status</th>
        <th className={`${TH} text-right`}>Actions</th>
      </tr>
    </thead>
  )
}

// The Comments tab of the Blog page. The page that renders it has already checked the role.
export default async function CommentsPanel() {
  const supabase = await createClient()

  const { data: comments } = await supabase
    .from('blog_comments')
    .select('id, name, email, message, status, created_at, blog_posts(slug, title)')
    .order('created_at', { ascending: false })

  const pending = comments?.filter((c) => c.status === 'pending') || []
  const others = comments?.filter((c) => c.status !== 'pending') || []

  return (
    <div>
      <p className="text-gray-500 mb-6">Approve or reject visitor comments before they appear on the blog.</p>

      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-sm font-bold uppercase tracking-wider text-amber-600 mb-3">
            Pending Approval ({pending.length})
          </h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <CommentTableHead />
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
              <CommentTableHead />
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
