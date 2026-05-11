'use client'

import { useState, useEffect } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import MessageRow from './MessageRow'
import MessageDetail from './MessageDetail'
import { getMessagesByLabel, getLabels } from '@/app/(app)/labels/actions'
import type { Message, Label } from '@/types'

export default function LabelInboxView({ labelId }: { labelId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [label, setLabel] = useState<Label | null>(null)
  const [selected, setSelected] = useState<Message | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [msgs, labels] = await Promise.all([
        getMessagesByLabel(labelId),
        getLabels(),
      ])
      setMessages(msgs as Message[])
      setLabel(labels.find((l) => l.id === labelId) ?? null)
      setLoading(false)
    }
    load()
  }, [labelId])

  const filtered = messages.filter((m) =>
    m.subject.toLowerCase().includes(search.toLowerCase()) ||
    m.from_profile?.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-full">
      <div className={`flex flex-col border-r ${selected ? 'hidden md:flex md:w-80 lg:w-96' : 'flex-1'}`}
        style={{ borderColor: 'var(--color-border-subtle)' }}>
        <div className="px-5 py-4 border-b shrink-0"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface-raised)' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {label && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: label.color }} />}
              <h2 className="font-semibold text-base" style={{ color: 'var(--color-foreground)' }}>
                {label?.name ?? 'Label'}
              </h2>
            </div>
            <button onClick={() => window.location.reload()} className="p-1.5 rounded-md"
              style={{ color: 'var(--color-muted-foreground)' }}>
              <RefreshCw size={14} />
            </button>
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }} />
            <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm" style={{ backgroundColor: 'var(--color-surface)' }} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 rounded-full border-2 animate-spin"
                style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 py-20">
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No messages with this label</p>
            </div>
          ) : (
            filtered.map((m) => (
              <MessageRow key={m.id} message={m} isSelected={selected?.id === m.id}
                isChecked={false}
                onSelect={() => setSelected(m)}
                onToggleImportant={() => {}}
                onToggleCheck={() => {}} />
            ))
          )}
        </div>
      </div>

      {selected ? (
        <div className="flex-1 overflow-hidden">
          <MessageDetail message={selected} onClose={() => setSelected(null)}
            onToggleImportant={() => {}} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>Select a message</p>
        </div>
      )}
    </div>
  )
}
