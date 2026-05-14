-- ============================================================
-- MIGRATION 014: Device session tracking for login alerts
-- ============================================================

create table if not exists public.device_sessions (
  id            uuid primary key default uuid_generate_v4(),
  profile_id    uuid not null references public.profiles(id) on delete cascade,
  device_hash   text not null,  -- hash of user-agent + IP to identify unique device
  user_agent    text,
  ip_address    text,
  location      text,           -- city, country (from IP geolocation)
  last_seen_at  timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  unique (profile_id, device_hash)
);

create index if not exists device_sessions_profile_idx on public.device_sessions (profile_id);

alter table public.device_sessions enable row level security;

create policy "device_sessions_read_own"
  on public.device_sessions for select
  using (auth.uid() = profile_id);
