import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Trash' }

export default function TrashPage() {
  return <InboxView category="trash" />
}
