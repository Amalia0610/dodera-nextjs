-- ╔══════════════════════════════════════════════════════════════╗
-- ║  api_tokens table — stores hashed API bearer tokens       ║
-- ║  Run this in the Supabase SQL Editor (Dashboard → SQL)     ║
-- ╚══════════════════════════════════════════════════════════════╝

create table public.api_tokens (
  id           bigint primary key generated always as identity,
  token_hash   text        not null unique,      -- SHA-256 hex hash (never store plain tokens)
  name         text        not null,             -- label: "CI pipeline", "mobile app", etc.
  created_at   timestamptz not null default now(),
  expires_at   timestamptz,                      -- NULL = never expires
  revoked_at   timestamptz,                      -- NULL = active; set to revoke
  last_used_at timestamptz                       -- updated on each successful auth
);

-- Enable Row Level Security (no public policies — only the secret key can access)
alter table public.api_tokens enable row level security;

-- Fast lookup by hash on every authenticated request
create unique index idx_api_tokens_hash on public.api_tokens (token_hash);

-- Index for listing / admin queries
create index idx_api_tokens_created_at on public.api_tokens (created_at desc);
