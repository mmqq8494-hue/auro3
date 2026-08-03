-- The SQL-level test proved RLS policies are correct (raw insert as role
-- anon worked, only failed on a duplicate id from the earlier test). So the
-- gap is specifically between the API layer (PostgREST) and the database —
-- the API connects as role "authenticator" then switches to "anon" per
-- request, and that role-switch grant is sometimes missing on a project.
-- This restores it. Safe, one-time, no data impact.

grant anon to authenticator;
grant authenticated to authenticator;

-- cleanup the leftover test row from the last diagnostic
delete from bookings where id = 'qa_sql_test_1';

NOTIFY pgrst, 'reload schema';
