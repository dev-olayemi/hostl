'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Inbox, Star, Send, FileText, Archive, Trash2,
  PenSquare, Settings, ChevronDown, ChevronRight, Menu, X, Bell,
  BadgeCheck, Users, ShieldAlert, FolderX, Tag, Plus, MoreHorizontal
} from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/app/(auth)/actions'
import { getLabels } from '@/app/(app)/labels/actions'
import { cn } from '@/lib/utils'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import DynamicTitle from '@/components/layout/DynamicTitle'
import type { Label } from '@/types'

const MAIN_NAV = [
  { label: 'Inbox',     href: '/inbox',           icon: Inbox },
  { label: 'Important', href: '/inbox/important',  icon: Star },
  { label: 'Sent',      href: '/inbox/sent',       icon: Send },
  { label: 'Drafts',    href: '/inbox/drafts',     icon: FileText },
]

const MORE_NAV = [
  { label: 'Archived',   href: '/inbox/archived',   icon: Archive },
  { label: 'Trash',      href: '/inbox/trash',      icon: Trash2 },
  { label: 'Isolated',   href: '/inbox/isolated',   icon: FolderX },
  { label: 'Suspicious', href: '/inbox/suspicious', icon: ShieldAlert },
]

interface AppShellProps {
  children: React.ReactNode
  profile: Record<string, string>
}

function NavLink({ href, icon: Icon, label, count, active, onClick }: {
  href: string; icon: React.ElementType; label: string
  count?: number; active: boolean; onClick?: () => void
}) {
  return (
    <Link href={href} onClick={onClick}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all"
      style={{
        backgroundColor: active ? 'var(--color-sidebar-active)' : 'transparent',
        color: active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
      }}
      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover)' }}
      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
    >
      <Icon size={15} strokeWidth={active ? 2.5 : 2} />
      <span className="flex-1">{label}</span>
      {count != null && count > 0 && (
        <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
          {count}
        </span>
      )}
    </Link>
  )
}

export default function AppShell({ children, profile }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMore, setShowMore] = useState(false)
  const [labels, setLabels] = useState<Label[]>([])
  const [showLabels, setShowLabels] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  const displayName = profile?.display_name || `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()
  const handle = profile?.handle ? `@${profile.handle}` : ''
  const avatarUrl = profile?.avatar_url ?? null
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  useEffect(() => {
    getLabels().then(setLabels).catch(() => {})

    // Fetch unread count
    async function fetchUnread() {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('to_profile_id', user.id)
        .eq('is_read', false)
        .eq('category', 'inbox')
      setUnreadCount(count ?? 0)
    }
    fetchUnread()
  }, [])

  const close = () => setSidebarOpen(false)

  return (
    <div className="flex h-screen overflow-hidden w-screen max-w-full" style={{ backgroundColor: 'var(--color-background)' }}>
      <DynamicTitle unreadCount={unreadCount} />
      {/* Mobile overlay — always in DOM, toggled via opacity/pointer-events */}
      <div
        className={cn(
          'fixed inset-0 z-20 lg:hidden transition-opacity duration-200',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        style={{ backgroundColor: 'oklch(0 0 0 / 0.4)' }}
        onClick={close}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex flex-col w-64 transition-transform duration-200 lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ backgroundColor: 'var(--color-sidebar-bg)', borderRight: '1px solid var(--color-border-subtle)' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <Link href="/inbox">
            <Image src="/hostle.png" alt="Hostl" width={72} height={36} style={{ width: 72, height: 'auto' }} loading="eager" />
          </Link>
          <button className="lg:hidden p-1 rounded-md" style={{ color: 'var(--color-muted-foreground)' }} onClick={close}>
            <X size={18} />
          </button>
        </div>

        {/* Compose */}
        <div className="px-4 pb-3 shrink-0 space-y-1.5">
          <Link href="/compose">
            <Button className="w-full gap-2 font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              <PenSquare size={15} /> Compose
            </Button>
          </Link>
          <Link href="/compose/mass">
            <Button variant="outline" className="w-full gap-2 text-sm h-8">
              <Users size={13} /> Mass message
            </Button>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-2">
          {/* Main nav */}
          {MAIN_NAV.map((item) => (
            <NavLink key={item.href} {...item}
              count={item.href === '/inbox' ? unreadCount : undefined}
              active={pathname === item.href} onClick={close} />
          ))}

          {/* More toggle */}
          <button
            onClick={() => setShowMore(!showMore)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm w-full transition-all"
            style={{ color: 'var(--color-muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
          >
            {showMore ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
            <span>{showMore ? 'Less' : 'More'}</span>
          </button>

          {showMore && MORE_NAV.map((item) => (
            <NavLink key={item.href} {...item} active={pathname === item.href} onClick={close} />
          ))}

          {/* Labels section */}
          <div className="pt-3">
            <div className="flex items-center justify-between px-3 py-1.5">
              <button
                onClick={() => setShowLabels(!showLabels)}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {showLabels ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                Labels
              </button>
              <Link href="/settings/labels" title="Manage labels">
                <button className="p-0.5 rounded transition-colors"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-foreground)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted-foreground)')}>
                  <MoreHorizontal size={13} />
                </button>
              </Link>
            </div>

            {showLabels && (
              <div className="space-y-0.5">
                {labels.map((label) => {
                  const href = `/inbox/label/${label.id}`
                  const active = pathname === href
                  return (
                    <Link key={label.id} href={href} onClick={close}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
                      style={{
                        backgroundColor: active ? 'var(--color-sidebar-active)' : 'transparent',
                        color: active ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
                      }}
                      onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'var(--color-sidebar-hover)' }}
                      onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent' }}
                    >
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                      <span className="flex-1 truncate">{label.name}</span>
                    </Link>
                  )
                })}
                <Link href="/settings/labels" onClick={close}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
                  style={{ color: 'var(--color-muted-foreground)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                  <Plus size={13} />
                  <span>Create label</span>
                </Link>
              </div>
            )}
          </div>
        </nav>

        {/* User profile */}
        <div className="shrink-0 p-3 border-t" style={{ borderColor: 'var(--color-border-subtle)' }}>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer"
              style={{ color: 'var(--color-foreground)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-sidebar-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Avatar className="w-8 h-8 shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt={displayName} className="w-8 h-8 rounded-full object-cover" />
                  : <AvatarFallback className="text-xs font-semibold"
                      style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
                      {initials}
                    </AvatarFallback>
                }
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{displayName}</div>
                <div className="text-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>{handle}</div>
              </div>
              <ChevronDown size={14} style={{ color: 'var(--color-muted-foreground)' }} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => router.push('/settings')}>
                <Settings size={14} className="mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/labels')}>
                <Tag size={14} className="mr-2" /> Manage labels
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/settings/verify')}>
                <BadgeCheck size={14} className="mr-2" /> Get verified
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-500" onClick={() => signOut()}>
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* Main content — always full width on mobile, flex-1 on desktop */}
      <div className="flex flex-col min-w-0 overflow-hidden w-full lg:flex-1">
        <header className="lg:hidden flex items-center justify-between px-4 py-3 shrink-0 border-b"
          style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border-subtle)' }}>
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-md shrink-0"
            style={{ color: 'var(--color-muted-foreground)' }}>
            <Menu size={20} />
          </button>
          <Link href="/inbox" className="flex-1 flex justify-center">
            <Image src="/hostle.png" alt="Hostl" width={56} height={28} style={{ width: 56, height: 'auto' }} />
          </Link>
          <button className="p-1.5 rounded-md shrink-0" style={{ color: 'var(--color-muted-foreground)' }}>
            <Bell size={18} />
          </button>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  )
}
