-- Havn remote schema (mirrors src/lib/db/schema.ts).
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
--
-- Ids are TEXT and reuse the same values generated locally (src/lib/db/id.ts),
-- so the sync worker (issue #19) can push/pull rows without remapping ids.
-- Every table carries a user_id tying rows to the signed-in (possibly anonymous)
-- Supabase user, enforced by Row Level Security below.

create table if not exists accounts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null,
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists categories (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  icon text,
  color text,
  type text not null,
  created_at timestamptz not null default now()
);

create table if not exists anchors (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  amount numeric not null,
  type text not null,
  category_id text references categories (id) on delete set null,
  account_id text not null references accounts (id) on delete cascade,
  frequency text not null,
  next_due_date date not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists transactions (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  account_id text not null references accounts (id) on delete cascade,
  category_id text references categories (id) on delete set null,
  anchor_id text references anchors (id) on delete set null,
  amount numeric not null,
  type text not null,
  description text,
  date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_account_id on transactions (account_id);
create index if not exists idx_transactions_category_id on transactions (category_id);
create index if not exists idx_transactions_date on transactions (date);
create index if not exists idx_transactions_anchor_id on transactions (anchor_id);
create index if not exists idx_anchors_next_due_date on anchors (next_due_date);

-- Row Level Security: each Supabase user (including anonymous ones) only ever
-- sees and writes their own rows.
alter table accounts enable row level security;
alter table categories enable row level security;
alter table anchors enable row level security;
alter table transactions enable row level security;

create policy "Users manage their own accounts" on accounts
  for all using (auth.uid () = user_id)
  with
    check (auth.uid () = user_id);

create policy "Users manage their own categories" on categories
  for all using (auth.uid () = user_id)
  with
    check (auth.uid () = user_id);

create policy "Users manage their own anchors" on anchors
  for all using (auth.uid () = user_id)
  with
    check (auth.uid () = user_id);

create policy "Users manage their own transactions" on transactions
  for all using (auth.uid () = user_id)
  with
    check (auth.uid () = user_id);
