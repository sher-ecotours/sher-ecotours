-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 06 — Auto-commission + Ripples trigger
-- Run in Supabase SQL editor   ▸  Role: postgres
-- ─────────────────────────────────────────────────────────────────────────────
-- What this does:
--   1. Creates trigger function fn_booking_confirmed_actions()
--   2. Attaches it to bookings AFTER UPDATE
--
-- Trigger fires when a booking transitions to status='confirmed' AND
-- source='partner'. It then:
--
--   A) COMMISSION — inserts one row into commissions using the partner's
--      currently locked commission_tier and commission_rate from the
--      partners table (set by compute_partner_tiers() at month start).
--      amount_usd = public_price_usd × group_size × rate / 100
--
--   B) RIPPLES (concierge bookings only) — if the booking has a
--      concierge_id, credits the experience's ripples_awarded points to
--      that concierge: inserts into ripples_ledger and updates
--      concierges.ripples_balance + ripples_earned_total.
--
-- Idempotent: skips commission if one already exists for the booking;
-- skips ripples if an 'earned' ledger row already exists for the booking.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function fn_booking_confirmed_actions()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exp_price         numeric(10,2);
  v_exp_ripples       integer;
  v_booking_value     numeric(10,2);
  v_partner_tier      text;
  v_partner_rate      numeric(5,2);
  v_commission_amount numeric(10,2);
  v_current_balance   integer;
  v_new_balance       integer;
begin

  -- ── Guard 1: only act on transition → 'confirmed' ─────────────────────────
  if OLD.status = 'confirmed' or NEW.status <> 'confirmed' then
    return NEW;
  end if;

  -- ── Guard 2: partner-sourced booking with a known partner ─────────────────
  if NEW.source <> 'partner' or NEW.partner_id is null then
    return NEW;
  end if;

  -- ── Fetch experience data in one query ────────────────────────────────────
  select coalesce(public_price_usd, 0),
         coalesce(ripples_awarded,  0)
  into   v_exp_price, v_exp_ripples
  from   experiences
  where  id = NEW.experience_id;

  -- Booking value = per-person price × guest count
  v_booking_value := round(
    coalesce(v_exp_price, 0) * coalesce(NEW.group_size, 1),
    2
  );

  -- ─────────────────────────────────────────────────────────────────────────
  -- A) COMMISSION
  -- ─────────────────────────────────────────────────────────────────────────
  if not exists (
    select 1 from commissions where booking_id = NEW.id
  ) then

    -- Use partner's current locked tier/rate (set by compute_partner_tiers()
    -- at month start). Falls back to Standard 12% for brand-new partners.
    select commission_tier,
           coalesce(commission_rate, 12.00)
    into   v_partner_tier, v_partner_rate
    from   partners
    where  id = NEW.partner_id;

    v_partner_tier      := coalesce(v_partner_tier, 'standard');
    v_partner_rate      := coalesce(v_partner_rate, 12.00);
    v_commission_amount := round(v_booking_value * v_partner_rate / 100.0, 2);

    insert into commissions (
      booking_id,
      partner_id,
      booking_value_usd,
      commission_tier_at_booking,
      commission_rate,
      commission_amount_usd,
      amount_usd,
      status
    ) values (
      NEW.id,
      NEW.partner_id,
      v_booking_value,
      v_partner_tier,
      v_partner_rate,
      v_commission_amount,
      v_commission_amount,   -- keeps base column in sync for Partner PWA query
      'pending'
    );

  end if;

  -- ─────────────────────────────────────────────────────────────────────────
  -- B) RIPPLES  (only when submitted by a named concierge)
  -- ─────────────────────────────────────────────────────────────────────────
  if NEW.concierge_id is not null
     and v_exp_ripples > 0
     and not exists (
       select 1 from ripples_ledger
       where  booking_id       = NEW.id
         and  transaction_type = 'earned'
     )
  then

    select coalesce(ripples_balance, 0)
    into   v_current_balance
    from   concierges
    where  id = NEW.concierge_id;

    v_new_balance := v_current_balance + v_exp_ripples;

    insert into ripples_ledger (
      concierge_id,
      booking_id,
      transaction_type,
      ripples_delta,
      balance_after,
      notes
    ) values (
      NEW.concierge_id,
      NEW.id,
      'earned',
      v_exp_ripples,
      v_new_balance,
      'Booking confirmed: ' || coalesce(NEW.booking_ref, NEW.id::text)
    );

    update concierges
    set    ripples_balance      = v_new_balance,
           ripples_earned_total = ripples_earned_total + v_exp_ripples
    where  id = NEW.concierge_id;

  end if;

  return NEW;
end;
$$;


-- Attach trigger (drop first for idempotency)
drop trigger if exists trg_booking_confirmed_actions on bookings;

create trigger trg_booking_confirmed_actions
  after update on bookings
  for each row
  execute function fn_booking_confirmed_actions();


-- ─────────────────────────────────────────────────────────────────────────────
-- Verify: after running, check the trigger exists
-- ─────────────────────────────────────────────────────────────────────────────
select trigger_name, event_manipulation, action_timing
from   information_schema.triggers
where  trigger_name = 'trg_booking_confirmed_actions';
