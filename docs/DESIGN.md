# Hostl Design System

Complete design reference for web, mobile, and marketing site.

---

## Brand

### Logo files

| File | Use |
|------|-----|
| public/hostle.png | Full wordmark — sidebar, auth page, headers |
| public/hostle.webp | WebP version (legacy, avoid — transparent bg issues) |
| public/hostl-icon.png | Icon only (h.) — favicon, avatars, small spaces |
| public/vector/*.svg | Verification badge SVGs |

### Logo usage rules
- Use hostle.png on white/light backgrounds only (transparent bg)
- Use hostl-icon.png in circular avatar contexts
- Never place hostle.png on colored backgrounds
- Minimum width: 64px for wordmark, 24px for icon
- Always use style={{ width: X, height: "auto" }} to preserve aspect ratio

### Brand colors

Hostl uses a blue-purple primary palette inspired by the logo colors.

```css
--color-hostl-50:  oklch(0.97 0.01 264)
--color-hostl-100: oklch(0.93 0.03 264)
--color-hostl-200: oklch(0.86 0.07 264)
--color-hostl-300: oklch(0.76 0.12 264)
--color-hostl-400: oklch(0.64 0.18 264)
--color-hostl-500: oklch(0.54 0.22 264)
--color-hostl-600: oklch(0.46 0.22 264)  /* primary */
--color-hostl-700: oklch(0.38 0.19 264)
--color-hostl-800: oklch(0.30 0.15 264)
--color-hostl-900: oklch(0.22 0.10 264)
--color-hostl-950: oklch(0.14 0.07 264)
```

---

## Color tokens

All colors are CSS custom properties defined in src/app/globals.css.
Use these tokens everywhere — never hardcode hex values.

### Light mode

```css
--color-background:      oklch(0.99 0 0)        /* page background */
--color-foreground:      oklch(0.13 0.01 264)   /* primary text */
--color-surface:         oklch(0.97 0.005 264)  /* card/panel bg */
--color-surface-raised:  oklch(1 0 0)           /* elevated surface */
--color-border:          oklch(0.90 0.01 264)   /* default border */
--color-border-subtle:   oklch(0.94 0.005 264)  /* subtle border */
--color-muted:           oklch(0.55 0.01 264)   /* muted text */
--color-muted-foreground: oklch(0.45 0.02 264)  /* secondary text */
--color-primary:         var(--color-hostl-600) /* #4f46e5 approx */
--color-primary-foreground: oklch(1 0 0)        /* white */
--color-primary-hover:   var(--color-hostl-700)
--color-accent:          oklch(0.94 0.02 264)   /* hover/selected bg */
--color-accent-foreground: var(--color-hostl-700)
--color-destructive:     oklch(0.55 0.22 27)    /* red */
--color-success:         oklch(0.55 0.18 145)   /* green */
--color-warning:         oklch(0.72 0.18 75)    /* amber */
--color-sidebar-bg:      oklch(0.97 0.008 264)
--color-sidebar-active:  oklch(0.92 0.03 264)
--color-sidebar-hover:   oklch(0.94 0.015 264)
```

### Dark mode

```css
--color-background:      oklch(0.10 0.01 264)
--color-foreground:      oklch(0.95 0.005 264)
--color-surface:         oklch(0.13 0.015 264)
--color-surface-raised:  oklch(0.16 0.015 264)
--color-border:          oklch(0.22 0.02 264)
--color-border-subtle:   oklch(0.18 0.015 264)
--color-primary:         var(--color-hostl-400)  /* lighter in dark */
--color-sidebar-bg:      oklch(0.12 0.015 264)
--color-sidebar-active:  oklch(0.18 0.03 264)
--color-sidebar-hover:   oklch(0.15 0.02 264)
```

### Badge colors (hardcoded, not tokens)

```
Personal verified:     #1877F2  (blue)
Company/org verified:  #1877F2  (blue)
Government verified:   #829AAB  (grey-blue)
Service verified:      #7C3AED  (purple)
Commerce verified:     #16A34A  (green)
```

---

## Typography

```css
--font-sans: "Inter", ui-sans-serif, system-ui, sans-serif
```

Load Inter via next/font/google (web) or expo-font (mobile).

### Scale

| Token | Size | Use |
|-------|------|-----|
| text-xs | 11px | Hints, timestamps, badges |
| text-sm | 13px | Body text, labels |
| text-base | 15px | Default body |
| text-lg | 17px | Subheadings |
| text-xl | 20px | Section headings |
| text-2xl | 24px | Page headings |

### Weights
- Regular (400): body text
- Medium (500): labels, secondary headings
- Semibold (600): headings, names, important text
- Bold (700): rarely used

---

## Spacing

Use Tailwind spacing scale. Key values:

| Class | Value | Use |
|-------|-------|-----|
| p-1.5 | 6px | Icon buttons |
| p-2 | 8px | Toolbar buttons |
| p-3 | 12px | Card padding small |
| p-4 | 16px | Standard padding |
| p-5 | 20px | Card padding |
| p-6 | 24px | Page padding |
| gap-2 | 8px | Tight element spacing |
| gap-3 | 12px | Standard spacing |
| gap-4 | 16px | Section spacing |

---

## Border radius

```css
--radius-sm:   0.375rem  (6px)   /* inputs, small elements */
--radius-md:   0.5rem    (8px)   /* buttons, tags */
--radius-lg:   0.75rem   (12px)  /* cards, panels */
--radius-xl:   1rem      (16px)  /* modals, large cards */
--radius-full: 9999px            /* pills, avatars */
```

Tailwind classes: rounded-md, rounded-lg, rounded-xl, rounded-full

---

## Components

### Button

Primary:
```tsx
<Button style={{ backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" }}>
  Action
</Button>
```

Outline:
```tsx
<Button variant="outline">Secondary</Button>
```

Icon button (toolbar):
```tsx
<button className="p-2 rounded-lg transition-colors"
  style={{ color: "var(--color-muted-foreground)" }}
  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--color-accent)"}
  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}>
  <Icon size={17} />
</button>
```

### Input

```tsx
<Input placeholder="..." />
```

With icon:
```tsx
<div className="relative">
  <AtSign size={15} className="absolute left-3 top-1/2 -translate-y-1/2"
    style={{ color: "var(--color-muted-foreground)" }} />
  <Input className="pl-8" />
</div>
```

### Avatar

```tsx
<Avatar className="w-9 h-9">
  {avatarUrl
    ? <img src={avatarUrl} className="w-9 h-9 rounded-full object-cover" />
    : <AvatarFallback style={{ backgroundColor: "var(--color-hostl-100)", color: "var(--color-hostl-700)" }}>
        {initials}
      </AvatarFallback>
  }
</Avatar>
```

### Section card

```tsx
<div className="rounded-xl p-5 space-y-4"
  style={{ backgroundColor: "var(--color-surface)", border: "1px solid var(--color-border-subtle)" }}>
  {children}
</div>
```

### Error message

```tsx
<div className="text-sm px-3 py-2 rounded-lg"
  style={{
    backgroundColor: "oklch(0.97 0.02 27)",
    color: "var(--color-destructive)",
    border: "1px solid oklch(0.90 0.05 27)"
  }}>
  {error}
</div>
```

### Success message

```tsx
<div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-lg"
  style={{
    backgroundColor: "oklch(0.95 0.05 145)",
    color: "oklch(0.35 0.15 145)",
    border: "1px solid oklch(0.85 0.08 145)"
  }}>
  <CheckCircle2 size={14} />
  Success message
</div>
```

---

## Layout patterns

### App shell (sidebar + content)

```
┌─────────────────────────────────────────┐
│ Sidebar (w-64)  │  Main content (flex-1) │
│                 │                        │
│ Logo            │  Header                │
│ Compose btn     │  ─────────────────     │
│ Nav items       │  Content               │
│ Labels          │                        │
│ ─────────────── │                        │
│ User profile    │                        │
└─────────────────────────────────────────┘
```

### Inbox split view

```
┌──────────────────────────────────────────────────┐
│ Message list (w-80 lg:w-96) │ Message detail      │
│                             │                     │
│ Header + search             │ Toolbar             │
│ ─────────────────           │ ─────────────────   │
│ MessageRow                  │ Subject             │
│ MessageRow                  │ Sender info         │
│ MessageRow                  │ Body                │
│                             │ Actions             │
└──────────────────────────────────────────────────┘
```

### Auth layout

```
┌──────────────────────────────────────────┐
│ Left panel (480px) │ Right panel (flex-1) │
│                    │                     │
│ Logo               │ Form                │
│                    │                     │
│ Headline           │                     │
│ Feature list       │                     │
│                    │                     │
│ Footer             │                     │
└──────────────────────────────────────────┘
```

---

## Icons

Library: lucide-react (web), lucide-react-native (mobile)
Version: 1.14.0

### Key icons used

| Icon | Use |
|------|-----|
| Inbox | Inbox nav |
| Star | Important/starred |
| Send | Sent nav |
| FileText | Drafts nav |
| Archive | Archive action |
| Trash2 | Delete action |
| PenSquare | Compose button |
| Users | Mass message |
| ShieldAlert | Suspicious nav |
| FolderX | Isolated nav |
| Tag | Labels |
| BadgeCheck | Verification |
| AtSign | Handle input prefix |
| Search | Search input |
| MoreHorizontal | More actions menu |
| Reply | Reply action |
| Forward | Forward action |
| Star | Star/important |
| MailOpen | Mark as read |
| Mail | Mark as unread |
| Clock | Snooze |
| Flag | Report |
| ShieldOff | Block |
| Camera | Avatar upload |
| RotateCw | Rotate in crop |
| CheckCircle2 | Success state |
| Loader2 | Loading spinner (animate-spin) |

### Icon sizing

| Context | Size |
|---------|------|
| Toolbar buttons | 17px |
| Nav items | 15px |
| Inline text | 13-14px |
| Badges | 11-13px |
| Large UI | 20-24px |

---

## Dropdown menus

Use SimpleMenu (src/components/ui/simple-menu.tsx) for action menus.
Do NOT use Base UI DropdownMenu for action menus — z-index issues in scroll containers.

SimpleMenu uses createPortal to render on document.body at z-index 9999.

```tsx
<SimpleMenu
  trigger={<MoreHorizontal size={17} />}
  align="end"
  items={[
    { label: "Action", icon: IconComponent, onClick: handler },
    { separator: true },
    { label: "Danger", icon: TrashIcon, onClick: handler, danger: true },
    { label: "Warning", icon: FlagIcon, onClick: handler, warning: true },
  ]}
/>
```

---

## Scrollbar styling

```css
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 9999px; }
::-webkit-scrollbar-thumb:hover { background: var(--color-muted); }
```

---

## Animation

- Loading spinner: className="animate-spin" on Loader2 icon
- Transitions: transition-colors (default), transition-all (for size changes)
- Duration: default Tailwind (150ms)
- No heavy animations — keep it fast and clean

---

## Website design guide

### Marketing site principles
- Same design tokens as the app
- Clean, minimal — inspired by Linear, Vercel, Notion
- Left panel of auth page is the reference for the marketing aesthetic
- Headline font: Inter Semibold, tight tracking
- Body: Inter Regular, comfortable line-height (1.6)
- CTA buttons: primary color, rounded-xl, font-medium
- No gradients, no heavy shadows, no decorative patterns
- Use the feature list pattern from auth layout for feature sections

### Key pages
- / — Hero with headline + CTA + feature highlights
- /features — Detailed feature breakdown
- /pricing — Freemium tiers
- /u/[handle] — Public profile (already built)
- /blog — Updates and announcements

### Hero section pattern
```
Hostl.

Your inbox, finally interactive.

Send, receive, and complete actions entirely inside
one app. No more clicking links and leaving.

[Create your Hostl ID]  [See how it works]
```

### Color usage on marketing site
- Background: white (#ffffff)
- Text: var(--color-foreground)
- Accent sections: var(--color-surface)
- CTA: var(--color-primary)
- Feature icons: var(--color-accent) bg + var(--color-primary) icon
