import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import VerificationForm from './VerificationForm'
import { getVerificationStatus } from './actions'

export const metadata: Metadata = { title: 'Apply for Verification' }

export default async function VerifyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = user.user_metadata
  const existing = await getVerificationStatus()

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <VerificationForm
        accountType={profile?.account_type ?? 'personal'}
        verified={profile?.verified ?? false}
        existing={existing}
      />
    </div>
  )
}
