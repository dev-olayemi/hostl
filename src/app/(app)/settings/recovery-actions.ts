'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import {
  SYSTEM_PROFILE_ID, SYSTEM_HANDLE, SYSTEM_DISPLAY_NAME,
  generateVerificationCode
} from '@/lib/system'

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

/** Ensure the @hostl system profile exists in the DB */
async function ensureSystemProfile(admin: ReturnType<typeof getAdminClient>) {
  const { data } = await admin
    .from('profiles')
    .select('id')
    .eq('id', SYSTEM_PROFILE_ID)
    .maybeSingle()

  if (!data) {
    // Insert system profile — bypasses auth.users FK using service role
    await admin.rpc('insert_system_profile', {
      p_id: SYSTEM_PROFILE_ID,
      p_handle: SYSTEM_HANDLE,
      p_display_name: SYSTEM_DISPLAY_NAME,
    }).catch(() => {
      // If RPC doesn't exist, try direct insert
      // The profiles table FK to auth.users may block this —
      // in that case, run the SQL below in Supabase:
      // INSERT INTO profiles (id, handle, display_name, first_name, last_name, date_of_birth, verified, avatar_url)
      // VALUES ('00000000-0000-0000-0000-000000000001', 'hostl', 'Hostl', 'Hostl', 'System', '2024-01-01', true, '/hostl-icon.png')
      // ON CONFLICT DO NOTHING;
    })
  }
}

/**
 * Step 1: Send a verification code to the target recovery handle.
 * Creates a system message in the target user's inbox.
 */
export async function sendRecoveryVerificationCode(targetHandle: string) {
  const userId = await getUserId()
  const admin = getAdmin()

  const cleanHandle = targetHandle.replace('@', '').trim().toLowerCase()
  if (!cleanHandle) return { error: 'Please enter a valid Hostl ID.' }

  // Can't use your own handle as recovery
  const { data: ownProfile } = await admin
    .from('profiles')
    .select('handle')
    .eq('id', userId)
    .single()

  if (ownProfile?.handle === cleanHandle) {
    return { error: 'You cannot use your own Hostl ID as a recovery handle.' }
  }

  // Check target handle exists
  const { data: targetProfile } = await admin
    .from('profiles')
    .select('id, handle, display_name')
    .eq('handle', cleanHandle)
    .maybeSingle()

  if (!targetProfile) {
    return { error: `@${cleanHandle} is not a Hostl account.` }
  }

  const code = generateVerificationCode()

  // Store the verification record
  await admin
    .from('recovery_handle_verifications')
    .upsert({
      profile_id: userId,
      target_handle: cleanHandle,
      code,
      verified: false,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'profile_id' })

  // Send a system message to the target handle's inbox
  // First ensure system profile exists
  await ensureSystemProfile(admin)

  // Create thread
  const { data: thread } = await admin
    .from('threads')
    .insert({
      subject: 'Recovery handle verification',
      created_by: SYSTEM_PROFILE_ID,
    })
    .select('id')
    .single()

  if (thread) {
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
    If you recognize this request, share the verification code below with them:
  </p>
  <div style="background:#f4f4f7;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px;">
    <span style="font-size:28px;font-weight:700;letter-spacing:4px;color:#1a1a2e;font-family:monospace;">${code}</span>
  </div>
  <p style="font-size:12px;color:#9aa0a6;line-height:1.6;margin:0;">
    This code expires in 24 hours. If you don't recognize this request, ignore this message.
  </p>
</div>
    `.trim()

    await admin.from('messages').insert({
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
  }

  return { success: true, targetHandle: cleanHandle }
}

/**
 * Step 2: Verify the code entered by the user.
 */
export async function verifyRecoveryCode(code: string) {
  const userId = await getUserId()
  const admin = getAdmin()

  const { data: record } = await admin
    .from('recovery_handle_verifications')
    .select('*')
    .eq('profile_id', userId)
    .eq('verified', false)
    .single()

  if (!record) return { error: 'No pending verification found.' }

  if (new Date(record.expires_at) < new Date()) {
    return { error: 'Verification code has expired. Please request a new one.' }
  }

  if (record.code !== code.trim().toUpperCase()) {
    return { error: 'Incorrect code. Please check and try again.' }
  }

  // Mark verified and save the recovery handle
  await admin
    .from('recovery_handle_verifications')
    .update({ verified: true })
    .eq('id', record.id)

  await admin
    .from('profiles')
    .update({ recovery_handle: record.target_handle })
    .eq('id', userId)

  return { success: true, handle: record.target_handle }
}
