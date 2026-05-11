'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function sendMessage(formData: FormData) {
  // Use regular client to verify the session
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Use admin client for all DB writes — bypasses RLS on server actions
  // Security is enforced by the auth check above
  const admin = getAdminClient()

  // Get sender profile
  const { data: senderProfile, error: profileError } = await admin
    .from('profiles')
    .select('id, handle')
    .eq('id', user.id)
    .single()

  if (profileError || !senderProfile) {
    return { error: `Profile not found: ${profileError?.message ?? 'unknown'}` }
  }

  const subject = (formData.get('subject') as string ?? '').trim()
  const body = (formData.get('body') as string ?? '').trim()
  const contentType = (formData.get('content_type') as string) || 'text'
  const toHandlesRaw = (formData.get('to') as string ?? '')
  const ccHandlesRaw = (formData.get('cc') as string ?? '')

  if (!subject || !body) return { error: 'Subject and message are required.' }

  const parseHandles = (raw: string) =>
    raw.split(/[\s,]+/)
      .map((h) => h.replace('@', '').trim().toLowerCase())
      .filter(Boolean)

  const toHandles = parseHandles(toHandlesRaw)
  const ccHandles = parseHandles(ccHandlesRaw)
  const allHandles = [...new Set([...toHandles, ...ccHandles])]

  if (toHandles.length === 0) return { error: 'At least one recipient is required.' }

  // Look up recipient profiles
  const { data: recipients, error: recipientError } = await admin
    .from('profiles')
    .select('id, handle')
    .in('handle', allHandles)

  if (recipientError) return { error: `Failed to look up recipients: ${recipientError.message}` }

  const notFound = allHandles.filter(
    (h) => !recipients?.some((r) => r.handle === h)
  )
  if (notFound.length > 0) {
    return { error: `Handle${notFound.length > 1 ? 's' : ''} not found: ${notFound.map((h) => `@${h}`).join(', ')}` }
  }

  // Create thread
  const { data: thread, error: threadError } = await admin
    .from('threads')
    .insert({ subject, created_by: senderProfile.id })
    .select('id')
    .single()

  if (threadError || !thread) {
    return { error: `Failed to create thread: ${threadError?.message ?? 'unknown'}` }
  }

  // Add participants
  const participantIds = [...new Set([senderProfile.id, ...recipients!.map((r) => r.id)])]
  const { error: participantError } = await admin
    .from('thread_participants')
    .insert(participantIds.map((profile_id) => ({ thread_id: thread.id, profile_id })))

  if (participantError) {
    return { error: `Failed to add participants: ${participantError.message}` }
  }

  // Insert messages
  const toRecipients = recipients!.filter((r) => toHandles.includes(r.handle))
  const ccRecipients = recipients!.filter((r) => ccHandles.includes(r.handle))

  const messages = [
    ...toRecipients.map((r) => ({
      thread_id: thread.id,
      from_profile_id: senderProfile.id,
      to_profile_id: r.id,
      subject,
      body,
      content_type: contentType,
      category: 'inbox' as const,
      is_read: false,
      is_important: false,
      action_completed: false,
    })),
    ...ccRecipients.map((r) => ({
      thread_id: thread.id,
      from_profile_id: senderProfile.id,
      to_profile_id: r.id,
      subject,
      body,
      content_type: contentType,
      category: 'inbox' as const,
      is_read: false,
      is_important: false,
      action_completed: false,
    })),
  ]

  const { error: msgError } = await admin.from('messages').insert(messages)
  if (msgError) {
    return { error: `Failed to send message: ${msgError.message}` }
  }

  redirect('/inbox/sent')
}
