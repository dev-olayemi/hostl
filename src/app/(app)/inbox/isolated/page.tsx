import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Isolated' }

export default function IsolatedPage() {
  return <InboxView category="isolated" />
}
