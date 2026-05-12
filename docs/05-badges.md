# 05 — Verification Badges

## Overview

All badges are inline SVG components — no image loading, no network requests.
They render at exactly the same time as the text they accompany.
Source: `src/components/ui/VerifiedBadge.tsx`

## Badge types

### Personal — Circle checkmark
- File: `public/vector/checkmark-circle.svg`
- Color: #1877F2 (Facebook/Meta blue)
- Used for: Verified individuals (celebrities, public figures)
- Account type: personal

### Company / Organization — Wavy seal
- File: `public/vector/twitter-verified-badge.svg`
- Color: #1877F2 (blue)
- Used for: Verified businesses, nonprofits, institutions
- Account types: company, organization

### Government — Square-ish badge
- File: `public/vector/twitter-checkmark-government-.svg`
- Color: #829AAB (grey-blue, as designed)
- Used for: Official government accounts
- Account type: government

### Service — Shield checkmark
- File: `public/vector/shield-checkmark.svg`
- Color: #7C3AED (purple)
- Used for: API/SDK integrations, noreply senders, system accounts
- Account type: service

### Commerce — Bag checkmark
- File: `public/vector/bag-check.svg`
- Color: #16A34A (green)
- Used for: E-commerce, marketplaces
- Account type: commerce

## System account (@hostl) — Double badge

The @hostl system account shows TWO badges:
1. Shield (purple) — service account
2. Circle (blue) — verified

This is unique to the system account and cannot be replicated by any user.

## isSystemProfile() logic

```typescript
// src/lib/system.ts
export function isSystemProfile(profile): boolean {
  if (!profile) return false
  // Primary: fixed UUID
  if (profile.id === "00000000-0000-0000-0000-000000000001") return true
  // Secondary: DB flag (cannot be set by users via RLS)
  if (profile.is_system === true) return true
  return false
}
```

## Usage

```tsx
import VerifiedBadge from "@/components/ui/VerifiedBadge"

// Single badge
<VerifiedBadge accountType="personal" size={16} />
<VerifiedBadge accountType="company" size={16} />
<VerifiedBadge accountType="government" size={16} />
<VerifiedBadge accountType="service" size={16} />
<VerifiedBadge accountType="commerce" size={16} />

// System account (double badge)
{isSystemProfile(profile) ? (
  <>
    <VerifiedBadge accountType="service" size={15} />
    <VerifiedBadge accountType="personal" size={15} />
  </>
) : (
  <VerifiedBadge accountType={profile.account_type} size={15} />
)}
```

## Verification application

Only company, organization, government, service, and commerce accounts can apply.
Personal accounts cannot apply (future: celebrity verification program).

Flow:
1. User goes to /settings/verify
2. Fills in: legal name, description, registration number, website, country, contact person
3. Submitted to verification_requests table with status=pending
4. Admin reviews in Supabase dashboard
5. Admin sets status=approved and profiles.verified=true
6. Badge appears immediately on next page load

## Mobile app badge sizes

| Context | Size |
|---------|------|
| Message list row | 13px |
| Message detail header | 15px |
| Profile page | 18px |
| Settings sidebar | 13px |
| Compose recipient tag | 12px |
