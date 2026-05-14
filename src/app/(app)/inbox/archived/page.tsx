import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InboxClient from '@/components/inbox/InboxClient'
import { getInboxMessages } from '@/lib/db/messages'

export const metadata: Metadata = { title: 'Archived' }

export default async function ArchivedPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const messages = await getInboxMessages(user.id, 'archived')
  return <InboxClient initialMessages={messages} category="archived" userId={user.id} />
}
