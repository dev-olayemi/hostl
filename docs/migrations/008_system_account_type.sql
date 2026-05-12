-- ============================================================
-- MIGRATION 008: Update @hostl system account type to 'service'
-- ============================================================

-- First add 'system' as a display alias — we keep 'service' in the DB
-- but show "System" in the UI for the @hostl account specifically.
-- The account_type stays 'service' (already valid from migration 007).

update public.profiles
set account_type = 'service'
where id = '00000000-0000-0000-0000-000000000001'
  and handle = 'hostl';
