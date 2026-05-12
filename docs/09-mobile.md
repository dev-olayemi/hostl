# 09 — Mobile App Guide

Everything needed to build the Hostl mobile app (React Native / Expo recommended).

## Recommended Stack

| Layer | Technology |
|-------|------------|
| Framework | Expo (React Native) |
| Navigation | Expo Router (file-based, mirrors Next.js) |
| Auth | @supabase/supabase-js + AsyncStorage |
| Styling | NativeWind (Tailwind for RN) or StyleSheet |
| Icons | lucide-react-native |
| Rich text | react-native-pell-rich-editor or custom WebView |
| Image crop | expo-image-picker + expo-image-manipulator |
| Image upload | Same /api/upload-avatar endpoint |
| State | React useState (same pattern as web) |

## Supabase setup for mobile

```typescript
import { createClient } from "@supabase/supabase-js"
import AsyncStorage from "@react-native-async-storage/async-storage"

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,  // false for mobile
  },
})
```

## Auth flow (mobile)

Same as web — handle + password.
No email required.
Use the same signIn/signUp logic:
1. Look up handle in profiles table
2. Get synthetic email from auth.users
3. signInWithPassword

For password reset on mobile: deep link to hostl://reset-password

## Environment variables (mobile)

```env
EXPO_PUBLIC_SUPABASE_URL=https://tilbejapfljfvdvqtggo.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
EXPO_PUBLIC_API_URL=https://hostl.net  # production API base
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dtelqmqjf
```

Note: SUPABASE_SERVICE_ROLE_KEY must NEVER be in mobile app.
All admin operations go through the web API.

## Screen structure (mirrors web routes)

```
app/
  (auth)/
    login.tsx
    signup.tsx
    forgot-password.tsx
    reset-password.tsx
  (app)/
    inbox/
      index.tsx          # /inbox
      important.tsx
      sent.tsx
      drafts.tsx
      archived.tsx
      trash.tsx
      isolated.tsx
      suspicious.tsx
      label/[id].tsx
    compose/
      index.tsx
      mass.tsx
    message/[id].tsx     # Message detail
    settings/
      index.tsx
      labels.tsx
      verify.tsx
    profile/[handle].tsx # Public profile
```

## API calls from mobile

For server actions, call the web API endpoints:

```typescript
// Send message
const res = await fetch("https://hostl.net/api/messages", {
  method: "POST",
  headers: { "Authorization": `Bearer ${session.access_token}` },
  body: JSON.stringify({ to, subject, body, content_type })
})
```

Or call Supabase directly for simple reads:

```typescript
const { data } = await supabase
  .from("messages")
  .select("*, from_profile:profiles!messages_from_profile_id_fkey(*)")
  .eq("to_profile_id", userId)
  .eq("category", "inbox")
  .order("created_at", { ascending: false })
```

Note: Mobile uses the anon client (subject to RLS).
Ensure RLS policies allow the queries you need.

## Verified badges (mobile)

Use SVG components (react-native-svg).
Same logic as web — check account_type and is_system.

```typescript
// Badge colors
const BADGE_COLORS = {
  personal:     "#1877F2",  // blue circle
  company:      "#1877F2",  // blue wavy
  organization: "#1877F2",  // blue wavy
  government:   "#829AAB",  // grey-blue square
  service:      "#7C3AED",  // purple shield
  commerce:     "#16A34A",  // green bag
}
```

SVG source files: `public/vector/` in the web repo.
Convert to react-native-svg components for mobile.

## Avatar upload (mobile)

1. Use expo-image-picker to select image
2. Use expo-image-manipulator to crop to square
3. POST to https://hostl.net/api/upload-avatar with Bearer token
4. Save returned URL to profiles.avatar_url

## Push notifications

Use Expo Push Notifications + Supabase Edge Functions.
Trigger on new message insert via Supabase webhook.
Store push tokens in a push_tokens table (add in future migration).

## Deep links

Register URL scheme: hostl://

| URL | Action |
|-----|--------|
| hostl://inbox | Open inbox |
| hostl://compose?to=handle | Open compose |
| hostl://message/[id] | Open message |
| hostl://u/[handle] | Open profile |
| hostl://reset-password | Password reset |

## Design tokens for mobile

See DESIGN.md for full token reference.
For mobile, map CSS variables to React Native StyleSheet values:

```typescript
export const colors = {
  primary: "#4f46e5",       // hostl-600
  primaryForeground: "#fff",
  background: "#ffffff",
  surface: "#f7f7fa",
  foreground: "#1a1a2e",
  muted: "#6b7280",
  border: "#e5e7eb",
  // Dark mode
  dark: {
    background: "#0f0f1a",
    surface: "#141420",
    foreground: "#f0f0f5",
    border: "#2a2a3a",
  }
}

export const typography = {
  fontFamily: "Inter",  // load via expo-font
  sizes: { xs: 11, sm: 13, base: 15, lg: 17, xl: 20, "2xl": 24 },
  weights: { regular: "400", medium: "500", semibold: "600", bold: "700" }
}

export const spacing = {
  1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24
}

export const radius = {
  sm: 6, md: 8, lg: 12, xl: 16, full: 9999
}
```
