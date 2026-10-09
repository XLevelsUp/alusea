'use server'

import { revalidatePath } from 'next/cache'
import { ActionError, defineAction } from '@/lib/actions'
import { assertRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLES, type Role } from '@/lib/auth/roles'
import type { Profile } from '@/lib/auth/session'

function parseRole(value: FormDataEntryValue | null): Role {
  const role = String(value ?? '')
  if (!ROLES.includes(role as Role)) {
    throw new ActionError('Unknown role')
  }
  return role as Role
}

// Developer accounts exist only for developers: an owner asking about one is told it is not there, the same as the page shows them.
function guardDeveloperRole(actor: Profile, role: Role) {
  if (role === 'developer' && actor.role !== 'developer') {
    throw new ActionError('Only a developer can assign the developer role')
  }
}

async function guardDeveloperTarget(actor: Profile, userId: string) {
  if (actor.role === 'developer') return
  const { data: target } = await createAdminClient().from('profiles').select('role').eq('id', userId).single()
  if (!target || target.role === 'developer') throw new ActionError('User not found')
}

export const inviteUser = defineAction(async function inviteUser(formData: FormData) {
  const actor = await assertRole('owner')

  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const role = parseRole(formData.get('role'))

  guardDeveloperRole(actor, role)

  if (!email) throw new ActionError('Email is required')
  if (password.length < 8) throw new ActionError('Password must be at least 8 characters')

  const admin = createAdminClient()

  // The profile row is created by the on_auth_user_created trigger. It takes the role from app_metadata, which only the service key can set, and the name from user_metadata.
  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
    app_metadata: { role },
  })

  if (error || !created.user) {
    console.error('inviteUser failed', { email, role, error })
    throw new ActionError('Could not create user: ' + (error?.message ?? 'no user returned'))
  }

  // The trigger never grants developer, so that role is set here, after the guard above has confirmed a developer is asking.
  if (role === 'developer') {
    const { error: roleError } = await admin.from('profiles').update({ role }).eq('id', created.user.id)
    if (roleError) throw new ActionError('User created, but the developer role could not be set: ' + roleError.message)
  }

  revalidatePath('/settings/users')
})

export const updateUserRole = defineAction(async function updateUserRole(formData: FormData) {
  const actor = await assertRole('owner')

  const userId = String(formData.get('user_id') ?? '')
  const role = parseRole(formData.get('role'))

  if (!userId) throw new ActionError('User is required')
  guardDeveloperRole(actor, role)
  await guardDeveloperTarget(actor, userId)

  // An owner demoting themselves could leave nobody able to manage users.
  if (userId === actor.id && role !== actor.role) {
    throw new ActionError('You cannot change your own role. Ask another owner to do it.')
  }

  const admin = createAdminClient()
  const { error } = await admin.from('profiles').update({ role }).eq('id', userId)

  if (error) {
    throw new ActionError('Could not update role: ' + error.message)
  }

  revalidatePath('/settings/users')
})

export const setUserActive = defineAction(async function setUserActive(formData: FormData) {
  const actor = await assertRole('owner')

  const userId = String(formData.get('user_id') ?? '')
  const isActive = String(formData.get('is_active') ?? '') === 'true'

  if (!userId) throw new ActionError('User is required')

  await guardDeveloperTarget(actor, userId)

  if (userId === actor.id && !isActive) {
    throw new ActionError('You cannot deactivate your own account.')
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
        throw new ActionError('This is the last active owner. Promote someone else first.')
      }
    }
  }

  const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId)

  if (error) {
    throw new ActionError('Could not update user: ' + error.message)
  }

  revalidatePath('/settings/users')
})
