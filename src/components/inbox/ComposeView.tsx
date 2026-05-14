'use client'

import { useState, useTransition, useRef, KeyboardEvent, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  AtSign, X, Loader2, Plus, FileText, CheckSquare,
  CalendarCheck, ClipboardList, Eye, Code2, Paperclip, File, Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createClient } from '@/lib/supabase/client'
import { sendMessage } from '@/app/(app)/actions'
import RichEditor from './RichEditor'
import type { MessageContentType, Attachment } from '@/types'

// ── Types ─────────────────────────────────────────────────────
interface RecipientProfile {
  id: string
  handle: string
  display_name: string
  avatar_url: string | null
}

// ── Message type config ───────────────────────────────────────
const MSG_TYPES: { value: MessageContentType; label: string; icon: React.ElementType }[] = [
  { value: 'text', label: 'Message', icon: FileText },
  { value: 'approval', label: 'Approval', icon: CheckSquare },
  { value: 'rsvp', label: 'RSVP', icon: CalendarCheck },
  { value: 'survey', label: 'Survey', icon: ClipboardList },
]

// ── Recipient tag with avatar ─────────────────────────────────
function RecipientTag({ profile, onRemove }: { profile: RecipientProfile; onRemove: () => void }) {
  const initials = profile.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
  return (
    <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium"
      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>
      <Avatar className="w-4 h-4">
        {profile.avatar_url
          ? <img src={profile.avatar_url} alt={profile.display_name} className="w-4 h-4 rounded-full object-cover" />
          : <AvatarFallback className="text-[8px]" style={{ backgroundColor: 'var(--color-hostl-200)', color: 'var(--color-hostl-700)' }}>
              {initials}
            </AvatarFallback>
        }
      </Avatar>
      @{profile.handle}
      <button type="button" onClick={onRemove} className="hover:opacity-70 ml-0.5">
        <X size={10} />
      </button>
    </span>
  )
}

// ── Handle input with live lookup ─────────────────────────────
function RecipientInput({
  label, recipients, onAdd, onRemove, maxRecipients = 4,
}: {
  label: string
  recipients: RecipientProfile[]
  onAdd: (p: RecipientProfile) => void
  onRemove: (id: string) => void
  maxRecipients?: number
}) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState<RecipientProfile[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const val = input.replace('@', '').trim().toLowerCase()
    if (!val || val.length < 2) { 
      setSuggestions([])
      setStatus('idle')
      return 
    }

    setStatus('loading')
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search-users?q=${encodeURIComponent(val)}`)
        const data = await response.json()

        if (data.results && data.results.length > 0) {
          setSuggestions(data.results)
          setStatus('found')
          setSelectedIndex(0)
        } else {
          setSuggestions([])
          setStatus('notfound')
        }
      } catch (error) {
        console.error('Search error:', error)
        setSuggestions([])
        setStatus('notfound')
      }
    }, 300)
  }, [input])

  function commit(profile?: RecipientProfile) {
    const profileToAdd = profile || suggestions[selectedIndex]
    if (profileToAdd && !recipients.find((r) => r.id === profileToAdd.id)) {
      if (recipients.length < maxRecipients) {
        onAdd(profileToAdd)
        setInput('')
        setSuggestions([])
        setStatus('idle')
        setSelectedIndex(0)
      }
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') { 
      e.preventDefault()
      if (suggestions.length > 0) {
        commit()
      }
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1))
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    }
    if (e.key === 'Backspace' && !input && recipients.length > 0) {
      onRemove(recipients[recipients.length - 1].id)
    }
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[42px] px-3 py-2 rounded-lg border cursor-text"
        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
        onClick={() => inputRef.current?.focus()}
      >
        {recipients.map((r) => (
          <RecipientTag key={r.id} profile={r} onRemove={() => onRemove(r.id)} />
        ))}
        {recipients.length < maxRecipients && (
          <div className="flex items-center gap-1 flex-1 min-w-[140px]">
            <AtSign size={13} style={{ color: 'var(--color-muted-foreground)' }} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value.replace(/[^a-zA-Z0-9_@-]/g, ''))}
              onKeyDown={onKeyDown}
              placeholder={recipients.length === 0 ? 'handle' : ''}
              className="flex-1 bg-transparent text-sm outline-none"
              style={{ color: 'var(--color-foreground)' }}
              autoComplete="off"
            />
          </div>
        )}
      </div>

      {/* Live suggestion */}
      {input.length > 1 && (
        <div className="rounded-lg border overflow-hidden"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)' }}>
          {status === 'loading' && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              <Loader2 size={12} className="animate-spin" /> Searching for @{input.replace('@', '')}…
            </div>
          )}
          {status === 'found' && suggestions.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              {suggestions.map((suggestion, index) => {
                const alreadyAdded = recipients.some((r) => r.id === suggestion.id)
                const isSelected = index === selectedIndex
                return (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => commit(suggestion)}
                    disabled={alreadyAdded}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors"
                    style={{ 
                      opacity: alreadyAdded ? 0.5 : 1,
                      backgroundColor: isSelected ? 'var(--color-accent)' : 'transparent'
                    }}
                    onMouseEnter={(e) => {
                      setSelectedIndex(index)
                      if (!alreadyAdded) e.currentTarget.style.backgroundColor = 'var(--color-accent)'
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent'
                    }}
                  >
                    <Avatar className="w-7 h-7 shrink-0">
                      {suggestion.avatar_url
                        ? <img src={suggestion.avatar_url} alt={suggestion.display_name} className="w-7 h-7 rounded-full object-cover" />
                        : <AvatarFallback className="text-xs" style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
                            {suggestion.display_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                          </AvatarFallback>
                      }
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                        {suggestion.display_name}
                      </div>
                      <div className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>
                        @{suggestion.handle}
                      </div>
                    </div>
                    {alreadyAdded && <span className="ml-auto text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Already added</span>}
                  </button>
                )
              })}
            </div>
          )}
          {status === 'notfound' && (
            <div className="px-3 py-2.5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              No accounts found for "{input.replace('@', '')}"
            </div>
          )}
        </div>
      )}

      {recipients.length >= maxRecipients && (
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          Maximum {maxRecipients} recipients
        </p>
      )}
    </div>
  )
}

// ── Main compose ──────────────────────────────────────────────
export default function ComposeView() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pre-fill from reply/forward URL params
  const prefillTo = searchParams.get('to') ?? ''
  const prefillSubject = searchParams.get('subject') ?? ''

  const [toRecipients, setToRecipients] = useState<RecipientProfile[]>([])
  const [ccRecipients, setCcRecipients] = useState<RecipientProfile[]>([])
  const [showCc, setShowCc] = useState(false)
  const [subject, setSubject] = useState(prefillSubject)
  const [contentType, setContentType] = useState<MessageContentType>('text')
  const [bodyMode, setBodyMode] = useState<'rich' | 'html'>('rich')
  const [richBody, setRichBody] = useState('')
  const [htmlBody, setHtmlBody] = useState('')
  const [showHtmlPreview, setShowHtmlPreview] = useState(false)
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [uploadingFile, setUploadingFile] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  // Get current user ID
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id)
    })
  }, [])

  // Track unsaved changes
  useEffect(() => {
    const hasContent = !!(subject.trim() || richBody.trim() || htmlBody.trim() || 
                       toRecipients.length > 0 || ccRecipients.length > 0 || 
                       attachments.length > 0)
    setHasUnsavedChanges(hasContent)
  }, [subject, richBody, htmlBody, toRecipients, ccRecipients, attachments])

  // Warn before leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Auto-save draft every 10 seconds
  useEffect(() => {
    if (!hasUnsavedChanges || !currentUserId) return

    const saveDraft = async () => {
      const body = bodyMode === 'html' ? htmlBody : richBody
      if (!body.trim() && !subject.trim()) return

      const draftData = {
        to: toRecipients,
        cc: ccRecipients,
        subject,
        body,
        bodyMode,
        contentType,
        attachments,
        savedAt: new Date().toISOString(),
      }

      localStorage.setItem(`draft_${currentUserId}`, JSON.stringify(draftData))
    }

    const interval = setInterval(saveDraft, 10000) // Save every 10 seconds
    return () => clearInterval(interval)
  }, [hasUnsavedChanges, currentUserId, toRecipients, ccRecipients, subject, richBody, htmlBody, bodyMode, contentType, attachments])

  // Load draft on mount
  useEffect(() => {
    if (!currentUserId) return

    const savedDraft = localStorage.getItem(`draft_${currentUserId}`)
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft)
        
        // Ask user if they want to restore draft
        const restore = window.confirm('You have an unsaved draft. Would you like to restore it?')
        if (restore) {
          setToRecipients(draft.to || [])
          setCcRecipients(draft.cc || [])
          setSubject(draft.subject || '')
          setBodyMode(draft.bodyMode || 'rich')
          setContentType(draft.contentType || 'text')
          setAttachments(draft.attachments || [])
          
          if (draft.bodyMode === 'html') {
            setHtmlBody(draft.body || '')
          } else {
            setRichBody(draft.body || '')
          }
          
          if (draft.cc && draft.cc.length > 0) {
            setShowCc(true)
          }
        } else {
          // Clear draft if user doesn't want to restore
          localStorage.removeItem(`draft_${currentUserId}`)
        }
      } catch (error) {
        console.error('Failed to restore draft:', error)
      }
    }
  }, [currentUserId])

  // Auto-add reply-to recipient
  useEffect(() => {
    if (!prefillTo) return
    const supabase = createClient()
    supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url')
      .eq('handle', prefillTo)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setToRecipients([data])
      })
  }, [prefillTo])

  const totalRecipients = toRecipients.length + ccRecipients.length

  // ── Handle file upload ────────────────────────────────────────
  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file size (25MB max)
    if (file.size > 25 * 1024 * 1024) {
      setError('File too large. Maximum size is 25MB.')
      return
    }

    setUploadingFile(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload-attachment', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed')
      }

      setAttachments((prev) => [...prev, result.attachment])
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setUploadingFile(false)
    }
  }

  function removeAttachment(id: string) {
    setAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (toRecipients.length === 0) { setError('Add at least one recipient.'); return }
    if (!subject.trim()) { setError('Subject is required.'); return }

    // Prevent self-messaging (check if user is sending to themselves)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const selfRecipient = [...toRecipients, ...ccRecipients].find(r => r.id === user.id)
        if (selfRecipient) {
          setError(`You cannot send messages to yourself (@${selfRecipient.handle}).`)
          return
        }
        
        // Continue with submission
        submitMessage()
      }
    })
  }

  function submitMessage() {
    const body = bodyMode === 'html' ? htmlBody : richBody
    if (!body.trim() || body === '<p></p>') { setError('Message body is required.'); return }

    const fd = new FormData()
    fd.set('to', toRecipients.map((r) => r.handle).join(','))
    fd.set('cc', ccRecipients.map((r) => r.handle).join(','))
    fd.set('subject', subject)
    fd.set('body', body)
    fd.set('content_type', contentType)
    fd.set('attachments', JSON.stringify(attachments.map((a) => a.id)))

    startTransition(async () => {
      const result = await sendMessage(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        // Clear draft after successful send
        if (currentUserId) {
          localStorage.removeItem(`draft_${currentUserId}`)
        }
        setHasUnsavedChanges(false)
      }
    })
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0"
        style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>
        <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>New message</h2>
        <button type="button" onClick={() => router.back()} className="p-1.5 rounded-md"
          style={{ color: 'var(--color-muted-foreground)' }}>
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-6 py-6 space-y-5">

          {/* To */}
          <RecipientInput
            label="To"
            recipients={toRecipients}
            onAdd={(p) => setToRecipients((prev) => [...prev, p])}
            onRemove={(id) => setToRecipients((prev) => prev.filter((r) => r.id !== id))}
          />

          {/* CC */}
          {!showCc ? (
            <button type="button" onClick={() => setShowCc(true)}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}>
              <Plus size={12} /> Add CC
            </button>
          ) : (
            <RecipientInput
              label="CC"
              recipients={ccRecipients}
              onAdd={(p) => setCcRecipients((prev) => [...prev, p])}
              onRemove={(id) => setCcRecipients((prev) => prev.filter((r) => r.id !== id))}
            />
          )}

          {/* Subject */}
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)}
              placeholder="What's this about?" />
          </div>

          {/* Message type — inline tabs */}
          <div className="space-y-1.5">
            <Label>Type</Label>
            <div className="flex gap-1.5 flex-wrap">
              {MSG_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setContentType(t.value)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
                  style={{
                    borderColor: contentType === t.value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: contentType === t.value ? 'var(--color-accent)' : 'transparent',
                    color: contentType === t.value ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                  }}
                >
                  <t.icon size={12} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body — rich text or HTML */}
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
              <RichEditor value={richBody} onChange={setRichBody} />
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    Write raw HTML — great for forms, custom layouts, and interactive content.
                  </p>
                  <button type="button" onClick={() => setShowHtmlPreview(!showHtmlPreview)}
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: 'var(--color-primary)' }}>
                    <Eye size={12} />
                    {showHtmlPreview ? 'Hide preview' : 'Preview'}
                  </button>
                </div>
                <textarea
                  value={htmlBody}
                  onChange={(e) => setHtmlBody(e.target.value)}
                  placeholder="<p>Your HTML here…</p>"
                  rows={10}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm resize-y focus:outline-none font-mono"
                  style={{
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-foreground)',
                    lineHeight: '1.6',
                  }}
                />
                {showHtmlPreview && htmlBody && (
                  <div className="rounded-lg border overflow-hidden"
                    style={{ borderColor: 'var(--color-border)' }}>
                    <div className="px-3 py-1.5 border-b text-xs font-medium"
                      style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-muted-foreground)' }}>
                      Preview
                    </div>
                    <div
                      className="p-4 prose prose-sm max-w-none"
                      style={{ backgroundColor: '#ffffff', color: '#202124' }}
                      dangerouslySetInnerHTML={{ __html: htmlBody }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Attachments</Label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile || attachments.length >= 5}
                className="flex items-center gap-1.5 text-xs font-medium disabled:opacity-50"
                style={{ color: 'var(--color-primary)' }}
              >
                <Paperclip size={12} />
                {uploadingFile ? 'Uploading...' : 'Add file'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.zip"
              />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--color-accent)' }}>
                      <File size={16} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                        {attachment.file_name}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {formatFileSize(attachment.file_size)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(attachment.id)}
                      className="p-1.5 rounded-md hover:bg-red-50"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {attachments.length >= 5 && (
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                Maximum 5 attachments per message
              </p>
            )}
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg" style={{
              backgroundColor: 'oklch(0.97 0.02 27)',
              color: 'var(--color-destructive)',
              border: '1px solid oklch(0.90 0.05 27)',
            }}>
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              {isPending
                ? <><Loader2 size={14} className="animate-spin mr-2" />Sending…</>
                : totalRecipients > 1 ? `Send to ${totalRecipients}` : 'Send'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                if (hasUnsavedChanges) {
                  const confirmDiscard = window.confirm('Discard unsaved changes?')
                  if (confirmDiscard) {
                    if (currentUserId) {
                      localStorage.removeItem(`draft_${currentUserId}`)
                    }
                    router.back()
                  }
                } else {
                  router.back()
                }
              }}>
              Discard
            </Button>
            {hasUnsavedChanges && (
              <span className="text-xs ml-auto" style={{ color: 'var(--color-muted-foreground)' }}>
                Draft auto-saved
              </span>
            )}
          </div>

        </form>
      </div>
    </div>
  )
}
