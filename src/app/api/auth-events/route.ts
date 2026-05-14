import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SYSTEM_PROFILE_ID } from '@/lib/system'
import { createHash } from 'crypto'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function sendSystemMessage(admin: ReturnType<typeof getAdmin>, toProfileId: string, subject: string, body: string) {
  const { data: thread } = await admin
    .from('threads')
    .insert({ subject, created_by: SYSTEM_PROFILE_ID })
    .select('id')
    .single()

  if (!thread) return

  await admin.from('thread_participants').insert([
    { thread_id: thread.id, profile_id: SYSTEM_PROFILE_ID },
    { thread_id: thread.id, profile_id: toProfileId },
  ])

  await admin.from('messages').insert({
    thread_id: thread.id,
    from_profile_id: SYSTEM_PROFILE_ID,
    to_profile_id: toProfileId,
    subject,
    body,
    content_type: 'text',
    category: 'inbox',
    is_read: false,
    is_important: true,
    action_completed: false,
  })
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { event } = await req.json()
    const admin = getAdmin()

    const { data: profile } = await admin
      .from('profiles')
      .select('id, handle, display_name, created_at')
      .eq('id', user.id)
      .single()

    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    // ── Welcome message (sent once on first login after signup) ──
    if (event === 'welcome') {
      // Check if welcome was already sent
      const { count } = await admin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('to_profile_id', profile.id)
        .eq('from_profile_id', SYSTEM_PROFILE_ID)
        .ilike('subject', '%Welcome%')

      if ((count ?? 0) === 0) {
        const welcomeBody = `
<div style="font-family:Arial,sans-serif;max-width:480px;color:#202124;">
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    Hey <strong>@${profile.handle}</strong>, welcome to Hostl! 👋
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    Your Hostl ID is ready. Here is what you can do:
  </p>
  <ul style="font-size:14px;line-height:1.8;margin:0 0 16px;padding-left:20px;color:#5f6368;">
    <li><strong>Send interactive messages</strong> — approvals, RSVPs, polls, and forms</li>
    <li><strong>Share your profile</strong> — hostl.cloud/u/${profile.handle}</li>
    <li><strong>Get verified</strong> — apply for a verification badge in Settings</li>
    <li><strong>Add a recovery handle</strong> — protect your account in Settings → Security</li>
  </ul>
  <p style="font-size:14px;color:#5f6368;margin:0;">
    If you have any questions, reply to this message.<br/>
    — The Hostl Team
  </p>
</div>`.trim()

        await sendSystemMessage(admin, profile.id, `Welcome to Hostl, @${profile.handle}!`, welcomeBody)
      }
      return NextResponse.json({ success: true })
    }

    // ── New device login alert ──
    if (event === 'new_device') {
      const userAgent = req.headers.get('user-agent') ?? 'Unknown device'
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('x-real-ip')
        ?? 'Unknown location'

      // Hash device fingerprint
      const deviceHash = createHash('sha256')
        .update(`${user.id}:${userAgent}:${ip}`)
        .digest('hex')
        .slice(0, 16)

      // Check if this device has been seen before
      const { data: existingSession } = await admin
        .from('device_sessions')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('device_hash', deviceHash)
        .maybeSingle()

      if (!existingSession) {
        // New device — record it and send alert
        const now = new Date()
        const timeStr = now.toLocaleString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
        })

        // Parse device name from user agent
        let deviceName = 'Unknown device'
        if (/iPhone/.test(userAgent)) deviceName = 'iPhone'
        else if (/iPad/.test(userAgent)) deviceName = 'iPad'
        else if (/Android/.test(userAgent)) deviceName = 'Android device'
        else if (/Mac/.test(userAgent)) deviceName = 'Mac'
        else if (/Windows/.test(userAgent)) deviceName = 'Windows PC'
        else if (/Linux/.test(userAgent)) deviceName = 'Linux device'

        // Parse browser
        let browser = ''
        if (/Chrome/.test(userAgent) && !/Chromium|Edge/.test(userAgent)) browser = 'Chrome'
        else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari'
        else if (/Firefox/.test(userAgent)) browser = 'Firefox'
        else if (/Edge/.test(userAgent)) browser = 'Edge'

        const deviceLabel = browser ? `${deviceName} (${browser})` : deviceName

        await admin.from('device_sessions').insert({
          profile_id: profile.id,
          device_hash: deviceHash,
          user_agent: userAgent,
          ip_address: ip,
          last_seen_at: now.toISOString(),
        })

        const alertBody = `
<div style="font-family:Arial,sans-serif;max-width:480px;color:#202124;">
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    A new sign-in to your Hostl account was detected.
  </p>
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 20px;">
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 0;color:#6b7280;width:120px;">Device</td>
      <td style="padding:10px 0;font-weight:500;">${deviceLabel}</td>
    </tr>
    <tr style="border-bottom:1px solid #e5e7eb;">
      <td style="padding:10px 0;color:#6b7280;">Time</td>
      <td style="padding:10px 0;">${timeStr}</td>
    </tr>
    <tr>
      <td style="padding:10px 0;color:#6b7280;">IP Address</td>
      <td style="padding:10px 0;">${ip}</td>
    </tr>
  </table>
  <p style="font-size:14px;line-height:1.6;margin:0 0 12px;color:#5f6368;">
    If this was you, no action is needed.
  </p>
  <p style="font-size:14px;line-height:1.6;margin:0;color:#dc2626;font-weight:500;">
    If this was not you, change your password immediately from Settings → Security.
  </p>
</div>`.trim()

        await sendSystemMessage(
          admin,
          profile.id,
          `New sign-in detected on ${deviceLabel}`,
          alertBody
        )
      } else {
        // Known device — just update last_seen
        await admin
          .from('device_sessions')
          .update({ last_seen_at: new Date().toISOString() })
          .eq('profile_id', profile.id)
          .eq('device_hash', deviceHash)
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unknown event' }, { status: 400 })
  } catch (err) {
    console.error('Auth event error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
