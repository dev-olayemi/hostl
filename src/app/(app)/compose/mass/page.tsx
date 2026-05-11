import { Metadata } from 'next'
import MassComposeView from '@/components/inbox/MassComposeView'

export const metadata: Metadata = { title: 'Mass Message' }

export default function MassComposePage() {
  return <MassComposeView />
}
