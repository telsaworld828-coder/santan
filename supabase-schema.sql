-- Run this in your Supabase SQL Editor to set up all required tables.
--
-- IMPORTANT — if you already ran an earlier version of this schema, just run
-- this one line below first to add the new column, then skip to the bottom:
--   alter table santander_transactions add column if not exists beneficiary jsonb;
-- The rest of this file is safe to re-run (everything uses IF NOT EXISTS /
-- ON CONFLICT), so you can also just run the whole thing again.

-- ── Users ──────────────────────────────────────────────────────────────────
create table if not exists santander_users (
  id            text primary key,
  name          text not null,
  email         text not null unique,
  password      text not null,
  pin           text not null,
  balance       numeric(14,2) not null default 0,
  status        text not null default 'active' check (status in ('active', 'frozen')),
  avatar        text,                          -- base64 data URL
  bank          text not null default 'Santander',
  bank_details  jsonb not null default '{}',
  sort_code     text,
  account_number text,
  created_at    timestamptz not null default now()
);

-- ── Transactions ──────────────────────────────────────────────────────────
create table if not exists santander_transactions (
  id          text primary key,
  user_id     text not null references santander_users(id),
  merchant    text not null,
  category    text not null,
  amount      numeric(14,2) not null,
  status      text not null default 'pending' check (status in ('pending', 'successful', 'failed')),
  kind        text not null check (kind in ('credit', 'debit')),
  bank        text,
  note        text,
  created_at  timestamptz not null default now(),
  deleted     boolean not null default false,
  source      text not null default 'user' check (source in ('admin', 'user', 'system')),
  beneficiary jsonb  -- snapshot of beneficiary details entered at transfer time
);

-- ── Admin ─────────────────────────────────────────────────────────────────
create table if not exists santander_admin (
  id       text primary key default 'main',
  balance  numeric(14,2) not null default 2000000
);

-- Insert default admin row
insert into santander_admin (id, balance) values ('main', 2000000)
on conflict (id) do nothing;

-- ── Audit log (optional) ──────────────────────────────────────────────────
create table if not exists santander_audit (
  id         bigserial primary key,
  actor      text not null,  -- 'admin' or user id
  action     text not null,
  payload    jsonb,
  created_at timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────
create index if not exists santander_transactions_user_id_idx on santander_transactions(user_id);
create index if not exists santander_transactions_created_at_idx on santander_transactions(created_at desc);

-- ── Row-Level Security ────────────────────────────────────────────────────
-- Using anon key with RLS disabled (admin-controlled app, no user auth via Supabase).
-- If you want to lock down, enable RLS and add policies here.
-- For now, allow all anon reads and writes (this app controls auth itself).
alter table santander_users enable row level security;
alter table santander_transactions enable row level security;
alter table santander_admin enable row level security;

create policy "allow_all_anon_users" on santander_users for all using (true) with check (true);
create policy "allow_all_anon_txs" on santander_transactions for all using (true) with check (true);
create policy "allow_all_anon_admin" on santander_admin for all using (true) with check (true);

-- ── Realtime ─────────────────────────────────────────────────────────────
-- In Supabase Dashboard → Database → Replication, add these tables to the
-- supabase_realtime publication:
--   santander_users
--   santander_transactions
--
-- Or run:
alter publication supabase_realtime add table santander_users;
alter publication supabase_realtime add table santander_transactions;
