-- Fix: "column excluded.city does not exist" — rewritten without ON CONFLICT/excluded,
-- using explicit existence check + branching instead. Safe to run multiple times.

create or replace function public.upsert_visitor(row_data jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := row_data->>'id';
  v_page text := row_data->>'last_page';
  existing visitors%rowtype;
begin
  select * into existing from visitors where id = v_id;

  if found then
    update visitors set
      last_active     = (row_data->>'last_active')::timestamptz,
      last_page       = v_page,
      max_scroll      = greatest(coalesce(existing.max_scroll,0), coalesce((row_data->>'max_scroll')::int,0)),
      pages_visited   = case when existing.pages_visited ? v_page then existing.pages_visited
                              else existing.pages_visited || to_jsonb(v_page) end,
      city = row_data->>'city', country = row_data->>'country', region = row_data->>'region',
      ip = row_data->>'ip', isp = row_data->>'isp', timezone = row_data->>'timezone',
      referrer = row_data->>'referrer', referrer_label = row_data->>'referrer_label',
      utm = coalesce(row_data->'utm', '{}'::jsonb),
      device = row_data->>'device', browser = row_data->>'browser', os = row_data->>'os',
      screen_res = row_data->>'screen_res', screen_depth = row_data->>'screen_depth',
      pixel_ratio = row_data->>'pixel_ratio', window_size = row_data->>'window_size',
      cpu_cores = row_data->>'cpu_cores', ram_gb = row_data->>'ram_gb', language = row_data->>'language',
      dark_mode = row_data->>'dark_mode', connection_type = row_data->>'connection_type', online = row_data->>'online'
    where id = v_id;
  else
    insert into visitors select * from jsonb_populate_record(null::visitors, row_data);
  end if;
end;
$$;
grant execute on function public.upsert_visitor(jsonb) to anon, authenticated;

NOTIFY pgrst, 'reload schema';
