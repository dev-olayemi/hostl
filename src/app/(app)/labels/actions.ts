'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import type { Label } from '@/types'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user.id
}

export async function getLabels(): Promise<Label[]> {
  const userId = await getUserId()
  const admin = getAdmin()
  const { data } = await admin
    .from('labels')
    .select('*')
    .eq('profile_id', userId)
    .order('name')
  return (data as Label[]) ?? []
}

export async function createLabel(name: string, color: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { data, error } = await admin
    .from('labels')
    .insert({ profile_id: userId, name: name.trim(), color })
    .select()
    .single()
  if (error) return { error: error.message }
  return { label: data as Label }
}

export async function updateLabel(id: string, name: string, color: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('labels')
    .update({ name: name.trim(), color })
    .eq('id', id)
    .eq('profile_id', userId)
  return error ? { error: error.message } : { success: true }
}

export async function deleteLabel(id: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('labels')
    .delete()
    .eq('id', id)
    .eq('profile_id', userId)
  return error ? { error: error.message } : { success: true }
}

export async function applyLabel(messageId: string, labelId: string) {
  const admin = getAdmin()
  const { error } = await admin
    .from('message_labels')
    .upsert({ message_id: messageId, label_id: labelId })
  return error ? { error: error.message } : { success: true }
}

export async function removeLabel(messageId: string, labelId: string) {
  const admin = getAdmin()
  const { error } = await admin
    .from('message_labels')
    .delete()
    .eq('message_id', messageId)
    .eq('label_id', labelId)
  return error ? { error: error.message } : { success: true }
}

export async function getMessagesByLabel(labelId: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { data } = await admin
    .from('message_labels')
    .select(`
      message:messages!message_labels_message_id_fkey(
        *,
        from_profile:profiles!messages_from_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type),
        to_profile:profiles!messages_to_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type)
      )
    `)
    .eq('label_id', labelId)
    .order('created_at', { referencedTable: 'messages', ascending: false })

  // Filter to only messages the user owns
  return (data ?? [])
    .map((row: Record<string, unknown>) => row.message)
    .filter((m: Record<string, unknown>) =>
      m?.to_profile_id === userId || m?.from_profile_id === userId
    )
}
