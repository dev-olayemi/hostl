import { Metadata } from 'next'
import { Suspense } from 'react'
import ComposeView from '@/components/inbox/ComposeView'

export const metadata: Metadata = { title: 'Compose' }

export default function ComposePage() {
  return (
    <Suspense>
      <ComposeView />
    </Suspense>
  )
}
