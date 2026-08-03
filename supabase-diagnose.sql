-- Diagnostic — run this and paste me the full result (as text or screenshot).
select schemaname, tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where tablename in ('bookings','reviews','visitors')
order by tablename, cmd;
