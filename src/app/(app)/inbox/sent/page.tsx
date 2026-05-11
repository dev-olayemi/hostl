import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Sent' }

export default function SentPage() {
  return <InboxView category="sent" />
}
