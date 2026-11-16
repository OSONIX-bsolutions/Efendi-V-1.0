-- ============================================================================
-- EFENDI Production Security Hardening Migration
-- Non-destructive: preserves all existing tables, menu items, orders, and users.
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- 1. Trusted Server/Admin-Controlled Role Mapping Table
create table if not exists public.team_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('staff', 'admin', 'developer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.team_roles enable row level security;

-- Helper function reading trusted role ONLY from app_metadata or public.team_roles
-- (NEVER from user-editable user_metadata)
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    nullif(auth.jwt() -> 'app_metadata' ->> 'role', ''),
    (select role from public.team_roles where user_id = auth.uid() limit 1)
  );
$$;

-- Migrate existing Supabase Auth users who previously had role in raw_user_meta_data
-- Non-destructive: preserves all existing user records while promoting role to trusted storage
insert into public.team_roles (user_id, email, role)
select
  id,
  coalesce(email, ''),
  (raw_user_meta_data ->> 'role')::text
from auth.users
where (raw_user_meta_data ->> 'role') in ('staff', 'admin', 'developer')
on conflict (user_id) do nothing;

update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || jsonb_build_object('role', raw_user_meta_data ->> 'role')
where (raw_user_meta_data ->> 'role') in ('staff', 'admin', 'developer')
  and coalesce(raw_app_meta_data ->> 'role', '') = '';

-- RLS for team_roles: users can read their own role; only developers can manage roles
drop policy if exists "Read own role" on public.team_roles;
drop policy if exists "Developers manage team roles" on public.team_roles;

create policy "Read own role"
  on public.team_roles for select
  using (auth.uid() = user_id or public.get_my_role() = 'developer');

create policy "Developers manage team roles"
  on public.team_roles for all
  using (public.get_my_role() = 'developer')
  with check (public.get_my_role() = 'developer');

-- ============================================================================
-- 2. CATEGORIES: Public read; admin & developer write
-- ============================================================================
alter table public.categories enable row level security;

drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Public write categories" on public.categories;
drop policy if exists "Authorized write categories" on public.categories;
drop policy if exists "Admin write categories" on public.categories;

create policy "Public read categories"
  on public.categories for select
  using (true);

create policy "Admin write categories"
  on public.categories for all
  using (public.get_my_role() in ('admin', 'developer'))
  with check (public.get_my_role() in ('admin', 'developer'));

-- ============================================================================
-- 3. MENU ITEMS: Public read for visible items only; admin & developer full access
-- ============================================================================
alter table public.menu_items enable row level security;

drop policy if exists "Public read menu_items" on public.menu_items;
drop policy if exists "Public write menu_items" on public.menu_items;
drop policy if exists "Authorized write menu_items" on public.menu_items;
drop policy if exists "Admin write menu_items" on public.menu_items;

create policy "Public read menu_items"
  on public.menu_items for select
  using (
    coalesce(is_hidden, false) = false
    or public.get_my_role() in ('staff', 'admin', 'developer')
  );

create policy "Admin write menu_items"
  on public.menu_items for all
  using (public.get_my_role() in ('admin', 'developer'))
  with check (public.get_my_role() in ('admin', 'developer'));

-- ============================================================================
-- 4. STORE SETTINGS: Public read (non-sensitive config); admin & developer write
-- ============================================================================
alter table public.store_settings enable row level security;

drop policy if exists "Public read settings" on public.store_settings;
drop policy if exists "Public write settings" on public.store_settings;
drop policy if exists "Public read store_settings" on public.store_settings;
drop policy if exists "Authorized write store_settings" on public.store_settings;
drop policy if exists "Admin write store_settings" on public.store_settings;

create policy "Public read store_settings"
  on public.store_settings for select
  using (true);

create policy "Admin write store_settings"
  on public.store_settings for all
  using (public.get_my_role() in ('admin', 'developer'))
  with check (public.get_my_role() in ('admin', 'developer'));

-- ============================================================================
-- 5. ORDERS: Protect customer PII (no public SELECT!)
-- ============================================================================
alter table public.orders enable row level security;

drop policy if exists "Public read orders" on public.orders;
drop policy if exists "Public write orders" on public.orders;
drop policy if exists "Public create orders" on public.orders;
drop policy if exists "Authorized read orders" on public.orders;
drop policy if exists "Authorized manage orders" on public.orders;
drop policy if exists "Authorized delete orders" on public.orders;
drop policy if exists "Staff read orders" on public.orders;
drop policy if exists "Staff update orders" on public.orders;
drop policy if exists "Admin delete orders" on public.orders;

-- Customers can place orders (or backend creates them via service role)
create policy "Public create orders"
  on public.orders for insert
  with check (status = 'new');

-- ONLY authenticated staff, admin, and developers can read customer orders & PII
create policy "Staff read orders"
  on public.orders for select
  using (public.get_my_role() in ('staff', 'admin', 'developer'));

-- Staff, admin, and developers can update order status
create policy "Staff update orders"
  on public.orders for update
  using (public.get_my_role() in ('staff', 'admin', 'developer'))
  with check (public.get_my_role() in ('staff', 'admin', 'developer'));

-- Only admin and developer can delete orders
create policy "Admin delete orders"
  on public.orders for delete
  using (public.get_my_role() in ('admin', 'developer'));

-- ============================================================================
-- 6. STORAGE (menu_images bucket): Public view; admin & developer upload/manage
-- ============================================================================
drop policy if exists "Allow all uploads to menu_images" on storage.objects;
drop policy if exists "Allow all updates to menu_images" on storage.objects;
drop policy if exists "Allow all deletes in menu_images" on storage.objects;
drop policy if exists "Allow public read menu_images" on storage.objects;
drop policy if exists "Public view menu_images" on storage.objects;
drop policy if exists "Authorized upload menu_images" on storage.objects;
drop policy if exists "Authorized update menu_images" on storage.objects;
drop policy if exists "Authorized delete menu_images" on storage.objects;
drop policy if exists "Admin upload menu_images" on storage.objects;
drop policy if exists "Admin update menu_images" on storage.objects;
drop policy if exists "Admin delete menu_images" on storage.objects;

create policy "Public view menu_images"
  on storage.objects for select
  using (bucket_id = 'menu_images');

create policy "Admin upload menu_images"
  on storage.objects for insert
  with check (
    bucket_id = 'menu_images'
    and public.get_my_role() in ('admin', 'developer')
  );

create policy "Admin update menu_images"
  on storage.objects for update
  using (
    bucket_id = 'menu_images'
    and public.get_my_role() in ('admin', 'developer')
  );

create policy "Admin delete menu_images"
  on storage.objects for delete
  using (
    bucket_id = 'menu_images'
    and public.get_my_role() in ('admin', 'developer')
  );
