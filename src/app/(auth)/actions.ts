'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { isValidHandle } from '@/lib/handle-utils'

function getAdminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

/** Translate raw errors into user-friendly messages */
function friendlyError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (msg.includes('ConnectTimeout') || msg.includes('fetch failed') || msg.includes('ECONNREFUSED') || msg.includes('network')) {
    return 'Connection timed out. Please check your internet and try again.'
  }
  if (msg.includes('Invalid login credentials')) return 'Incorrect Hostl ID or password.'
  if (msg.includes('already registered') || msg.includes('already exists')) return 'This handle is already taken.'
  if (msg.includes('rate limit') || msg.includes('too many')) return 'Too many attempts. Please wait a moment and try again.'
  if (msg.includes('JWT') || msg.includes('token')) return 'Your session expired. Please sign in again.'
  return 'Something went wrong. Please try again.'
}

function generateSyntheticEmail(handle: string): string {
  const clean = handle.toLowerCase().replace(/[^a-z0-9_-]/g, '')
  const rand = Math.random().toString(36).slice(2, 8)
  return `h.${clean}.${rand}@hostl.app`
}

export async function checkHandleAvailable(handle: string): Promise<{ available: boolean }> {
  if (!isValidHandle(handle)) return { available: false }
  try {
    const admin = getAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('handle')
      .eq('handle', handle.toLowerCase())
      .maybeSingle()
    if (error) return { available: true } // fail open — let server-side check catch it
    return { available: data === null }
  } catch {
    return { available: true }
  }
}

export async function signUp(formData: FormData) {
  try {
    const firstName   = formData.get('first_name') as string
    const lastName    = formData.get('last_name') as string
    const dob         = formData.get('date_of_birth') as string
    const rawHandle   = (formData.get('handle') as string ?? '').replace('@', '').trim()
    const password    = formData.get('password') as string
    const accountType = (formData.get('account_type') as string) || 'personal'

    if (!rawHandle || !password || !firstName || !lastName || !dob) {
      return { error: 'All fields are required.' }
    }
    if (!isValidHandle(rawHandle)) {
      return { error: 'Handle can only contain letters, numbers, underscores, and hyphens.' }
    }

    const handle = rawHandle.toLowerCase()
    const { available } = await checkHandleAvailable(handle)
    if (!available) return { error: 'This handle is already taken. Please choose another.' }

    const admin = getAdminClient()
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email: generateSyntheticEmail(handle),
      password,
      email_confirm: true,
      user_metadata: {
        handle,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        date_of_birth: dob,
        account_type: accountType,
      },
    })

    if (createError) return { error: friendlyError(createError) }
    if (!newUser.user) return { error: 'Account could not be created. Please try again.' }

    const supabase = await createClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: newUser.user.email!,
      password,
    })
    if (signInError) return { error: 'Account created. Please sign in with your new Hostl ID.' }

    redirect('/inbox')
  } catch (err) {
    return { error: friendlyError(err) }
  }
}

export async function signIn(formData: FormData) {
  try {
    const rawHandle = (formData.get('handle') as string ?? '').replace('@', '').trim().toLowerCase()
    const password  = formData.get('password') as string

    if (!rawHandle || !password) return { error: 'Hostl ID and password are required.' }

    const admin = getAdminClient()

    // Look up by profiles table first (faster, no full user scan)
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('handle', rawHandle)
      .maybeSingle()

    if (!profile) return { error: 'No account found with that Hostl ID.' }

    // Get the synthetic email from auth.users
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listError) return { error: friendlyError(listError) }

    const matchedUser = users?.find((u) => u.id === profile.id)
    if (!matchedUser?.email) return { error: 'No account found with that Hostl ID.' }

    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: matchedUser.email,
      password,
    })
    if (error) return { error: friendlyError(error) }

    redirect('/inbox')
  } catch (err) {
    return { error: friendlyError(err) }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch { /* ignore */ }
  redirect('/login')
}

export async function forgotPassword(formData: FormData) {
  try {
    const rawHandle = (formData.get('handle') as string ?? '').replace('@', '').trim().toLowerCase()
    if (!rawHandle) return { error: 'Please enter your Hostl ID.' }

    const admin = getAdminClient()
    const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 })
    if (listError) return { error: friendlyError(listError) }

    const matchedUser = users?.find((u) => u.user_metadata?.handle?.toLowerCase() === rawHandle)
    if (!matchedUser?.email) return { success: true } // don't reveal if handle exists

    const supabase = await createClient()
    await supabase.auth.resetPasswordForEmail(matchedUser.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/reset-password`,
    })
    return { success: true }
  } catch (err) {
    return { error: friendlyError(err) }
  }
}

export async function resetPassword(formData: FormData) {
  try {
    const password = formData.get('password') as string
    const confirm  = formData.get('confirm_password') as string

    if (!password || password.length < 8) return { error: 'Password must be at least 8 characters.' }
    if (password !== confirm) return { error: 'Passwords do not match.' }

    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: friendlyError(error) }

    redirect('/inbox')
  } catch (err) {
    return { error: friendlyError(err) }
  }
}
