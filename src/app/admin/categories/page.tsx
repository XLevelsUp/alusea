import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { deleteCategory } from '../actions'
import CategoryForm from './CategoryForm'
import DeleteCategoryButton from './DeleteCategoryButton'
import Link from 'next/link'

export default async function AdminCategoriesPage(props: { searchParams: Promise<{ edit?: string; add?: string }> | { edit?: string; add?: string } }) {
  const resolvedSearchParams = await props.searchParams;
  const editId = resolvedSearchParams?.edit;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('category')

  const usageCounts: Record<string, number> = {};
  products?.forEach((p) => {
    usageCounts[p.category] = (usageCounts[p.category] || 0) + 1;
  });

  const isAddOpen = resolvedSearchParams?.add === 'true';
  const isModalOpen = !!editId || isAddOpen;
  const editingCategory = editId ? categories?.find(c => c.id === editId) : null;

  return (
    <div className="p-8 max-w-4xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Category Management</h1>
          <p className="text-gray-500 mt-2">Add, rename, and manage your product categories.</p>
        </div>
        <div>
          <Link
            href="/admin/categories?add=true"
            className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
          >
            + Add New Category
          </Link>
        </div>
      </div>

      {/* CATEGORY LIST */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Products</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {categories?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 align-top">
                    <span className="font-bold text-gray-900">{item.name}</span>
                  </td>
                  <td className="p-4 align-top">
                    <span className="text-xs text-gray-500">{usageCounts[item.name] || 0} product(s)</span>
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/categories?edit=${item.id}`} className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-blue-200 hover:bg-blue-50 rounded transition-colors">
                        Edit
                      </Link>
                      <DeleteCategoryButton id={item.id} deleteAction={deleteCategory} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!categories || categories.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No categories found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OVERLAY FOR ADD / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-md w-full max-h-[90vh] flex flex-col relative animate-scaleIn">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white rounded-t-xl">
              <h2 className="text-lg font-bold uppercase tracking-wider text-matte-black">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <Link href="/admin/categories" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-matte-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <CategoryForm key={editId ?? 'new'} initialData={editingCategory || undefined} cancelUrl="/admin/categories" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
