'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, CheckCheck, Mail, ShieldAlert, BadgeCheck, Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatDistanceToNow } from 'date-fns'
import { createPortal } from 'react-dom'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  ref_type: string | null
  ref_id: string | null
  is_read: boolean
  created_at: string
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  new_message: Mail,
  action_required: CheckCheck,
  action_completed: CheckCheck,
  mention: Mail,
  system: Info,
}

export default function NotificationBell() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [pos, setPos] = useState({ top: 0, right: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    loadNotifications()
  }, [])

  // Real-time subscription for new notifications
  useEffect(() => {
    const supabase = createClient()
    let userId: string

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      userId = user.id

      const channel = supabase
        .channel('notifications')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${userId}`,
        }, (payload) => {
          const n = payload.new as Notification
          setNotifications((prev) => [n, ...prev])
          setUnread((prev) => prev + 1)
        })
        .subscribe()

      return () => { supabase.removeChannel(channel) }
    })
  }, [])

  async function loadNotifications() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    setNotifications((data as Notification[]) ?? [])
    setUnread((data ?? []).filter((n: Notification) => !n.is_read).length)
  }

  async function markAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('profile_id', user.id)
      .eq('is_read', false)

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnread(0)
  }

  async function handleNotificationClick(n: Notification) {
    // Mark as read
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', n.id)
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, is_read: true } : x))
    setUnread((prev) => Math.max(0, prev - (n.is_read ? 0 : 1)))

    // Navigate to ref
    if (n.ref_type === 'message' && n.ref_id) {
      router.push(`/inbox`)
    }
    setOpen(false)
  }

  function toggleOpen() {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right })
    }
    setOpen(!open)
  }

  return (
    <>
      <button
        ref={btnRef}
        onClick={toggleOpen}
        className="relative p-1.5 rounded-md transition-colors"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-[9998]" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div
            className="fixed z-[9999] w-80 max-h-[70vh] flex flex-col rounded-2xl overflow-hidden"
            style={{
              top: pos.top,
              right: pos.right,
              backgroundColor: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 8px 32px oklch(0 0 0 / 0.12)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0"
              style={{ borderColor: 'var(--color-border-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm" style={{ color: 'var(--color-foreground)' }}>
                  Notifications
                </span>
                {unread > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <button onClick={markAllRead} className="text-xs font-medium"
                    style={{ color: 'var(--color-primary)' }}>
                    Mark all read
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="p-1 rounded"
                  style={{ color: 'var(--color-muted-foreground)' }}>
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Bell size={24} style={{ color: 'var(--color-border)' }} />
                  <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                    No notifications yet
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const Icon = TYPE_ICONS[n.type] ?? Info
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left border-b transition-colors"
                      style={{
                        borderColor: 'var(--color-border-subtle)',
                        backgroundColor: n.is_read ? 'transparent' : 'var(--color-accent)',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = n.is_read ? 'transparent' : 'var(--color-accent)')}
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: 'var(--color-border-subtle)', color: 'var(--color-primary)' }}>
                        <Icon size={14} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-foreground)' }}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-muted-foreground)' }}>
                            {n.body}
                          </p>
                        )}
                        <p className="text-xs mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full shrink-0 mt-2"
                          style={{ backgroundColor: 'var(--color-primary)' }} />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
