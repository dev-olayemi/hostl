import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Important' }

export default function ImportantPage() {
  return <InboxView category="important" />
}
