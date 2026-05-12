'use client'

import { Star, CheckSquare, CalendarCheck, ClipboardList, FileText } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import { isSystemProfile } from '@/lib/system'
import type { Message } from '@/types'
import { cn } from '@/lib/utils'

const CONTENT_TYPE_ICONS = {
  approval: CheckSquare,
  rsvp: CalendarCheck,
  survey: ClipboardList,
  html_form: FileText,
  text: null,
}

const CONTENT_TYPE_LABELS = {
  approval: 'Approval',
  rsvp: 'RSVP',
  survey: 'Survey',
  html_form: 'Form',
  text: null,
}

interface MessageRowProps {
  message: Message
  isSelected: boolean
  isChecked: boolean
  onSelect: () => void
  onToggleImportant: () => void
  onToggleCheck: () => void
}

export default function MessageRow({ message, isSelected, isChecked, onSelect, onToggleImportant, onToggleCheck }: MessageRowProps) {
  const { from_profile, subject, body, is_read, is_important, content_type, created_at } = message

  const initials = (from_profile?.display_name ?? '?')
    .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  const TypeIcon = CONTENT_TYPE_ICONS[content_type]
  const typeLabel = CONTENT_TYPE_LABELS[content_type]
  const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true })
  const bodyPreview = body.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-start gap-3 px-4 py-3.5 cursor-pointer border-b transition-colors group relative',
        isSelected ? 'bg-[var(--color-accent)]' : 'hover:bg-[var(--color-sidebar-hover)]'
      )}
      style={{ borderColor: 'var(--color-border-subtle)' }}
    >
      {/* Checkbox — visible on hover or when checked */}
      <div className="mt-1.5 shrink-0 w-4 flex items-center justify-center">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleCheck() }}
          className={cn(
            'w-4 h-4 rounded border flex items-center justify-center transition-all',
            isChecked
              ? 'opacity-100'
              : 'opacity-0 group-hover:opacity-100'
          )}
          style={{
            borderColor: isChecked ? 'var(--color-primary)' : 'var(--color-border)',
            backgroundColor: isChecked ? 'var(--color-primary)' : 'transparent',
          }}
        >
          {isChecked && (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 4.5L3.5 6.5L7.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        {/* Unread dot — shown when not hovered and not checked */}
        {!is_read && !isChecked && (
          <div className="w-2 h-2 rounded-full absolute left-4 mt-1.5 group-hover:hidden"
            style={{ backgroundColor: 'var(--color-primary)' }} />
        )}
      </div>

      {/* Avatar */}
      <Avatar className="w-9 h-9 shrink-0 mt-0.5">
        {from_profile?.avatar_url
          ? <img src={from_profile.avatar_url} alt={from_profile.display_name ?? ''} className="w-9 h-9 rounded-full object-cover" />
          : <AvatarFallback className="text-xs font-semibold"
              style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
              {initials}
            </AvatarFallback>
        }
      </Avatar>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span
            className={cn('text-sm truncate', !is_read ? 'font-semibold' : 'font-medium')}
            style={{ color: 'var(--color-foreground)' }}
          >
            {from_profile?.display_name ?? 'Unknown'}
            {from_profile?.verified && (
              <>
                {isSystemProfile(from_profile) ? (
                  <>
                    <VerifiedBadge accountType="service" size={13} className="ml-1" />
                    <VerifiedBadge accountType="personal" size={13} />
                  </>
                ) : (
                  <VerifiedBadge accountType={from_profile.account_type} size={13} className="ml-1" />
                )}
              </>
            )}
          </span>
          <span className="text-xs shrink-0" style={{ color: 'var(--color-muted-foreground)' }}>
            {timeAgo}
          </span>
        </div>

        <div
          className={cn('text-sm truncate mb-1', !is_read ? 'font-medium' : '')}
          style={{ color: 'var(--color-foreground)' }}
        >
          {subject}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs truncate flex-1" style={{ color: 'var(--color-muted-foreground)' }}>
            {bodyPreview}
          </span>
          {TypeIcon && typeLabel && (
            <span
              className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-md shrink-0 font-medium"
              style={{
                backgroundColor: 'var(--color-accent)',
                color: 'var(--color-accent-foreground)',
              }}
            >
              <TypeIcon size={10} />
              {typeLabel}
            </span>
          )}
        </div>
      </div>

      {/* Star */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleImportant() }}
        className="shrink-0 mt-1 p-0.5 rounded transition-opacity opacity-0 group-hover:opacity-100"
        style={{ color: is_important ? 'oklch(0.72 0.18 75)' : 'var(--color-muted-foreground)' }}
        title={is_important ? 'Remove from important' : 'Mark as important'}
      >
        <Star size={14} fill={is_important ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
