-- ============================================================
-- MIGRATION 003: Company/Org Verification System
-- Run in Supabase SQL Editor
-- ============================================================

create table if not exists public.verification_requests (
  id              uuid primary key default uuid_generate_v4(),
  profile_id      uuid not null references public.profiles(id) on delete cascade,

  -- Organization details
  legal_name      text not null,
  account_type    text not null check (account_type in ('company', 'organization')),
  website         text not null,
  country         text not null,
  city            text,
  address         text,
  registration_number text,       -- company reg / charity number
  description     text not null,  -- what does the org do

  -- Contact
  contact_name    text not null,
  contact_title   text not null,  -- e.g. CEO, Director
  contact_email   text not null,  -- real email for verification comms

  -- Status
  status          text not null default 'pending'
                    check (status in ('pending', 'under_review', 'approved', 'rejected')),
  rejection_reason text,
  reviewed_by     text,           -- admin handle
  reviewed_at     timestamptz,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- One active request per profile
  unique (profile_id)
);

create index if not exists verification_requests_profile_idx on public.verification_requests (profile_id);
create index if not exists verification_requests_status_idx  on public.verification_requests (status);

-- Auto-update updated_at
create trigger verification_requests_updated_at
  before update on public.verification_requests
  for each row execute function public.set_updated_at();

-- RLS
alter table public.verification_requests enable row level security;

create policy "verification_read_own"
  on public.verification_requests for select
  using (auth.uid() = profile_id);

create policy "verification_insert_own"
  on public.verification_requests for insert
  with check (
    auth.uid() = profile_id
    -- Only company/org accounts can apply
  );

create policy "verification_update_own"
  on public.verification_requests for update
  using (auth.uid() = profile_id)
  with check (status = 'pending'); -- can only edit while pending
