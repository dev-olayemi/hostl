'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface MessageBodyProps {
  body: string
  isHtml: boolean
}

/**
 * Renders message body with smart @handle detection.
 *
 * For plain text: scans for @handle patterns, verifies them against
 * the Hostl profiles DB, and highlights only real Hostl handles.
 *
 * For HTML: renders as-is (already styled by sender).
 *
 * Clicking a verified @handle opens compose pre-filled with that recipient.
 */
export default function MessageBody({ body, isHtml }: MessageBodyProps) {
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [verifiedHandles, setVerifiedHandles] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isHtml) return // HTML messages handle their own formatting

    // Extract all @handle candidates from the text
    const candidates = [...body.matchAll(/@([a-zA-Z0-9_-]{2,30})/g)]
      .map((m) => m[1].toLowerCase())
      .filter((v, i, a) => a.indexOf(v) === i) // unique

    if (candidates.length === 0) return

    // Verify which ones are real Hostl handles
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('handle')
      .in('handle', candidates)
      .then(({ data }) => {
        if (data) {
          setVerifiedHandles(new Set(data.map((p) => p.handle)))
        }
      })
  }, [body, isHtml])

  if (isHtml) {
    return (
      <div
        className="prose prose-sm max-w-none"
        style={{ color: 'var(--color-foreground)' }}
        dangerouslySetInnerHTML={{ __html: body }}
      />
    )
  }

  // Render plain text with @handle highlighting
  const parts = body.split(/(@[a-zA-Z0-9_-]{2,30})/g)

  return (
    <div
      ref={containerRef}
      className="text-sm leading-relaxed whitespace-pre-wrap"
      style={{ color: 'var(--color-foreground)' }}
    >
      {parts.map((part, i) => {
        if (part.startsWith('@')) {
          const handle = part.slice(1).toLowerCase()
          if (verifiedHandles.has(handle)) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => router.push(`/compose?to=${handle}`)}
                className="font-semibold rounded px-0.5 transition-colors cursor-pointer"
                style={{
                  color: 'var(--color-primary)',
                  backgroundColor: 'var(--color-accent)',
                }}
                title={`Send message to @${handle}`}
              >
                {part}
              </button>
            )
          }
          // Not a Hostl handle — render as plain text
          return <span key={i}>{part}</span>
        }
        return <span key={i}>{part}</span>
      })}
    </div>
  )
}
