-- ══════════════════════════════════════════════════════════════
-- AURO — Supabase schema + Row Level Security policies
-- Paste this whole file into: Supabase Dashboard → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════════════

-- ── BOOKINGS (public can insert, only logged-in admin can read/update/delete) ──
create table bookings (
  id          text primary key,
  name        text,
  phone       text,
  city        text,
  event       text,
  event_date  text,
  time        text,
  notes       text,
  pkg         text,
  cups        text,
  price       numeric default 0,
  additions   text,
  drinks      text,
  status      text default 'pending',
  date        timestamptz default now(),
  created_at  bigint
);
alter table bookings enable row level security;
create policy "public can insert bookings" on bookings for insert to anon with check (true);
create policy "admin full access bookings" on bookings for all to authenticated using (true) with check (true);

-- ── REVIEWS (public can insert + read approved only) ──
create table reviews (
  id        text primary key,
  name      text,
  phone     text,
  rating    int,
  comment   text,
  location  text,
  device    text,
  referrer  text,
  status    text default 'pending',
  date      timestamptz default now()
);
alter table reviews enable row level security;
create policy "public can insert reviews" on reviews for insert to anon with check (true);
create policy "public can read approved reviews" on reviews for select to anon using (status = 'approved');
create policy "admin full access reviews" on reviews for all to authenticated using (true) with check (true);

-- ── VISITORS (public can insert/update their own session, admin reads all) ──
create table visitors (
  id               text primary key,
  session_id       text,
  first_visit      timestamptz default now(),
  last_active      timestamptz default now(),
  pages_visited    jsonb default '[]',
  max_scroll       int default 0,
  last_page        text,
  location         text,
  city             text,
  country          text,
  region           text,
  ip               text,
  isp              text,
  timezone         text,
  referrer         text,
  referrer_label   text,
  utm              jsonb default '{}',
  device           text,
  browser          text,
  os               text,
  screen_res       text,
  screen_depth     text,
  pixel_ratio      text,
  window_size      text,
  cpu_cores        text,
  ram_gb           text,
  language         text,
  dark_mode        text,
  connection_type  text,
  online           text
);
alter table visitors enable row level security;
create policy "public can insert visitors" on visitors for insert to anon with check (true);
create policy "public can update visitors" on visitors for update to anon using (true) with check (true);
create policy "admin full access visitors" on visitors for all to authenticated using (true) with check (true);

-- ── CONTRACTS ──
create table contracts (
  id               text primary key,
  client_name      text,
  phone            text,
  city             text,
  status           text default 'draft',
  event_type       text,
  event_date       text,
  event_time       text,
  event_loc        text,
  corner_type      text,
  package_name     text,
  add_deco         boolean default false,
  add_host         boolean default false,
  extra_notes      text,
  guests           text,
  duration         text,
  additions        text,
  service_val      numeric default 0,
  deposit_val      numeric default 500,
  total_value      numeric default 0,
  contract_number  text,
  signed_at        text,
  signed_ip        text,
  signature_image  text,
  created_at       bigint,
  updated_at       bigint
);
alter table contracts enable row level security;
-- signing flow: the client (unauthenticated) opens contract.html via a shared link and signs it
create policy "public can read contracts by id" on contracts for select to anon using (true);
create policy "public can sign contracts" on contracts for update to anon using (true) with check (true);
create policy "admin full access contracts" on contracts for all to authenticated using (true) with check (true);

-- ── INVOICES (quotes + final invoices) ──
create table invoices (
  id               text primary key,
  type             text default 'quote',
  status           text default 'pending',
  client_name      text,
  phone            text,
  city             text,
  pay_method       text,
  event_date       text,
  event_loc        text,
  corner_type      text,
  package_name     text,
  add_deco         boolean default false,
  add_host         boolean default false,
  extra_notes      text,
  event_type       text,
  guests           text,
  duration         text,
  additions        text,
  service_val      numeric default 0,
  deposit_val      numeric default 500,
  deposit_status   text default 'held',
  notes            text,
  total            numeric default 0,
  invoice_number   text,
  created_at       bigint,
  updated_at       bigint
);
alter table invoices enable row level security;
create policy "public can read invoices by id" on invoices for select to anon using (true);
create policy "admin full access invoices" on invoices for all to authenticated using (true) with check (true);

-- ── FORMS (delivery / receipt handover) ──
create table forms (
  id             text primary key,
  type           text,
  status         text default 'draft',
  order_id       text,
  client_name    text,
  phone          text,
  event_date     text,
  event_loc      text,
  corner_type    text,
  damage_type    text,
  damage_desc    text,
  damage_val     numeric default 0,
  damage_deduct  numeric default 0,
  damage_extra   numeric default 0,
  notes          text,
  items          jsonb default '[]',
  form_number    text,
  signed_at      text,
  signed_ip      text,
  signature_img  text,
  created_at     bigint,
  updated_at     bigint
);
alter table forms enable row level security;
create policy "public can read forms by id" on forms for select to anon using (true);
create policy "public can sign forms" on forms for update to anon using (true) with check (true);
create policy "admin full access forms" on forms for all to authenticated using (true) with check (true);

-- ── CLIENTS ──
create table clients (
  id          text primary key,
  name        text,
  phone       text,
  city        text,
  notes       text,
  created_at  bigint,
  updated_at  bigint
);
alter table clients enable row level security;
create policy "admin full access clients" on clients for all to authenticated using (true) with check (true);

-- ── AUDIT LOGS (admin actions only) ──
create table audit_logs (
  id          bigint generated always as identity primary key,
  action      text,
  collection  text,
  doc_id      text,
  admin_user  text,
  timestamp   bigint
);
alter table audit_logs enable row level security;
create policy "admin full access audit_logs" on audit_logs for all to authenticated using (true) with check (true);
