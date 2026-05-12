# 03 — Authentication

## How it works

Hostl uses handle-based auth. No email is required to sign up or log in.

Supabase Auth requires an email internally, so we generate a synthetic one:
```
h.{handle}.{random6}@hostl.app
```
Example: `h.muhammed.x7k2qp@hostl.app`

Users never see this email. It is stored in auth.users but never displayed.

## Signup flow

1. User enters: first name, last name, date of birth (step 1)
2. User picks: account type, @handle, password (step 2)
3. Handle availability checked against profiles table
4. Admin client creates user with `email_confirm: true` (no email sent)
5. Immediately signs in with signInWithPassword
6. Redirects to /inbox

## Login flow

1. User enters @handle + password
2. Look up profile by handle in profiles table
3. Get auth.users record by profile.id
4. signInWithPassword with synthetic email
5. Redirect to /inbox

## Session persistence

- Access token: 7 days (604800 seconds)
- Refresh token: never expires, rotates on each use
- Cookie maxAge: 400 days
- Compromised token detection: enabled
- Reuse interval: 10 seconds
- proxy.ts refreshes session on every request

## Password reset

Since there is no real email, password reset works via recovery handle:
1. User goes to /forgot-password, enters @handle
2. System looks up synthetic email, sends reset link
3. User clicks link → /reset-password
4. Client-side: listens for PASSWORD_RECOVERY event
5. Calls supabase.auth.updateUser({ password })

## Recovery handle

Users can add a recovery @handle in Settings > Security.
1. User enters target @handle
2. System sends a code (H-XXXXXXX) as a Hostl message to that handle
3. User enters the code to verify
4. recovery_handle saved to profiles table

## Account types

| Type | Description | Badge |
|------|-------------|-------|
| personal | Individual users | Circle (blue) |
| company | Businesses | Wavy seal (blue) |
| organization | Nonprofits, institutions | Wavy seal (blue) |
| government | Official government | Square-ish (grey-blue) |
| service | API/SDK bots, noreply | Shield (purple) |
| commerce | E-commerce, marketplaces | Bag (green) |

## Files

- `src/app/(auth)/actions.ts` — signUp, signIn, signOut, forgotPassword, resetPassword
- `src/app/(auth)/signup/page.tsx` — signup page
- `src/app/(auth)/login/page.tsx` — login page
- `src/app/(auth)/forgot-password/page.tsx` — forgot password
- `src/app/(auth)/reset-password/page.tsx` — reset password
- `src/components/auth/SignupForm.tsx` — 2-step signup with handle suggestions
- `src/components/auth/LoginForm.tsx` — handle + password login
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/ResetPasswordForm.tsx` — client-side, listens for PASSWORD_RECOVERY
- `src/lib/handle-utils.ts` — isValidHandle(), generateHandleSuggestions()
- `src/lib/supabase/client.ts` — browser client with persistSession: true
- `src/lib/supabase/server.ts` — server client with long-lived cookies
- `src/lib/supabase/middleware.ts` — updateSession() called by proxy.ts
- `src/proxy.ts` — Next.js proxy, protects /inbox /compose /settings
