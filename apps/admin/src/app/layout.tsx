import type { Metadata } from "next";
import { ReactNode } from "react";
import { getProfile } from "@/lib/auth/session";
import AdminNav from "@/components/AdminNav";
import { ConfirmProvider } from "@/components/ConfirmProvider";
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
  const profile = await getProfile();

  return (
    <html lang="en">
      <body className="antialiased">
        <ConfirmProvider>
          <div className="min-h-screen bg-gray-50 md:flex">
            {profile && (
              <AdminNav
                role={profile.role}
                email={profile.email}
                fullName={profile.full_name}
                signOut={signOut}
              />
            )}
            <main className="flex-1 min-w-0 overflow-x-hidden">{children}</main>
          </div>
        </ConfirmProvider>
      </body>
    </html>
  );
}
