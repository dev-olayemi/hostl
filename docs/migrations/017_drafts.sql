-- ============================================================
-- MIGRATION 017: Database-backed drafts (Gmail-style)
-- ============================================================

-- Drafts table
create table if not exists public.drafts (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,
  to_handles      text[] not null default '{}',  -- Array of recipient handles
  cc_handles      text[] not null default '{}',  -- Array of CC handles
  subject         text not null default '',
  body            text not null default '',
  body_mode       text not null default 'rich',  -- 'rich' or 'html'
  content_type    text not null default 'text',  -- 'text', 'approval', 'rsvp', 'survey'
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Draft attachments junction table
create table if not exists public.draft_attachments (
  id              uuid primary key default uuid_generate_v4(),
  draft_id        uuid not null references public.drafts(id) on delete cascade,
  attachment_id   uuid not null references public.attachments(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (draft_id, attachment_id)
);

-- Indexes
create index drafts_profile_idx on public.drafts (profile_id);
create index drafts_updated_at_idx on public.drafts (updated_at desc);
create index draft_attachments_draft_idx on public.draft_attachments (draft_id);

-- RLS policies
alter table public.drafts enable row level security;
alter table public.draft_attachments enable row level security;

-- Users can only access their own drafts
create policy "drafts_all_own"
  on public.drafts for all
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- Users can manage attachments for their own drafts
create policy "draft_attachments_all_own"
  on public.draft_attachments for all
  using (
    exists (
      select 1 from public.drafts d
      where d.id = draft_id
      and d.profile_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.drafts d
      where d.id = draft_id
      and d.profile_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
create or replace function public.update_draft_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-update updated_at
create trigger drafts_updated_at_trigger
  before update on public.drafts
  for each row
  execute function public.update_draft_timestamp();
