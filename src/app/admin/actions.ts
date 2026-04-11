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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const imageFiles = formData.getAll('image_files') as File[]
  const description = formData.get('description') as string
  const specsRaw = formData.get('specs') as string
  
  let specs: Record<string, string> = {}
  if (specsRaw) {
    try {
      if (specsRaw.trim().startsWith('{')) {
         specs = JSON.parse(specsRaw)
      } else {
         throw new Error("Parse as plain text");
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
  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'webp'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('alusea-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error(uploadError)
        throw new Error('Image upload failed')
      }

      const { data: publicUrlData } = supabase.storage
        .from('alusea-assets')
        .getPublicUrl(fileName)
        
      uploadedUrls.push(publicUrlData.publicUrl)
    }
  }

  if (uploadedUrls.length === 0) {
    throw new Error('Please provide at least one image file')
  }

  const finalImageUrl = uploadedUrls[0];

  const { error } = await supabase
    .from('products')
    .insert([{ name, category, image_url: finalImageUrl, image_urls: uploadedUrls, description, specs }])

  if (error) {
    console.error(error)
    throw new Error('Could not add product: ' + error.message)
  }

  revalidatePath('/catalogue')
  revalidatePath('/admin/catalogue')
}

export async function updateProduct(formData: FormData) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const id = formData.get('id') as string
  const name = formData.get('name') as string
  const category = formData.get('category') as string
  const description = formData.get('description') as string
  const specsRaw = formData.get('specs') as string
  const existingUrlsRaw = formData.get('existing_urls') as string
  const imageFiles = formData.getAll('image_files') as File[]
  
  let specs: Record<string, string> = {}
  if (specsRaw) {
    try {
      if (specsRaw.trim().startsWith('{')) {
         specs = JSON.parse(specsRaw)
      } else {
         throw new Error("Parse as plain text");
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

  for (const file of imageFiles) {
    if (file && file.size > 0) {
      const fileExt = file.name.split('.').pop() || 'webp'
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('alusea-assets')
        .upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        console.error(uploadError)
        throw new Error('Image upload failed')
      }

      const { data: publicUrlData } = supabase.storage
        .from('alusea-assets')
        .getPublicUrl(fileName)
        
      finalUrls.push(publicUrlData.publicUrl)
    }
  }

  if (finalUrls.length === 0) {
    throw new Error('Please provide at least one image file')
  }

  const mainImageUrl = finalUrls[0];

  const { error } = await supabase
    .from('products')
    .update({ name, category, image_url: mainImageUrl, image_urls: finalUrls, description, specs })
    .eq('id', id)

  if (error) {
    console.error(error)
    throw new Error('Could not update product: ' + error.message)
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
