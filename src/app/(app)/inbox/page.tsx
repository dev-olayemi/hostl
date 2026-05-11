import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Inbox' }

export default function InboxPage() {
  return <InboxView category="inbox" />
}
