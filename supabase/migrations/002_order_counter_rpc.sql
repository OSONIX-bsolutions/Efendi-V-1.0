-- ============================================================================
-- Atomic Order Number Allocator RPC
-- Fixes stuck order numbers when SUPABASE_SERVICE_ROLE_KEY is absent or under
-- concurrent serverless invocations (Vercel).
-- Run once in Supabase SQL Editor.
-- ============================================================================

create or replace function public.allocate_next_order_number()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current integer;
begin
  select coalesce(nullif((data ->> 'nextOrderNumber'), '')::integer, 1)
    into v_current
  from public.store_settings
  where id = 'store_config'
  for update;

  if not found then
    v_current := 1;
    insert into public.store_settings (id, data, updated_at)
    values ('store_config', jsonb_build_object('nextOrderNumber', 2), now())
    on conflict (id) do update
      set data = jsonb_set(coalesce(public.store_settings.data, '{}'::jsonb), '{nextOrderNumber}', to_jsonb(2), true),
          updated_at = now();
    return v_current;
  end if;

  if v_current < 1 then
    v_current := 1;
  end if;

  update public.store_settings
  set data = jsonb_set(coalesce(data, '{}'::jsonb), '{nextOrderNumber}', to_jsonb(v_current + 1), true),
      updated_at = now()
  where id = 'store_config';

  return v_current;
end;
$$;

grant execute on function public.allocate_next_order_number() to anon, authenticated, service_role;
