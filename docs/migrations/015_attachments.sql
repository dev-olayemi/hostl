-- ============================================================
-- MIGRATION 015: Message attachments with deduplication
-- ============================================================

-- Drop existing tables if they exist (clean slate)
drop table if exists public.message_attachments cascade;
drop table if exists public.attachments cascade;

-- Attachments table — stores unique files once
create table public.attachments (
  id            uuid primary key default uuid_generate_v4(),
  file_hash     text not null unique,  -- SHA-256 hash for deduplication
  file_name     text not null,
  file_size     bigint not null check (file_size > 0 and file_size <= 26214400),  -- 25MB max
  mime_type     text not null,
  storage_url   text not null,         -- Cloudinary or S3 URL
  uploaded_by   uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now()
);

-- Create indexes after table is created
create index attachments_hash_idx on public.attachments (file_hash);
create index attachments_uploaded_by_idx on public.attachments (uploaded_by);

-- Message attachments junction table — links messages to attachments
create table public.message_attachments (
  id            uuid primary key default uuid_generate_v4(),
  message_id    uuid not null references public.messages(id) on delete cascade,
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  created_at    timestamptz not null default now(),
  unique (message_id, attachment_id)
);

-- Create indexes after table is created
create index message_attachments_message_idx on public.message_attachments (message_id);
create index message_attachments_attachment_idx on public.message_attachments (attachment_id);

-- RLS policies
alter table public.attachments enable row level security;
alter table public.message_attachments enable row level security;

-- Users can upload attachments
create policy "attachments_insert_own"
  on public.attachments for insert
  with check (auth.uid() = uploaded_by);

-- Users can read attachments they uploaded or that are attached to messages they can see
create policy "attachments_read_accessible"
  on public.attachments for select
  using (
    auth.uid() = uploaded_by
    or exists (
      select 1 from public.message_attachments ma
      join public.messages m on m.id = ma.message_id
      where ma.attachment_id = attachments.id
      and (m.from_profile_id = auth.uid() or m.to_profile_id = auth.uid())
    )
  );

-- Users can link attachments to messages they're sending
create policy "message_attachments_insert_sender"
  on public.message_attachments for insert
  with check (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and m.from_profile_id = auth.uid()
    )
  );

-- Users can read message attachments for messages they can access
create policy "message_attachments_read_accessible"
  on public.message_attachments for select
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and (m.from_profile_id = auth.uid() or m.to_profile_id = auth.uid())
    )
  );
