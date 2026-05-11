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

export async function sendMassMessage(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()

  const { data: senderProfile } = await admin
    .from('profiles')
    .select('id, handle')
    .eq('id', user.id)
    .single()

  if (!senderProfile) return { error: 'Profile not found.' }

  const subject     = (formData.get('subject') as string ?? '').trim()
  const body        = (formData.get('body') as string ?? '').trim()
  const contentType = (formData.get('content_type') as string) || 'text'
  const handlesRaw  = (formData.get('handles') as string ?? '')

  if (!subject || !body) return { error: 'Subject and message are required.' }

  const handles = handlesRaw
    .split(/[\s,\n]+/)
    .map((h) => h.replace('@', '').trim().toLowerCase())
    .filter(Boolean)

  if (handles.length === 0) return { error: 'Add at least one recipient.' }
  if (handles.length > 50)  return { error: 'Mass messages are limited to 50 recipients at a time.' }

  // Look up all recipients
  const { data: recipients, error: recipientError } = await admin
    .from('profiles')
    .select('id, handle')
    .in('handle', handles)

  if (recipientError) return { error: recipientError.message }

  const notFound = handles.filter((h) => !recipients?.some((r) => r.handle === h))
  if (notFound.length > 0) {
    return { error: `Handles not found: ${notFound.map((h) => `@${h}`).join(', ')}` }
  }

  // Create mass message job record
  const { data: job } = await admin
    .from('mass_messages')
    .insert({
      sender_id: senderProfile.id,
      subject,
      body,
      content_type: contentType,
      recipient_count: recipients!.length,
      status: 'sending',
    })
    .select('id')
    .single()

  // Create a thread per recipient (mass messages are individual threads)
  let sentCount = 0
  for (const recipient of recipients!) {
    const { data: thread } = await admin
      .from('threads')
      .insert({ subject, created_by: senderProfile.id })
      .select('id')
      .single()

    if (!thread) continue

    await admin.from('thread_participants').insert([
      { thread_id: thread.id, profile_id: senderProfile.id },
      { thread_id: thread.id, profile_id: recipient.id },
    ])

    await admin.from('messages').insert({
      thread_id: thread.id,
      from_profile_id: senderProfile.id,
      to_profile_id: recipient.id,
      subject,
      body,
      content_type: contentType,
      category: 'inbox',
      is_read: false,
      is_important: false,
      action_completed: false,
    })

    sentCount++
  }

  // Update job status
  if (job) {
    await admin
      .from('mass_messages')
      .update({ status: 'done', sent_count: sentCount })
      .eq('id', job.id)
  }

  return { success: true, sent: sentCount }
}
