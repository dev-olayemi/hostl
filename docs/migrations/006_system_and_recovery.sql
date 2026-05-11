-- ============================================================
-- MIGRATION 006: System profile + recovery handle verification
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Recovery handle verification codes ───────────────────────
create table if not exists public.recovery_handle_verifications (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  target_handle text not null,        -- the handle being added as recovery
  code        text not null,          -- e.g. H-647GF74
  verified    boolean not null default false,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

create index if not exists recovery_verif_profile_idx on public.recovery_handle_verifications (profile_id);

alter table public.recovery_handle_verifications enable row level security;

create policy "recovery_verif_own"
  on public.recovery_handle_verifications for all
  using (auth.uid() = profile_id);

-- ── System Hostl profile ──────────────────────────────────────
-- This is the official @hostl system account that sends
-- verification codes, system notifications, etc.
-- We insert it directly — it won't have an auth.users row
-- so we use a fixed UUID and bypass the FK with a special insert.

-- First, allow null on the FK temporarily for the system user
-- (We'll use a service-role insert from the app instead)
-- Just document the intended system profile ID here:
-- System profile ID: 00000000-0000-0000-0000-000000000001
-- Handle: hostl
-- This is inserted by the app on first run via the admin client.

comment on table public.profiles is
  'User profiles. The @hostl system account (id=00000000-0000-0000-0000-000000000001) is a special verified account used for system messages.';
