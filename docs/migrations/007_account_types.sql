-- ============================================================
-- MIGRATION 007: Extended account types
-- ============================================================

-- Drop old constraint and add new one with all types
alter table public.profiles
  drop constraint if exists profiles_account_type_check;

alter table public.profiles
  add constraint profiles_account_type_check
  check (account_type in (
    'personal',       -- individuals (circle badge)
    'company',        -- businesses, orgs (wavy badge)
    'organization',   -- nonprofits, institutions (wavy badge)
    'government',     -- official government accounts (square-ish badge)
    'service',        -- API/SDK bots, noreply senders (shield badge)
    'commerce'        -- e-commerce, marketplaces (bag badge)
  ));
