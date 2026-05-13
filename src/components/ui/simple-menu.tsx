'use client'

/**
 * SimpleMenu — a lightweight fixed-position dropdown that avoids
 * Base UI's z-index and portal issues inside scroll containers.
 * Used for action menus in MessageDetail.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface MenuItem {
  label?: string
  icon?: React.ElementType
  onClick?: () => void
  danger?: boolean
  warning?: boolean
  separator?: boolean
}

interface SimpleMenuProps {
  trigger: React.ReactNode
  items: MenuItem[]
  align?: 'start' | 'end'
}

export function SimpleMenu({ trigger, items, align = 'start' }: SimpleMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePos = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const menuWidth = 220
    let left = align === 'end' ? rect.right - menuWidth : rect.left
    // Keep within viewport
    if (left + menuWidth > window.innerWidth - 8) left = window.innerWidth - menuWidth - 8
    if (left < 8) left = 8
    setPos({ top: rect.bottom + 4, left })
  }, [align])

  function toggle() {
    updatePos()
    setOpen((o) => !o)
  }

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      if (
        menuRef.current && !menuRef.current.contains(e.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(e.target as Node)
      ) setOpen(false)
    }
    function closeOnScroll() { setOpen(false) }
    document.addEventListener('mousedown', close)
    document.addEventListener('scroll', closeOnScroll, true)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('scroll', closeOnScroll, true)
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--color-muted-foreground)' }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
      >
        {trigger}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          className="fixed z-[9999] min-w-[220px] rounded-xl p-1.5 outline-none"
          style={{
            top: pos.top,
            left: pos.left,
            backgroundColor: 'var(--color-surface-raised)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 8px 24px oklch(0 0 0 / 0.12), 0 2px 6px oklch(0 0 0 / 0.08)',
          }}
        >
          {items.map((item, i) => {
            if (item.separator) {
              return <div key={i} className="my-1 h-px" style={{ backgroundColor: 'var(--color-border-subtle)' }} />
            }
            const Icon = item.icon
            return (
              <button
                key={i}
                type="button"
                onClick={() => { item.onClick?.(); setOpen(false) }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-left transition-colors',
                )}
                style={{
                  color: item.danger
                    ? 'var(--color-destructive)'
                    : item.warning
                      ? 'oklch(0.60 0.18 55)'
                      : 'var(--color-foreground)',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = item.danger
                    ? 'oklch(0.97 0.02 27)'
                    : 'var(--color-accent)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'
                }}
              >
                {Icon && <Icon size={14} style={{ flexShrink: 0 }} />}
                {item.label}
              </button>
            )
          })}
        </div>,
        document.body
      )}
    </>
  )
}
