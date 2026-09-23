'use server'

import { ActionError, defineAction } from '@/lib/actions'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { syncProductToCatalog, removeProductFromCatalog } from '@/lib/metaCatalog'
import { assertRole } from '@/lib/auth/session'
import { landingPageFor } from '@/lib/auth/roles'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { data: session, error } = await supabase.auth.signInWithPassword(data)

  if (error || !session.user) {
    redirect('/login?error=Could not authenticate user')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', session.user.id)
    .single()

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut()
    redirect('/login?error=This account is not active. Ask an owner to enable it.')
  }

  revalidatePath('/', 'layout')
  redirect(landingPageFor(profile.role))
}

export const addProduct = defineAction(async function addProduct(formData: FormData) {
  const supabase = await createClient()

  await assertRole('owner', 'sales')

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const newUploadedUrlsRaw = formData.get('new_uploaded_urls') as string
  const description = formData.get('description') as string
  const specsRaw = formData.get('specs') as string
  const pricePerSqftRaw = formData.get('price_per_sqft') as string
  const pricePerSqft = pricePerSqftRaw ? parseFloat(pricePerSqftRaw) : 1500

  let specs: Record<string, string> = {}
  if (specsRaw) {
    try {
      if (specsRaw.trim().startsWith('{')) {
         specs = JSON.parse(specsRaw)
      } else {
         throw new ActionError("Parse as plain text");
      }
    } catch (e) {
      const lines = specsRaw.split('\n')
      lines.forEach(line => {
        const parts = line.split(':')
        if (parts.length > 1) {
          const key = parts[0].trim()
          const val = parts.slice(1).join(':').trim()
          if (key) specs[key] = val
        } else if (line.trim()) {
          specs[line.trim()] = ""
        }
      })
    }
  }

  let uploadedUrls: string[] = [];
  if (newUploadedUrlsRaw) {
    try {
      uploadedUrls = JSON.parse(newUploadedUrlsRaw);
    } catch(e) {}
  }

  if (uploadedUrls.length === 0) {
    throw new ActionError('Please provide at least one image file')
  }

  const finalImageUrl = uploadedUrls[0];

  const { data: inserted, error } = await supabase
    .from('products')
    .insert([{ name, category, image_url: finalImageUrl, image_urls: uploadedUrls, description, specs, price_per_sqft: pricePerSqft }])
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new ActionError('Could not add product: ' + error.message)
  }

  await syncProductToCatalog(inserted)

  revalidatePath('/catalogue')
  revalidatePath('/catalogue')
})

export const updateProduct = defineAction(async function updateProduct(formData: FormData) {
  const supabase = await createClient()

  await assertRole('owner', 'sales')

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const specsRaw = formData.get('specs') as string
  const existingUrlsRaw = formData.get('existing_urls') as string
  const newUploadedUrlsRaw = formData.get('new_uploaded_urls') as string
  const pricePerSqftRaw = formData.get('price_per_sqft') as string
  const pricePerSqft = pricePerSqftRaw ? parseFloat(pricePerSqftRaw) : 1500

  let specs: Record<string, string> = {}
  if (specsRaw) {
    try {
      if (specsRaw.trim().startsWith('{')) {
         specs = JSON.parse(specsRaw)
      } else {
         throw new ActionError("Parse as plain text");
      }
    } catch (e) {
      const lines = specsRaw.split('\n')
      lines.forEach(line => {
        const parts = line.split(':')
        if (parts.length > 1) {
          const key = parts[0].trim()
          const val = parts.slice(1).join(':').trim()
          if (key) specs[key] = val
        } else if (line.trim()) {
          specs[line.trim()] = ""
        }
      })
    }
  }

  let finalUrls: string[] = []
  if (existingUrlsRaw) {
    try {
      finalUrls = JSON.parse(existingUrlsRaw)
    } catch(e) {}
  }

  if (newUploadedUrlsRaw) {
    try {
      const newUrls = JSON.parse(newUploadedUrlsRaw)
      finalUrls = [...finalUrls, ...newUrls]
    } catch(e) {}
  }

  if (finalUrls.length === 0) {
    throw new ActionError('Please provide at least one image file')
  }

  const mainImageUrl = finalUrls[0];

  const { data: updated, error } = await supabase
    .from('products')
    .update({ name, category, image_url: mainImageUrl, image_urls: finalUrls, description, specs, price_per_sqft: pricePerSqft })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error(error)
    throw new ActionError('Could not update product: ' + error.message)
  }

  await syncProductToCatalog(updated)

  revalidatePath('/catalogue')
  revalidatePath('/catalogue')
})

export const deleteProduct = defineAction(async function deleteProduct(id: string) {
  const supabase = await createClient()

  await assertRole('owner', 'sales')

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    throw new ActionError('Could not delete product')
  }

  await removeProductFromCatalog(id)

  revalidatePath('/catalogue')
  revalidatePath('/catalogue')
})

export const addCategory = defineAction(async function addCategory(formData: FormData) {
  const supabase = await createClient()

  await assertRole('owner', 'sales')

  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    throw new ActionError('Category name is required')
  }

  const { error } = await supabase
    .from('categories')
    .insert([{ name }])

  if (error) {
    console.error(error)
    throw new ActionError('Could not add category: ' + error.message)
  }

  revalidatePath('/')
  revalidatePath('/catalogue')
  revalidatePath('/catalogue')
  revalidatePath('/categories')
})

export const updateCategory = defineAction(async function updateCategory(formData: FormData) {
  const supabase = await createClient()

  await assertRole('owner', 'sales')

  const id = formData.get('id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!name) {
    throw new ActionError('Category name is required')
  }

  const { data: existing, error: fetchError } = await supabase
    .from('categories')
    .select('name')
    .eq('id', id)
    .single()

  if (fetchError || !existing) {
    throw new ActionError('Could not find category')
  }

  const { error } = await supabase
    .from('categories')
    .update({ name })
    .eq('id', id)

  if (error) {
    console.error(error)
    throw new ActionError('Could not update category: ' + error.message)
  }

  if (existing.name !== name) {
    const { error: productsError } = await supabase
      .from('products')
      .update({ category: name })
      .eq('category', existing.name)

    if (productsError) {
      console.error(productsError)
      throw new ActionError('Category renamed, but failed to update existing products: ' + productsError.message)
    }
  }

  revalidatePath('/')
  revalidatePath('/catalogue')
  revalidatePath('/catalogue')
  revalidatePath('/categories')
})

export const deleteCategory = defineAction(async function deleteCategory(id: string) {
  const supabase = await createClient()

  await assertRole('owner', 'sales')

  const { data: category, error: fetchError } = await supabase
    .from('categories')
    .select('name')
    .eq('id', id)
    .single()

  if (fetchError || !category) {
    throw new ActionError('Could not find category')
  }

  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category', category.name)

  if (countError) {
    throw new ActionError('Could not verify category usage')
  }

  if (count && count > 0) {
    throw new ActionError(`Cannot delete "${category.name}" — ${count} product(s) still use this category.`)
  }

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (error) {
    throw new ActionError('Could not delete category')
  }

  revalidatePath('/')
  revalidatePath('/catalogue')
  revalidatePath('/catalogue')
  revalidatePath('/categories')
})

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/login');
}
