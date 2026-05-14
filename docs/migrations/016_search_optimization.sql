-- ============================================================
-- MIGRATION 016: Optimized user search with full-text search
-- ============================================================

-- Enable pg_trgm extension for fuzzy matching
create extension if not exists pg_trgm;

-- Add search vector column for full-text search
alter table public.profiles
  add column if not exists search_vector tsvector;

-- Create function to update search vector
create or replace function public.profiles_search_vector_update()
returns trigger as $$
begin
  new.search_vector :=
    setweight(to_tsvector('english', coalesce(new.handle, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.display_name, '')), 'B');
  return new;
end;
$$ language plpgsql;

-- Create trigger to auto-update search vector
drop trigger if exists profiles_search_vector_trigger on public.profiles;
create trigger profiles_search_vector_trigger
  before insert or update on public.profiles
  for each row
  execute function public.profiles_search_vector_update();

-- Update existing rows
update public.profiles
set search_vector = 
  setweight(to_tsvector('english', coalesce(handle, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(display_name, '')), 'B');

-- Create GIN index for fast full-text search (O(log n) lookups)
create index if not exists profiles_search_vector_idx 
  on public.profiles using gin(search_vector);

-- Create GIN index for trigram similarity (fuzzy matching)
create index if not exists profiles_handle_trgm_idx 
  on public.profiles using gin(handle gin_trgm_ops);

create index if not exists profiles_display_name_trgm_idx 
  on public.profiles using gin(display_name gin_trgm_ops);

-- Create composite index for common queries
create index if not exists profiles_handle_display_name_idx 
  on public.profiles (handle, display_name);

-- Add comment
comment on column public.profiles.search_vector is 
  'Full-text search vector for handle and display_name. Auto-updated via trigger.';

-- Create search function with ranking
create or replace function public.search_profiles(
  search_query text,
  result_limit int default 10
)
returns table (
  id uuid,
  handle text,
  display_name text,
  avatar_url text,
  verified boolean,
  account_type text,
  rank real
) as $$
begin
  return query
  select
    p.id,
    p.handle,
    p.display_name,
    p.avatar_url,
    p.verified,
    p.account_type,
    -- Combine full-text search rank with trigram similarity
    greatest(
      ts_rank(p.search_vector, plainto_tsquery('english', search_query)),
      similarity(p.handle, search_query) * 0.8,
      similarity(p.display_name, search_query) * 0.6
    ) as rank
  from public.profiles p
  where
    -- Full-text search match OR trigram similarity match
    p.search_vector @@ plainto_tsquery('english', search_query)
    or similarity(p.handle, search_query) > 0.3
    or similarity(p.display_name, search_query) > 0.3
  order by rank desc, p.handle asc
  limit result_limit;
end;
$$ language plpgsql stable;

-- Grant execute permission
grant execute on function public.search_profiles(text, int) to authenticated;

