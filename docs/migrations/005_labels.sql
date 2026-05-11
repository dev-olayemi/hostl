-- ============================================================
-- MIGRATION 005: Labels, Isolated, Suspicious, Mass Message
-- Run in Supabase SQL Editor
-- ============================================================

-- ── Labels ───────────────────────────────────────────────────
create table if not exists public.labels (
  id          uuid primary key default uuid_generate_v4(),
  profile_id  uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1', -- hex color
  created_at  timestamptz not null default now(),
  unique (profile_id, name)
);

create index if not exists labels_profile_idx on public.labels (profile_id);

-- Message ↔ Label junction
create table if not exists public.message_labels (
  message_id  uuid not null references public.messages(id) on delete cascade,
  label_id    uuid not null references public.labels(id) on delete cascade,
  primary key (message_id, label_id)
);

create index if not exists message_labels_message_idx on public.message_labels (message_id);
create index if not exists message_labels_label_idx   on public.message_labels (label_id);

-- ── Extend messages category ──────────────────────────────────
-- Add 'isolated' and 'suspicious' as valid categories
alter table public.messages
  drop constraint if exists messages_category_check;

alter table public.messages
  add constraint messages_category_check
  check (category in ('inbox','important','sent','drafts','archived','trash','isolated','suspicious'));

-- ── Mass message jobs ─────────────────────────────────────────
-- Tracks bulk sends so we can show progress and rate-limit
create table if not exists public.mass_messages (
  id              uuid primary key default uuid_generate_v4(),
  sender_id       uuid not null references public.profiles(id) on delete cascade,
  subject         text not null,
  body            text not null,
  content_type    text not null default 'text',
  recipient_count int not null default 0,
  sent_count      int not null default 0,
  status          text not null default 'pending'
                    check (status in ('pending','sending','done','failed')),
  created_at      timestamptz not null default now()
);

create index if not exists mass_messages_sender_idx on public.mass_messages (sender_id);

-- ── RLS ───────────────────────────────────────────────────────
alter table public.labels         enable row level security;
alter table public.message_labels enable row level security;
alter table public.mass_messages  enable row level security;

create policy "labels_read_own"   on public.labels for select using (auth.uid() = profile_id);
create policy "labels_insert_own" on public.labels for insert with check (auth.uid() = profile_id);
create policy "labels_update_own" on public.labels for update using (auth.uid() = profile_id);
create policy "labels_delete_own" on public.labels for delete using (auth.uid() = profile_id);

create policy "message_labels_read" on public.message_labels for select
  using (exists (
    select 1 from public.messages m
    where m.id = message_id
    and (m.to_profile_id = auth.uid() or m.from_profile_id = auth.uid())
  ));

create policy "message_labels_insert" on public.message_labels for insert
  with check (exists (
    select 1 from public.messages m
    where m.id = message_id
    and (m.to_profile_id = auth.uid() or m.from_profile_id = auth.uid())
  ));

create policy "message_labels_delete" on public.message_labels for delete
  using (exists (
    select 1 from public.messages m
    where m.id = message_id
    and (m.to_profile_id = auth.uid() or m.from_profile_id = auth.uid())
  ));

create policy "mass_messages_own" on public.mass_messages for all using (auth.uid() = sender_id);
