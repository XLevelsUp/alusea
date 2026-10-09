// Loads the reference data a quote or invoice form needs: clients to pick from, and the company state and GST rate that drive the tax.

import { createClient } from '@/lib/supabase/server'

export async function loadDocumentFormData() {
  const supabase = await createClient()

  const [{ data: parties }, { data: company }] = await Promise.all([
    supabase
      .from('parties')
      .select('id, name, billing_state_code, billing_state, gstin')
      .eq('is_client', true)
      .eq('is_active', true)
      .order('name'),
    supabase.from('company_profile').select('state_code, default_gst_rate').eq('id', 1).single(),
  ])

  return {
    parties: (parties ?? []).map((party) => ({
      id: party.id,
      name: party.name,
      stateCode: party.billing_state_code,
      stateName: party.billing_state,
      gstin: party.gstin,
    })),
    companyStateCode: company?.state_code ?? '',
    defaultGstRate: Number(company?.default_gst_rate ?? 18),
  }
}
