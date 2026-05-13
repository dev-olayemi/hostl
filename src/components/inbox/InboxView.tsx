'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  Search, RefreshCw, PenSquare, Mail, CheckSquare,
  CalendarCheck, UserCircle, Archive, Trash2, MailOpen,
  Star, X, Check
} from 'lucide-react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import MessageRow from './MessageRow'
import MessageDetail from './MessageDetail'
import { createClient } from '@/lib/supabase/client'
import {
  bulkMarkRead, bulkArchive, bulkTrash, bulkMarkImportant,
  markRead as markReadAction,
} from '@/app/(app)/message-actions'
import type { Message, MessageCategory } from '@/types'

const CATEGORY_LABELS: Record<MessageCategory, string> = {
  inbox: 'Inbox', important: 'Important', sent: 'Sent',
  drafts: 'Drafts', archived: 'Archived', trash: 'Trash',
  isolated: 'Isolated', suspicious: 'Suspicious',
}

const ONBOARDING_TIPS = [
  { icon: Mail,         title: 'Send your first message',   desc: 'Use Compose to send a message to any @handle.' },
  { icon: CheckSquare,  title: 'Try an approval request',   desc: 'Send an approval — the recipient can approve or decline right inside the message.' },
  { icon: CalendarCheck,title: 'Send an RSVP',              desc: 'Invite someone to an event and get their response without any back-and-forth.' },
  { icon: UserCircle,   title: 'Complete your profile',     desc: 'Add a photo and bio so people know who you are when they receive your messages.' },
]

interface InboxViewProps { category: MessageCategory }

export default function InboxView({ category }: InboxViewProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [search, setSearch] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    loadMessages()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  async function loadMessages() {
    setLoading(true)
    setSelected(new Set())
    const supabase = createClient()

    // Wait for session to be ready
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      // Try getUser as fallback
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    let query = supabase
      .from('messages')
      .select(`
        *,
        from_profile:profiles!messages_from_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system),
        to_profile:profiles!messages_to_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system)
      `)
      .order('created_at', { ascending: false })

    if (category === 'sent') {
      query = query.eq('from_profile_id', user.id)
    } else {
      query = query.eq('to_profile_id', user.id).eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('InboxView query error:', error.message, error.code, error.details)
    }

    console.log('InboxView loaded:', { category, userId: user.id, count: data?.length, error: error?.message })
    setMessages(((data as unknown) as Message[]) ?? [])
    setLoading(false)
  }

  const filtered = messages.filter((m) =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from_profile?.display_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.from_profile?.handle?.toLowerCase().includes(search.toLowerCase())
  )

  const unreadCount = messages.filter((m) => !m.is_read).length
  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id))
  const someSelected = selected.size > 0

  // ── Selection helpers ──────────────────────────────────────
  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(filtered.map((m) => m.id)))
    }
  }

  function clearSelection() { setSelected(new Set()) }

  // ── Local state helpers ────────────────────────────────────
  function removeMessages(ids: string[]) {
    setMessages((prev) => prev.filter((m) => !ids.includes(m.id)))
    if (selectedMessage && ids.includes(selectedMessage.id)) setSelectedMessage(null)
    setSelected(new Set())
  }

  function updateMessages(ids: string[], patch: Partial<Message>) {
    setMessages((prev) => prev.map((m) => ids.includes(m.id) ? { ...m, ...patch } : m))
    if (selectedMessage && ids.includes(selectedMessage.id)) {
      setSelectedMessage((prev) => prev ? { ...prev, ...patch } : prev)
    }
  }

  // ── Single message actions ─────────────────────────────────
  function markRead(id: string, isRead = true) {
    // Update local state immediately for instant UI feedback
    updateMessages([id], { is_read: isRead })
    // Persist to DB — use the server action which has proper auth
    markReadAction(id, isRead).catch((err) => {
      console.error('markRead failed:', err)
      // Revert local state if DB update failed
      updateMessages([id], { is_read: !isRead })
    })
  }

  function toggleImportant(id: string) {
    const msg = messages.find((m) => m.id === id)
    if (!msg) return
    const next = !msg.is_important
    updateMessages([id], { is_important: next })
    const supabase = createClient()
    supabase.from('messages').update({ is_important: next }).eq('id', id)
  }

  // ── Bulk actions ───────────────────────────────────────────
  function bulkAction(fn: (ids: string[]) => Promise<unknown>, patch?: Partial<Message>, remove = false) {
    const ids = Array.from(selected)
    if (patch) updateMessages(ids, patch)
    if (remove) removeMessages(ids)
    startTransition(async () => { await fn(ids) })
  }

  const isEmpty = !loading && filtered.length === 0

  return (
    <div className="flex h-full">

      {/* ── Message list ── */}
      <div
        className={`flex flex-col border-r transition-all ${selectedMessage ? 'hidden md:flex md:w-80 lg:w-96' : 'flex-1'}`}
        style={{ borderColor: 'var(--color-border-subtle)' }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>

          {/* Bulk toolbar — shown when items selected */}
          {someSelected ? (
            <div className="flex items-center gap-1 mb-3">
              <button onClick={clearSelection} className="p-1.5 rounded-md mr-1"
                style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={15} />
              </button>
              <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-foreground)' }}>
                {selected.size} selected
              </span>
              <button
                onClick={() => bulkAction((ids) => bulkMarkRead(ids, true), { is_read: true })}
                title="Mark as read" className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <MailOpen size={15} />
              </button>
              <button
                onClick={() => bulkAction((ids) => bulkMarkRead(ids, false), { is_read: false })}
                title="Mark as unread" className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Mail size={15} />
              </button>
              <button
                onClick={() => bulkAction((ids) => bulkMarkImportant(ids, true), { is_important: true })}
                title="Star all" className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Star size={15} />
              </button>
              <button
                onClick={() => bulkAction(bulkArchive, undefined, true)}
                title="Archive all" className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Archive size={15} />
              </button>
              <button
                onClick={() => bulkAction(bulkTrash, undefined, true)}
                title="Delete all" className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-destructive)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'oklch(0.97 0.02 27)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <Trash2 size={15} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Select all checkbox */}
                <button
                  onClick={toggleSelectAll}
                  className="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                  style={{
                    borderColor: allSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: allSelected ? 'var(--color-primary)' : 'transparent',
                  }}
                  title="Select all"
                >
                  {allSelected && <Check size={10} style={{ color: 'var(--color-primary-foreground)' }} />}
                </button>
                <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
                  {CATEGORY_LABELS[category]}
                </h2>
                {unreadCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold min-w-[20px] text-center"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              <button onClick={loadMessages} className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }} title="Refresh"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }} />
            <Input placeholder="Search messages…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
              style={{ backgroundColor: 'var(--color-surface)' }} />
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : isEmpty && category === 'inbox' ? (
            <div className="px-5 py-8 space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Your inbox is empty</p>
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Here's what you can do with Hostl:</p>
              </div>
              <div className="space-y-3">
                {ONBOARDING_TIPS.map((tip) => (
                  <div key={tip.title} className="flex items-start gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-primary)' }}>
                      <tip.icon size={16} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>{tip.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{tip.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/compose">
                <Button className="w-full gap-2" style={{
                  backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)',
                }}>
                  <PenSquare size={14} /> Send your first message
                </Button>
              </Link>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-20">
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {search ? 'No results found' : 'Nothing here yet'}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                {search ? 'Try a different search term' : 'Messages will appear here'}
              </p>
            </div>
          ) : (
            filtered.map((message) => (
              <MessageRow
                key={message.id}
                message={message}
                isSelected={selectedMessage?.id === message.id}
                isChecked={selected.has(message.id)}
                onSelect={() => { setSelectedMessage(message); markRead(message.id) }}
                onToggleImportant={() => toggleImportant(message.id)}
                onToggleCheck={() => toggleSelect(message.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Message detail ── */}
      {selectedMessage ? (
        <div className="flex-1 overflow-hidden">
          <MessageDetail
            message={selectedMessage}
            onClose={() => setSelectedMessage(null)}
            onToggleImportant={() => toggleImportant(selectedMessage.id)}
            onArchive={() => removeMessages([selectedMessage.id])}
            onDelete={() => removeMessages([selectedMessage.id])}
            onMarkUnread={() => markRead(selectedMessage.id, false)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center flex-col gap-2">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Select a message to read it
          </p>
        </div>
      )}
    </div>
  )
}
