import { createBrowserClient } from '@supabase/ssr'

/**
 * Browser Supabase client.
 * Uses localStorage for session persistence — session survives page refreshes
 * and browser restarts as long as the user hasn't cleared storage or logged out.
 * The @supabase/ssr package handles token refresh automatically.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Persist session in localStorage so it survives browser restarts
        persistSession: true,
        // Auto-refresh the access token before it expires
        autoRefreshToken: true,
        // Detect session from URL (needed for password reset links)
        detectSessionInUrl: true,
        // Use localStorage (default) — survives browser close/reopen
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      },
      cookieOptions: {
        // Long-lived cookie — 400 days (browser max)
        maxAge: 400 * 24 * 60 * 60,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      },
    }
  )
}
