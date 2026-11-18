-- ============================================================================
-- EFENDI Dispatch Channels & Accounts Database Sync Migration
-- Non-destructive: adds dedicated columns for WhatsApp & Telegram dispatch
-- accounts on public.store_settings and keeps them automatically synchronized
-- with the existing data jsonb column via a trigger.
-- Run this in Supabase SQL Editor.
-- ============================================================================

alter table public.store_settings
  add column if not exists whatsapp_number text,
  add column if not exists telegram_username text,
  add column if not exists whatsapp_enabled boolean not null default true,
  add column if not exists telegram_enabled boolean not null default true,
  add column if not exists direct_ordering_only boolean not null default true,
  add column if not exists order_channel text not null default 'both';

create or replace function public.normalize_telegram_handle(raw text)
returns text
language sql
immutable
as $$
  select nullif(
    trim(both '@' from
      split_part(
        split_part(
          regexp_replace(
            coalesce(trim(raw), ''),
            '^https?://(www\.)?(t\.me|telegram\.me)/',
            '',
            'i'
          ),
          '?',
          1
        ),
        '/',
        1
      )
    ),
    ''
  );
$$;

create or replace function public.sync_store_settings_dispatch_columns()
returns trigger
language plpgsql
as $$
declare
  v_data jsonb;
  v_wa text;
  v_wa_digits text;
  v_tg text;
  v_wa_enabled boolean;
  v_tg_enabled boolean;
  v_direct_only boolean;
  v_channel text;
begin
  v_data := coalesce(new.data, '{}'::jsonb);

  v_wa := coalesce(
    nullif(trim(v_data ->> 'whatsappNumber'), ''),
    nullif(trim(new.whatsapp_number), ''),
    ''
  );
  v_wa_digits := regexp_replace(v_wa, '[^0-9]', '', 'g');
  if v_wa_digits <> '' then
    v_wa := '+' || v_wa_digits;
  else
    v_wa := '';
  end if;

  v_tg := coalesce(
    public.normalize_telegram_handle(v_data ->> 'telegramUsername'),
    public.normalize_telegram_handle(new.telegram_username),
    ''
  );

  v_wa_enabled := coalesce((v_data ->> 'whatsappEnabled')::boolean, new.whatsapp_enabled, true);
  v_tg_enabled := coalesce((v_data ->> 'telegramEnabled')::boolean, new.telegram_enabled, true);
  v_direct_only := coalesce((v_data ->> 'directOrderingOnly')::boolean, new.direct_ordering_only, true);

  v_channel := case
    when v_wa_enabled and v_tg_enabled then 'both'
    when v_wa_enabled then 'whatsapp'
    when v_tg_enabled then 'telegram'
    else 'both'
  end;

  new.whatsapp_number := nullif(v_wa, '');
  new.telegram_username := nullif(v_tg, '');
  new.whatsapp_enabled := v_wa_enabled;
  new.telegram_enabled := v_tg_enabled;
  new.direct_ordering_only := v_direct_only;
  new.order_channel := v_channel;

  new.data := v_data
    || jsonb_build_object(
      'whatsappNumber', v_wa,
      'telegramUsername', v_tg,
      'whatsappEnabled', v_wa_enabled,
      'telegramEnabled', v_tg_enabled,
      'directOrderingOnly', v_direct_only,
      'orderChannel', v_channel
    );

  return new;
end;
$$;

drop trigger if exists trg_sync_store_settings_dispatch_columns on public.store_settings;

create trigger trg_sync_store_settings_dispatch_columns
  before insert or update on public.store_settings
  for each row
  execute function public.sync_store_settings_dispatch_columns();

-- Non-destructive backfill for the existing store_config row
update public.store_settings
set updated_at = coalesce(updated_at, now())
where id = 'store_config';
