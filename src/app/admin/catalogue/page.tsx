import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { deleteProduct } from '../actions'
import Image from 'next/image'
import AddProductForm from './AddProductForm'
import DeleteProductButton from './DeleteProductButton'
import Link from 'next/link'

export default async function AdminCataloguePage(props: { searchParams: Promise<{ edit?: string }> | { edit?: string } }) {
  const resolvedSearchParams = await props.searchParams;
  const editId = resolvedSearchParams?.edit;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const editingProduct = editId ? products?.find(p => p.id === editId) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Catalogue Management</h1>
          <p className="text-gray-500 mt-2">Add, remove, and manage your products.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD / EDIT PRODUCT FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
            <div className="flex justify-between items-center mb-6 border-b pb-3">
               <h2 className="text-lg font-bold uppercase tracking-wider text-matte-black">
                 {editingProduct ? 'Edit Item' : 'Add New Item'}
               </h2>
               {editingProduct && (
                 <Link href="/admin/catalogue" className="text-xs text-blue-500 hover:underline">Cancel Edit</Link>
               )}
            </div>
            <AddProductForm initialData={editingProduct} />
          </div>
        </div>

        {/* PRODUCT LIST */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                          <Link href={`/admin/catalogue?edit=${item.id}`} className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-blue-200 hover:bg-blue-50 rounded transition-colors">
                            Edit
                          </Link>
                          <DeleteProductButton id={item.id} deleteAction={deleteProduct} />
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

      </div>
    </div>
  )
}
