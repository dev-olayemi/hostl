import { Metadata } from 'next'
import LabelInboxView from '@/components/inbox/LabelInboxView'

export const metadata: Metadata = { title: 'Label' }

export default async function LabelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <LabelInboxView labelId={id} />
}
