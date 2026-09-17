// Reference data the expense form needs: categories to file under, and vendors to attribute the spend to.

import { createClient } from '@/lib/supabase/server'

export async function loadExpenseFormData() {
  const supabase = await createClient()

  const [{ data: categories }, { data: vendors }] = await Promise.all([
    supabase.from('expense_categories').select('id, name').eq('is_active', true).order('sort_order'),
    supabase.from('parties').select('id, name').eq('is_vendor', true).eq('is_active', true).order('name'),
  ])

  return {
    categories: categories ?? [],
    // Staff cannot read parties, so the vendor list is simply empty for them rather than an error.
    vendors: vendors ?? [],
  }
}
