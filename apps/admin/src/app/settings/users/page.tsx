import { requireRole } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, type Role } from "@/lib/auth/roles";
import { inviteUser, updateUserRole, setUserActive } from "./actions";
import UserRow from "./UserRow";
import AddUserForm from "./AddUserForm";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";

export default async function UsersPage() {
  const profile = await requireRole("owner");

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
        <FormDialog title="Add User" size="lg" trigger={<Button type="button" variant="brand">+ Add User</Button>}>
          <AddUserForm add={inviteUser} />
        </FormDialog>
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
    </div>
  );
}
