import { redirect } from 'next/navigation'

// Categories are now a tab of the Catalogue page; old links and bookmarks land there.
export default function AdminCategoriesPage() {
  redirect('/catalogue?tab=categories')
}
