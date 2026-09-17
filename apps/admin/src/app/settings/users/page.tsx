import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/auth/roles";
import { inviteUser, updateUserRole, setUserActive } from "./actions";
import UserRow from "./UserRow";

export default async function UsersPage(props: {
  searchParams: Promise<{ add?: string }>;
}) {
  const profile = await requireRole("owner");
  const searchParams = await props.searchParams;
  const isAddOpen = searchParams?.add === "true";

  const admin = createAdminClient();
  const { data: users } = await admin
    .from("profiles")
    .select("id, email, full_name, role, is_active")
    .order("role", { ascending: true })
    .order("email", { ascending: true });

  return (
    <div className="p-8 max-w-5xl mx-auto w-full relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-tight text-matte-black">Users &amp; Roles</h1>
          <p className="text-gray-500 mt-2">Control who can sign in and what each person can reach.</p>
        </div>
        <Link
          href="/settings/users?add=true"
          className="inline-flex items-center justify-center px-5 py-3 bg-[#A67C52] text-white text-xs font-bold uppercase tracking-wider rounded-sm hover:bg-[#8e6944] transition-colors shadow-md"
        >
          + Add User
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-full mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">User</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {users?.map((user) => (
                <UserRow
                  key={user.id}
                  id={user.id}
                  email={user.email}
                  fullName={user.full_name}
                  role={user.role as Role}
                  isActive={user.is_active}
                  isSelf={user.id === profile.id}
                  updateRole={updateUserRole}
                  setActive={setUserActive}
                />
              ))}
              {(!users || users.length === 0) && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-gray-500">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-matte-black mb-4">What each role can do</h2>
        <dl className="space-y-3">
          {ROLES.map((role) => (
            <div key={role} className="flex flex-col sm:flex-row sm:gap-4">
              <dt className="text-xs font-bold uppercase tracking-wider text-[#A67C52] sm:w-28 shrink-0 mb-1 sm:mb-0">
                {ROLE_LABELS[role]}
              </dt>
              <dd className="text-sm text-gray-600">{ROLE_DESCRIPTIONS[role]}</dd>
            </div>
          ))}
        </dl>
      </div>

      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full max-h-[90vh] flex flex-col relative">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold uppercase tracking-wider text-matte-black">Add User</h2>
              <Link
                href="/settings/users"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-matte-black"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Link>
            </div>
            <form action={inviteUser} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="full_name">
                  Full name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
                  Temporary password
                </label>
                <input
                  id="password"
                  name="password"
                  type="text"
                  required
                  minLength={8}
                  className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
                />
                <p className="text-xs text-gray-400 mt-1">Share this with them directly, then ask them to change it after signing in.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="role">
                  Role
                </label>
                <select
                  id="role"
                  name="role"
                  defaultValue="staff"
                  className="rounded-md px-4 py-2 bg-gray-50 border border-gray-200 w-full text-black"
                >
                  {ROLES.map((role) => (
                    <option key={role} value={role}>
                      {ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-matte-black hover:bg-black text-white px-4 py-3 rounded-md uppercase tracking-widest text-xs font-bold transition-colors cursor-pointer"
                >
                  Create User
                </button>
                <Link
                  href="/settings/users"
                  className="px-5 py-3 border border-gray-200 text-gray-600 rounded-md uppercase tracking-widest text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
