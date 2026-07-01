-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 11 — Fix auto_create_commission + concierge independent operator flag
-- Run in Supabase SQL editor  ▸  Role: postgres
-- ─────────────────────────────────────────────────────────────────────────────

-- ── FIX 1: auto_create_commission was missing amount_usd (NOT NULL column) ───
-- Migration 10's trigger fires before migration 06's trigger (alphabetical
-- order) and its INSERT omitted amount_usd, causing a NOT NULL violation on
-- every partner booking confirmation.

create or replace function auto_create_commission()
returns trigger language plpgsql security definer as $$
declare
  v_rate   numeric;
  v_tier   text;
  v_value  numeric;
  v_amount numeric;
begin
  if new.status = 'confirmed'
     and old.status is distinct from 'confirmed'
     and new.source = 'partner'
     and new.partner_id is not null
  then
    select commission_tier, coalesce(commission_rate, 12)
      into v_tier, v_rate
    from partners where id = new.partner_id;

    v_tier   := coalesce(v_tier,  'standard');
    v_rate   := coalesce(v_rate,  12);
    v_value  := coalesce(new.total_value_usd, new.revenue_usd, 0);
    v_amount := round((v_value * v_rate / 100)::numeric, 2);

    insert into commissions (
      booking_id, partner_id, concierge_id, status,
      booking_value_usd, commission_tier_at_booking,
      commission_rate, commission_amount_usd, amount_usd
    )
    select
      new.id, new.partner_id, new.concierge_id, 'pending',
      v_value, v_tier, v_rate, v_amount, v_amount
    where not exists (
      select 1 from commissions where booking_id = new.id
    );
  end if;
  return new;
end;
$$;

-- Drop the migration-06 trigger — migration-10 triggers now cover both
-- commission (trg_auto_commission) and Ripples (trg_auto_ripples).
drop trigger if exists trg_booking_confirmed_actions on bookings;


-- ── FIX 2: concierge independent operator flag ────────────────────────────────
-- Concierges default to desk-staff mode (cannot submit bookings).
-- Set is_independent_operator = true for concierges running their own
-- operation who should have full New Booking / My Sales access.

alter table concierges
  add column if not exists is_independent_operator boolean not null default false;


-- ── Verify ────────────────────────────────────────────────────────────────────
select tgname, tgenabled
from   pg_trigger
where  tgrelid = 'bookings'::regclass
  and  tgname in (
    'trg_booking_confirmed_actions',
    'trg_auto_commission',
    'trg_auto_ripples'
  );
