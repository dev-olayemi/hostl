'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import {
  SYSTEM_PROFILE_ID,
  generateVerificationCode,
} from '@/lib/system'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('ConnectTimeout') || msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
    return 'Connection timed out. Please check your internet and try again.'
  }
  if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment and try again.'
  return 'Something went wrong. Please try again.'
}

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user.id
}

export async function sendRecoveryVerificationCode(targetHandle: string) {
  try {
    const userId = await getUserId()
    const admin = getAdmin()

    const cleanHandle = targetHandle.replace('@', '').trim().toLowerCase()
    if (!cleanHandle) return { error: 'Please enter a valid Hostl ID.' }

    // Can't use your own handle
    const { data: ownProfile } = await admin
      .from('profiles')
      .select('handle')
      .eq('id', userId)
      .single()

    if (ownProfile?.handle === cleanHandle) {
      return { error: 'You cannot use your own Hostl ID as a recovery handle.' }
    }

    // Check target exists
    const { data: targetProfile, error: targetError } = await admin
      .from('profiles')
      .select('id, handle, display_name')
      .eq('handle', cleanHandle)
      .maybeSingle()

    if (targetError) return { error: friendlyError(targetError) }
    if (!targetProfile) return { error: `@${cleanHandle} is not a Hostl account.` }

    const code = generateVerificationCode()

    // Store verification record — delete old one first, then insert fresh
    await admin
      .from('recovery_handle_verifications')
      .delete()
      .eq('profile_id', userId)

    const { error: insertError } = await admin
      .from('recovery_handle_verifications')
      .insert({
        profile_id: userId,
        target_handle: cleanHandle,
        code,
        verified: false,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })

    if (insertError) return { error: `Could not save verification: ${insertError.message}` }

    // Send system message to target's inbox
    const { data: thread, error: threadError } = await admin
      .from('threads')
      .insert({
        subject: 'Recovery handle verification code',
        created_by: SYSTEM_PROFILE_ID,
      })
      .select('id')
      .single()

    if (threadError || !thread) {
      // Message failed but code is saved — user can still verify manually
      console.error('Thread creation failed:', threadError?.message)
      return { success: true, targetHandle: cleanHandle, messageWarning: true }
    }

    await admin.from('thread_participants').insert([
      { thread_id: thread.id, profile_id: SYSTEM_PROFILE_ID },
      { thread_id: thread.id, profile_id: targetProfile.id },
    ])

    const body = `
<div style="font-family:Arial,sans-serif;max-width:480px;color:#202124;">
  <p style="font-size:14px;line-height:1.6;margin:0 0 16px;">
    Someone is adding <strong>@${cleanHandle}</strong> as their Hostl account recovery handle.
  </p>
  <p style="font-size:14px;line-height:1.6;margin:0 0 24px;">
    If you recognise this request, share the verification code below with them:
  </p>
  <div style="background:#f4f4f7;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
    <span style="font-size:28px;font-weight:700;letter-spacing:4px;color:#1a1a2e;font-family:monospace;">${code}</span>
  </div>
  <p style="font-size:12px;color:#9aa0a6;line-height:1.6;margin:0;">
    This code expires in 24 hours. If you don't recognise this request, ignore this message.
  </p>
</div>`.trim()

    const { error: msgError } = await admin.from('messages').insert({
      thread_id: thread.id,
      from_profile_id: SYSTEM_PROFILE_ID,
      to_profile_id: targetProfile.id,
      subject: 'Recovery handle verification code',
      body,
      content_type: 'text',
      category: 'inbox',
      is_read: false,
      is_important: true,
      action_completed: false,
    })

    if (msgError) {
      console.error('Message insert failed:', msgError.message)
      return { success: true, targetHandle: cleanHandle, messageWarning: true }
    }

    return { success: true, targetHandle: cleanHandle }
  } catch (err) {
    return { error: friendlyError(err) }
  }
}

export async function verifyRecoveryCode(code: string) {
  try {
    const userId = await getUserId()
    const admin = getAdmin()

    const { data: record, error: fetchError } = await admin
      .from('recovery_handle_verifications')
      .select('*')
      .eq('profile_id', userId)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !record) return { error: 'No pending verification found. Please request a new code.' }

    if (new Date(record.expires_at) < new Date()) {
      return { error: 'This code has expired. Please request a new one.' }
    }

    if (record.code !== code.trim().toUpperCase()) {
      return { error: 'Incorrect code. Double-check and try again.' }
    }

    await admin
      .from('recovery_handle_verifications')
      .update({ verified: true })
      .eq('id', record.id)

    await admin
      .from('profiles')
      .update({ recovery_handle: record.target_handle })
      .eq('id', userId)

    return { success: true, handle: record.target_handle }
  } catch (err) {
    return { error: friendlyError(err) }
  }
}
