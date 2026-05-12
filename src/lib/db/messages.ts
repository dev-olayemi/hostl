import { createClient as createAdminClient } from '@supabase/supabase-js'

const PROFILE_SELECT = 'id, handle, display_name, avatar_url, verified, account_type, is_system'

const MESSAGE_SELECT = `
  *,
  from_profile:profiles!messages_from_profile_id_fkey(${PROFILE_SELECT}),
  to_profile:profiles!messages_to_profile_id_fkey(${PROFILE_SELECT})
`

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function getInboxMessages(userId: string, category: string) {
  const admin = getAdmin()
  const { data } = await admin
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('to_profile_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getSentMessages(userId: string) {
  const admin = getAdmin()
  const { data } = await admin
    .from('messages')
    .select(MESSAGE_SELECT)
    .eq('from_profile_id', userId)
    .order('created_at', { ascending: false })
  return data ?? []
}
