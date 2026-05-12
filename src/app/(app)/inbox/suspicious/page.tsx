import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import InboxClient from '@/components/inbox/InboxClient'
import { getInboxMessages } from '@/lib/db/messages'

export const metadata: Metadata = { title: 'Suspicious' }

export default async function SuspiciousPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const messages = await getInboxMessages(user.id, 'suspicious')
  return <InboxClient initialMessages={messages} category="suspicious" />
}
