'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { AtSign, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { forgotPassword } from '@/app/(auth)/actions'

export default function ForgotPasswordForm() {
  const [sent, setSent] = useState(false)
  const [handle, setHandle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await forgotPassword(fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setSent(true)
      }
    })
  }

  if (sent) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Check your email
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            If <strong>@{handle}</strong> has a recovery email on file, we've sent a reset link to it.
          </p>
        </div>

        <div
          className="text-sm px-4 py-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-foreground)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          Didn't get it? Check your spam folder, or make sure you've added a recovery email in your account settings.
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 text-sm font-medium"
          style={{ color: 'var(--color-primary)' }}
        >
          <ArrowLeft size={14} />
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
          Reset your password
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Enter your Hostl ID and we'll send a reset link to your recovery email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="handle">Hostl ID</Label>
          <div className="relative">
            <AtSign
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <Input
              id="handle"
              name="handle"
              placeholder="your-handle"
              className="pl-8"
              required
              autoFocus
              autoComplete="username"
              value={handle}
              onChange={(e) => setHandle(e.target.value.replace('@', '').trim())}
            />
          </div>
        </div>

        {error && (
          <div
            className="text-sm px-3 py-2 rounded-lg"
            style={{
              backgroundColor: 'oklch(0.97 0.02 27)',
              color: 'var(--color-destructive)',
              border: '1px solid oklch(0.90 0.05 27)',
            }}
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isPending}
          className="w-full"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          {isPending
            ? <><Loader2 size={14} className="animate-spin mr-2" />Sending…</>
            : 'Send reset link'}
        </Button>
      </form>

      <Link
        href="/login"
        className="flex items-center gap-2 text-sm font-medium"
        style={{ color: 'var(--color-muted-foreground)' }}
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>
    </div>
  )
}
