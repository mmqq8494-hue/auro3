-- ══════════════════════════════════════════════════════════════
-- Fix: anon INSERT/UPDATE was blocked (RLS policies exist, but the
-- base Postgres GRANTs for anon/authenticated were missing on these
-- tables). Run this once — paste into SQL Editor → Run.
-- Safe to run multiple times.
-- ══════════════════════════════════════════════════════════════

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  bookings, reviews, visitors, contracts, invoices, forms, clients, audit_logs
to anon, authenticated;

grant usage, select on all sequences in schema public to anon, authenticated;
