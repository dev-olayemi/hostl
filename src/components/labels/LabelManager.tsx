'use client'

import { useState, useTransition } from 'react'
import { Plus, Pencil, Trash2, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createLabel, updateLabel, deleteLabel } from '@/app/(app)/labels/actions'
import type { Label } from '@/types'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface LabelManagerProps {
  labels: Label[]
  onLabelsChange: (labels: Label[]) => void
}

export default function LabelManager({ labels, onLabelsChange }: LabelManagerProps) {
  const [isPending, startTransition] = useTransition()
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      const result = await createLabel(newName, newColor)
      if (result.label) {
        onLabelsChange([...labels, result.label])
        setNewName('')
        setNewColor(PRESET_COLORS[0])
        setCreating(false)
      }
    })
  }

  function startEdit(label: Label) {
    setEditingId(label.id)
    setEditName(label.name)
    setEditColor(label.color)
  }

  function handleUpdate(id: string) {
    if (!editName.trim()) return
    startTransition(async () => {
      await updateLabel(id, editName, editColor)
      onLabelsChange(labels.map((l) => l.id === id ? { ...l, name: editName, color: editColor } : l))
      setEditingId(null)
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteLabel(id)
      onLabelsChange(labels.filter((l) => l.id !== id))
    })
  }

  const ColorPicker = ({ value, onChange }: { value: string; onChange: (c: string) => void }) => (
    <div className="flex gap-1.5 flex-wrap">
      {PRESET_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className="w-5 h-5 rounded-full transition-transform"
          style={{
            backgroundColor: c,
            transform: value === c ? 'scale(1.25)' : 'scale(1)',
            outline: value === c ? `2px solid ${c}` : 'none',
            outlineOffset: '2px',
          }}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-3">
      {/* Existing labels */}
      {labels.map((label) => (
        <div key={label.id} className="rounded-lg border p-3 space-y-2"
          style={{ borderColor: 'var(--color-border-subtle)', backgroundColor: 'var(--color-surface)' }}>
          {editingId === label.id ? (
            <div className="space-y-2">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)}
                className="h-8 text-sm" autoFocus />
              <ColorPicker value={editColor} onChange={setEditColor} />
              <div className="flex gap-2">
                <Button size="sm" onClick={() => handleUpdate(label.id)} disabled={isPending}
                  className="gap-1 h-7 text-xs"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                  <Check size={11} /> Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)}
                  className="gap-1 h-7 text-xs">
                  <X size={11} /> Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
              <span className="text-sm flex-1" style={{ color: 'var(--color-foreground)' }}>{label.name}</span>
              <button onClick={() => startEdit(label)} className="p-1 rounded transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-foreground)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted-foreground)')}>
                <Pencil size={13} />
              </button>
              <button onClick={() => handleDelete(label.id)} className="p-1 rounded transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-destructive)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-muted-foreground)')}>
                <Trash2 size={13} />
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Create new */}
      {creating ? (
        <div className="rounded-lg border p-3 space-y-2"
          style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-surface)' }}>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Label name…" className="h-8 text-sm" autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
          <ColorPicker value={newColor} onChange={setNewColor} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={isPending || !newName.trim()}
              className="gap-1 h-7 text-xs"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              {isPending ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
              Create
            </Button>
            <Button size="sm" variant="outline" onClick={() => { setCreating(false); setNewName('') }}
              className="gap-1 h-7 text-xs">
              <X size={11} /> Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-sm w-full px-2 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--color-muted-foreground)' }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
          <Plus size={14} /> Create new label
        </button>
      )}
    </div>
  )
}
