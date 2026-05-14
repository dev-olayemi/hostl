'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
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
  { icon: Mail,          title: 'Send your first message',  desc: 'Use Compose to send a message to any @handle.' },
  { icon: CheckSquare,   title: 'Try an approval request',  desc: 'Send an approval — the recipient can approve or decline right inside the message.' },
  { icon: CalendarCheck, title: 'Send an RSVP',             desc: 'Invite someone to an event and get their response without any back-and-forth.' },
  { icon: UserCircle,    title: 'Complete your profile',    desc: 'Add a photo and bio so people know who you are when they receive your messages.' },
]

// Search filter chips — like Gmail
interface SearchFilters {
  from: string
  to: string
  label: string
  hasAttachment: boolean
  dateAfter: string
  dateBefore: string
  isUnread: boolean | null
  isStarred: boolean | null
}

const DEFAULT_FILTERS: SearchFilters = {
  from: '', to: '', label: '', hasAttachment: false,
  dateAfter: '', dateBefore: '', isUnread: null, isStarred: null,
}

interface Props {
  initialMessages: Message[]
  category: MessageCategory
  userId: string
}

export default function InboxClient({ initialMessages, category, userId }: Props) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPending, startTransition] = useTransition()

  // ── Real-time subscription ─────────────────────────────────
  useEffect(() => {
    if (category !== 'inbox' && category !== 'important') return

    const supabase = createClient()
    const channel = supabase
      .channel(`inbox-${userId}-${category}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `to_profile_id=eq.${userId}`,
      }, async (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.category !== category && category !== 'inbox') return

        // Fetch full message with profiles
        const { data } = await supabase
          .from('messages')
          .select(`
            *,
            from_profile:profiles!messages_from_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system),
            to_profile:profiles!messages_to_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system)
          `)
          .eq('id', newMsg.id)
          .single()

        if (data) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === data.id)) return prev
            return [data as Message, ...prev]
          })
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `to_profile_id=eq.${userId}`,
      }, (payload) => {
        const updated = payload.new as Message
        setMessages((prev) => prev.map((m) => m.id === updated.id ? { ...m, ...updated } : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, category])

  // ── Refresh with animation ─────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Re-fetch from the server page by doing a soft navigation refresh
      // This triggers the server component to re-fetch with admin client
      // We use router.refresh() which re-runs the server component without full page reload
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setIsRefreshing(false); return }

      let query = supabase
        .from('messages')
        .select(`
          *,
          from_profile:profiles!messages_from_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system),
          to_profile:profiles!messages_to_profile_id_fkey(id, handle, display_name, avatar_url, verified, account_type, is_system)
        `)
        .order('created_at', { ascending: false })

      if (category === 'sent') {
        query = query.eq('from_profile_id', userId)
      } else if (category === 'important') {
        query = query.eq('to_profile_id', userId).eq('is_important', true)
      } else {
        query = query.eq('to_profile_id', userId).eq('category', category)
      }

      const { data, error } = await query
      if (!error && data) {
        setMessages(((data as unknown) as Message[]))
      }
    } catch (e) {
      console.error('Refresh error:', e)
    }
    setTimeout(() => setIsRefreshing(false), 400)
  }, [userId, category])

  // ── Search + filter logic ──────────────────────────────────
  const filtered = messages.filter((m) => {
    const q = search.toLowerCase()
    const matchesText = !q ||
      m.subject.toLowerCase().includes(q) ||
      m.from_profile?.display_name?.toLowerCase().includes(q) ||
      m.from_profile?.handle?.toLowerCase().includes(q) ||
      m.body.replace(/<[^>]*>/g, '').toLowerCase().includes(q)

    const matchesFrom = !filters.from ||
      m.from_profile?.handle?.toLowerCase().includes(filters.from.toLowerCase()) ||
      m.from_profile?.display_name?.toLowerCase().includes(filters.from.toLowerCase())

    const matchesUnread = filters.isUnread === null ||
      (filters.isUnread ? !m.is_read : m.is_read)

    const matchesStarred = filters.isStarred === null ||
      (filters.isStarred ? m.is_important : !m.is_important)

    const matchesDate = (!filters.dateAfter || new Date(m.created_at) >= new Date(filters.dateAfter)) &&
      (!filters.dateBefore || new Date(m.created_at) <= new Date(filters.dateBefore))

    return matchesText && matchesFrom && matchesUnread && matchesStarred && matchesDate
  })

  const hasActiveFilters = filters.from || filters.isUnread !== null ||
    filters.isStarred !== null || filters.dateAfter || filters.dateBefore

  const unreadCount = messages.filter((m) => !m.is_read).length
  const allSelected = filtered.length > 0 && filtered.every((m) => selected.has(m.id))
  const someSelected = selected.size > 0
  const isEmpty = filtered.length === 0

  function toggleSelect(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(filtered.map((m) => m.id)))
  }
  function clearSelection() { setSelected(new Set()) }

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

  function markRead(id: string, isRead = true) {
    updateMessages([id], { is_read: isRead })
    markReadAction(id, isRead).catch(() => updateMessages([id], { is_read: !isRead }))
  }

  function toggleImportant(id: string) {
    const msg = messages.find((m) => m.id === id)
    if (!msg) return
    const next = !msg.is_important
    updateMessages([id], { is_important: next })
    const supabase = createClient()
    supabase.from('messages').update({ is_important: next }).eq('id', id)
  }

  function bulkAction(fn: (ids: string[]) => Promise<unknown>, patch?: Partial<Message>, remove = false) {
    const ids = Array.from(selected)
    if (patch) updateMessages(ids, patch)
    if (remove) removeMessages(ids)
    startTransition(async () => { await fn(ids) })
  }

  function clearFilters() {
    setFilters(DEFAULT_FILTERS)
    setSearch('')
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Message list */}
      <div className={`flex flex-col border-r shrink-0 ${selectedMessage ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full'}`}
        style={{ borderColor: 'var(--color-border-subtle)' }}>

        {/* Header */}
        <div className="px-4 py-3 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>

          {someSelected ? (
            <div className="flex items-center gap-1 mb-3">
              <button onClick={clearSelection} className="p-1.5 rounded-md mr-1" style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={15} />
              </button>
              <span className="text-sm font-medium flex-1" style={{ color: 'var(--color-foreground)' }}>{selected.size} selected</span>
              {[
                { icon: MailOpen, title: 'Mark as read',   fn: () => bulkAction((ids) => bulkMarkRead(ids, true),  { is_read: true }) },
                { icon: Mail,     title: 'Mark as unread', fn: () => bulkAction((ids) => bulkMarkRead(ids, false), { is_read: false }) },
                { icon: Star,     title: 'Star all',       fn: () => bulkAction((ids) => bulkMarkImportant(ids, true), { is_important: true }) },
                { icon: Archive,  title: 'Archive all',    fn: () => bulkAction(bulkArchive, undefined, true) },
                { icon: Trash2,   title: 'Delete all',     fn: () => bulkAction(bulkTrash, undefined, true), danger: true },
              ].map(({ icon: Icon, title, fn, danger }) => (
                <button key={title} onClick={fn} title={title}
                  className="p-1.5 rounded-md transition-colors"
                  style={{ color: danger ? 'var(--color-destructive)' : 'var(--color-muted-foreground)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = danger ? 'oklch(0.97 0.02 27)' : 'var(--color-accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <button onClick={toggleSelectAll}
                  className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
                  style={{ borderColor: allSelected ? 'var(--color-primary)' : 'var(--color-border)', backgroundColor: allSelected ? 'var(--color-primary)' : 'transparent' }}>
                  {allSelected && <Check size={10} style={{ color: 'var(--color-primary-foreground)' }} />}
                </button>
                <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
                  {CATEGORY_LABELS[category]}
                </h2>
                {unreadCount > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    {unreadCount}
                  </span>
                )}
              </div>
              {/* Refresh with spinner */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                title="Refresh"
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
          )}

          {/* Search bar — font-size 16px prevents iOS zoom */}
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: 'var(--color-muted-foreground)' }} />
            <input
              type="search"
              placeholder="Search messages…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border pl-8 pr-8 h-9 transition-colors focus:outline-none focus:ring-2"
              style={{
                fontSize: '16px',
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
            />
            {(search || hasActiveFilters) && (
              <button onClick={clearFilters}
                className="absolute right-2.5 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-muted-foreground)' }}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Filter chips — only shown when search is active */}
          {search.length > 0 && (
            <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
              {/* Unread filter */}
              <button
                onClick={() => setFilters((f) => ({ ...f, isUnread: f.isUnread === true ? null : true }))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0 transition-colors"
                style={{
                  borderColor: filters.isUnread ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: filters.isUnread ? 'var(--color-accent)' : 'transparent',
                  color: filters.isUnread ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                }}
              >
                <Mail size={10} /> Unread
              </button>

              {/* Starred filter */}
              <button
                onClick={() => setFilters((f) => ({ ...f, isStarred: f.isStarred === true ? null : true }))}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-medium shrink-0 transition-colors"
                style={{
                  borderColor: filters.isStarred ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: filters.isStarred ? 'var(--color-accent)' : 'transparent',
                  color: filters.isStarred ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                }}
              >
                <Star size={10} /> Starred
              </button>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                  style={{ color: 'var(--color-destructive)' }}>
                  <X size={10} /> Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {isEmpty && category === 'inbox' && !search && !hasActiveFilters ? (
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
                <Button className="w-full gap-2" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                  <PenSquare size={14} /> Send your first message
                </Button>
              </Link>
            </div>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-20">
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                {search || hasActiveFilters ? 'No results found' : 'Nothing here yet'}
              </p>
              {(search || hasActiveFilters) && (
                <button onClick={clearFilters} className="text-xs underline"
                  style={{ color: 'var(--color-primary)' }}>
                  Clear search
                </button>
              )}
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

      {/* Detail */}
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
        <div className="hidden md:flex flex-1 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Select a message to read it</p>
        </div>
      )}
    </div>
  )
}
