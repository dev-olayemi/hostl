'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordForm() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Supabase puts the recovery token in the URL hash.
  // We must let the client SDK exchange it for a session before we can call updateUser.
  useEffect(() => {
    const supabase = createClient()

    // Listen for the PASSWORD_RECOVERY event — fires when Supabase
    // detects the recovery token in the URL and establishes a session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })

    // Also check if we already have a session (e.g. page refresh after token exchange)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const fd = new FormData(e.currentTarget)
    const password = fd.get('password') as string
    const confirm = fd.get('confirm_password') as string

    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    startTransition(async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setError(error.message)
        return
      }
      // Sign out and redirect to login so they sign in fresh
      await supabase.auth.signOut()
      router.push('/login?reset=success')
    })
  }

  // Waiting for the recovery token to be exchanged
  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
            Set a new password
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          <Loader2 size={14} className="animate-spin" />
          Verifying reset link…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
          Set a new password
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Choose a strong password for your Hostl account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              minLength={8}
              required
              autoFocus
              className="pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirm_password">Confirm password</Label>
          <div className="relative">
            <Input
              id="confirm_password"
              name="confirm_password"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repeat your password"
              minLength={8}
              required
              className="pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
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
            ? <><Loader2 size={14} className="animate-spin mr-2" />Updating…</>
            : 'Update password'}
        </Button>
      </form>
    </div>
  )
}
