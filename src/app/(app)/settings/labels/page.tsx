import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LabelsSettingsClient from './LabelsSettingsClient'
import { getLabels } from '@/app/(app)/labels/actions'

export const metadata: Metadata = { title: 'Manage Labels' }

export default async function LabelsSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const labels = await getLabels()
  return <LabelsSettingsClient initialLabels={labels} />
}
