import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import InboxClient from '@/components/inbox/InboxClient'

export const metadata: Metadata = { title: 'Sent' }

export default async function SentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: rawMessages } = await admin
    .from('messages')
    .select(`
      *,
      from_profile:profiles!messages_from_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system),
      to_profile:profiles!messages_to_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system),
      message_attachments(
        attachments(id, file_name, file_size, mime_type, storage_url)
      )
    `)
    .eq('from_profile_id', user.id)
    .order('created_at', { ascending: false })

  // Transform nested attachments structure
  const messages = rawMessages?.map((msg: any) => ({
    ...msg,
    attachments: msg.message_attachments?.map((ma: any) => ma.attachments).filter(Boolean) || []
  })) || []

  return <InboxClient initialMessages={messages} category="sent" userId={user.id} />
}
