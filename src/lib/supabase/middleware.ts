import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Session middleware.
 *
 * On every request:
 * 1. Reads the session cookie
 * 2. If the access token is expired, silently refreshes it using the refresh token
 * 3. Writes the new tokens back to cookies with a long maxAge
 * 4. Protects app routes — redirects unauthenticated users to /login
 *
 * This is what keeps users logged in indefinitely (like GitHub):
 * - Access token: refreshed automatically before expiry
 * - Refresh token: rotates on each use, stored in a long-lived cookie
 * - Session only ends on explicit logout or cookie deletion
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write to request (for downstream server components)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          // Rebuild response with updated cookies
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Long-lived cookie — persists across browser restarts
              maxAge: 400 * 24 * 60 * 60,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production',
            })
          )
        },
      },
    }
  )

  // IMPORTANT: This call refreshes the access token if expired.
  // Do not remove — this is what keeps the session alive.
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // ── Protect app routes ────────────────────────────────────
  const isAppRoute =
    path.startsWith('/inbox') ||
    path.startsWith('/compose') ||
    path.startsWith('/settings')

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // Preserve the intended destination so we can redirect back after login
    url.searchParams.set('next', path)
    return NextResponse.redirect(url)
  }

  // ── Redirect logged-in users away from auth pages ─────────
  const isAuthRoute =
    path.startsWith('/login') ||
    path.startsWith('/signup') ||
    path.startsWith('/forgot-password')

  if (isAuthRoute && user) {
    // Respect ?next= param if present
    const next = request.nextUrl.searchParams.get('next') ?? '/inbox'
    const url = request.nextUrl.clone()
    url.pathname = next
    url.search = ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
