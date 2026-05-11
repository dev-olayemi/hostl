import { Metadata } from 'next'
import ComposeView from '@/components/inbox/ComposeView'

export const metadata: Metadata = { title: 'Compose' }

export default function ComposePage() {
  return <ComposeView />
}
