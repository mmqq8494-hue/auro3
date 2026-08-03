-- Run each block separately if possible, and paste me everything that happens
-- (success messages AND any error text).

-- 1) Confirm RLS is actually ON for bookings, and see all policies (any table, not just 3):
select relname, relrowsecurity, relforcerowsecurity
from pg_class
where relname in ('bookings','reviews','visitors');

-- 2) Try inserting AS the anon role directly, to see the raw Postgres error:
set role anon;
insert into bookings (id, name, status) values ('qa_sql_test_1', 'sql test', 'pending');
reset role;
