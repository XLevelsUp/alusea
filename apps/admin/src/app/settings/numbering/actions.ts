'use server'

import { revalidatePath } from 'next/cache'
import { ActionError, defineAction } from '@/lib/actions'
import { assertRole } from '@/lib/auth/session'
import { createClient } from '@/lib/supabase/server'

// Switches whether cancelled invoice numbers are given to the next invoice issued.
export const setReuseCancelledNumbers = defineAction(async function setReuseCancelledNumbers(formData: FormData) {
  await assertRole('developer')

  const reuse = formData.get('reuse') === 'true'
  const supabase = await createClient()
  const { error } = await supabase.from('company_profile').update({ reuse_cancelled_invoice_numbers: reuse }).eq('id', 1)

  if (error) throw new ActionError('Could not save the setting: ' + error.message)

  revalidatePath('/settings/numbering')
})
