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
    const { messageId, response, responseType } = body

    if (!messageId || !response || !responseType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const admin = getAdminClient()

    // Verify user is the recipient of this message
    const { data: message, error: msgError } = await admin
      .from('messages')
      .select('id, to_profile_id, from_profile_id, content_type')
      .eq('id', messageId)
      .single()

    if (msgError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.to_profile_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to respond to this message' }, { status: 403 })
    }

    // Insert or update response
    const { data: existingResponse } = await admin
      .from('message_responses')
      .select('id')
      .eq('message_id', messageId)
      .eq('responder_id', user.id)
      .maybeSingle()

    if (existingResponse) {
      // Update existing response
      await admin
        .from('message_responses')
        .update({ response: { type: responseType, value: response } })
        .eq('id', existingResponse.id)
    } else {
      // Insert new response
      await admin
        .from('message_responses')
        .insert({
          message_id: messageId,
          responder_id: user.id,
          response: { type: responseType, value: response },
        })
    }

    // Update message action_completed and action_data
    await admin
      .from('messages')
      .update({
        action_completed: true,
        action_data: { type: responseType, value: response },
      })
      .eq('id', messageId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Response submission error:', error)
    return NextResponse.json({ error: 'Failed to submit response' }, { status: 500 })
  }
}
