-- ============================================================
-- MIGRATION 002: Message actions, reports, blocks
-- Run in Supabase SQL Editor
-- ============================================================

-- Add snooze + mute to messages
alter table public.messages
  add column if not exists snoozed_until timestamptz,
  add column if not exists muted boolean not null default false;

-- Reports table
create table if not exists public.reports (
  id            uuid primary key default uuid_generate_v4(),
  reporter_id   uuid not null references public.profiles(id) on delete cascade,
  message_id    uuid references public.messages(id) on delete set null,
  reported_handle text not null,
  reason        text not null check (reason in (
    'spam', 'harassment', 'phishing', 'impersonation', 'other'
  )),
  notes         text,
  resolved      boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists reports_reporter_idx on public.reports (reporter_id);
create index if not exists reports_handle_idx   on public.reports (reported_handle);

-- Blocked users table
create table if not exists public.blocked_users (
  blocker_id  uuid not null references public.profiles(id) on delete cascade,
  blocked_id  uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create index if not exists blocked_users_blocker_idx on public.blocked_users (blocker_id);

-- RLS
alter table public.reports       enable row level security;
alter table public.blocked_users enable row level security;

create policy "reports_insert_own"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

create policy "reports_read_own"
  on public.reports for select
  using (auth.uid() = reporter_id);

create policy "blocked_insert_own"
  on public.blocked_users for insert
  with check (auth.uid() = blocker_id);

create policy "blocked_read_own"
  on public.blocked_users for select
  using (auth.uid() = blocker_id);

create policy "blocked_delete_own"
  on public.blocked_users for delete
  using (auth.uid() = blocker_id);
