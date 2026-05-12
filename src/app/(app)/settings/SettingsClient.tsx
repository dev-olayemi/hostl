'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  User, AtSign, Phone, MapPin, Shield, BadgeCheck,
  Loader2, Check, Lock, Eye, EyeOff, ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import AvatarUpload from '@/components/settings/AvatarUpload'
import { updateProfile } from './actions'
import { sendRecoveryVerificationCode, verifyRecoveryCode } from './recovery-actions'
import { COUNTRIES, getCountry } from '@/lib/countries'
import VerifiedBadge from '@/components/ui/VerifiedBadge'

interface Props {
  profile: Record<string, string> | null
}

const GENDER_OPTIONS = [
  { value: 'male',             label: 'Male' },
  { value: 'female',           label: 'Female' },
  { value: 'non_binary',       label: 'Non-binary' },
  { value: 'prefer_not_to_say',label: 'Prefer not to say' },
]

function Section({ title, icon: Icon, children }: {
  title: string; icon: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Icon size={16} style={{ color: 'var(--color-primary)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>{title}</h2>
      </div>
      <div className="rounded-xl p-5 space-y-4"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{hint}</p>}
    </div>
  )
}

// ── Recovery handle verification widget ──────────────────────
function RecoveryHandleField({
  currentHandle, onVerified,
}: { currentHandle: string; onVerified: (h: string) => void }) {
  const [step, setStep] = useState<'idle' | 'sent' | 'verified'>('idle')
  const [inputHandle, setInputHandle] = useState(currentHandle)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // If already set, show as verified
  const isVerified = step === 'verified' || (currentHandle && step === 'idle')

  function handleSendCode() {
    setError(null)
    startTransition(async () => {
      const res = await sendRecoveryVerificationCode(inputHandle)
      if (res?.error) setError(res.error)
      else {
        setStep('sent')
        if ((res as { messageWarning?: boolean }).messageWarning) {
          setError('Code generated but the message could not be delivered. Ask @' + inputHandle + ' to check their inbox, or try again.')
        }
      }
    })
  }

  function handleVerifyCode() {
    setError(null)
    startTransition(async () => {
      const res = await verifyRecoveryCode(code)
      if (res?.error) setError(res.error)
      else {
        setStep('verified')
        onVerified(res.handle!)
      }
    })
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <Label>Recovery Hostl ID</Label>
        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          If you lose access, messages can be sent to this @handle to help you recover your account.
        </p>
      </div>

      {/* Current verified handle */}
      {currentHandle && step !== 'sent' && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <AtSign size={14} style={{ color: 'var(--color-muted-foreground)' }} />
          <span style={{ color: 'var(--color-foreground)' }}>@{currentHandle}</span>
          <span className="ml-auto text-xs px-1.5 py-0.5 rounded-full"
            style={{ backgroundColor: 'oklch(0.95 0.05 145)', color: 'oklch(0.45 0.18 145)' }}>
            ✓ Verified
          </span>
          <button type="button" onClick={() => { setStep('idle'); setInputHandle('') }}
            className="text-xs underline" style={{ color: 'var(--color-muted-foreground)' }}>
            Change
          </button>
        </div>
      )}

      {/* Input + send code */}
      {(!currentHandle || step === 'idle') && step !== 'sent' && (
        <div className="flex gap-2">
          <div className="relative flex-1">
            <AtSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-muted-foreground)' }} />
            <Input
              value={inputHandle}
              onChange={(e) => setInputHandle(e.target.value.replace('@', '').replace(/[^a-zA-Z0-9_-]/g, ''))}
              placeholder="recovery-handle"
              className="pl-8"
            />
          </div>
          <Button type="button" onClick={handleSendCode}
            disabled={isPending || !inputHandle.trim()}
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Send code'}
          </Button>
        </div>
      )}

      {/* Code entry */}
      {step === 'sent' && (
        <div className="space-y-3 rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-accent)', border: '1px solid var(--color-border-subtle)' }}>
          <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
            A verification code was sent to <strong>@{inputHandle}</strong>'s inbox.
            Ask them to share it with you.
          </p>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9H-]/g, ''))}
              placeholder="H-XXXXXXX"
              className="font-mono tracking-widest text-center"
              maxLength={9}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyCode()}
            />
            <Button type="button" onClick={handleVerifyCode}
              disabled={isPending || code.length < 9}
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              {isPending ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
            </Button>
          </div>
          <button type="button" onClick={() => setStep('idle')}
            className="text-xs underline" style={{ color: 'var(--color-muted-foreground)' }}>
            Use a different handle
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>{error}</p>
      )}
    </div>
  )
}

export default function SettingsClient({ profile }: Props) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null)

  // Form state
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName]   = useState(profile?.last_name ?? '')
  const [bio, setBio]             = useState(profile?.bio ?? '')
  const [gender, setGender]       = useState(profile?.gender ?? '')
  const [country, setCountry]     = useState(profile?.country ?? '')
  const [phoneCountry, setPhoneCountry] = useState(profile?.phone_country ?? '')
  const [phoneNumber, setPhoneNumber]   = useState(profile?.phone_number ?? '')
  const [address, setAddress]     = useState(profile?.address ?? '')
  const [recoveryHandle, setRecoveryHandle] = useState(profile?.recovery_handle ?? '')
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [showPhoneDropdown, setShowPhoneDropdown] = useState(false)

  const selectedCountry = getCountry(country)
  const selectedPhoneCountry = getCountry(phoneCountry)
  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dialCode.includes(countrySearch)
  )

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    const fd = new FormData(e.currentTarget)
    fd.set('gender', gender)
    fd.set('country', country)
    fd.set('phone_country', phoneCountry)
    startTransition(async () => {
      const result = await updateProfile(fd)
      if (result?.error) setError(result.error)
      else setSaved(true)
    })
  }

  const handle = profile?.handle ?? ''
  const accountType = profile?.account_type ?? 'personal'
  const verified = profile?.verified === 'true' || profile?.verified === true as unknown as string

  return (
    <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>Settings</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage your Hostl account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ── Avatar ── */}
        <Section title="Profile picture" icon={User}>
          <div className="flex items-center gap-6">
            <AvatarUpload
              currentUrl={avatarUrl}
              displayName={`${firstName} ${lastName}`.trim() || handle}
              onUpload={(url) => setAvatarUrl(url)}
            />
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                {firstName} {lastName}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                @{handle}
                {verified && (
                  <VerifiedBadge accountType={accountType} size={13} className="ml-1.5" />
                )}
              </p>
              <p className="text-xs mt-2" style={{ color: 'var(--color-muted-foreground)' }}>
                JPG, PNG, WebP, GIF or SVG · Max 2MB
              </p>
            </div>
          </div>
        </Section>

        {/* ── Identity ── */}
        <Section title="Identity" icon={User}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="First name">
              <Input name="first_name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </Field>
            <Field label="Last name">
              <Input name="last_name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </Field>
          </div>

          <Field label="Bio">
            <textarea name="bio" value={bio} onChange={(e) => setBio(e.target.value)}
              rows={3} placeholder="Tell people a bit about yourself…"
              className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-foreground)' }} />
          </Field>

          <Field label="Gender">
            <div className="relative">
              <select name="gender" value={gender} onChange={(e) => setGender(e.target.value)}
                className="w-full rounded-lg border px-3 py-2.5 text-sm appearance-none focus:outline-none pr-8"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: gender ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}>
                <option value="">Select gender</option>
                {GENDER_OPTIONS.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: 'var(--color-muted-foreground)' }} />
            </div>
          </Field>

          {/* Hostl ID — read only */}
          <Field label="Hostl ID" hint="Your @handle is permanent and cannot be changed.">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-border-subtle)', color: 'var(--color-muted-foreground)' }}>
              <AtSign size={14} />
              <span>{handle}</span>
              <Lock size={12} className="ml-auto" />
            </div>
          </Field>
        </Section>

        {/* ── Contact ── */}
        <Section title="Contact & location" icon={Phone}>
          {/* Phone */}
          <Field label="Phone number">
            <div className="flex gap-2">
              {/* Country code picker */}
              <div className="relative">
                <button type="button"
                  onClick={() => { setShowPhoneDropdown(!showPhoneDropdown); setCountrySearch('') }}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm whitespace-nowrap"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: 'var(--color-foreground)', minWidth: '90px' }}>
                  {selectedPhoneCountry ? (
                    <><span>{selectedPhoneCountry.flag}</span><span>{selectedPhoneCountry.dialCode}</span></>
                  ) : (
                    <span style={{ color: 'var(--color-muted-foreground)' }}>+code</span>
                  )}
                  <ChevronDown size={12} style={{ color: 'var(--color-muted-foreground)' }} />
                </button>
                {showPhoneDropdown && (
                  <div className="absolute top-full left-0 mt-1 z-50 w-64 rounded-xl border overflow-hidden"
                    style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', boxShadow: '0 8px 24px oklch(0 0 0 / 0.12)' }}>
                    <div className="p-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                      <Input placeholder="Search country…" value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)} className="h-8 text-sm" autoFocus />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredCountries.map((c) => (
                        <button key={c.code} type="button"
                          onClick={() => { setPhoneCountry(c.code); setShowPhoneDropdown(false); setCountrySearch('') }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left"
                          style={{ color: 'var(--color-foreground)' }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                          <span>{c.flag}</span>
                          <span className="flex-1 truncate">{c.name}</span>
                          <span style={{ color: 'var(--color-muted-foreground)' }}>{c.dialCode}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Input name="phone_number" value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+\s\-()]/g, ''))}
                placeholder="Phone number" className="flex-1" type="tel" />
            </div>
          </Field>

          {/* Country */}
          <Field label="Country">
            <div className="relative">
              <button type="button"
                onClick={() => { setShowCountryDropdown(!showCountryDropdown); setCountrySearch('') }}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm text-left"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface-raised)', color: selectedCountry ? 'var(--color-foreground)' : 'var(--color-muted-foreground)' }}>
                {selectedCountry ? (
                  <><span>{selectedCountry.flag}</span><span>{selectedCountry.name}</span></>
                ) : (
                  <span>Select country</span>
                )}
                <ChevronDown size={14} className="ml-auto" style={{ color: 'var(--color-muted-foreground)' }} />
              </button>
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 z-50 w-full rounded-xl border overflow-hidden"
                  style={{ backgroundColor: 'var(--color-surface-raised)', borderColor: 'var(--color-border)', boxShadow: '0 8px 24px oklch(0 0 0 / 0.12)' }}>
                  <div className="p-2 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
                    <Input placeholder="Search country…" value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)} className="h-8 text-sm" autoFocus />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCountries.map((c) => (
                      <button key={c.code} type="button"
                        onClick={() => { setCountry(c.code); setShowCountryDropdown(false); setCountrySearch('') }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left"
                        style={{ color: 'var(--color-foreground)' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--color-accent)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}>
                        <span>{c.flag}</span>
                        <span>{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Field>

          {/* Address */}
          <Field label="Home address">
            <Input name="address" value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="123 Main Street, City" />
          </Field>
        </Section>

        {/* ── Security ── */}
        <Section title="Security & recovery" icon={Shield}>
          <RecoveryHandleField
            currentHandle={recoveryHandle}
            onVerified={(h) => setRecoveryHandle(h)}
          />

          <div className="pt-1">
            <Link href="/forgot-password">
              <Button type="button" variant="outline" className="gap-2 text-sm">
                <Lock size={14} /> Change password
              </Button>
            </Link>
          </div>
        </Section>

        {/* ── Verification (company/org only) ── */}
        {accountType !== 'personal' && (
          <Section title="Verification" icon={BadgeCheck}>
            {verified ? (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: 'oklch(0.95 0.05 145)' }}>
                  <Check size={16} style={{ color: 'oklch(0.45 0.18 145)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>Verified account</p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    Your ✓ badge is active on your profile and messages.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    Get verified
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                    Apply for a ✓ verification badge for your {accountType}.
                  </p>
                </div>
                <Link href="/settings/verify">
                  <Button type="button" variant="outline" className="gap-2 text-sm shrink-0">
                    <BadgeCheck size={14} /> Apply
                  </Button>
                </Link>
              </div>
            )}
          </Section>
        )}

        {/* Save */}
        {error && (
          <div className="text-sm px-3 py-2 rounded-lg"
            style={{ backgroundColor: 'oklch(0.97 0.02 27)', color: 'var(--color-destructive)', border: '1px solid oklch(0.90 0.05 27)' }}>
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            {isPending ? <><Loader2 size={14} className="animate-spin mr-2" />Saving…</> : 'Save changes'}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm"
              style={{ color: 'oklch(0.55 0.18 145)' }}>
              <Check size={14} /> Saved
            </span>
          )}
        </div>

      </form>
    </div>
  )
}
