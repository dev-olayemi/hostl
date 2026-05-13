# Hostl Website — Development Guide

> This document is the complete brief for building hostl.cloud (the marketing website).
> Read every section. Follow every rule. The website must feel like an extension of the app.

---

## 1. Project identity

**Domain:** hostl.cloud
**App URL:** app.hostl.cloud
**Messaging URL:** message.hostl.cloud
**Framework:** Next.js 16 (App Router)
**Styling:** Tailwind CSS v4 + shadcn/ui
**Language:** TypeScript
**Font:** Inter (via next/font/google)

---

## 2. What this website is for

Hostl is a universal interaction and identity platform.
The website has one job: make someone understand what Hostl does in under 10 seconds
and give them a reason to create an account.

The tone is:
- Confident, not arrogant
- Simple, not dumbed down
- Modern, not trendy
- Focused, not cluttered

Inspiration: Linear.app, Vercel.com, Notion.so — clean, fast, purposeful.

---

## 3. Pages

| Route | Page |
|-------|------|
| / | Home (hero + features + CTA) |
| /features | Full feature breakdown |
| /pricing | Free + paid tiers |
| /about | Story, mission, team |
| /blog | Updates, announcements |
| /security | How we keep data safe |
| /u/[handle] | Public profile (already in app repo) |

---

## 4. Navigation

```
[Hostl logo]    Features  Pricing  About  Blog    [Open app]  [Create account]
```

- Logo: hostle.png (full wordmark) on white background
- Links: text-sm, font-medium, text-foreground/70, hover:text-foreground
- "Open app" → https://message.hostl.cloud (outlined button)
- "Create account" → https://app.hostl.cloud/signup (filled primary button)
- Mobile: hamburger menu, full-screen overlay
- Sticky on scroll with subtle backdrop-blur

---

## 5. Home page sections

### Section 1 — Hero

Full viewport height. Centered content.

```
[Hostl logo — large, centered]

Your inbox,
finally interactive.

Send approvals, RSVPs, polls, and forms
that recipients complete right inside the message.
No redirects. No extra logins. Just done.

[Create your Hostl ID — free]    [See how it works ↓]

[App screenshot / mockup]
```

- Headline: text-5xl md:text-7xl, font-semibold, tracking-tight, text-foreground
- Subheadline: text-lg md:text-xl, text-muted-foreground, max-w-xl, mx-auto
- Primary CTA → app.hostl.cloud/signup
- Secondary CTA → scrolls to features section
- Background: white, subtle grid pattern (CSS, not image)
- App mockup: screenshot of the inbox on a device frame

### Section 2 — Problem statement

```
Email was built for 1999.

You get a message. You click a link.
You open a browser. You log in again.
You fill a form. You go back.

Every single day. For every single thing.

There is a better way.
```

- Dark background section: bg-foreground, text-background
- Large text, centered, line by line reveal on scroll
- Simple. No icons. No cards. Just words.

### Section 3 — How it works

Three steps, horizontal on desktop, vertical on mobile:

```
1. Get your @handle
   One ID for everything. @yourname is yours forever.

2. Send interactive messages
   Approvals, RSVPs, polls, forms — built right into the message.

3. Recipients act inside the message
   No links. No redirects. They approve, RSVP, vote — right there.
```

- Step number: text-primary, font-bold, text-4xl
- Title: text-xl, font-semibold
- Description: text-muted-foreground
- Divider lines between steps on desktop

### Section 4 — Feature showcase

Alternating left/right layout. App screenshot on one side, text on the other.

**Feature 1: Approvals**
```
[Screenshot: approval message with Approve/Decline buttons]

Approvals that actually get approved.

Send a leave request, invoice approval, or access request.
The recipient approves or declines right inside the message.
You get notified instantly. No email chains. No follow-ups.
```

**Feature 2: RSVP**
```
[Screenshot: RSVP message with event card]

Event invites people actually respond to.

Send an event invitation with date, time, and location.
Guests RSVP with one tap. You see who is coming in real time.
```

**Feature 3: Polls**
```
[Screenshot: poll with live results]

Decisions made faster.

Ask a question. Get answers. See live results.
No Google Forms. No survey links. Just send and done.
```

**Feature 4: @handle identity**
```
[Screenshot: compose with @handle lookup]

One handle. Every platform.

Share hostl.cloud/u/yourname anywhere.
Anyone can send you a message — no account needed to view your profile.
```

### Section 5 — Verification badges

Showcase the badge system visually.

```
Trust, built in.

Verified badges tell recipients exactly who they are dealing with.

[Personal ✓]     Verified individuals
[Company ✓]      Verified businesses
[Government ✓]   Official government accounts
[Service ✓]      Trusted integrations
[Commerce ✓]     Verified merchants
```

- Show each badge SVG at 24px next to the label
- Use the exact badge colors from the design system
- Brief description under each

### Section 6 — CTA banner

```
Ready to upgrade your inbox?

Create your Hostl ID in 30 seconds. Free forever.

[Create your Hostl ID]
```

- Background: primary color (#4f46e5)
- Text: white
- Button: white background, primary text

### Section 7 — Footer

```
[Hostl logo]
The universal interaction platform.

Product          Company          Legal
Features         About            Privacy
Pricing          Blog             Terms
Security         Contact          Cookies

© 2026 Hostl · hostl.cloud
```

---

## 6. Design rules — MUST follow

### Colors

All colors use CSS custom properties. Never hardcode hex values in components.
Define these in globals.css exactly as in the app:

```css
:root {
  --color-background: oklch(0.99 0 0);
  --color-foreground: oklch(0.13 0.01 264);
  --color-surface: oklch(0.97 0.005 264);
  --color-surface-raised: oklch(1 0 0);
  --color-border: oklch(0.90 0.01 264);
  --color-border-subtle: oklch(0.94 0.005 264);
  --color-muted-foreground: oklch(0.45 0.02 264);
  --color-primary: oklch(0.46 0.22 264);
  --color-primary-foreground: oklch(1 0 0);
  --color-accent: oklch(0.94 0.02 264);
}

.dark {
  --color-background: oklch(0.10 0.01 264);
  --color-foreground: oklch(0.95 0.005 264);
  --color-surface: oklch(0.13 0.015 264);
  --color-border: oklch(0.22 0.02 264);
  --color-primary: oklch(0.64 0.18 264);
}
```

### Typography rules

- Font: Inter only. No other fonts.
- Headings: font-semibold, tracking-tight
- Body: font-normal, leading-relaxed
- Captions/labels: text-sm, text-muted-foreground
- NEVER use font-bold on headings — use font-semibold
- NEVER use pure black (#000) — use text-foreground token
- NEVER use pure white (#fff) on light bg — use text-foreground

### Spacing rules

- Section padding: py-24 md:py-32
- Container max width: max-w-6xl mx-auto px-6
- Card padding: p-6 or p-8
- Gap between elements: gap-4 (tight), gap-6 (standard), gap-12 (sections)
- Never use arbitrary spacing values — use Tailwind scale

### Component rules

**Buttons:**
```tsx
// Primary
<Button style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
  Create your Hostl ID
</Button>

// Outline
<Button variant="outline">Open app</Button>
```

**Cards:**
```tsx
<div className="rounded-xl p-6 border"
  style={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border-subtle)" }}>
  content
</div>
```

**Section headings:**
```tsx
<h2 className="text-3xl md:text-4xl font-semibold tracking-tight"
  style={{ color: "var(--color-foreground)" }}>
  Heading
</h2>
<p className="text-lg mt-4 max-w-2xl"
  style={{ color: "var(--color-muted-foreground)" }}>
  Subheading
</p>
```

### What NOT to do

- No gradients on backgrounds
- No drop shadows on cards (use border instead)
- No rounded-full on cards (use rounded-xl)
- No emoji in headings or body text
- No stock photos — use app screenshots and device mockups
- No animations that delay content loading
- No carousels or sliders
- No pop-ups or cookie banners on first load
- No more than 2 font weights per section
- No centered text in body paragraphs (only in hero and CTA)

---

## 7. shadcn/ui setup

Install shadcn with the same config as the app:

```bash
npx shadcn@latest init
```

Components to install:
```bash
npx shadcn@latest add button input label badge avatar separator card
```

The website uses the same component library as the app.
This ensures buttons, inputs, and cards look identical across both.

---

## 8. Mobile responsiveness rules

- Mobile-first: write mobile styles first, add md: and lg: breakpoints
- Navigation: hamburger at md:hidden, full nav at md:flex
- Hero headline: text-4xl on mobile, text-7xl on desktop
- Feature sections: stack vertically on mobile (flex-col), side by side on desktop (md:flex-row)
- Screenshots: full width on mobile, 500n desktop
- Footer: single column on mobile, 4 columns on desktop
- Touch targets: minimum 44px height on all interactive elements
- No horizontal scroll on any screen size

---

## 9. App links

All CTAs must use these exact URLs:

| Action | URL |
|--------|-----|
| Create account | https://app.hostl.cloud/signup |
| Sign in | https://app.hostl.cloud/login |
| Open inbox | https://message.hostl.cloud |
| Public profile | https://hostl.cloud/u/[handle] |

The website itself (hostl.cloud) is marketing only.
The app lives at app.hostl.cloud.
The messaging interface lives at message.hostl.cloud.

---

## 10. SEO and metadata

```typescript
export const metadata = {
  title: "Hostl — Your inbox, finally interactive",
  description: "Send approvals, RSVPs, polls, and forms that recipients complete right inside the message. No redirects. No extra logins.",
  openGraph: {
    title: "Hostl",
    description: "Your inbox, finally interactive.",
    url: "https://hostl.cloud",
    siteName: "Hostl",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hostl — Your inbox, finally interactive",
  },
  icons: {
    icon: "/hostl-icon.png",
    apple: "/hostl-icon.png",
  }
}
```

---

## 11. Performance rules

- All images: use next/image with width + height + style={{ height: "auto" }}
- App screenshots: WebP format, compressed
- No external CSS or JS libraries beyond what is listed
- No Google Analytics on first load — defer or use privacy-first alternative
- Lighthouse score target: 95+ on all metrics
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, FID < 100ms

---

## 12. Environment

```env
NEXT_PUBLIC_APP_URL=https://app.hostl.cloud
NEXT_PUBLIC_MESSAGE_URL=https://message.hostl.cloud
NEXT_PUBLIC_SITE_URL=https://hostl.cloud
```

---

## 13. Reference files (from app repo)

Copy these directly from https://github.com/dev-olayemi/hostl:

| File | Use |
|------|-----|
| public/hostle.png | Full wordmark logo |
| public/hostl-icon.png | Icon for favicon + small spaces |
| public/vector/*.svg | Verification badge SVGs |
| src/app/globals.css | Color tokens (copy exactly) |
| docs/DESIGN.md | Full design system reference |
| docs/05-badges.md | Badge colors and SVG paths |
