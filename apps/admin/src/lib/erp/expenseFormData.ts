// Reference data the expense form needs: categories to file under, vendors who were paid, and clients whose job the spend was for.

import { createClient } from '@/lib/supabase/server'

export async function loadExpenseFormData() {
  const supabase = await createClient()

  const [{ data: categories }, { data: vendors }, { data: clients }] = await Promise.all([
    supabase.from('expense_categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('parties').select('id, name').eq('is_vendor', true).eq('is_active', true).order('name'),
    supabase.from('parties').select('id, name').eq('is_client', true).eq('is_active', true).order('name'),
  ])

  return {
    categories: categories ?? [],
    // Staff cannot read parties, so the vendor and client lists are simply empty for them rather than an error.
    vendors: vendors ?? [],
    clients: clients ?? [],
  }
}
