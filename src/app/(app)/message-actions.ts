'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

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

// ── Single message actions ────────────────────────────────────
// Note: we match on either to_profile_id OR from_profile_id so
// both sender and recipient can manage their copy of the message.

export async function archiveMessage(messageId: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ category: 'archived' })
    .eq('id', messageId)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function trashMessage(messageId: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ category: 'trash' })
    .eq('id', messageId)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function markRead(messageId: string, isRead: boolean) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ is_read: isRead })
    .eq('id', messageId)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function markImportant(messageId: string, isImportant: boolean) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ is_important: isImportant })
    .eq('id', messageId)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function snoozeMessage(messageId: string, until: string) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ snoozed_until: until })
    .eq('id', messageId)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function muteMessage(messageId: string, muted: boolean) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ muted })
    .eq('id', messageId)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

// ── Bulk actions ──────────────────────────────────────────────

export async function bulkMarkRead(messageIds: string[], isRead: boolean) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ is_read: isRead })
    .in('id', messageIds)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function bulkArchive(messageIds: string[]) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ category: 'archived' })
    .in('id', messageIds)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function bulkTrash(messageIds: string[]) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ category: 'trash' })
    .in('id', messageIds)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

export async function bulkMarkImportant(messageIds: string[], isImportant: boolean) {
  const userId = await getUserId()
  const admin = getAdmin()
  const { error } = await admin
    .from('messages')
    .update({ is_important: isImportant })
    .in('id', messageIds)
    .or(`to_profile_id.eq.${userId},from_profile_id.eq.${userId}`)
  return error ? { error: error.message } : { success: true }
}

// ── Report / Block ────────────────────────────────────────────

export async function reportMessage(messageId: string, reportedHandle: string, reason: string) {
  const userId = await getUserId()
  const admin = getAdmin()

  // Normalize reason to match DB constraint
  const normalized = reason.toLowerCase()
    .replace('harassment or abuse', 'harassment')
    .replace('phishing or scam', 'phishing')
    .replace(/ /g, '_')
    .replace(/[^a-z_]/g, '')

  const validReasons = ['spam', 'harassment', 'phishing', 'impersonation', 'other']
  const finalReason = validReasons.includes(normalized) ? normalized : 'other'

  const { error } = await admin.from('reports').insert({
    reporter_id: userId,
    message_id: messageId,
    reported_handle: reportedHandle,
    reason: finalReason,
  })
  return error ? { error: error.message } : { success: true }
}

export async function blockUser(handleToBlock: string) {
  const userId = await getUserId()
  const admin = getAdmin()

  const { data: target } = await admin
    .from('profiles')
    .select('id')
    .eq('handle', handleToBlock)
    .single()

  if (!target) return { error: 'User not found.' }

  const { error } = await admin.from('blocked_users').upsert({
    blocker_id: userId,
    blocked_id: target.id,
  })
  return error ? { error: error.message } : { success: true }
}
