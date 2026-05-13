'use client'

import { useState, useTransition } from 'react'
import { BadgeCheck, Clock, XCircle, CheckCircle2, Loader2, Building2, Globe, MapPin, FileText, User, Mail, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { submitVerification } from './actions'

interface Props {
  accountType: string
  verified: boolean
  existing: Record<string, string> | null
}

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'oklch(0.72 0.18 75)',
    bg: 'oklch(0.97 0.04 75)',
    border: 'oklch(0.88 0.08 75)',
    label: 'Under review',
    desc: 'Your application has been submitted and is being reviewed. We\'ll notify you once a decision is made.',
  },
  under_review: {
    icon: Clock,
    color: 'oklch(0.55 0.18 220)',
    bg: 'oklch(0.96 0.03 220)',
    border: 'oklch(0.85 0.06 220)',
    label: 'Under review',
    desc: 'Our team is actively reviewing your application.',
  },
  approved: {
    icon: CheckCircle2,
    color: 'oklch(0.55 0.18 145)',
    bg: 'oklch(0.96 0.04 145)',
    border: 'oklch(0.85 0.08 145)',
    label: 'Verified',
    desc: 'Your account has been verified. The ✓ badge is now visible on your profile and messages.',
  },
  rejected: {
    icon: XCircle,
    color: 'var(--color-destructive)',
    bg: 'oklch(0.97 0.02 27)',
    border: 'oklch(0.90 0.05 27)',
    label: 'Not approved',
    desc: 'Your application was not approved. You can update your details and resubmit.',
  },
}

export default function VerificationForm({ accountType, verified, existing }: Props) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const status = existing?.status as keyof typeof STATUS_CONFIG | undefined
  const statusConfig = status ? STATUS_CONFIG[status] : null
  const canSubmit = !existing || existing.status === 'rejected'

  if (accountType === 'personal') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Verification
        </h1>
        <div className="rounded-xl p-5 text-sm"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-muted-foreground)' }}>
          Verification is available for <strong>Company</strong> and <strong>Organization</strong> accounts only.
          If you represent a company or organization, update your account type in Settings first.
        </div>
      </div>
    )
  }

  if (verified || status === 'approved') {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>Verification</h1>
        <div className="rounded-xl p-5 flex items-start gap-4"
          style={{ backgroundColor: STATUS_CONFIG.approved.bg, border: `1px solid ${STATUS_CONFIG.approved.border}` }}>
          <BadgeCheck size={24} style={{ color: STATUS_CONFIG.approved.color, flexShrink: 0 }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: STATUS_CONFIG.approved.color }}>Your account is verified</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{STATUS_CONFIG.approved.desc}</p>
          </div>
        </div>
      </div>
    )
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await submitVerification(fd)
      if (result?.error) setError(result.error)
      else setSuccess(true)
    })
  }

  if (success) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>Verification</h1>
        <div className="rounded-xl p-5 flex items-start gap-4"
          style={{ backgroundColor: STATUS_CONFIG.pending.bg, border: `1px solid ${STATUS_CONFIG.pending.border}` }}>
          <Clock size={22} style={{ color: STATUS_CONFIG.pending.color }} />
          <div>
            <p className="font-semibold text-sm" style={{ color: STATUS_CONFIG.pending.color }}>Application submitted</p>
            <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>{STATUS_CONFIG.pending.desc}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BadgeCheck size={22} style={{ color: 'var(--color-primary)' }} />
          <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Apply for Verification
          </h1>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Verified accounts get a ✓ badge on their profile and messages, building trust with recipients.
        </p>
      </div>

      {/* Current status banner */}
      {statusConfig && status !== 'approved' && (
        <div className="rounded-xl p-4 flex items-start gap-3"
          style={{ backgroundColor: statusConfig.bg, border: `1px solid ${statusConfig.border}` }}>
          <statusConfig.icon size={18} style={{ color: statusConfig.color, marginTop: 1 }} />
          <div>
            <p className="text-sm font-medium" style={{ color: statusConfig.color }}>{statusConfig.label}</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>{statusConfig.desc}</p>
            {existing?.rejection_reason && (
              <p className="text-xs mt-1 font-medium" style={{ color: 'var(--color-destructive)' }}>
                Reason: {existing.rejection_reason}
              </p>
            )}
          </div>
        </div>
      )}

      {canSubmit && (
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Organization details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <Building2 size={15} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Organization details
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="legal_name">Legal name <span style={{ color: 'var(--color-destructive)' }}>*</span></Label>
                <Input id="legal_name" name="legal_name" placeholder="Acme Inc." required
                  defaultValue={existing?.legal_name} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="description">What does your organization do? <span style={{ color: 'var(--color-destructive)' }}>*</span></Label>
                <textarea id="description" name="description" required rows={3}
                  placeholder="Brief description of your organization's purpose and activities…"
                  defaultValue={existing?.description}
                  className="w-full rounded-lg border px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)', color: 'var(--color-foreground)' }} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="registration_number">
                  <Hash size={12} className="inline mr-1" />
                  Registration / Charity number
                </Label>
                <Input id="registration_number" name="registration_number"
                  placeholder="Optional" defaultValue={existing?.registration_number} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">
                  <Globe size={12} className="inline mr-1" />
                  Website <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </Label>
                <Input id="website" name="website" type="url" placeholder="https://example.com"
                  required defaultValue={existing?.website} />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <MapPin size={15} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Location</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="country">Country <span style={{ color: 'var(--color-destructive)' }}>*</span></Label>
                <Input id="country" name="country" placeholder="Nigeria" required
                  defaultValue={existing?.country} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" placeholder="Lagos" defaultValue={existing?.city} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" placeholder="123 Main Street"
                  defaultValue={existing?.address} />
              </div>
            </div>
          </div>

          {/* Contact person */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: 'var(--color-border-subtle)' }}>
              <User size={15} style={{ color: 'var(--color-primary)' }} />
              <h2 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>Contact person</h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
              This person will be contacted if we need to verify your application. Not shown publicly.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="contact_name">Full name <span style={{ color: 'var(--color-destructive)' }}>*</span></Label>
                <Input id="contact_name" name="contact_name" placeholder="Jane Smith" required
                  defaultValue={existing?.contact_name} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="contact_title">Title / Role <span style={{ color: 'var(--color-destructive)' }}>*</span></Label>
                <Input id="contact_title" name="contact_title" placeholder="CEO, Director, etc." required
                  defaultValue={existing?.contact_title} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="contact_email">
                  <Mail size={12} className="inline mr-1" />
                  Contact email <span style={{ color: 'var(--color-destructive)' }}>*</span>
                </Label>
                <Input id="contact_email" name="contact_email" type="email"
                  placeholder="contact@yourcompany.com" required defaultValue={existing?.contact_email} />
                <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                  Must be a company email address (not Gmail, Yahoo, etc.)
                </p>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-xl p-4 text-xs space-y-1"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)', color: 'var(--color-muted-foreground)' }}>
            <p className="font-medium" style={{ color: 'var(--color-foreground)' }}>Before you submit</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>All information must be accurate and verifiable.</li>
              <li>Providing false information will result in permanent account suspension.</li>
              <li>Review typically takes 3–5 business days.</li>
              <li>We may contact you at the email provided for additional verification.</li>
            </ul>
          </div>

          {error && (
            <div className="text-sm px-3 py-2 rounded-lg"
              style={{ backgroundColor: 'oklch(0.97 0.02 27)', color: 'var(--color-destructive)', border: '1px solid oklch(0.90 0.05 27)' }}>
              {error}
            </div>
          )}

          <Button type="submit" disabled={isPending} className="w-full gap-2"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            {isPending
              ? <><Loader2 size={14} className="animate-spin" />Submitting…</>
              : <><BadgeCheck size={15} />{status === 'rejected' ? 'Resubmit application' : 'Submit for verification'}</>
            }
          </Button>
        </form>
      )}
    </div>
  )
}
