-- ============================================================
-- MIGRATION 006: System profile + recovery handle verification
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Recovery handle verification codes ───────────────────────
create table if not exists public.recovery_handle_verifications (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  target_handle text not null,
  code        text not null,
  verified    boolean not null default false,
  expires_at  timestamptz not null default (now() + interval '24 hours'),
  created_at  timestamptz not null default now()
);

create index if not exists recovery_verif_profile_idx
  on public.recovery_handle_verifications (profile_id);

alter table public.recovery_handle_verifications enable row level security;

create policy "recovery_verif_own"
  on public.recovery_handle_verifications for all
  using (auth.uid() = profile_id);

-- ── System @hostl profile ─────────────────────────────────────
-- The profiles table has a FK to auth.users.
-- We temporarily disable the trigger, insert the system row, then re-enable.

-- Step 1: Insert a dummy auth user for the system account
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  created_at, updated_at, raw_user_meta_data
)
values (
  '00000000-0000-0000-0000-000000000001',
  'system@hostl.app',
  '',
  now(),
  now(),
  now(),
  '{"handle":"hostl","display_name":"Hostl","first_name":"Hostl","last_name":"System","account_type":"company"}'::jsonb
)
on conflict (id) do nothing;

-- Step 2: Insert the system profile
insert into public.profiles (
  id, handle, display_name, first_name, last_name,
  date_of_birth, account_type, verified, avatar_url
)
values (
  '00000000-0000-0000-0000-000000000001',
  'hostl',
  'Hostl',
  'Hostl',
  'System',
  '2024-01-01',
  'company',
  true,
  '/hostl-icon.png'
)
on conflict (id) do update set
  verified = true,
  avatar_url = '/hostl-icon.png';

-- ── RPC for app to call if system profile is missing ─────────
create or replace function public.insert_system_profile(
  p_id uuid,
  p_handle text,
  p_display_name text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, handle, display_name, first_name, last_name, date_of_birth, account_type, verified, avatar_url)
  values (p_id, p_handle, p_display_name, 'Hostl', 'System', '2024-01-01', 'company', true, '/hostl-icon.png')
  on conflict (id) do nothing;
end;
$$;
