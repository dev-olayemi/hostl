'use client'

import { useState, useTransition, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, AtSign, Loader2, CheckCircle2, Check, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signUp, checkHandleAvailable } from '@/app/(auth)/actions'
import { isValidHandle, generateHandleSuggestions } from '@/lib/handle-utils'

type AccountType = 'personal' | 'company' | 'organization' | 'commerce' | 'service'

const ACCOUNT_TYPES: { value: AccountType; label: string; desc: string }[] = [
  { value: 'personal',     label: 'Personal',     desc: 'For individuals' },
  { value: 'company',      label: 'Company',      desc: 'For businesses & orgs' },
  { value: 'organization', label: 'Organization', desc: 'Nonprofits & institutions' },
  { value: 'commerce',     label: 'Commerce',     desc: 'E-commerce & marketplaces' },
  { value: 'service',      label: 'Service',      desc: 'API/SDK integrations' },
]

type HandleStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function SignupForm() {
  const [step, setStep] = useState<1 | 2>(1)
  const [showPassword, setShowPassword] = useState(false)
  const [accountType, setAccountType] = useState<AccountType>('personal')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Step 1
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [dob, setDob] = useState('')

  // Step 2 — handle
  const [handle, setHandle] = useState('')
  const [handleStatus, setHandleStatus] = useState<HandleStatus>('idle')
  const [suggestions, setSuggestions] = useState<string[]>([])

  // Generate suggestions when moving to step 2
  useEffect(() => {
    if (step === 2) {
      const s = generateHandleSuggestions(firstName, lastName)
      setSuggestions(s)
      if (s.length > 0 && !handle) {
        setHandle(s[0])
      }
    }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced handle availability check
  const checkHandle = useCallback(async (value: string) => {
    if (!value) { setHandleStatus('idle'); return }
    if (!isValidHandle(value)) { setHandleStatus('invalid'); return }
    setHandleStatus('checking')
    const { available } = await checkHandleAvailable(value)
    setHandleStatus(available ? 'available' : 'taken')
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => checkHandle(handle), 500)
    return () => clearTimeout(timer)
  }, [handle, checkHandle])

  function handleStep1(e: React.FormEvent) {
    e.preventDefault()
    if (!firstName || !lastName || !dob) return
    setStep(2)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (handleStatus !== 'available') return
    setError(null)
    const fd = new FormData(e.currentTarget)
    fd.set('handle', handle)
    fd.set('account_type', accountType)
    startTransition(async () => {
      const result = await signUp(fd)
      if (result?.error) setError(result.error)
    })
  }

  const handleStatusIcon = () => {
    if (handleStatus === 'checking') return <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-muted-foreground)' }} />
    if (handleStatus === 'available') return <Check size={14} style={{ color: 'oklch(0.55 0.18 145)' }} />
    if (handleStatus === 'taken') return <X size={14} style={{ color: 'var(--color-destructive)' }} />
    if (handleStatus === 'invalid') return <X size={14} style={{ color: 'var(--color-destructive)' }} />
    return null
  }

  const handleStatusText = () => {
    if (handleStatus === 'checking') return { text: 'Checking availability…', color: 'var(--color-muted-foreground)' }
    if (handleStatus === 'available') return { text: `@${handle} is available`, color: 'oklch(0.55 0.18 145)' }
    if (handleStatus === 'taken') return { text: `@${handle} is already taken`, color: 'var(--color-destructive)' }
    if (handleStatus === 'invalid') return { text: 'Only letters, numbers, _ and - allowed (2–30 chars)', color: 'var(--color-destructive)' }
    return { text: 'Letters, numbers, _ and - only. This is your permanent Hostl ID.', color: 'var(--color-muted-foreground)' }
  }

  const statusInfo = handleStatusText()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-foreground)' }}>
          Create your Hostl ID
        </h1>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          One handle for everything. Let's get you set up.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {([1, 2] as const).map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all"
              style={{
                backgroundColor: step >= s ? 'var(--color-primary)' : 'var(--color-border)',
                color: step >= s ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
              }}
            >
              {step > s ? <CheckCircle2 size={14} /> : s}
            </div>
            <span className="text-xs" style={{
              color: step === s ? 'var(--color-foreground)' : 'var(--color-muted-foreground)',
            }}>
              {s === 1 ? 'Identity' : 'Your handle'}
            </span>
            {s < 2 && <div className="w-8 h-px mx-1" style={{ backgroundColor: 'var(--color-border)' }} />}
          </div>
        ))}
      </div>

      {/* ── Step 1 — Name & DOB ── */}
      {step === 1 && (
        <form onSubmit={handleStep1} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                placeholder="Muhammed"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                placeholder="Dev"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of birth</Label>
            <Input
              id="dob"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              max={new Date(Date.now() - 13 * 365.25 * 24 * 60 * 60 * 1000)
                .toISOString().split('T')[0]}
            />
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              You must be at least 13 years old.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Continue
          </Button>
        </form>
      )}

      {/* ── Step 2 — Handle, account type & password ── */}
      {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <input type="hidden" name="first_name" value={firstName} />
          <input type="hidden" name="last_name" value={lastName} />
          <input type="hidden" name="date_of_birth" value={dob} />

          {/* Account type */}
          <div className="space-y-2">
            <Label>Account type</Label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setAccountType(t.value)}
                  className="p-3 rounded-lg border text-left transition-all"
                  style={{
                    borderColor: accountType === t.value ? 'var(--color-primary)' : 'var(--color-border)',
                    backgroundColor: accountType === t.value ? 'var(--color-accent)' : 'var(--color-surface)',
                  }}
                >
                  <div className="text-xs font-medium" style={{ color: 'var(--color-foreground)' }}>{t.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Handle input */}
          <div className="space-y-1.5">
            <Label htmlFor="handle">Choose your @handle</Label>
            <div className="relative">
              <AtSign
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-muted-foreground)' }}
              />
              <Input
                id="handle"
                value={handle}
                onChange={(e) => {
                  // Strip disallowed characters on input
                  const cleaned = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '')
                  setHandle(cleaned)
                }}
                placeholder="your_handle"
                className="pl-8 pr-8"
                required
                autoFocus
                maxLength={30}
                autoComplete="off"
                style={{
                  borderColor: handleStatus === 'available'
                    ? 'oklch(0.55 0.18 145)'
                    : handleStatus === 'taken' || handleStatus === 'invalid'
                      ? 'var(--color-destructive)'
                      : undefined,
                }}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {handleStatusIcon()}
              </div>
            </div>
            <p className="text-xs" style={{ color: statusInfo.color }}>
              {statusInfo.text}
            </p>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Suggestions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setHandle(s)}
                      className="text-xs px-2.5 py-1 rounded-full border transition-all"
                      style={{
                        borderColor: handle === s ? 'var(--color-primary)' : 'var(--color-border)',
                        backgroundColor: handle === s ? 'var(--color-accent)' : 'transparent',
                        color: handle === s ? 'var(--color-primary)' : 'var(--color-muted-foreground)',
                      }}
                    >
                      @{s}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const s = generateHandleSuggestions(firstName, lastName)
                      const rand = Math.floor(Math.random() * 900 + 100)
                      const extra = s.map((x) => `${x}${rand}`)
                      setSuggestions(extra)
                    }}
                    className="text-xs px-2 py-1 rounded-full border transition-colors flex items-center gap-1"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-muted-foreground)',
                    }}
                    title="More suggestions"
                  >
                    <RefreshCw size={10} />
                    More
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 8 characters"
                minLength={8}
                required
                className="pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
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

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isPending || handleStatus !== 'available'}
              className="flex-1"
              style={{
                backgroundColor: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                opacity: handleStatus !== 'available' ? 0.6 : 1,
              }}
            >
              {isPending
                ? <><Loader2 size={14} className="animate-spin mr-2" />Creating…</>
                : 'Create Hostl ID'}
            </Button>
          </div>
        </form>
      )}

      <p className="text-sm text-center" style={{ color: 'var(--color-muted-foreground)' }}>
        Already have an account?{' '}
        <Link href="/login" className="font-medium" style={{ color: 'var(--color-primary)' }}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
