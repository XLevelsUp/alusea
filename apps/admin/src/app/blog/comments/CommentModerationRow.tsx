'use client';

import { Button } from '@/components/ui/button';
import { useConfirm, type ConfirmOptions } from '@/components/ConfirmProvider';
import { useActionRunner } from '@/hooks/use-action';
import type { Action } from '@/lib/actions';
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
  const { run, isPending, error } = useActionRunner();
  const postSlug = comment.blog_posts?.slug || '';

  const confirm = useConfirm();

  const handle = async (action: Action<[string, string]>, question?: ConfirmOptions) => {
    if (question && !(await confirm(question))) return;
    run(action, comment.id, postSlug);
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => handle(approveComment)}
              className="border-green-200 text-green-600 hover:bg-green-50 hover:text-green-800"
            >
              Approve
            </Button>
          )}
          {comment.status !== 'rejected' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() =>
                handle(rejectComment, {
                  title: `Reject ${comment.name}'s comment?`,
                  description: 'It will be hidden from the blog post. You can approve it again later.',
                  confirmLabel: 'Reject',
                })
              }
              className="border-amber-200 text-amber-600 hover:bg-amber-50 hover:text-amber-800"
            >
              Reject
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={isPending}
            onClick={() =>
              handle(deleteComment, {
                title: `Delete ${comment.name}'s comment?`,
                description: 'It is removed permanently. This cannot be undone.',
                confirmLabel: 'Delete',
              })
            }
          >
            Delete
          </Button>
        </div>
        {error && <p role="alert" className="text-xs text-destructive mt-2">{error}</p>}
      </td>
    </tr>
  );
}
