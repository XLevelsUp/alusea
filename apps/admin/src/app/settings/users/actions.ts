'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { assertRole } from '@/lib/auth/session'
import { createAdminClient } from '@/lib/supabase/admin'
import { ROLES, type Role } from '@/lib/auth/roles'

// Actions return errors instead of throwing, because production Next.js hides thrown messages behind a generic crash page.
export type ActionResult = { error: string | null }

function parseRole(value: FormDataEntryValue | null): Role {
  const role = String(value ?? '')
  if (!ROLES.includes(role as Role)) {
    throw new Error('Unknown role')
  }
  return role as Role
}

function toResult(e: unknown): ActionResult {
  return { error: e instanceof Error ? e.message : 'Something went wrong' }
}

// Echoes the submitted fields back so the form can refill them, since React resets the form after every action.
export type InviteResult = ActionResult & {
  values?: { email: string; full_name: string; password: string; role: string }
}

export async function inviteUser(_prev: InviteResult, formData: FormData): Promise<InviteResult> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const fullName = String(formData.get('full_name') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const values = { email, full_name: fullName, password, role: String(formData.get('role') ?? '') }

  try {
    await assertRole('owner')

    const role = parseRole(formData.get('role'))

    if (!email) return { error: 'Email is required', values }
    if (password.length < 8) return { error: 'Password must be at least 8 characters', values }

    const admin = createAdminClient()

    // The profile row is created by the on_auth_user_created trigger, which reads role and full_name from this metadata.
    const { error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, role },
    })

    if (error) {
      console.error('inviteUser failed', { email, role, error })
      return { error: 'Could not create user: ' + error.message, values }
    }
  } catch (e) {
    console.error('inviteUser failed', e)
    return { ...toResult(e), values }
  }

  revalidatePath('/settings/users')
  // Outside the try block because redirect() works by throwing.
  redirect('/settings/users')
}

export async function updateUserRole(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await assertRole('owner')

    const userId = String(formData.get('user_id') ?? '')
    const role = parseRole(formData.get('role'))

    if (!userId) return { error: 'User is required' }

    // An owner demoting themselves could leave nobody able to manage users.
    if (userId === actor.id && role !== 'owner') {
      return { error: 'You cannot change your own role. Ask another owner to do it.' }
    }

    const admin = createAdminClient()
    const { error } = await admin.from('profiles').update({ role }).eq('id', userId)

    if (error) {
      console.error('updateUserRole failed', { userId, role, error })
      return { error: 'Could not update role: ' + error.message }
    }
  } catch (e) {
    console.error('updateUserRole failed', e)
    return toResult(e)
  }

  revalidatePath('/settings/users')
  return { error: null }
}

export async function setUserActive(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await assertRole('owner')

    const userId = String(formData.get('user_id') ?? '')
    const isActive = String(formData.get('is_active') ?? '') === 'true'

    if (!userId) return { error: 'User is required' }

    if (userId === actor.id && !isActive) {
      return { error: 'You cannot deactivate your own account.' }
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
          return { error: 'This is the last active owner. Promote someone else first.' }
        }
      }
    }

    const { error } = await admin.from('profiles').update({ is_active: isActive }).eq('id', userId)

    if (error) {
      console.error('setUserActive failed', { userId, isActive, error })
      return { error: 'Could not update user: ' + error.message }
    }
  } catch (e) {
    console.error('setUserActive failed', e)
    return toResult(e)
  }

  revalidatePath('/settings/users')
  return { error: null }
}
