-- ============================================================
-- MIGRATION 004: Extended profile fields for settings
-- Run in Supabase SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists gender          text check (gender in ('male','female','non_binary','prefer_not_to_say')),
  add column if not exists phone_number    text,
  add column if not exists phone_country   text,   -- ISO 3166-1 alpha-2 e.g. "NG"
  add column if not exists country         text,   -- ISO 3166-1 alpha-2
  add column if not exists address         text,
  add column if not exists recovery_handle text,   -- @handle of recovery account
  add column if not exists avatar_public_id text;  -- Cloudinary public_id for transforms

-- Index for recovery handle lookups
create index if not exists profiles_recovery_handle_idx on public.profiles (recovery_handle);
