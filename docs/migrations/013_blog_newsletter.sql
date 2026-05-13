-- ============================================================
-- MIGRATION 013: Blog + Newsletter subscriptions
-- ============================================================

-- ── Blog posts ───────────────────────────────────────────────
create table if not exists public.blog_posts (
  id            uuid primary key default uuid_generate_v4(),
  slug          text not null unique,
  title         text not null,
  excerpt       text not null,
  content       text not null,  -- HTML or Markdown
  cover_image   text,           -- Cloudinary URL
  category      text not null default 'Product'
                  check (category in ('Announcement', 'Product', 'Engineering', 'Company', 'Tutorial')),
  author_name   text not null default 'Hostl Team',
  author_avatar text,
  read_time     int not null default 3,  -- minutes
  published     boolean not null default false,
  published_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx       on public.blog_posts (slug);
create index if not exists blog_posts_published_idx  on public.blog_posts (published_at desc) where published = true;
create index if not exists blog_posts_category_idx   on public.blog_posts (category);

create trigger blog_posts_updated_at
  before update on public.blog_posts
  for each row execute function public.set_updated_at();

-- Public read, admin write (no RLS needed for public read)
alter table public.blog_posts enable row level security;

create policy "blog_public_read"
  on public.blog_posts for select
  using (published = true);

-- ── Newsletter subscriptions ──────────────────────────────────
create table if not exists public.newsletter_subscriptions (
  id            uuid primary key default uuid_generate_v4(),
  handle        text not null unique,  -- Hostl @handle
  profile_id    uuid references public.profiles(id) on delete set null,
  subscribed    boolean not null default true,
  confirmed     boolean not null default false,  -- confirmed via system message
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists newsletter_handle_idx on public.newsletter_subscriptions (handle);
create index if not exists newsletter_active_idx on public.newsletter_subscriptions (subscribed) where subscribed = true;

alter table public.newsletter_subscriptions enable row level security;

-- Anyone can insert (subscribe)
create policy "newsletter_insert"
  on public.newsletter_subscriptions for insert
  with check (true);

-- Only the subscriber can read/update their own
create policy "newsletter_read_own"
  on public.newsletter_subscriptions for select
  using (profile_id = auth.uid());

create policy "newsletter_update_own"
  on public.newsletter_subscriptions for update
  using (profile_id = auth.uid());
