-- ╔══════════════════════════════════════════════════════════════╗
-- ║  contacts table — stores contact form submissions          ║
-- ║  Run this in the Supabase SQL Editor (Dashboard → SQL)     ║
-- ╚══════════════════════════════════════════════════════════════╝

create table public.contacts (
  id          bigint primary key generated always as identity,
  name        text        not null,
  email       text        not null,
  company     text,
  phone       text,
  message     text        not null,
  created_at  timestamptz not null default now()
);

-- Enable Row Level Security (no public policies — only the secret key can access)
alter table public.contacts enable row level security;

-- Optional: add an index on created_at for dashboard sorting
create index idx_contacts_created_at on public.contacts (created_at desc);
