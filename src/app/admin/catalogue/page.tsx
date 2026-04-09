import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { addProduct, deleteProduct } from '../actions'
import Image from 'next/image'

export default async function AdminCataloguePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-7xl mx-auto w-full">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Catalogue Management</h1>
          <p className="text-gray-500 mt-2">Add, remove, and manage your products.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ADD NEW PRODUCT FORM */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
            <h2 className="text-lg font-bold uppercase tracking-wider mb-6 border-b pb-3 text-matte-black">Add New Item</h2>
            <form action={addProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Product Name</label>
                <input required name="name" type="text" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900" placeholder="e.g. MasterLine Door" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Category</label>
                <select required name="category" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900">
                  <option value="Doors">Doors</option>
                  <option value="Windows">Windows</option>
                  <option value="Windows & Sliding">Windows & Sliding</option>
                  <option value="Specialty">Specialty</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Product Image</label>
                <input required name="image_file" type="file" accept="image/*" className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#A67C52] file:text-white hover:file:bg-[#8e6944] cursor-pointer" />
                <p className="text-[10px] text-gray-400 mt-1">Select an image from your device.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                <textarea required name="description" rows={3} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900" placeholder="Short product description..." />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Specifications (One per line)</label>
                <textarea name="specs" rows={4} className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-sm text-gray-900"
                  placeholder="Material: Premium Aluminum&#10;Glazing: Double Toughened&#10;Security: Multi-point lock" />
                {/* <p className="text-[10px] text-gray-400 mt-1">Format: "Key: Value" or just plain text sentences on each line.</p> */}
              </div>

              <button type="submit" className="w-full bg-[#A67C52] hover:bg-[#8e6944] text-white py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors mt-4 shadow-md">
                Add Product
              </button>
            </form>
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
                        <form action={async () => {
                          'use server'
                          await deleteProduct(item.id)
                        }}>
                          <button type="submit" className="text-red-500 hover:text-red-700 text-xs font-semibold uppercase tracking-wider px-3 py-1 border border-red-200 hover:bg-red-50 rounded transition-colors">
                            Delete
                          </button>
                        </form>
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
