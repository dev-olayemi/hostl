import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Archived' }

export default function ArchivedPage() {
  return <InboxView category="archived" />
}
