-- ══════════════════════════════════════════════════════════════
-- Fix: INSERT policies scoped to role "anon" were being rejected even
-- though pg_policies shows them correctly with with_check=true. Rebuilding
-- them scoped to PUBLIC (matches any role, sidesteps any anon/authenticated
-- role-mapping mismatch) to isolate/fix the issue.
-- Safe to run multiple times.
-- ══════════════════════════════════════════════════════════════

drop policy if exists "public can insert bookings" on bookings;
create policy "public can insert bookings" on bookings for insert to public with check (true);

drop policy if exists "public can insert reviews" on reviews;
create policy "public can insert reviews" on reviews for insert to public with check (true);

drop policy if exists "public can insert visitors" on visitors;
create policy "public can insert visitors" on visitors for insert to public with check (true);

drop policy if exists "public can update visitors" on visitors;
create policy "public can update visitors" on visitors for update to public using (true) with check (true);
