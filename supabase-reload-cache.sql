-- Force PostgREST to reload its cached schema/policies (harmless, no data changes).
NOTIFY pgrst, 'reload schema';
