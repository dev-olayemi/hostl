import { redirect } from 'next/navigation'

/**
 * Protocol handler page — processes web+hostl: links from external apps.
 *
 * Examples:
 *   web+hostl:@muhammed          → /compose?to=muhammed
 *   web+hostl://compose?to=ola   → /compose?to=ola
 *   web+hostl:@muhammed,@ola     → /compose?to=muhammed,ola  (multi-recipient)
 */
export default async function ProtocolPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>
}) {
  const { url } = await searchParams

  if (!url) redirect('/inbox')

  try {
    const decoded = decodeURIComponent(url)

    // Pattern: web+hostl:@handle or web+hostl:@handle1,@handle2
    const handleMatch = decoded.match(/^web\+hostl:@?([a-zA-Z0-9_,@-]+)/)
    if (handleMatch) {
      const handles = handleMatch[1]
        .split(',')
        .map((h) => h.replace('@', '').trim().toLowerCase())
        .filter(Boolean)

      if (handles.length === 1) {
        // Single handle — go to compose pre-filled
        redirect(`/compose?to=${handles[0]}`)
      } else {
        // Multiple handles — go to compose with all
        redirect(`/compose?to=${handles.join(',')}`)
      }
    }

    // Pattern: web+hostl://compose?to=handle
    const urlMatch = decoded.match(/^web\+hostl:\/\/(.+)/)
    if (urlMatch) {
      const path = urlMatch[1]
      redirect(`/${path}`)
    }
  } catch {
    // ignore parse errors
  }

  redirect('/compose')
}
