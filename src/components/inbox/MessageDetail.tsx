'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Star, Archive, Trash2, Reply, Forward,
  CheckSquare, CalendarCheck, ClipboardList, FileText,
  Check, X, MoreHorizontal, ChevronDown, ChevronUp,
  MailOpen, FolderInput, BellOff, Flag, ShieldOff,
  Printer, ExternalLink, Clock, Loader2, File, Download,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SimpleMenu } from '@/components/ui/simple-menu'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import { isSystemProfile } from '@/lib/system'
import MessageBody from './MessageBody'
import {
  archiveMessage, trashMessage, markRead, markImportant,
  muteMessage, reportMessage, blockUser,
} from '@/app/(app)/message-actions'
import type { Message } from '@/types'

interface MessageDetailProps {
  message: Message
  onClose: () => void
  onToggleImportant: () => void
  onArchive?: () => void
  onDelete?: () => void
  onMarkUnread?: () => void
}

const CONTENT_TYPE_CONFIG = {
  approval:  { icon: CheckSquare, label: 'Approval Request', color: 'var(--color-hostl-600)' },
  rsvp:      { icon: CalendarCheck, label: 'RSVP',           color: 'oklch(0.55 0.18 145)' },
  survey:    { icon: ClipboardList, label: 'Survey',          color: 'oklch(0.55 0.18 220)' },
  html_form: { icon: FileText,      label: 'Form',            color: 'oklch(0.55 0.18 300)' },
  text:      { icon: null,          label: null,              color: null },
}

export default function MessageDetail({
  message, onClose, onToggleImportant, onArchive, onDelete, onMarkUnread,
}: MessageDetailProps) {
  const router = useRouter()
  const [actionState, setActionState] = useState<'idle' | 'approved' | 'declined' | 'submitted'>('idle')
  const [showDetails, setShowDetails] = useState(false)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [localImportant, setLocalImportant] = useState(message.is_important)
  const [isPending, startTransition] = useTransition()
  const [submittingResponse, setSubmittingResponse] = useState(false)

  // Check if already responded
  useEffect(() => {
    if (message.action_completed && message.action_data) {
      const data = message.action_data as { type?: string; value?: string }
      if (data.type === 'approval') {
        setActionState(data.value === 'approved' ? 'approved' : 'declined')
      } else if (data.type === 'rsvp') {
        setActionState(data.value === 'yes' ? 'approved' : 'declined')
      } else {
        setActionState('submitted')
      }
    }
  }, [message.action_completed, message.action_data])

  const { from_profile, to_profile, subject, body, content_type, created_at } = message
  const config = CONTENT_TYPE_CONFIG[content_type]
  const isHtml = /<[a-z][\s\S]*>/i.test(body)

  const initials = (from_profile?.display_name ?? '?')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true })
  const fullDate = format(new Date(created_at), 'MMM d, yyyy, h:mm a')

  // ── Actions ────────────────────────────────────────────────
  function run(fn: () => Promise<unknown>) {
    startTransition(async () => { await fn() })
  }

  function handleArchive() {
    run(async () => { await archiveMessage(message.id); onArchive?.() })
  }

  function handleDelete() {
    run(async () => { await trashMessage(message.id); onDelete?.() })
  }

  function handleMarkUnread() {
    run(async () => { await markRead(message.id, false); onMarkUnread?.() })
  }

  function handleToggleStar() {
    const next = !localImportant
    setLocalImportant(next)
    run(async () => { await markImportant(message.id, next); onToggleImportant() })
  }

  function handleMute() {
    run(() => muteMessage(message.id, true))
  }

  function handleReport(reason: string) {
    run(async () => {
      await reportMessage(message.id, from_profile?.handle ?? '', reason)
      setShowReportMenu(false)
    })
  }

  function handleBlock() {
    if (!from_profile?.handle) return
    run(() => blockUser(from_profile.handle))
  }

  function handleReply() {
    router.push(`/compose?reply=${message.id}&to=${from_profile?.handle ?? ''}&subject=${encodeURIComponent(`Re: ${subject}`)}`)
  }

  function handleForward() {
    router.push(`/compose?forward=${message.id}&subject=${encodeURIComponent(`Fwd: ${subject}`)}`)
  }

  function handlePrint() { window.print() }

  async function submitResponse(responseType: string, responseValue: string) {
    setSubmittingResponse(true)
    try {
      const response = await fetch('/api/message-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          response: responseValue,
          responseType,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit response')
      }

      // Update local state
      if (responseType === 'approval') {
        setActionState(responseValue === 'approved' ? 'approved' : 'declined')
      } else if (responseType === 'rsvp') {
        setActionState(responseValue === 'yes' ? 'approved' : 'declined')
      } else {
        setActionState('submitted')
      }
    } catch (error) {
      console.error('Response submission error:', error)
      alert('Failed to submit response. Please try again.')
    } finally {
      setSubmittingResponse(false)
    }
  }

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // ── Toolbar button ─────────────────────────────────────────
  const ToolbarBtn = ({ onClick, title, active, children }: {
    onClick?: () => void; title: string; active?: boolean; children: React.ReactNode
  }) => (
    <button onClick={onClick} title={title}
      className="p-2 rounded-lg transition-colors"
      style={{ color: active ? 'var(--color-primary)' : 'var(--color-muted-foreground)' }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      {children}
    </button>
  )

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>

        <ToolbarBtn onClick={onClose} title="Back">
          <ArrowLeft size={17} className="md:hidden" />
        </ToolbarBtn>

        <ToolbarBtn onClick={handleArchive} title="Archive">
          <Archive size={17} />
        </ToolbarBtn>

        <ToolbarBtn onClick={handleDelete} title="Move to trash">
          <Trash2 size={17} />
        </ToolbarBtn>

        <ToolbarBtn onClick={handleMarkUnread} title="Mark as unread">
          <MailOpen size={17} />
        </ToolbarBtn>

        <ToolbarBtn title="Snooze (coming soon)">
          <Clock size={17} />
        </ToolbarBtn>

        {/* More — left side */}
        <SimpleMenu
          trigger={<MoreHorizontal size={17} />}
          align="start"
          items={[
            { label: 'Mark as unread',      icon: MailOpen,      onClick: handleMarkUnread },
            { label: 'Mute conversation',   icon: BellOff,       onClick: handleMute },
            { label: 'Print',               icon: Printer,       onClick: handlePrint },
            { separator: true },
            { label: 'Report',              icon: Flag,          onClick: () => setShowReportMenu(true), warning: true },
            { label: `Block @${from_profile?.handle}`, icon: ShieldOff, onClick: handleBlock, danger: true },
          ]}
        />

        <div className="flex-1" />

        {isPending && <Loader2 size={14} className="animate-spin mr-1" style={{ color: 'var(--color-muted-foreground)' }} />}

        {/* Star */}
        <ToolbarBtn onClick={handleToggleStar} title={localImportant ? 'Remove star' : 'Star'} active={localImportant}>
          <Star size={17}
            fill={localImportant ? 'oklch(0.72 0.18 75)' : 'none'}
            style={{ color: localImportant ? 'oklch(0.72 0.18 75)' : 'var(--color-muted-foreground)' }}
          />
        </ToolbarBtn>

        {/* Reply */}
        <ToolbarBtn onClick={handleReply} title="Reply">
          <Reply size={17} />
        </ToolbarBtn>

        {/* More — right side */}
        <SimpleMenu
          trigger={<MoreHorizontal size={17} />}
          align="end"
          items={[
            { label: 'Reply',   icon: Reply,   onClick: handleReply },
            { label: 'Forward', icon: Forward, onClick: handleForward },
          ]}
        />
      </div>

      {/* ── Message content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* Subject + type badge */}
          <div className="flex items-start gap-3 flex-wrap">
            <h1 className="text-xl font-semibold flex-1 leading-snug" style={{ color: 'var(--color-foreground)' }}>
              {subject}
            </h1>
            {config.label && config.icon && (
              <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                style={{ backgroundColor: 'var(--color-accent)', color: config.color }}>
                <config.icon size={11} />
                {config.label}
              </span>
            )}
          </div>

          {/* Sender row */}
          <div className="flex items-start gap-3">
            <Avatar className="w-10 h-10 shrink-0 mt-0.5">
              {from_profile?.avatar_url
                ? <img src={from_profile.avatar_url} alt={from_profile.display_name} className="w-10 h-10 rounded-full object-cover" />
                : <AvatarFallback className="text-sm font-semibold"
                    style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
                    {initials}
                  </AvatarFallback>
              }
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  {from_profile?.display_name}
                </span>
                {from_profile?.verified && (
                  <>
                    {/* System accounts get both the service (shield/purple) + verified (circle/blue) badges */}
                    {isSystemProfile(from_profile) ? (
                      <>
                        <VerifiedBadge accountType="service" size={15} />
                        <VerifiedBadge accountType="personal" size={15} />
                      </>
                    ) : (
                      <VerifiedBadge accountType={from_profile.account_type} size={15} />
                    )}
                  </>
                )}
                {from_profile?.account_type && from_profile.account_type !== 'personal' && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full capitalize"
                    style={{ backgroundColor: 'var(--color-border-subtle)', color: 'var(--color-muted-foreground)' }}>
                    {isSystemProfile(from_profile) ? 'System' : from_profile.account_type}
                  </span>
                )}
              </div>

              <button type="button" onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 mt-0.5 text-xs"
                style={{ color: 'var(--color-muted-foreground)' }}>
                <span>to @{to_profile?.handle ?? 'me'}</span>
                {showDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {showDetails && (
                <div className="mt-3 rounded-xl p-4 text-xs space-y-2"
                  style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
                  {[
                    { label: 'From',    value: `${from_profile?.display_name ?? ''} @${from_profile?.handle ?? ''}` },
                    { label: 'To',      value: `${to_profile?.display_name ?? ''} @${to_profile?.handle ?? ''}` },
                    { label: 'Date',    value: fullDate },
                    { label: 'Subject', value: subject },
                    { label: 'Type',    value: config.label ?? 'Message' },
                    { label: 'Account', value: isSystemProfile(from_profile) ? 'System' : (from_profile?.account_type ?? 'personal') },
                  ].filter(({ value }) => value.trim()).map(({ label, value }) => (
                    <div key={label} className="flex gap-2 flex-wrap">
                      <span className="shrink-0 font-medium w-14 text-right" style={{ color: 'var(--color-muted-foreground)' }}>
                        {label}
                      </span>
                      <span className="flex-1 min-w-0 wrap-break-word" style={{ color: 'var(--color-foreground)' }}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs shrink-0 mt-1" style={{ color: 'var(--color-muted-foreground)' }} title={fullDate}>
              {timeAgo}
            </div>
          </div>

          <Separator style={{ backgroundColor: 'var(--color-border-subtle)' }} />

          {/* Body */}
          <MessageBody body={body} isHtml={isHtml} />

          {/* Security Flags */}
          {message.security_flags && Array.isArray(message.security_flags) && message.security_flags.length > 0 && (
            <div className="rounded-lg border overflow-hidden"
              style={{ 
                borderColor: message.security_score && message.security_score < 30 
                  ? 'oklch(0.85 0.05 27)' 
                  : message.security_score && message.security_score < 60
                  ? 'oklch(0.85 0.05 60)'
                  : 'oklch(0.85 0.05 220)',
                backgroundColor: 'var(--color-surface-raised)'
              }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b"
                style={{ 
                  borderColor: 'var(--color-border-subtle)',
                  backgroundColor: message.security_score && message.security_score < 30 
                    ? 'oklch(0.98 0.02 27)' 
                    : message.security_score && message.security_score < 60
                    ? 'oklch(0.98 0.02 60)'
                    : 'oklch(0.98 0.02 220)'
                }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ 
                      backgroundColor: message.security_score && message.security_score < 30 
                        ? 'oklch(0.95 0.05 27)' 
                        : message.security_score && message.security_score < 60
                        ? 'oklch(0.95 0.05 60)'
                        : 'oklch(0.95 0.05 220)'
                    }}>
                    <ShieldOff size={16} 
                      style={{ 
                        color: message.security_score && message.security_score < 30 
                          ? 'var(--color-destructive)' 
                          : message.security_score && message.security_score < 60
                          ? 'oklch(0.50 0.15 60)'
                          : 'oklch(0.50 0.15 220)'
                      }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                      Security Analysis
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {message.security_flags.length} {message.security_flags.length === 1 ? 'issue' : 'issues'} detected
                    </p>
                  </div>
                </div>
                {message.security_score !== undefined && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      Trust Score
                    </span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md"
                      style={{ 
                        backgroundColor: message.security_score >= 60 
                          ? 'oklch(0.95 0.05 145)' 
                          : message.security_score >= 30 
                          ? 'oklch(0.95 0.05 60)' 
                          : 'oklch(0.95 0.05 27)',
                        border: `1px solid ${
                          message.security_score >= 60 
                            ? 'oklch(0.85 0.08 145)' 
                            : message.security_score >= 30 
                            ? 'oklch(0.85 0.08 60)' 
                            : 'oklch(0.85 0.08 27)'
                        }`
                      }}>
                      <span className="text-sm font-bold"
                        style={{ 
                          color: message.security_score >= 60 
                            ? 'oklch(0.40 0.18 145)' 
                            : message.security_score >= 30 
                            ? 'oklch(0.45 0.15 60)' 
                            : 'var(--color-destructive)'
                        }}>
                        {message.security_score}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>/100</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Flags List */}
              <div className="divide-y" style={{ borderColor: 'var(--color-border-subtle)' }}>
                {message.security_flags.map((flag: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 px-4 py-3">
                    {/* Icon */}
                    <div className="w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                      style={{ 
                        backgroundColor: flag.severity >= 70 
                          ? 'oklch(0.95 0.05 27)' 
                          : flag.severity >= 40 
                          ? 'oklch(0.95 0.05 60)' 
                          : 'oklch(0.95 0.05 220)',
                        border: `1px solid ${
                          flag.severity >= 70 
                            ? 'oklch(0.85 0.08 27)' 
                            : flag.severity >= 40 
                            ? 'oklch(0.85 0.08 60)' 
                            : 'oklch(0.85 0.08 220)'
                        }`
                      }}>
                      {flag.type === 'keyword' && <FileText size={14} style={{ color: flag.severity >= 70 ? 'var(--color-destructive)' : flag.severity >= 40 ? 'oklch(0.50 0.15 60)' : 'oklch(0.50 0.15 220)' }} />}
                      {flag.type === 'url' && <ExternalLink size={14} style={{ color: flag.severity >= 70 ? 'var(--color-destructive)' : flag.severity >= 40 ? 'oklch(0.50 0.15 60)' : 'oklch(0.50 0.15 220)' }} />}
                      {flag.type === 'attachment' && <File size={14} style={{ color: flag.severity >= 70 ? 'var(--color-destructive)' : flag.severity >= 40 ? 'oklch(0.50 0.15 60)' : 'oklch(0.50 0.15 220)' }} />}
                      {flag.type === 'sender' && <MailOpen size={14} style={{ color: flag.severity >= 70 ? 'var(--color-destructive)' : flag.severity >= 40 ? 'oklch(0.50 0.15 60)' : 'oklch(0.50 0.15 220)' }} />}
                      {flag.type === 'blocked' && <ShieldOff size={14} style={{ color: 'var(--color-destructive)' }} />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                          {flag.type === 'keyword' && 'Suspicious Content'}
                          {flag.type === 'url' && 'Suspicious Link'}
                          {flag.type === 'attachment' && 'Suspicious Attachment'}
                          {flag.type === 'sender' && 'Sender Pattern'}
                          {flag.type === 'blocked' && 'Blocked Sender'}
                        </p>
                        {flag.severity !== undefined && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded uppercase tracking-wide shrink-0"
                            style={{ 
                              backgroundColor: flag.severity >= 70 
                                ? 'oklch(0.95 0.05 27)' 
                                : flag.severity >= 40 
                                ? 'oklch(0.95 0.05 60)' 
                                : 'oklch(0.95 0.05 220)',
                              color: flag.severity >= 70 
                                ? 'var(--color-destructive)' 
                                : flag.severity >= 40 
                                ? 'oklch(0.50 0.15 60)' 
                                : 'oklch(0.50 0.15 220)',
                              border: `1px solid ${
                                flag.severity >= 70 
                                  ? 'oklch(0.85 0.08 27)' 
                                  : flag.severity >= 40 
                                  ? 'oklch(0.85 0.08 60)' 
                                  : 'oklch(0.85 0.08 220)'
                              }`
                            }}>
                            {flag.severity >= 70 ? 'High' : flag.severity >= 40 ? 'Medium' : 'Low'}
                          </span>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed mb-1" style={{ color: 'var(--color-muted-foreground)' }}>
                        {flag.description}
                      </p>
                      {flag.value && (
                        <code className="text-[11px] px-1.5 py-0.5 rounded font-mono"
                          style={{ 
                            backgroundColor: 'var(--color-surface)',
                            color: 'var(--color-foreground)',
                            border: '1px solid var(--color-border-subtle)'
                          }}>
                          {flag.value}
                        </code>
                      )}
                      {flag.context && (
                        <p className="text-[10px] mt-1.5 flex items-center gap-1"
                          style={{ color: 'var(--color-muted-foreground)' }}>
                          <span className="w-1 h-1 rounded-full" style={{ backgroundColor: 'var(--color-muted-foreground)' }} />
                          {flag.context === 'trusted_sender' && 'Severity reduced: Trusted sender'}
                          {flag.context === 'existing_conversation' && 'Severity reduced: Existing conversation'}
                          {flag.context === 'first_contact' && 'Severity increased: First contact'}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Warning */}
              {(message.category === 'suspicious' || message.category === 'isolated') && (
                <div className="px-4 py-3 border-t"
                  style={{ 
                    borderColor: 'var(--color-border-subtle)',
                    backgroundColor: message.category === 'isolated' 
                      ? 'oklch(0.98 0.02 27)' 
                      : 'oklch(0.98 0.02 60)'
                  }}>
                  <div className="flex items-start gap-2.5">
                    <Flag size={14} className="mt-0.5 shrink-0"
                      style={{ 
                        color: message.category === 'isolated' 
                          ? 'var(--color-destructive)' 
                          : 'oklch(0.50 0.15 60)'
                      }} />
                    <div>
                      <p className="text-xs font-medium mb-0.5"
                        style={{ 
                          color: message.category === 'isolated' 
                            ? 'var(--color-destructive)' 
                            : 'oklch(0.45 0.15 60)'
                        }}>
                        {message.category === 'isolated' ? 'Message Isolated' : 'Message Flagged'}
                      </p>
                      <p className="text-[11px] leading-relaxed"
                        style={{ color: 'var(--color-muted-foreground)' }}>
                        {message.category === 'isolated' 
                          ? 'This message has been quarantined for your protection. Do not interact with any links or attachments.'
                          : 'This message has been flagged as potentially suspicious. Exercise caution with links and attachments.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                {message.attachments.length} {message.attachments.length === 1 ? 'Attachment' : 'Attachments'}
              </p>
              <div className="space-y-2">
                {message.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.storage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors"
                    style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-surface)')}
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
                    <Download size={16} style={{ color: 'var(--color-muted-foreground)' }} />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Interactive action area */}
          {content_type !== 'text' && (
            <div className="rounded-xl p-5 space-y-4 border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-subtle)' }}>
              {actionState === 'idle' && (
                <>
                  {content_type === 'approval' && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Your response</p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => submitResponse('approval', 'approved')} 
                          disabled={submittingResponse}
                          className="flex-1 gap-2"
                          style={{ backgroundColor: 'oklch(0.55 0.18 145)', color: 'white' }}>
                          <Check size={15} /> {submittingResponse ? 'Submitting...' : 'Approve'}
                        </Button>
                        <Button 
                          onClick={() => submitResponse('approval', 'declined')} 
                          disabled={submittingResponse}
                          variant="outline" 
                          className="flex-1 gap-2"
                          style={{ color: 'var(--color-destructive)', borderColor: 'var(--color-destructive)' }}>
                          <X size={15} /> {submittingResponse ? 'Submitting...' : 'Decline'}
                        </Button>
                      </div>
                    </div>
                  )}
                  {content_type === 'rsvp' && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Will you attend?</p>
                      <div className="flex gap-3">
                        <Button 
                          onClick={() => submitResponse('rsvp', 'yes')} 
                          disabled={submittingResponse}
                          className="flex-1"
                          style={{ backgroundColor: 'oklch(0.55 0.18 145)', color: 'white' }}>
                          {submittingResponse ? 'Submitting...' : "Yes, I'll be there"}
                        </Button>
                        <Button 
                          onClick={() => submitResponse('rsvp', 'no')} 
                          disabled={submittingResponse}
                          variant="outline" 
                          className="flex-1">
                          {submittingResponse ? 'Submitting...' : "Can't make it"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {(content_type === 'survey' || content_type === 'html_form') && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Complete this form</p>
                      <Button 
                        onClick={() => submitResponse('survey', 'completed')} 
                        disabled={submittingResponse}
                        className="w-full"
                        style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                        {submittingResponse ? 'Submitting...' : 'Submit response'}
                      </Button>
                    </div>
                  )}
                </>
              )}
              {actionState !== 'idle' && (
                <div className="flex items-center gap-3 py-1">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: actionState === 'declined' ? 'oklch(0.97 0.02 27)' : 'oklch(0.95 0.05 145)' }}>
                    {actionState === 'declined'
                      ? <X size={16} style={{ color: 'var(--color-destructive)' }} />
                      : <Check size={16} style={{ color: 'oklch(0.45 0.18 145)' }} />
                    }
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {actionState === 'approved' && 'Approved'}
                      {actionState === 'declined' && 'Declined'}
                      {actionState === 'submitted' && 'Submitted'}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      Response sent to {from_profile?.display_name}
                    </p>
                  </div>
                  <button onClick={() => setActionState('idle')} className="ml-auto text-xs underline"
                    style={{ color: 'var(--color-muted-foreground)' }}>
                    Undo
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bottom Reply / Forward */}
          <div className="flex items-center gap-2 pt-2 flex-wrap">
            <Button variant="outline" className="gap-2" onClick={handleReply}>
              <Reply size={14} /> Reply
            </Button>
            <Button variant="outline" className="gap-2" onClick={handleForward}>
              <Forward size={14} /> Forward
            </Button>
          </div>

        </div>
      </div>

      {/* Report modal */}
      {showReportMenu && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center"
          style={{ backgroundColor: 'oklch(0 0 0 / 0.4)' }}
          onClick={() => setShowReportMenu(false)}>
          <div className="rounded-xl p-6 w-full max-w-sm space-y-4"
            style={{ backgroundColor: 'var(--color-surface-raised)', border: '1px solid var(--color-border)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
              Report this message
            </h3>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              Why are you reporting this message?
            </p>
            <div className="space-y-2">
              {['Spam', 'Harassment or abuse', 'Phishing or scam', 'Impersonation', 'Other'].map((reason) => (
                <button key={reason} type="button"
                  className="w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors"
                  style={{ border: '1px solid var(--color-border)', color: 'var(--color-foreground)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  onClick={() => handleReport(reason)}>
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => setShowReportMenu(false)} className="text-sm w-full text-center"
              style={{ color: 'var(--color-muted-foreground)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
