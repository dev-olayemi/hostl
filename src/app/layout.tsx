import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Hostl — Your universal interaction inbox',
    template: '%s | Hostl',
  },
  description:
    'Send, receive, and complete actions entirely inside one seamless app. No more clicking links and leaving for external websites.',
  metadataBase: new URL('https://hostl.net'),
  icons: {
    icon: [
      { url: '/hostl-icon.png', type: 'image/png' },
    ],
    shortcut: '/hostl-icon.png',
    apple: '/hostl-icon.png',
  },
  openGraph: {
    title: 'Hostl — Your universal interaction inbox',
    description: 'Send approvals, RSVPs, polls, and forms that recipients complete right inside the message. No redirects. No extra logins.',
    url: 'https://hostl.net',
    siteName: 'Hostl',
    images: [
      {
        url: '/main-banner.png',
        width: 1200,
        height: 630,
        alt: 'Hostl — Your inbox, finally interactive',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hostl — Your universal interaction inbox',
    description: 'Send approvals, RSVPs, polls, and forms that recipients complete right inside the message.',
    images: ['/main-banner.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  )
}
