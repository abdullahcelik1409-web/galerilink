'use server'

import { createAdminClient } from "@/lib/supabase/admin"
import { getAuthUser } from "@/lib/supabase/auth-cache"
import { revalidateTag } from "next/cache"

// 🛡️ Admin Check
async function checkAdminAuth() {
  const { user } = await getAuthUser()
  const adminEmailsVar = process.env.ADMIN_EMAILS || 'abdullah.celik1409@gmail.com'
  const authorizedEmails = adminEmailsVar.split(',').map(e => e.trim().toLowerCase())
  
  if (!user || !authorizedEmails.includes(user.email?.toLowerCase() || "")) {
    throw new Error("Unauthorized access to Taxonomy API")
  }
  return user
}

function toSlug(text: string) {
  return text.toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function getNodes(level: string, parentId: string | null = null) {
  await checkAdminAuth()
  const adminClient = createAdminClient()

  let query = adminClient
    .from('car_taxonomy')
    .select('*')
    .eq('level', level)

  if (parentId === null) {
    query = query.is('parent_id', null)
  } else {
    query = query.eq('parent_id', parentId)
  }

  const { data, error } = await query.order('name', { ascending: level !== 'yil' })

  if (error) throw error
  return data
}

export async function addNode(name: string, level: string, parentId: string | null) {
  await checkAdminAuth()
  const adminClient = createAdminClient()

  const slug = toSlug(`${name}-${level}-${parentId ? parentId.substring(0, 4) : 'root'}`)

  const { data, error } = await adminClient
    .from('car_taxonomy')
    .insert({
      name,
      level,
      parent_id: parentId,
      slug,
      status: 'approved' // Admin added nodes are automatically approved
    })
    .select()
    .single()

  if (error) throw error

  revalidateTag('taxonomy', 'default')
  return data
}

export async function updateNode(id: string, name: string) {
  await checkAdminAuth()
  const adminClient = createAdminClient()

  const { data, error } = await adminClient
    .from('car_taxonomy')
    .update({ name })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  revalidateTag('taxonomy', 'default')
  return data
}

export async function deleteNode(id: string) {
  await checkAdminAuth()
  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('car_taxonomy')
    .delete()
    .eq('id', id)

  if (error) throw error

  revalidateTag('taxonomy', 'default')
  return { success: true }
}
