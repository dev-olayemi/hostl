'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  return user
}

function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('ConnectTimeout') || msg.includes('fetch failed') || msg.includes('ECONNREFUSED')) {
    return 'Connection timed out. Please check your internet and try again.'
  }
  return 'Something went wrong. Please try again.'
}

export async function getProfile() {
  try {
    const user = await getUser()
    const admin = getAdmin()
    const { data } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    return data
  } catch {
    return null
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const user = await getUser()
    const admin = getAdmin()

    const firstName      = (formData.get('first_name') as string ?? '').trim()
    const lastName       = (formData.get('last_name') as string ?? '').trim()
    const bio            = (formData.get('bio') as string ?? '').trim()
    const gender         = (formData.get('gender') as string ?? '') || null
    const country        = (formData.get('country') as string ?? '') || null
    const address        = (formData.get('address') as string ?? '').trim() || null
    const phoneCountry   = (formData.get('phone_country') as string ?? '') || null
    const phoneNumber    = (formData.get('phone_number') as string ?? '').trim() || null
    const recoveryHandle = (formData.get('recovery_handle') as string ?? '').replace('@', '').trim().toLowerCase() || null

    if (!firstName || !lastName) return { error: 'First and last name are required.' }

    if (recoveryHandle) {
      const { data: rProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('handle', recoveryHandle)
        .maybeSingle()
      if (!rProfile) return { error: `@${recoveryHandle} is not a Hostl account.` }
    }

    const displayName = `${firstName} ${lastName}`

    const { error } = await admin
      .from('profiles')
      .update({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        bio,
        gender,
        country,
        address,
        phone_country: phoneCountry,
        phone_number: phoneNumber,
        recovery_handle: recoveryHandle,
      })
      .eq('id', user.id)

    if (error) return { error: friendlyError(error) }

    const supabase = await createClient()
    await supabase.auth.updateUser({
      data: { first_name: firstName, last_name: lastName, display_name: displayName },
    })

    return { success: true }
  } catch (err) {
    return { error: friendlyError(err) }
  }
}
