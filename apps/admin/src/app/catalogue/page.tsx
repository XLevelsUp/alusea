import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { deleteProduct } from '../actions'
import Image from 'next/image'
import AddProductForm from './AddProductForm'
import DeleteProductButton from './DeleteProductButton'
import Link from 'next/link'

export default async function AdminCataloguePage(props: { searchParams: Promise<{ edit?: string; add?: string }> | { edit?: string; add?: string } }) {
  const resolvedSearchParams = await props.searchParams;
  const editId = resolvedSearchParams?.edit;

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('name')
    .order('sort_order', { ascending: true })

  const isAddOpen = resolvedSearchParams?.add === 'true';
  const isModalOpen = !!editId || isAddOpen;
  const editingProduct = editId ? products?.find(p => p.id === editId) : null;

  return (
    <div className="p-8 max-w-7xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Catalogue Management</h1>
          <p className="text-gray-500 mt-2">Add, remove, and manage your products.</p>
        </div>
        <div>
          <Link 
            href="/catalogue?add=true" 
            className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
          >
            + Add New Product
          </Link>
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
                      <Link href={`/catalogue?edit=${item.id}`} className="text-blue-500 hover:text-blue-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-blue-200 hover:bg-blue-50 rounded transition-colors">
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

      {/* MODAL OVERLAY FOR ADD / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-2xl w-full max-h-[90vh] flex flex-col relative animate-scaleIn">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white rounded-t-xl">
              <h2 className="text-lg font-bold uppercase tracking-wider text-matte-black">
                {editingProduct ? 'Edit Product Details' : 'Add New Product'}
              </h2>
              <Link href="/catalogue" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-matte-black">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <AddProductForm key={editId ?? 'new'} initialData={editingProduct || undefined} cancelUrl="/catalogue" categories={categories?.map(c => c.name) || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
