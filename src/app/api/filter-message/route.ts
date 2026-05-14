import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { messageId, subject, messageBody, senderHandle, attachmentTypes } = body

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Check if sender is blocked
    const { data: blocked } = await admin
      .from('blocked_senders')
      .select('id')
      .eq('profile_id', user.id)
      .eq('blocked_id', (await admin
        .from('profiles')
        .select('id')
        .eq('handle', senderHandle)
        .single()
      ).data?.id)
      .maybeSingle()

    if (blocked) {
      // Automatically move to isolated
      await admin
        .from('messages')
        .update({
          category: 'isolated',
          security_score: 0,
          security_flags: [{ type: 'blocked', description: 'Sender is blocked' }],
          filtered_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      return NextResponse.json({ 
        category: 'isolated', 
        score: 0,
        reason: 'Sender is blocked'
      })
    }

    // Check if sender is trusted
    const { data: trusted } = await admin
      .from('trusted_senders')
      .select('id')
      .eq('profile_id', user.id)
      .eq('trusted_id', (await admin
        .from('profiles')
        .select('id')
        .eq('handle', senderHandle)
        .single()
      ).data?.id)
      .maybeSingle()

    if (trusted) {
      // Trusted sender - always goes to inbox
      await admin
        .from('messages')
        .update({
          category: 'inbox',
          security_score: 100,
          security_flags: [],
          filtered_at: new Date().toISOString(),
        })
        .eq('id', messageId)

      return NextResponse.json({ 
        category: 'inbox', 
        score: 100,
        reason: 'Sender is trusted'
      })
    }

    // Calculate security score using enhanced context-aware function
    const { data: scoreData, error: scoreError } = await admin
      .rpc('calculate_message_security_score_v2', {
        message_body: messageBody || '',
        message_subject: subject || '',
        sender_id: (await admin
          .from('profiles')
          .select('id')
          .eq('handle', senderHandle)
          .single()
        ).data?.id,
        recipient_id: user.id,
        sender_handle: senderHandle || '',
        attachment_types: attachmentTypes || []
      })

    if (scoreError) {
      console.error('Score calculation error:', scoreError)
      return NextResponse.json({ error: 'Failed to calculate security score' }, { status: 500 })
    }

    const score = scoreData.score
    const flags = scoreData.flags

    // Determine category based on score
    let category = 'inbox'
    if (score < 30) {
      category = 'isolated'  // Very suspicious - isolate completely
    } else if (score < 60) {
      category = 'suspicious'  // Somewhat suspicious - flag for review
    }

    // Update message with security data
    await admin
      .from('messages')
      .update({
        category,
        security_score: score,
        security_flags: flags,
        filtered_at: new Date().toISOString(),
        filter_version: '1.0',
      })
      .eq('id', messageId)

    return NextResponse.json({ 
      success: true,
      category,
      score,
      flags
    })
  } catch (error) {
    console.error('Filter message error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
