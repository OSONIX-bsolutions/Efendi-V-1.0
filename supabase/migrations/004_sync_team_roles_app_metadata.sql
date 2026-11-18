-- ============================================================================
-- EFENDI Team Role -> Auth JWT app_metadata Synchronization Migration
-- Non-destructive: syncs existing and future public.team_roles entries directly
-- into auth.users.raw_app_meta_data so trusted roles are present inside the
-- Supabase Auth JWT as well as public.team_roles.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- 1. Normalize any accidental whitespace/casing in existing team_roles rows
update public.team_roles
set role = lower(trim(role)),
    email = lower(trim(email)),
    updated_at = now()
where role <> lower(trim(role))
   or email <> lower(trim(email));

-- 2. Backfill auth.users.raw_app_meta_data from public.team_roles
update auth.users u
set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', lower(trim(tr.role)))
from public.team_roles tr
where u.id = tr.user_id
  and lower(trim(tr.role)) in ('staff', 'admin', 'developer')
  and coalesce(u.raw_app_meta_data ->> 'role', '') <> lower(trim(tr.role));

-- 3. Keep auth.users.raw_app_meta_data synced whenever public.team_roles changes
create or replace function public.sync_team_role_to_auth_metadata()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if new.role is not null and lower(trim(new.role)) in ('staff', 'admin', 'developer') then
    update auth.users
    set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', lower(trim(new.role)))
    where id = new.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_team_role_to_auth_metadata on public.team_roles;

create trigger trg_sync_team_role_to_auth_metadata
  after insert or update on public.team_roles
  for each row
  execute function public.sync_team_role_to_auth_metadata();

-- 4. Ensure authenticated users can always read their own role row cleanly
alter table public.team_roles enable row level security;
drop policy if exists "Read own role" on public.team_roles;
create policy "Read own role"
  on public.team_roles for select
  using (auth.uid() = user_id or public.get_my_role() = 'developer');

grant execute on function public.get_my_role() to authenticated, service_role;
