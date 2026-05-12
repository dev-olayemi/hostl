-- ============================================================
-- MIGRATION 009: is_system flag on profiles
-- A proper, ID-based way to identify system accounts.
-- Only the @hostl platform account has this set to true.
-- ============================================================

alter table public.profiles
  add column if not exists is_system boolean not null default false;

-- Only the platform system account gets this flag
update public.profiles
set is_system = true
where id = '00000000-0000-0000-0000-000000000001';

-- Prevent anyone else from setting this via RLS
-- (the update policy only allows owners to update their own profile,
--  and the system account has no real user behind it)
create policy "profiles_no_system_flag_self_update"
  on public.profiles
  as restrictive
  for update
  using (true)
  with check (
    -- Regular users cannot set is_system = true on their own profile
    case
      when auth.uid() = id then is_system = false
      else true
    end
  );
