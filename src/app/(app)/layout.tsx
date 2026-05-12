import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AppShell from '@/components/layout/AppShell'
import ProtocolHandler from '@/components/layout/ProtocolHandler'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch full profile from DB — includes avatar_url, recovery_handle, etc.
  // user_metadata only has what was set at signup and doesn't reflect DB updates.
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('id, handle, display_name, first_name, last_name, avatar_url, account_type, verified, bio')
    .eq('id', user.id)
    .single()

  // Fallback to user_metadata if profile not yet created (race condition on first login)
  const profileData = profile ?? user.user_metadata

  return (
    <AppShell profile={profileData}>
      <ProtocolHandler />
      {children}
    </AppShell>
  )
}
