-- ╔══════════════════════════════════════════════════════════════╗
-- ║  admin_users table — stores admin dashboard credentials   ║
-- ║  Run this in the Supabase SQL Editor (Dashboard → SQL)     ║
-- ╚══════════════════════════════════════════════════════════════╝

create table public.admin_users (
  id           bigint primary key generated always as identity,
  email        text        not null unique,
  password_hash text       not null,           -- bcrypt hash
  name         text,                           -- optional display name
  created_at   timestamptz not null default now(),
  last_login_at timestamptz                    -- updated on each successful login
);

-- Enable Row Level Security (no public policies — only the secret key can access)
alter table public.admin_users enable row level security;

-- Fast lookup by email
create unique index idx_admin_users_email on public.admin_users (email);
