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

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = getAdminClient()

    // Get counts for all categories
    const categories = ['inbox', 'important', 'sent', 'drafts', 'archived', 'trash', 'isolated', 'suspicious']
    const counts: Record<string, number> = {}

    // Inbox count (received messages in inbox category)
    const { count: inboxCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('category', 'inbox')

    counts.inbox = inboxCount || 0

    // Important count (messages marked as important)
    const { count: importantCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('is_important', true)
      .neq('category', 'trash')

    counts.important = importantCount || 0

    // Sent count (messages sent by user)
    const { count: sentCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('from_profile_id', user.id)
      .neq('category', 'trash')

    counts.sent = sentCount || 0

    // Drafts count
    const { count: draftsCount } = await admin
      .from('drafts')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)

    counts.drafts = draftsCount || 0

    // Archived count
    const { count: archivedCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('category', 'archived')

    counts.archived = archivedCount || 0

    // Trash count
    const { count: trashCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('category', 'trash')

    counts.trash = trashCount || 0

    // Isolated count
    const { count: isolatedCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('category', 'isolated')

    counts.isolated = isolatedCount || 0

    // Suspicious count
    const { count: suspiciousCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('category', 'suspicious')

    counts.suspicious = suspiciousCount || 0

    // Unread count (for inbox)
    const { count: unreadCount } = await admin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('to_profile_id', user.id)
      .eq('category', 'inbox')
      .eq('is_read', false)

    counts.unread = unreadCount || 0

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('Get message counts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
