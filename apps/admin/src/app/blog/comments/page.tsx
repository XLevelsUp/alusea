import { redirect } from 'next/navigation'

// Comments are now a tab of the Blog page; old links and bookmarks land there.
export default function AdminBlogCommentsPage() {
  redirect('/blog?tab=comments')
}
