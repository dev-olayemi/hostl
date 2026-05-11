import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Drafts' }

export default function DraftsPage() {
  return <InboxView category="drafts" />
}
