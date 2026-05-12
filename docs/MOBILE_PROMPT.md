# Hostl Mobile App — Full Development Prompt

> Use this document as the complete briefing for building the Hostl mobile app.
> Read every section before writing a single line of code.

---

## 1. Project Identity

**App name:** Hostl
**Tagline:** Your inbox, finally interactive.
**Bundle ID:** net.hostl.app
**App icon:** hostl-icon (the colorful "h." mark — blue, red, yellow, green)
**Primary color:** #4f46e5 (indigo/blue-purple)
**Platform:** iOS + Android
**Framework:** React Native with Expo (SDK 52+)
**Router:** Expo Router (file-based, mirrors Next.js App Router)

---

## 2. What is Hostl?

Hostl is a universal interaction and identity platform.
Every user gets a single @handle.
They use it to send and receive messages that contain interactive actions:
approvals, RSVPs, forms, surveys — all completable inside the message.
No redirects. No external links. No re-logging in.

Think of it as the evolution of email:
- Email tells you something happened
- Hostl lets you act on it immediately

---

## 3. Core objective of the mobile app

The mobile app must deliver the full Hostl experience on iOS and Android:
1. Create a Hostl ID (@handle) — no email required
2. Send and receive interactive messages
3. Complete actions (approve, decline, RSVP, submit) inside messages
4. Manage inbox with labels, categories, bulk actions
5. Full profile with avatar, verification badges
6. Persistent sessions — stay logged in like GitHub
7. Push notifications for new messages and actions
8. Deep links — hostl://compose?to=handle

---

## 4. Tech stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Expo SDK 52 | Managed workflow, OTA updates |
| Router | Expo Router v4 | File-based, mirrors web |
| Language | TypeScript | Same as web |
| Auth | @supabase/supabase-js + AsyncStorage | Same backend |
| Styling | NativeWind v4 (Tailwind for RN) | Design token parity |
| Icons | lucide-react-native | Same icon set as web |
| Rich text | react-native-webview (render Tiptap HTML) | Consistent rendering |
| Image | expo-image-picker + expo-image-manipulator | Crop/rotate |
| Image upload | fetch POST to /api/upload-avatar | Same Cloudinary pipeline |
| Notifications | expo-notifications | Push + local |
| Storage | @react-native-async-storage/async-storage | Session persistence |
| Haptics | expo-haptics | Tactile feedback on actions |
| Clipboard | expo-clipboard | Copy verification codes |

## 5. Backend (already built — DO NOT rebuild)

The backend is live at https://hostl.net (Next.js 16 + Supabase).
GitHub: https://github.com/dev-olayemi/hostl

Supabase project: tilbejapfljfvdvqtggo.supabase.co

The mobile app connects to the SAME Supabase project.
Do NOT create a new Supabase project.
Do NOT recreate any tables — they already exist.

### Environment variables for mobile

```
EXPO_PUBLIC_SUPABASE_URL=https://tilbejapfljfvdvqtggo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRpbGJlamFwZmxqZnZkdnF0Z2dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MDQyODMsImV4cCI6MjA5Mzk4MDI4M30.no-GnuZs0No_pxI5t_u4Bu8hl9UiJm58ptZCVh67WBs
EXPO_PUBLIC_API_URL=https://hostl.net
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dtelqmqjf
```

NEVER put SUPABASE_SERVICE_ROLE_KEY in the mobile app.
All admin operations go through the web API with a Bearer token.

### Supabase client setup

```typescript
import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
)
```

## 6. Authentication (handle-based, no email)

Hostl does NOT use email for login. Users sign in with @handle + password.

Internally, Supabase stores a synthetic email: h.{handle}.{random}@hostl.app
The mobile app must NEVER show this email to the user.

### Sign up flow
1. Step 1: First name, last name, date of birth
2. Step 2: Account type, @handle (with suggestions), password
3. Call POST /api/auth/signup or use the same server action logic
4. On success: session is returned, store in AsyncStorage
5. Navigate to inbox

### Sign in flow
1. User enters @handle + password
2. Look up profile by handle: supabase.from("profiles").select("id").eq("handle", handle)
3. Get auth user by profile.id to find synthetic email
4. supabase.auth.signInWithPassword({ email: syntheticEmail, password })
5. Store session, navigate to inbox

### Session persistence
- AsyncStorage keeps session across app restarts
- autoRefreshToken: true handles silent refresh
- User stays logged in indefinitely (same as web)
- Only logs out on explicit sign out or token revocation

### Handle validation rules
- 2-30 characters
- Letters, numbers, underscores, hyphens only
- No spaces, no special characters
- Lowercase only (normalize on input)
- Must be unique in profiles table

### Account types
personal | company | organization | government | service | commerce

## 7. Screen structure

```
app/
  _layout.tsx              # Root layout, session check
  (auth)/
    _layout.tsx            # Auth layout (logo + form)
    login.tsx              # @handle + password
    signup.tsx             # 2-step: identity then handle
    forgot-password.tsx    # Enter @handle to get reset link
    reset-password.tsx     # Enter new password
  (app)/
    _layout.tsx            # Tab bar + drawer
    inbox/
      index.tsx            # Main inbox
      important.tsx
      sent.tsx
      drafts.tsx
      archived.tsx
      trash.tsx
      isolated.tsx
      suspicious.tsx
      label/[id].tsx
    message/[id].tsx       # Full message detail
    compose/
      index.tsx            # Compose new message
      mass.tsx             # Mass message (up to 50)
    settings/
      index.tsx            # Profile settings
      labels.tsx           # Manage labels
      verify.tsx           # Verification application
    profile/[handle].tsx   # Public profile view
```

## 8. Navigation structure

Bottom tab bar (main navigation):
- Inbox (Inbox icon) — badge with unread count
- Compose (PenSquare icon) — opens compose screen
- Important (Star icon)
- Settings (Settings icon)

Drawer or "More" tab:
- Sent, Drafts, Archived, Trash
- Isolated, Suspicious
- Labels (list)
- Mass message

## 9. Inbox screen

Fetch messages server-side via Supabase:
```typescript
const { data } = await supabase
  .from("messages")
  .select(`
    *,
    from_profile:profiles!messages_from_profile_id_fkey(
      id, handle, display_name, avatar_url, verified, account_type, is_system
    ),
    to_profile:profiles!messages_to_profile_id_fkey(
      id, handle, display_name, avatar_url, verified, account_type, is_system
    )
  `)
  .eq("to_profile_id", userId)
  .eq("category", "inbox")
  .order("created_at", { ascending: false })
```

Message row shows:
- Avatar (real photo or initials fallback)
- Display name + verified badge
- Subject (bold if unread)
- Body preview (strip HTML tags)
- Time ago
- Unread dot
- Swipe left: archive
- Swipe right: mark important
- Long press: multi-select

## 10. Message detail screen

Shows full message with:
- Sender avatar + name + verified badges
- Account type pill (System for @hostl, else account_type)
- "to @handle" expandable details row
- Full message body (HTML rendered in WebView, plain text in Text)
- Interactive action area based on content_type:
  - approval: Approve / Decline buttons
  - rsvp: Yes / No buttons
  - survey/html_form: Submit button
- Reply / Forward buttons at bottom
- Toolbar: Archive, Trash, Mark unread, Star, More (...)
- More menu: Mute, Report, Block @handle

### @handle detection in plain text
Scan body for @handle patterns.
Check profiles table for each candidate.
Highlight only real Hostl handles.
Tap to open compose pre-filled with that handle.

## 11. Compose screen

- To field: tag-style input, live @handle lookup with avatar
- CC field (toggle)
- Max 4 recipients in To, 4 in CC
- Subject field
- Message type selector: Message / Approval / RSVP / Survey
- Body: rich text (WebView with Tiptap) or plain TextInput
- Send button shows recipient count when > 1

### Recipient lookup
```typescript
const { data } = await supabase
  .from("profiles")
  .select("id, handle, display_name, avatar_url")
  .eq("handle", inputHandle)
  .maybeSingle()
```

## 12. Verified badges

Use react-native-svg. Same SVG paths as web.

```typescript
const BADGE_COLORS = {
  personal:     "#1877F2",  // blue circle
  company:      "#1877F2",  // blue wavy
  organization: "#1877F2",  // blue wavy
  government:   "#829AAB",  // grey-blue square
  service:      "#7C3AED",  // purple shield
  commerce:     "#16A34A",  // green bag
}

// System account (@hostl) shows TWO badges:
// 1. Shield (purple) + 2. Circle (blue)
// Check: profile.id === "00000000-0000-0000-0000-000000000001"
// OR: profile.is_system === true
```

SVG source files are in public/vector/ of the web repo.
Convert each to a react-native-svg component.

## 13. Avatar

- Show real avatar_url if set (use expo-image for caching)
- Fallback: initials in a circle (first letter of first + last name)
- Fallback colors: backgroundColor #e0e7ff, color #4338ca
- System account (@hostl): show /hostl-icon.png (the h. icon)
- Upload: expo-image-picker → crop square → POST to /api/upload-avatar

## 14. Settings screen

Sections:
1. Profile picture (tap to change — camera, gallery, illustrations)
2. Identity: first name, last name, bio, gender, handle (read-only)
3. Contact: phone + country code, country, address
4. Security: recovery @handle (2-step verification), change password
5. Verification: apply for badge (company/org/service/commerce/government only)
6. Labels: manage labels
7. Sign out

## 15. Push notifications

Use expo-notifications.
Request permission on first launch after login.
Store push token in Supabase (add push_tokens table).
Trigger on new message via Supabase webhook → Edge Function → Expo Push API.

Notification payload:
```json
{
  "title": "New message from @handle",
  "body": "Subject line here",
  "data": { "messageId": "uuid", "screen": "message" }
}
```

On tap: navigate to message/[id]

## 16. Deep links

URL scheme: hostl://
Universal links: hostl.net

| URL | Screen |
|-----|--------|
| hostl://inbox | Inbox |
| hostl://compose?to=handle | Compose pre-filled |
| hostl://message/[id] | Message detail |
| hostl://u/[handle] | Profile |
| hostl://reset-password | Reset password |

## 17. Design tokens

### Colors
```typescript
export const colors = {
  primary: "#4f46e5",
  primaryForeground: "#ffffff",
  background: "#ffffff",
  surface: "#f7f7fa",
  surfaceRaised: "#ffffff",
  foreground: "#1a1a2e",
  muted: "#6b7280",
  mutedForeground: "#6b7280",
  border: "#e5e7eb",
  borderSubtle: "#f0f0f5",
  accent: "#eef0ff",
  destructive: "#dc2626",
  success: "#16a34a",
  warning: "#d97706",
  sidebarBg: "#f5f5fa",
  dark: {
    background: "#0f0f1a",
    surface: "#141420",
    surfaceRaised: "#1a1a28",
    foreground: "#f0f0f5",
    muted: "#9ca3af",
    border: "#2a2a3a",
    borderSubtle: "#1e1e2e",
    accent: "#1e1e30",
    sidebarBg: "#0d0d1a",
  }
}
```

### Typography
```typescript
export const typography = {
  fontFamily: {
    sans: "Inter_400Regular",
    medium: "Inter_500Medium",
    semibold: "Inter_600SemiBold",
    bold: "Inter_700Bold",
  },
  size: {
    xs: 11, sm: 13, base: 15, lg: 17, xl: 20, "2xl": 24, "3xl": 30
  },
  lineHeight: {
    tight: 1.2, normal: 1.5, relaxed: 1.6
  }
}
```

### Spacing
```typescript
export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40
}
```

### Border radius
```typescript
export const radius = {
  sm: 6, md: 8, lg: 12, xl: 16, "2xl": 20, full: 9999
}
```

### Shadows (iOS)
```typescript
export const shadow = {
  sm: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
}
```

## 18. Key icons (lucide-react-native)

Inbox, Star, Send, FileText, Archive, Trash2, PenSquare,
Users, ShieldAlert, FolderX, Tag, BadgeCheck, AtSign,
Search, MoreHorizontal, Reply, Forward, MailOpen, Mail,
Clock, Flag, ShieldOff, Camera, RotateCw, CheckCircle2,
Loader2, ChevronDown, ChevronRight, X, Check, Plus,
Settings, Bell, Menu, ArrowLeft, Eye, EyeOff, Lock

## 19. What NOT to do

- Do NOT create a new Supabase project
- Do NOT recreate tables or migrations
- Do NOT use email anywhere in the UI
- Do NOT show the synthetic email (h.handle.xxx@hostl.app)
- Do NOT put SUPABASE_SERVICE_ROLE_KEY in the app
- Do NOT use a different color palette — use the tokens above
- Do NOT use a different icon library — use lucide-react-native
- Do NOT use a different font — use Inter
- Do NOT build a separate backend — use the existing one

## 20. First steps (in order)

1. `npx create-expo-app@latest hostl-mobile --template blank-typescript`
2. Install dependencies:
   - expo-router, @supabase/supabase-js, @react-native-async-storage/async-storage
   - nativewind, lucide-react-native, react-native-svg
   - expo-image-picker, expo-image-manipulator, expo-notifications
   - expo-haptics, expo-clipboard, expo-font
   - @expo-google-fonts/inter
3. Set up Supabase client with AsyncStorage
4. Set up Expo Router with (auth) and (app) groups
5. Build auth screens (login, signup) first
6. Build inbox screen with real data
7. Build message detail with action buttons
8. Build compose screen
9. Build settings
10. Add push notifications last

## 21. Reference

- Web app repo: https://github.com/dev-olayemi/hostl
- System docs: docs/01-overview.md through docs/09-mobile.md
- Design system: docs/DESIGN.md
- Database schema: docs/02-database.md
- All migrations: docs/migrations/
- Badge SVGs: public/vector/ in web repo
- App icon: public/hostl-icon.png in web repo
- Full logo: public/hostle.png in web repo
