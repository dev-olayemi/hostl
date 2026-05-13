import { NextRequest, NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { SYSTEM_PROFILE_ID } from '@/lib/system'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const { handle } = await req.json()

    if (!handle || typeof handle !== 'string') {
      return NextResponse.json({ error: 'Handle is required.' }, { status: 400 })
    }

    const cleanHandle = handle.replace('@', '').trim().toLowerCase()

    if (!/^[a-zA-Z0-9_-]{2,30}$/.test(cleanHandle)) {
      return NextResponse.json({ error: 'Invalid handle format.' }, { status: 400 })
    }

    const admin = getAdmin()

    // Check handle exists
    const { data: profile } = await admin
      .from('profiles')
      .select('id, handle, display_name')
      .eq('handle', cleanHandle)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { error: `No Hostl account found for @${cleanHandle}. Create one at app.hostl.cloud` },
        { status: 404 }
      )
    }

    // Check if already subscribed
    const { data: existing } = await admin
      .from('newsletter_subscriptions')
      .select('id, subscribed')
      .eq('handle', cleanHandle)
      .maybeSingle()

    if (existing?.subscribed) {
      return NextResponse.json({ error: 'You are already subscribed.' }, { status: 409 })
    }

    // Upsert subscription
    await admin
      .from('newsletter_subscriptions')
      .upsert({
        handle: cleanHandle,
        profile_id: profile.id,
        subscribed: true,
        confirmed: true,
      }, { onConflict: 'handle' })

    // Send welcome system message
    const { data: thread } = await admin
      .from('threads')
      .insert({
        subject: 'Welcome to Hostl updates',
        created_by: SYSTEM_PROFILE_ID,
      })
      .select('id')
      .single()

    if (thread) {
      await admin.from('thread_participants').insert([
        { thread_id: thread.id, profile_id: SYSTEM_PROFILE_ID },
        { thread_id: thread.id, profile_id: profile.id },
      ])

      const body = `
<div style="font-family:Arial,sans-serif;max-width:480px;color:#202124;">
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    Hey <strong>@${cleanHandle}</strong>,
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    You are now subscribed to Hostl product updates.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
    We will send you announcements, new features, and important news
    directly to your Hostl inbox — no email, no spam, just the things that matter.
  </p>
  <p style="font-size:15px;line-height:1.6;margin:0 0 24px;">
    You can unsubscribe anytime from your account settings.
  </p>
  <p style="font-size:14px;color:#5f6368;margin:0;">
    — The Hostl Team
  </p>
</div>`.trim()

      await admin.from('messages').insert({
        thread_id: thread.id,
        from_profile_id: SYSTEM_PROFILE_ID,
        to_profile_id: profile.id,
        subject: 'Welcome to Hostl updates',
        body,
        content_type: 'text',
        category: 'inbox',
        is_read: false,
        is_important: false,
        action_completed: false,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Newsletter subscribe error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// Allow CORS from the marketing website
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://hostl.cloud',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
