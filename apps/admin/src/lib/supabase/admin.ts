// Service-role client: bypasses RLS entirely, so it is only ever used in server actions that have already checked the caller is an owner.
// Never import this into a Client Component — the key must not reach the browser.

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { type Database } from './types'

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. User management needs it; see apps/admin/.env.example.')
  }

  return createSupabaseClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
