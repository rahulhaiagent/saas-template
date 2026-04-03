-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles table ──────────────────────────────────────────────────────────
-- Mirrors Clerk user data. Populated via Clerk webhook (user.created / user.updated).
create table public.profiles (
  id           uuid primary key default uuid_generate_v4(),
  clerk_id     text unique not null,      -- Clerk's user ID (e.g. user_2abc...)
  email        text unique not null,
  first_name   text,
  last_name    text,
  avatar_url   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz                -- Soft delete support
);

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table public.profiles enable row level security;

-- Users can only read their own profile.
-- auth.jwt() ->> 'sub' returns the Clerk user ID from the JWT claim.
create policy "Users can view own profile"
  on public.profiles
  for select
  using (clerk_id = (auth.jwt() ->> 'sub'));

-- Users can update their own profile.
create policy "Users can update own profile"
  on public.profiles
  for update
  using (clerk_id = (auth.jwt() ->> 'sub'));

-- Service role bypasses RLS automatically (used by webhook handler).

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index on public.profiles (clerk_id);

-- ─── Auto-update updated_at ───────────────────────────────────────────────────
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function update_updated_at_column();
