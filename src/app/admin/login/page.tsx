import { login } from '../actions'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/admin/catalogue')
  }
  
  const search = await searchParams

  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-50 flex-col">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-100 p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-matte-black">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-2">Sign in to Alusea ERP</p>
        </div>

        <form className="animate-in flex-1 flex flex-col w-full" action={login}>
          <label className="text-sm font-medium mb-1 text-gray-700" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 mb-6 w-full text-black shadow-sm"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
          <label className="text-sm font-medium mb-1 text-gray-700" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 mb-6 w-full text-black shadow-sm"
            name="password"
            placeholder="••••••••"
            required
            type="password"
          />
          
          <button className="bg-matte-black hover:bg-black text-white px-4 py-3 rounded-md uppercase tracking-widest text-sm font-bold transition-all w-full shadow-md">
            Sign In
          </button>
          
          {search?.error && (
            <p className="mt-4 p-4 bg-red-50 text-red-600 text-center text-sm rounded-md border border-red-100">
              {search.error}
            </p>
          )}
        </form>
      </div>
      <p className="text-xs text-gray-400 mt-8 text-center max-w-sm">
        This area is restricted to authorized Alusea personnel only.
      </p>
    </div>
  )
}
