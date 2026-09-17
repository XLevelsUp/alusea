// Server-side access checks. Every ERP page and server action calls one of these.
// Hiding a nav link is not access control: server actions re-check independently, and RLS enforces it again at the database.

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Role } from './roles'

export type Profile = {
  id: string
  email: string
  full_name: string
  role: Role
  is_active: boolean
}

// Returns the signed-in user's profile, or null when signed out, inactive, or missing a profile row.
export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, role, is_active')
    .eq('id', user.id)
    .single()

  if (!data || !data.is_active) return null
  return data as Profile
}

// Use on any page that requires a signed-in, active user regardless of role.
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return profile
}

// Use on pages restricted to particular roles. Sends an authenticated but unauthorised user to /no-access rather than /login, so they are not asked to sign in again.
export async function requireRole(...allowed: Role[]): Promise<Profile> {
  const profile = await requireProfile()
  if (!allowed.includes(profile.role)) redirect('/no-access')
  return profile
}

// Server-action equivalent: throws instead of redirecting, since actions have no page to navigate to.
export async function assertRole(...allowed: Role[]): Promise<Profile> {
  const profile = await getProfile()
  if (!profile) throw new Error('Unauthorized')
  if (!allowed.includes(profile.role)) throw new Error('Forbidden')
  return profile
}
