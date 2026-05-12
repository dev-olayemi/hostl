import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Image from 'next/image'
import Link from 'next/link'
import VerifiedBadge from '@/components/ui/VerifiedBadge'
import { isSystemProfile } from '@/lib/system'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>
}): Promise<Metadata> {
  const { handle } = await params
  return {
    title: `@${handle} on Hostl`,
    description: `Send a message to @${handle} on Hostl`,
  }
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>
}) {
  const { handle } = await params

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: profile } = await admin
    .from('profiles')
    .select('id, handle, display_name, avatar_url, bio, account_type, verified, is_system, created_at')
    .eq('handle', handle.toLowerCase())
    .single()

  if (!profile) notFound()

  const initials = profile.display_name
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="flex justify-center">
          <Link href="/">
            <Image src="/hostle.png" alt="Hostl" width={80} height={40}
              style={{ width: 80, height: 'auto' }} />
          </Link>
        </div>

        {/* Profile card */}
        <div className="rounded-2xl p-8 text-center space-y-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border-subtle)' }}>

          {/* Avatar */}
          <div className="flex justify-center">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name}
                className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold"
                style={{ backgroundColor: 'var(--color-hostl-100)', color: 'var(--color-hostl-700)' }}>
                {initials}
              </div>
            )}
          </div>

          {/* Name + badges */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-xl font-semibold" style={{ color: 'var(--color-foreground)' }}>
                {profile.display_name}
              </h1>
              {profile.verified && (
                <div className="flex items-center gap-1">
                  {isSystemProfile(profile) ? (
                    <>
                      <VerifiedBadge accountType="service" size={18} />
                      <VerifiedBadge accountType="personal" size={18} />
                    </>
                  ) : (
                    <VerifiedBadge accountType={profile.account_type} size={18} />
                  )}
                </div>
              )}
            </div>
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              @{profile.handle}
            </p>
            {profile.account_type !== 'personal' && (
              <span className="inline-block text-xs px-2 py-0.5 rounded-full capitalize"
                style={{ backgroundColor: 'var(--color-border-subtle)', color: 'var(--color-muted-foreground)' }}>
                {isSystemProfile(profile) ? 'System' : profile.account_type}
              </span>
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              {profile.bio}
            </p>
          )}

          {/* CTA */}
          <Link href={`/compose?to=${profile.handle}`}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-medium text-sm transition-colors"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            Send a message to @{profile.handle}
          </Link>

          <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            You need a Hostl account to send messages.{' '}
            <Link href="/signup" style={{ color: 'var(--color-primary)' }}>
              Create one free
            </Link>
          </p>
        </div>

        {/* Share link hint */}
        <p className="text-center text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          Share this profile:{' '}
          <span className="font-mono" style={{ color: 'var(--color-foreground)' }}>
            hostl.net/u/{profile.handle}
          </span>
        </p>

      </div>
    </div>
  )
}
