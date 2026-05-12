-- ============================================================
-- MIGRATION 011: Message responses for polls, surveys, approvals
-- ============================================================

-- Add response tracking to messages
alter table public.messages
  add column if not exists response_data jsonb,
  add column if not exists response_count int not null default 0;

-- Responses table — one row per respondent per message
create table if not exists public.message_responses (
  id           uuid primary key default uuid_generate_v4(),
  message_id   uuid not null references public.messages(id) on delete cascade,
  responder_id uuid not null references public.profiles(id) on delete cascade,
  response     jsonb not null,
  created_at   timestamptz not null default now(),
  unique (message_id, responder_id)
);

create index if not exists message_responses_message_idx on public.message_responses (message_id);
create index if not exists message_responses_responder_idx on public.message_responses (responder_id);

alter table public.message_responses enable row level security;

-- Responder can insert their own response
create policy "responses_insert_own"
  on public.message_responses for insert
  with check (auth.uid() = responder_id);

-- Sender can read all responses to their messages
create policy "responses_read_sender"
  on public.message_responses for select
  using (
    exists (
      select 1 from public.messages m
      where m.id = message_id
      and m.from_profile_id = auth.uid()
    )
    or auth.uid() = responder_id
  );
