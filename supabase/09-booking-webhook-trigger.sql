-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 09 — Booking notification webhook trigger (pg_net)
-- Run in Supabase SQL editor   ▸  Role: postgres
-- Bypasses the Dashboard webhook UI and creates the trigger directly.
-- This is exactly what Supabase's UI does internally.
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable pg_net extension (safe if already enabled)
create extension if not exists pg_net schema extensions;

-- Trigger function: fires on INSERT and UPDATE, POSTs to edge function
create or replace function notify_booking_webhook()
returns trigger language plpgsql security definer as $$
declare
  payload jsonb;
begin
  if TG_OP = 'INSERT' then
    payload := jsonb_build_object(
      'type',       'INSERT',
      'table',      'bookings',
      'schema',     'public',
      'record',     row_to_json(NEW)::jsonb,
      'old_record', null
    );
  elsif TG_OP = 'UPDATE' then
    payload := jsonb_build_object(
      'type',       'UPDATE',
      'table',      'bookings',
      'schema',     'public',
      'record',     row_to_json(NEW)::jsonb,
      'old_record', row_to_json(OLD)::jsonb
    );
  end if;

  perform extensions.http_post(
    url     := 'https://hvxqettaonfxmmntrsmd.supabase.co/functions/v1/notify-new-booking',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body    := payload
  );

  return NEW;
end;
$$;

-- Attach trigger to bookings table
drop trigger if exists trg_notify_booking on bookings;

create trigger trg_notify_booking
  after insert or update on bookings
  for each row
  execute function notify_booking_webhook();

-- Verify
select tgname, tgenabled
from   pg_trigger
where  tgrelid = 'bookings'::regclass
  and  tgname  = 'trg_notify_booking';
