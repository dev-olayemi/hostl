import Image from 'next/image'
import { AtSign, Zap, Shield, Users } from 'lucide-react'

const FEATURES = [
  {
    icon: AtSign,
    title: 'One handle, everything',
    desc: 'Your @handle works across messages, approvals, forms, and identity.',
  },
  {
    icon: Zap,
    title: 'Act without leaving',
    desc: 'Approve, RSVP, sign, and submit — all inside the message.',
  },
  {
    icon: Shield,
    title: 'Built for trust',
    desc: 'Verified handles, secure actions, no phishing links.',
  },
  {
    icon: Users,
    title: 'Personal, company, or org',
    desc: 'One platform for individuals, teams, and institutions.',
  },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* ── Left panel ── */}
      <div
        className="hidden lg:flex lg:w-[480px] xl:w-[520px] shrink-0 flex-col justify-between px-14 py-12 border-r"
        style={{
          backgroundColor: 'var(--color-background)',
          borderColor: 'var(--color-border-subtle)',
        }}
      >
        {/* Logo */}
        <div>
          <Image
            src="/hostle.png"
            alt="Hostl"
            width={80}
            height={40}
            loading="eager"
            style={{ width: 80, height: 'auto' }}
          />
        </div>

        {/* Feature list */}
        <div className="space-y-8">
          <p
            className="text-2xl font-semibold leading-snug tracking-tight"
            style={{ color: 'var(--color-foreground)' }}
          >
            Your inbox,<br />finally interactive.
          </p>

          <div className="space-y-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-4">
                <div
                  className="mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--color-accent)',
                    color: 'var(--color-primary)',
                  }}
                >
                  <f.icon size={15} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {f.title}
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--color-muted-foreground)' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-5 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
          <span>© 2026 Hostl</span>
          <a href="#" className="hover:underline">Privacy</a>
          <a href="#" className="hover:underline">Terms</a>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12"
        style={{ backgroundColor: 'var(--color-surface)' }}
      >
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Image
            src="/hostle.png"
            alt="Hostl"
            width={64}
            height={32}
            style={{ width: 64, height: 'auto' }}
          />
        </div>

        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

    </div>
  )
}
