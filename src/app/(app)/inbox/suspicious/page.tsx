import { Metadata } from 'next'
import InboxView from '@/components/inbox/InboxView'

export const metadata: Metadata = { title: 'Suspicious' }

export default function SuspiciousPage() {
  return <InboxView category="suspicious" />
}
