import type { Metadata } from "next";
import { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./actions";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alusea Admin",
  description: "Internal admin panel for managing Alusea's website content.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-gray-50 flex">
      {user && (
        <aside className="w-64 bg-matte-black text-white p-6 hidden md:block">
          <div className="mb-10 mt-4">
            <h2 className="text-xl font-bold tracking-widest uppercase">Alusea ERP</h2>
          </div>
          <nav className="space-y-4">
            <Link href="/catalogue" className="block px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer font-medium tracking-wide">
              Catalogue Items
            </Link>
            <Link href="/categories" className="block px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer font-medium tracking-wide">
              Categories
            </Link>
            <Link href="/media" className="block px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer font-medium tracking-wide">
              Page Media
            </Link>
            <Link href="/blog" className="block px-4 py-3 rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer font-medium tracking-wide">
              Blog
            </Link>
            {/* Add more admin routes here in the future */}
          </nav>
          
          <div className="absolute bottom-10 left-6 pr-6 w-full max-w-[200px]">
            <p className="text-xs text-gray-400 mb-2 truncate">{user.email}</p>
            <form action={signOut}>
               <button className="w-full text-left text-sm text-[#A67C52] hover:text-white transition-colors" type="submit">Sign Out</button>
            </form>
          </div>
        </aside>
      )}
      
      <main className="flex-1 overflow-x-hidden">
        {/* Mobile Header (optional simplifications) */}
        {user && (
          <div className="md:hidden bg-matte-black text-white p-4 flex justify-between items-center">
            <span className="font-bold uppercase tracking-widest">Alusea ERP</span>
            <form action={signOut}>
               <button className="text-xs text-[#A67C52] p-2" type="submit">Logout</button>
            </form>
          </div>
        )}
        
        {children}
          </main>
        </div>
      </body>
    </html>
  );
}
