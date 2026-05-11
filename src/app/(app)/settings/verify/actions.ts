'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function getAdmin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function submitVerification(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = getAdmin()

  // Check account type
  const { data: profile } = await admin
    .from('profiles')
    .select('account_type, verified')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Profile not found.' }
  if (profile.account_type === 'personal') {
    return { error: 'Only company and organization accounts can apply for verification.' }
  }
  if (profile.verified) return { error: 'Your account is already verified.' }

  const payload = {
    profile_id: user.id,
    legal_name:          (formData.get('legal_name') as string).trim(),
    account_type:        profile.account_type,
    website:             (formData.get('website') as string).trim(),
    country:             (formData.get('country') as string).trim(),
    city:                (formData.get('city') as string).trim(),
    address:             (formData.get('address') as string).trim(),
    registration_number: (formData.get('registration_number') as string).trim(),
    description:         (formData.get('description') as string).trim(),
    contact_name:        (formData.get('contact_name') as string).trim(),
    contact_title:       (formData.get('contact_title') as string).trim(),
    contact_email:       (formData.get('contact_email') as string).trim(),
    status: 'pending',
  }

  if (!payload.legal_name || !payload.website || !payload.country ||
      !payload.description || !payload.contact_name || !payload.contact_email) {
    return { error: 'Please fill in all required fields.' }
  }

  // Upsert — allow resubmission if rejected
  const { error } = await admin
    .from('verification_requests')
    .upsert(payload, { onConflict: 'profile_id' })

  if (error) return { error: error.message }
  return { success: true }
}

export async function getVerificationStatus() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = getAdmin()
  const { data } = await admin
    .from('verification_requests')
    .select('*')
    .eq('profile_id', user.id)
    .maybeSingle()

  return data
}
