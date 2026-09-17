"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navFor, ROLE_LABELS, type Role } from "@/lib/auth/roles";

type Props = {
  role: Role;
  email: string;
  fullName: string;
  signOut: () => Promise<void>;
};

function isActive(pathname: string, href: string): boolean {
  // Exact match only for /blog, so the Blog link does not stay lit while Comments is open.
  if (href === "/blog") return pathname === "/blog" || /^\/blog\/(new|[^/]+\/edit)$/.test(pathname);
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminNav({ role, email, fullName, signOut }: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = navFor(role);

  const navBody = (
    <nav className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="px-4 mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            {group.label}
          </p>
          <div className="space-y-1">
            {group.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(pathname, item.href) ? "page" : undefined}
                className={`block px-4 py-2.5 rounded-md text-sm font-medium tracking-wide transition-colors ${
                  isActive(pathname, item.href)
                    ? "bg-[#A67C52] text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  const userBlock = (
    <div className="border-t border-white/10 pt-4">
      <p className="text-sm text-white truncate">{fullName || email}</p>
      <p className="text-xs text-white/50 truncate mb-1">{email}</p>
      <p className="text-[10px] uppercase tracking-widest text-[#A67C52] mb-3">{ROLE_LABELS[role]}</p>
      <form action={signOut}>
        <button className="text-sm text-white/70 hover:text-white transition-colors cursor-pointer" type="submit">
          Sign Out
        </button>
      </form>
    </div>
  );

  return (
    <>
      <aside className="w-64 bg-matte-black text-white p-6 hidden md:flex md:flex-col md:justify-between shrink-0">
        <div>
          <h2 className="text-xl font-bold tracking-widest uppercase mb-8 mt-2">Alusea ERP</h2>
          {navBody}
        </div>
        {userBlock}
      </aside>

      <div className="md:hidden bg-matte-black text-white px-4 py-3 flex justify-between items-center sticky top-0 z-40">
        <span className="font-bold uppercase tracking-widest text-sm">Alusea ERP</span>
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label="Toggle navigation"
          className="p-2 -mr-2 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={mobileOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-matte-black text-white px-6 pb-6 pt-2 space-y-6 sticky top-[52px] z-40">
          {navBody}
          {userBlock}
        </div>
      )}
    </>
  );
}
