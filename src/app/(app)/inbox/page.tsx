import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import InboxClient from '@/components/inbox/InboxClient'

export const metadata: Metadata = { title: 'Inbox' }

export default async function InboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: messages } = await admin
    .from('messages')
    .select(`
      *,
      from_profile:profiles!messages_from_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system),
      to_profile:profiles!messages_to_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system)
    `)
    .eq('to_profile_id', user.id)
    .eq('category', 'inbox')
    .order('created_at', { ascending: false })

  return <InboxClient initialMessages={messages ?? []} category="inbox" />
}
