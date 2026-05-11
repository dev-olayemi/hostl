'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isValidHandle } from '@/lib/handle-utils'

/**
 * Supabase requires a valid email for auth.
 * We generate a unique, valid synthetic email per user using their handle +
 * a short random suffix. Users never see this — it's purely internal.
 * Format: h.{handle}.{6-char-random}@hostl.app
 */
function generateSyntheticEmail(handle: string): string {
  const clean = handle.toLowerCase().replace(/[^a-z0-9_-]/g, '')
  const rand = Math.random().toString(36).slice(2, 8)
  return `h.${clean}.${rand}@hostl.app`
}

/**
 * Admin client — service role, server-side only.
 * Used for handle lookups and auto-confirming users.
 */
function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/**
 * Check handle availability by querying the profiles table directly.
 * Much faster and more reliable than scanning auth.users.
 */
export async function checkHandleAvailable(handle: string): Promise<{ available: boolean }> {
  if (!isValidHandle(handle)) return { available: false }

  const admin = getAdminClient()
  const { data, error } = await admin
    .from('profiles')
    .select('handle')
    .eq('handle', handle.toLowerCase())
    .maybeSingle()

  if (error) {
    // If profiles table query fails, fall back to auth.users scan
    const { data: authData } = await admin.auth.admin.listUsers()
    const taken = authData?.users?.some(
      (u) => u.user_metadata?.handle?.toLowerCase() === handle.toLowerCase()
    )
    return { available: !taken }
  }

  return { available: data === null }
}

export async function signUp(formData: FormData) {
  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const dob = formData.get('date_of_birth') as string
  const rawHandle = (formData.get('handle') as string ?? '').replace('@', '').trim()
  const password = formData.get('password') as string
  const accountType = (formData.get('account_type') as string) || 'personal'

  if (!rawHandle || !password || !firstName || !lastName || !dob) {
    return { error: 'All fields are required.' }
  }

  if (!isValidHandle(rawHandle)) {
    return { error: 'Handle can only contain letters, numbers, underscores, and hyphens.' }
  }

  const handle = rawHandle.toLowerCase()

  // Final availability check server-side
  const { available } = await checkHandleAvailable(handle)
  if (!available) {
    return { error: 'This handle is already taken. Please choose another.' }
  }

  const syntheticEmail = generateSyntheticEmail(handle)
  const admin = getAdminClient()

  // Use admin client to create user — this bypasses email confirmation entirely
  const { data: newUser, error: createError } = await admin.auth.admin.createUser({
    email: syntheticEmail,
    password,
    email_confirm: true, // auto-confirm — no email needed
    user_metadata: {
      handle,
      first_name: firstName,
      last_name: lastName,
      display_name: `${firstName} ${lastName}`,
      date_of_birth: dob,
      account_type: accountType,
    },
  })

  if (createError) {
    return { error: createError.message }
  }

  if (!newUser.user) {
    return { error: 'Something went wrong. Please try again.' }
  }

  // Now sign in immediately with the regular client to get a session
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: syntheticEmail,
    password,
  })

  if (signInError) {
    return { error: 'Account created but could not sign in. Please try logging in.' }
  }

  redirect('/inbox')
}

export async function signIn(formData: FormData) {
  const rawHandle = (formData.get('handle') as string ?? '').replace('@', '').trim().toLowerCase()
  const password = formData.get('password') as string

  if (!rawHandle || !password) {
    return { error: 'Hostl ID and password are required.' }
  }

  // Look up the synthetic email via the profiles table + admin auth
  const admin = getAdminClient()

  // Get the user's auth record by scanning for their handle in metadata
  // We use a paginated approach to handle larger user bases
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({
    perPage: 1000,
  })

  if (listError) {
    return { error: 'Sign in failed. Please try again.' }
  }

  const matchedUser = users?.find(
    (u) => u.user_metadata?.handle?.toLowerCase() === rawHandle
  )

  if (!matchedUser?.email) {
    return { error: 'No account found with that Hostl ID.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: matchedUser.email,
    password,
  })

  if (error) {
    return { error: 'Incorrect Hostl ID or password.' }
  }

  redirect('/inbox')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  const rawHandle = (formData.get('handle') as string ?? '').replace('@', '').trim().toLowerCase()

  if (!rawHandle) {
    return { error: 'Please enter your Hostl ID.' }
  }

  // Look up synthetic email by handle
  const admin = getAdminClient()
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })

  if (listError) {
    return { error: 'Something went wrong. Please try again.' }
  }

  const matchedUser = users?.find(
    (u) => u.user_metadata?.handle?.toLowerCase() === rawHandle
  )

  // Always return success — don't reveal whether a handle exists
  if (!matchedUser?.email) {
    return { success: true }
  }

  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(matchedUser.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
  })

  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm_password') as string

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters.' }
  }

  if (password !== confirm) {
    return { error: 'Passwords do not match.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: error.message }
  }

  redirect('/inbox')
}
