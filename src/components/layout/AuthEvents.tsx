'use client'

import { useEffect, useRef } from 'react'

/**
 * Fires auth events after login:
 * 1. Welcome message (once, on first login)
 * 2. New device alert (when signing in from an unrecognized device)
 *
 * Uses sessionStorage to avoid firing on every page navigation.
 * Only fires once per browser session.
 */
export default function AuthEvents() {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    if (typeof window === 'undefined') return

    // Only fire once per browser session
    const key = 'hostl_auth_events_fired'
    if (sessionStorage.getItem(key)) return

    fired.current = true
    sessionStorage.setItem(key, '1')

    // Fire both events in parallel
    Promise.all([
      fetch('/api/auth-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'welcome' }),
      }),
      fetch('/api/auth-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'new_device' }),
      }),
    ]).catch(() => {
      // Silent fail — these are non-critical notifications
    })
  }, [])

  return null
}
