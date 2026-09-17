// Loads the reference data a quote or invoice form needs: clients to pick from, catalogue products to price from, and the company state that drives the tax split.

import { createClient } from '@/lib/supabase/server'

export async function loadDocumentFormData() {
  const supabase = await createClient()

  const [{ data: parties }, { data: products }, { data: company }] = await Promise.all([
    supabase
      .from('parties')
      .select('id, name, billing_state_code, billing_state, gstin')
      .eq('is_client', true)
      .eq('is_active', true)
      .order('name'),
    supabase.from('products').select('id, name, price_per_sqft').order('name'),
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
    products: (products ?? []).map((product) => ({
      id: product.id,
      name: product.name,
      pricePerSqft: Number(product.price_per_sqft),
    })),
    companyStateCode: company?.state_code ?? '',
    defaultGstRate: Number(company?.default_gst_rate ?? 18),
  }
}
