-- ============================================================
-- MIGRATION 006b: System @hostl profile (no auth.users touch)
-- We temporarily drop the FK from profiles.id → auth.users.id,
-- insert the system profile, then restore the FK.
-- ============================================================

-- Step 1: Drop the FK constraint temporarily
alter table public.profiles
  drop constraint if exists profiles_id_fkey;

-- Step 2: Insert the @hostl system profile
insert into public.profiles (
  id,
  handle,
  display_name,
  first_name,
  last_name,
  date_of_birth,
  account_type,
  verified,
  avatar_url
)
values (
  '00000000-0000-0000-0000-000000000001',
  'hostl',
  'Hostl',
  'Hostl',
  'System',
  '2024-01-01',
  'company',
  true,
  '/hostl-icon.png'
)
on conflict (id) do update set
  verified   = true,
  avatar_url = '/hostl-icon.png';

-- Step 3: Restore the FK (only enforces future inserts, not existing rows)
alter table public.profiles
  add constraint profiles_id_fkey
  foreign key (id)
  references auth.users(id)
  on delete cascade
  not valid;  -- "not valid" skips checking existing rows (our system row)

-- Step 4: RPC for app fallback
create or replace function public.insert_system_profile(
  p_id           uuid,
  p_handle       text,
  p_display_name text
)
returns void
language plpgsql
security definer
as $$
begin
  -- Temporarily bypass FK by using a direct insert
  -- (this function runs as the definer who owns the table)
  insert into public.profiles (
    id, handle, display_name, first_name, last_name,
    date_of_birth, account_type, verified, avatar_url
  )
  values (
    p_id, p_handle, p_display_name,
    'Hostl', 'System', '2024-01-01',
    'company', true, '/hostl-icon.png'
  )
  on conflict (id) do nothing;
end;
$$;
