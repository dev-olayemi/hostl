-- ============================================================
-- MIGRATION 010: Fix messages RLS to ensure inbox loads correctly
-- ============================================================

-- Drop existing message read policy and recreate it explicitly
drop policy if exists "messages_read_own" on public.messages;

create policy "messages_read_own"
  on public.messages for select
  using (
    auth.uid() = to_profile_id
    or auth.uid() = from_profile_id
  );

-- Also ensure the profiles RLS allows reading any profile
-- (needed for the joined from_profile / to_profile selects)
drop policy if exists "profiles_public_read" on public.profiles;

create policy "profiles_public_read"
  on public.profiles for select
  using (true);
