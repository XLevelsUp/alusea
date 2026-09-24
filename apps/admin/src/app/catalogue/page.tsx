import { createClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth/session'
import { deleteProduct } from '../actions'
import Image from 'next/image'
import AddProductForm from './AddProductForm'
import DeleteButton from '@/components/DeleteButton'
import { FormDialog } from '@/components/FormDialog'
import { Button } from '@/components/ui/button'
import type { ProductRow } from '@/lib/supabase/types'

export default async function AdminCataloguePage() {
  const supabase = await createClient()
  await requireRole('owner', 'sales')

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .order('sort_order', { ascending: true })

  const categoryNames = categories?.map(c => c.name) || []

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Catalogue Management</h1>
          <p className="text-gray-500 mt-2">Add, remove, and manage your products.</p>
        </div>
        <div>
          <FormDialog title="Add New Product" trigger={<Button type="button" variant="brand">+ Add New Product</Button>}>
            <AddProductForm categories={categoryNames} />
          </FormDialog>
        </div>
      </div>

      {/* PRODUCT LIST - FULL WIDTH */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {products?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4 align-top w-32">
                    <div className="relative w-24 h-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200">
                      {item.image_url.startsWith('/') || item.image_url.startsWith('http') ? (
                        <Image src={item.image_url} alt={item.name} fill className="object-cover" sizes="96px" />
                      ) : null}
                    </div>
                  </td>
                  <td className="p-4 align-top">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#A67C52] uppercase mb-1 tracking-wider">{item.category}</span>
                      <span className="font-bold text-gray-900 mb-1">{item.name}</span>
                      <span className="text-xs text-gray-500 line-clamp-2 max-w-md">{item.description}</span>
                    </div>
                  </td>
                  <td className="p-4 align-top text-right">
                    <div className="flex items-center justify-end gap-2">
                      <FormDialog title="Edit Product Details" trigger={<Button type="button" variant="outline" size="sm" className="border-blue-200 text-blue-500 hover:bg-blue-50 hover:text-blue-700">Edit</Button>}>
                        <AddProductForm initialData={item as ProductRow} categories={categoryNames} />
                      </FormDialog>
                      <DeleteButton id={item.id} itemLabel="product" name={item.name} deleteAction={deleteProduct} />
                    </div>
                  </td>
                </tr>
              ))}
              {(!products || products.length === 0) && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-gray-500">
                    No products found in the database.
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
