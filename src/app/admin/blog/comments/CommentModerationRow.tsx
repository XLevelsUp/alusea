'use client';

import { useTransition } from 'react';
import { approveComment, rejectComment, deleteComment } from './actions';

type Comment = {
  id: string;
  name: string;
  email: string;
  message: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  blog_posts: { slug: string; title: string } | null;
};

export default function CommentModerationRow({ comment }: { comment: Comment }) {
  const [isPending, startTransition] = useTransition();
  const postSlug = comment.blog_posts?.slug || '';

  const handle = (action: (id: string, slug: string) => Promise<void>, confirmMsg?: string) => {
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    startTransition(async () => {
      try {
        await action(comment.id, postSlug);
      } catch {
        alert('Something went wrong.');
      }
    });
  };

  return (
    <tr className="hover:bg-gray-50/50 transition-colors">
      <td className="p-4 align-top">
        <div className="flex flex-col">
          <span className="font-bold text-gray-900">{comment.name}</span>
          <span className="text-xs text-gray-500">{comment.email}</span>
        </div>
      </td>
      <td className="p-4 align-top max-w-md">
        <p className="text-sm text-gray-700">{comment.message}</p>
        {comment.blog_posts && (
          <p className="text-xs text-gray-400 mt-1">on “{comment.blog_posts.title}”</p>
        )}
      </td>
      <td className="p-4 align-top text-xs text-gray-500">
        {new Date(comment.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </td>
      <td className="p-4 align-top">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded ${
            comment.status === 'approved'
              ? 'bg-green-100 text-green-700'
              : comment.status === 'rejected'
              ? 'bg-red-100 text-red-700'
              : 'bg-amber-100 text-amber-700'
          }`}
        >
          {comment.status}
        </span>
      </td>
      <td className="p-4 align-top text-right">
        <div className="flex items-center justify-end gap-2 flex-wrap">
          {comment.status !== 'approved' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handle(approveComment)}
              className="text-green-600 hover:text-green-800 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-green-200 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
            >
              Approve
            </button>
          )}
          {comment.status !== 'rejected' && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => handle(rejectComment)}
              className="text-amber-600 hover:text-amber-800 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-amber-200 hover:bg-amber-50 rounded transition-colors disabled:opacity-50"
            >
              Reject
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => handle(deleteComment, 'Permanently delete this comment?')}
            className="text-red-500 hover:text-red-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-red-200 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
