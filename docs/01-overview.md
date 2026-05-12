# 01 — Overview & Architecture

## What is Hostl?

Hostl is a universal interaction and identity platform. Users get a single @handle to send, receive, and complete actions (approvals, RSVPs, forms, surveys) entirely inside one app — no redirects, no external links.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (handle-based, no email required) |
| Styling | Tailwind CSS v4 + shadcn/ui (Base UI) |
| Rich Text | Tiptap v3 |
| Image Upload | Cloudinary |
| State | React useState/useTransition (no external store) |
| Icons | Lucide React |
| Date | date-fns v4 |

## Project Structure

```
src/
  app/
    (auth)/          # Login, signup, forgot/reset password
    (app)/           # Protected app routes
      inbox/         # All inbox views (server components)
      compose/       # Compose + mass message
      settings/      # Profile, labels, verification
    api/             # API routes (avatar upload)
    protocol/        # web+hostl:// protocol handler
    u/[handle]/      # Public profile pages
  components/
    auth/            # Auth forms
    inbox/           # Message list, detail, compose
    layout/          # AppShell, sidebar, dynamic title
    settings/        # Avatar upload with crop
    ui/              # shadcn components + VerifiedBadge
    labels/          # Label manager
  lib/
    supabase/        # client.ts, server.ts, middleware.ts
    db/              # messages.ts (server-side DB helpers)
    handle-utils.ts  # Handle validation + suggestions
    countries.ts     # Country list with flags + dial codes
    system.ts        # System profile constants + isSystemProfile()
  types/
    index.ts         # All TypeScript types
  proxy.ts           # Next.js proxy (replaces middleware)
```

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tilbejapfljfvdvqtggo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dtelqmqjf
CLOUDINARY_API_KEY=769114115466397
CLOUDINARY_API_SECRET=<api_secret>
CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@dtelqmqjf
```

> Never commit .env.local — it is in .gitignore

## Key Architectural Decisions

### Handle-based auth (no email required)
Supabase requires an email internally. We generate a synthetic email:
`h.{handle}.{random6}@hostl.app` — users never see this.
Login: look up handle in profiles table → get synthetic email → signInWithPassword.

### Server components for inbox
All inbox pages are server components that fetch data using the admin client (bypasses RLS). Data is passed as props to client components. This avoids session race conditions.

### Admin client for writes
All server actions use the Supabase admin client (service role). Security is enforced by `auth.getUser()` at the top of every action — not by RLS.

### Proxy (not middleware)
Next.js 16 renamed middleware to proxy. File is `src/proxy.ts`, export is `proxy()`.
