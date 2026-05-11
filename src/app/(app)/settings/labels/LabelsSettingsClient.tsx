'use client'

import { useState } from 'react'
import { Tag } from 'lucide-react'
import LabelManager from '@/components/labels/LabelManager'
import type { Label } from '@/types'

export default function LabelsSettingsClient({ initialLabels }: { initialLabels: Label[] }) {
  const [labels, setLabels] = useState<Label[]>(initialLabels)

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Tag size={18} style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>Labels</h1>
      </div>
      <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
        Labels help you organize your messages. Create custom labels with colors and apply them to any message.
      </p>
      <LabelManager labels={labels} onLabelsChange={setLabels} />
    </div>
  )
}
