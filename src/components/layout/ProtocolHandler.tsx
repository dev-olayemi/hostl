'use client'

import { useEffect } from 'react'

/**
 * Registers hostl:// as a custom protocol handler.
 * This allows links like hostl:@muhammed from any app (WhatsApp, Twitter, etc.)
 * to open Hostl compose pre-filled with that recipient.
 *
 * Usage from external apps:
 *   hostl:@muhammed          → opens /compose?to=muhammed
 *   hostl://compose?to=muhammed  → same
 *
 * The browser will ask the user once to allow the protocol association.
 */
export default function ProtocolHandler() {
  useEffect(() => {
    if (typeof navigator === 'undefined') return
    if (!('registerProtocolHandler' in navigator)) return

    try {
      // Register hostl: protocol — %s is replaced with the full URL
      navigator.registerProtocolHandler(
        'web+hostl',
        `${window.location.origin}/protocol?url=%s`,
        // @ts-expect-error — third arg (title) is deprecated but some browsers still need it
        'Hostl'
      )
    } catch {
      // Silently ignore — user may have already registered or browser doesn't support it
    }
  }, [])

  return null
}
