'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff, AtSign, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/app/(auth)/actions'

export default function LoginForm() {
  const searchParams = useSearchParams()
  const resetSuccess = searchParams.get('reset') === 'success'

  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await signIn(fd)
      if (result?.error) setError(result.error)
      else if (result?.redirect) window.location.href = result.redirect
    })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Sign in with your Hostl ID
        </p>
      </div>

      {resetSuccess && (
        <div
          className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg"
          style={{
            backgroundColor: 'oklch(0.95 0.05 145)',
            color: 'oklch(0.35 0.15 145)',
            border: '1px solid oklch(0.85 0.08 145)',
          }}
        >
          <CheckCircle2 size={14} />
          Password updated. Sign in with your new password.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="handle">Hostl ID</Label>
          <div className="relative">
            <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }} />
            <Input
              id="handle" name="handle" placeholder="your-handle"
              className="pl-8" required autoFocus autoComplete="username"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs transition-colors"
              style={{ color: 'var(--color-primary)' }}>
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password" name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Your password" required className="pr-10"
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
              style={{ color: 'var(--color-muted-foreground)' }}>
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-sm px-3 py-2 rounded-lg" style={{
            backgroundColor: 'oklch(0.97 0.02 27)',
            color: 'var(--color-destructive)',
            border: '1px solid oklch(0.90 0.05 27)',
          }}>
            {error}
          </div>
        )}

        <Button type="submit" disabled={isPending} className="w-full"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
          {isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Signing in…</> : 'Sign in'}
        </Button>
      </form>

      <p className="text-sm text-center" style={{ color: 'var(--color-muted-foreground)' }}>
        Don't have an account?{' '}
        <Link href="/signup" className="font-medium transition-colors" style={{ color: 'var(--color-primary)' }}>
          Create Hostl ID
        </Link>
      </p>
    </div>
  )
}
