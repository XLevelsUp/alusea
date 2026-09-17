'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLES, type Role } from '@/lib/auth/roles'

function parseRole(value: FormDataEntryValue | null): Role {
  const role = String(value ?? '')
  if (!ROLES.includes(role as Role)) {
    throw new Error('Unknown role')
  }
  return role as Role
}

export async function inviteUser(formData: FormData) {
  await assertRole('owner')

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const role = parseRole(formData.get('role'))

  if (!email) throw new Error('Email is required')
  if (password.length < 8) throw new Error('Password must be at least 8 characters')

  const admin = createAdminClient()

  // The profile row is created by the on_auth_user_created trigger, which reads role and full_name from this metadata.
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  })

  if (error) {
    throw new Error('Could not create user: ' + error.message)
  }

  revalidatePath('/settings/users')
}

export async function updateUserRole(formData: FormData) {
  const actor = await assertRole('owner')

  const userId = String(formData.get('user_id') ?? '')
  const role = parseRole(formData.get('role'))

  if (!userId) throw new Error('User is required')

  // An owner demoting themselves could leave nobody able to manage users.
  if (userId === actor.id && role !== 'owner') {
    throw new Error('You cannot change your own role. Ask another owner to do it.')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)

  if (error) {
    throw new Error('Could not update role: ' + error.message)
  }

  revalidatePath('/settings/users')
}

export async function setUserActive(formData: FormData) {
  const actor = await assertRole('owner')

  const userId = String(formData.get('user_id') ?? '')
  const isActive = String(formData.get('is_active') ?? '') === 'true'

  if (!userId) throw new Error('User is required')

  if (userId === actor.id && !isActive) {
    throw new Error('You cannot deactivate your own account.')
  }

  const admin = createAdminClient()

  // Deactivating the last active owner would leave the panel unmanageable.
  if (!isActive) {
    const { data: target } = await admin.from('profiles').select('role').eq('id', userId).single()

    if (target?.role === 'owner') {
      const { count } = await admin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'owner')
        .eq('is_active', true)

      if ((count ?? 0) <= 1) {
        throw new Error('This is the last active owner. Promote someone else first.')
      }
    }
  }

  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId)

  if (error) {
    throw new Error('Could not update user: ' + error.message)
  }

  revalidatePath('/settings/users')
}
