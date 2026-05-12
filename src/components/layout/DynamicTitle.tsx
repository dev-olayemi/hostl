'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface DynamicTitleProps {
  unreadCount: number
}

const PATH_LABELS: Record<string, string> = {
  '/inbox':           'Inbox',
  '/inbox/important': 'Important',
  '/inbox/sent':      'Sent',
  '/inbox/drafts':    'Drafts',
  '/inbox/archived':  'Archived',
  '/inbox/trash':     'Trash',
  '/inbox/isolated':  'Isolated',
  '/inbox/suspicious':'Suspicious',
  '/compose':         'Compose',
  '/compose/mass':    'Mass Message',
  '/settings':        'Settings',
  '/settings/labels': 'Labels',
  '/settings/verify': 'Verification',
}

export default function DynamicTitle({ unreadCount }: DynamicTitleProps) {
  const pathname = usePathname()

  useEffect(() => {
    const label = PATH_LABELS[pathname] ?? 'Hostl'
    const count = unreadCount > 0 ? `(${unreadCount}) ` : ''

    if (label === 'Hostl') {
      document.title = `${count}Hostl`
    } else {
      document.title = `${count}${label} | Hostl`
    }
  }, [pathname, unreadCount])

  return null
}
