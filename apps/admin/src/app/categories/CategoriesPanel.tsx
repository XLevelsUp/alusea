import { createClient } from '@/lib/supabase/server'
import { deleteCategory } from '../actions'
import CategoryForm from './CategoryForm'
import DeleteButton from '@/components/DeleteButton'
import { FormDialog } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'

// The Categories tab of the Catalogue page. The page that renders it has already checked the role.
export default async function CategoriesPanel() {
  const supabase = await createClient()

  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order', { ascending: true }),
    supabase.from('products').select('category'),
  ])

  const usageCounts: Record<string, number> = {}
  products?.forEach((p) => {
    usageCounts[p.category] = (usageCounts[p.category] || 0) + 1
  })

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <p className="text-gray-500">Add, rename, and manage your product categories.</p>
        <FormDialog title="Add New Category" size="md" trigger={<Button type="button" variant="brand">+ Add New Category</Button>}>
          <CategoryForm />
        </FormDialog>
      </div>

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
                      <FormDialog title="Edit Category" size="md" trigger={<Button type="button" variant="outline" size="sm">Edit</Button>}>
                        <CategoryForm initialData={item} />
                      </FormDialog>
                      <DeleteButton id={item.id} itemLabel="category" name={item.name} deleteAction={deleteCategory} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!categories || categories.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No categories yet.
                    <div className="mt-4">
                      <FormDialog title="Add New Category" size="md" trigger={<Button type="button" variant="brand">+ Add New Category</Button>}>
                        <CategoryForm />
                      </FormDialog>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
