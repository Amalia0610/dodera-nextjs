-- ╔══════════════════════════════════════════════════════════════╗
-- ║  auto_generated_blog_posts — tracks AI-generated posts     ║
-- ║  Used to prevent topic repetition across AI generations    ║
-- ║  Run this in the Supabase SQL Editor (Dashboard → SQL)     ║
-- ╚══════════════════════════════════════════════════════════════╝

create table public.auto_generated_blog_posts (
  id          bigint      primary key generated always as identity,
  uid         text        not null unique,
  title       text        not null,
  category    text,
  tags        text[],
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security (no public policies — only the secret key can access)
alter table public.auto_generated_blog_posts enable row level security;

-- Index for fast "last N posts" queries (used for deduplication)
create index idx_auto_generated_blog_posts_created_at on public.auto_generated_blog_posts (created_at desc);

-- Index for uid lookups (duplicate prevention)
create index idx_auto_generated_blog_posts_uid on public.auto_generated_blog_posts (uid);
