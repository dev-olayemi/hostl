-- ============================================================
-- MIGRATION 006c: Add unique constraint on recovery verifications
-- Safe to run — uses IF NOT EXISTS equivalent via DO block
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'recovery_handle_verifications_profile_id_key'
  ) then
    alter table public.recovery_handle_verifications
      add constraint recovery_handle_verifications_profile_id_key
      unique (profile_id);
  end if;
end;
$$;
