'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    redirect('/admin/login?error=Could not authenticate user')
  }

  revalidatePath('/', 'layout')
  redirect('/admin/catalogue')
}

export async function addProduct(formData: FormData) {
  const supabase = await createClient()

  // Get user session to verify authorization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const imageFile = formData.get('image_file') as File | null
  const description = formData.get('description') as string
  const specsRaw = formData.get('specs') as string
  
  let specs: Record<string, string> = {}
  if (specsRaw) {
    try {
      // Allow valid JSON if the admin happens to still paste valid JSON
      if (specsRaw.trim().startsWith('{')) {
         specs = JSON.parse(specsRaw)
      } else {
         throw new Error("Parse as plain text");
      }
    } catch (e) {
      // Parse as plain text (Key: Value line by line)
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

  let finalImageUrl = "";
  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop() || 'webp'
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('alusea-assets')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error(uploadError)
      throw new Error('Image upload failed')
    }

    const { data: publicUrlData } = supabase.storage
      .from('alusea-assets')
      .getPublicUrl(fileName)
      
    finalImageUrl = publicUrlData.publicUrl
  } else {
    throw new Error('Please provide an image file')
  }

  const { error } = await supabase
    .from('products')
    .insert([{ name, category, image_url: finalImageUrl, description, specs }])

  if (error) {
    console.error(error)
    throw new Error('Could not add product')
  }

  revalidatePath('/catalogue')
  revalidatePath('/admin/catalogue')
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error('Could not delete product')
  }

  revalidatePath('/catalogue')
  revalidatePath('/admin/catalogue')
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect('/admin/login');
}
