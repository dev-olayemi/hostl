'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Users, FileText, CheckSquare, CalendarCheck, ClipboardList, Code2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RichEditor from '@/components/inbox/RichEditor'
import { sendMassMessage } from '@/app/(app)/compose/mass-actions'
import type { MessageContentType } from '@/types'

const MSG_TYPES: { value: MessageContentType; label: string; icon: React.ElementType }[] = [
  { value: 'text',     label: 'Message',  icon: FileText },
  { value: 'approval', label: 'Approval', icon: CheckSquare },
  { value: 'rsvp',     label: 'RSVP',     icon: CalendarCheck },
  { value: 'survey',   label: 'Survey',   icon: ClipboardList },
]

export default function MassComposeView() {
  const router = useRouter()
  const [handles, setHandles] = useState('')
  const [subject, setSubject] = useState('')
  const [contentType, setContentType] = useState<MessageContentType>('text')
  const [bodyMode, setBodyMode] = useState<'rich' | 'html'>('rich')
  const [richBody, setRichBody] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleCount = handles.split(/[\s,\n]+/).filter((h) => h.trim()).length

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const body = bodyMode === 'html' ? htmlBody : richBody
    if (!handles.trim()) { setError('Add at least one recipient.'); return }
    if (!subject.trim()) { setError('Subject is required.'); return }
    if (!body.trim() || body === '<p></p>') { setError('Message body is required.'); return }
    if (handleCount > 50) { setError('Maximum 50 recipients per mass message.'); return }

    const fd = new FormData()
    fd.set('handles', handles)
    fd.set('subject', subject)
    fd.set('body', body)
    fd.set('content_type', contentType)

    startTransition(async () => {
      const res = await sendMassMessage(fd)
      if (res?.error) setError(res.error)
      else if (res?.success) setResult({ sent: res.sent })
    })
  }

  if (result) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4 px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'oklch(0.95 0.05 145)' }}>
          <Users size={24} style={{ color: 'oklch(0.45 0.18 145)' }} />
        </div>
        <div className="text-center space-y-1">
          <p className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
            Sent to {result.sent} {result.sent === 1 ? 'person' : 'people'}
          </p>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Your mass message has been delivered.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/inbox/sent')}>View sent</Button>
          <Button onClick={() => { setResult(null); setHandles(''); setSubject(''); setRichBody(''); setHtmlBody('') }}
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            Send another
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>
        <div className="flex items-center gap-2">
          <Users size={16} style={{ color: 'var(--color-primary)' }} />
          <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>Mass message</h2>
          <span className="text-xs px-2 py-0.5 rounded-full"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-muted-foreground)' }}>
            Up to 50 recipients
          </span>
        </div>
        <button type="button" onClick={() => router.back()} className="p-1.5 rounded-md"
          style={{ color: 'var(--color-muted-foreground)' }}>
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-6 space-y-5">

          {/* Recipients textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Recipients</Label>
              {handleCount > 0 && (
                <span className="text-xs" style={{ color: handleCount > 50 ? 'var(--color-destructive)' : 'var(--color-muted-foreground)' }}>
                  {handleCount}/50
                </span>
              )}
            </div>
            <textarea
              value={handles}
              onChange={(e) => setHandles(e.target.value)}
              placeholder="@handle1, @handle2, @handle3&#10;One per line or comma-separated"
              rows={4}
              className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none font-mono"
              style={{
                borderColor: handleCount > 50 ? 'var(--color-destructive)' : 'var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-foreground)',
                lineHeight: '1.6',
              }}
            />
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              Separate handles with commas, spaces, or new lines. Each recipient gets an individual message.
            </p>
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?" />
          </div>

          {/* Type */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-1.5 flex-wrap">
              {MSG_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setContentType(t.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    borderColor: contentType === t.value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: contentType === t.value ? 'var(--color-accent)' : 'transparent',
                    color: contentType === t.value ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                  }}>
                  <t.icon size={12} /> {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
              <div className="flex items-center gap-1 rounded-lg p-0.5"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <button type="button" onClick={() => setBodyMode('rich')}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: bodyMode === 'rich' ? 'var(--color-surface-raised)' : 'transparent',
                    color: bodyMode === 'rich' ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                  }}>
                  <FileText size={11} /> Text
                </button>
                <button type="button" onClick={() => setBodyMode('html')}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all"
                  style={{
                    backgroundColor: bodyMode === 'html' ? 'var(--color-surface-raised)' : 'transparent',
                    color: bodyMode === 'html' ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                  }}>
                  <Code2 size={11} /> HTML
                </button>
              </div>
            </div>

            {bodyMode === 'rich' ? (
              <RichEditor value={richBody} onChange={setRichBody} placeholder="Write your message…" />
            ) : (
              <div className="space-y-2">
                <textarea value={htmlBody} onChange={(e) => setHtmlBody(e.target.value)}
                  placeholder="<p>Your HTML here…</p>" rows={8}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm resize-y focus:outline-none font-mono"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-foreground)' }} />
                <button type="button" onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: 'var(--color-primary)' }}>
                  <Eye size={12} /> {showHtmlPreview ? 'Hide preview' : 'Preview'}
                </button>
                {showHtmlPreview && htmlBody && (
                  <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                    <div className="px-3 py-1.5 border-b text-xs font-medium"
                      style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-muted-foreground)' }}>
                      Preview
                    </div>
                    <div className="p-4 prose prose-sm max-w-none" style={{ backgroundColor: '#ffffff', color: '#202124' }}
                      dangerouslySetInnerHTML={{ __html: htmlBody }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Warning */}
          <div className="rounded-lg px-3 py-2.5 text-xs"
            style={{ backgroundColor: 'oklch(0.97 0.04 75)', border: '1px solid oklch(0.88 0.08 75)', color: 'oklch(0.50 0.15 55)' }}>
            ⚠ Mass messages are sent individually to each recipient. Use responsibly — abuse may result in account suspension.
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'oklch(0.97 0.02 27)', color: 'var(--color-destructive)', border: '1px solid oklch(0.90 0.05 27)' }}>
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending || handleCount > 50}
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              {isPending
                ? <><Loader2 size={14} className="animate-spin mr-2" />Sending…</>
                : <><Users size={14} className="mr-2" />Send to {handleCount || '…'}</>
              }
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>Discard</Button>
          </div>

        </form>
      </div>
    </div>
  )
}
