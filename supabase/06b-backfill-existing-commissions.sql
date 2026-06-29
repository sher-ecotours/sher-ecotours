-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 06b — Backfill commissions for already-confirmed partner bookings
-- Run AFTER 06-commission-ripples-trigger.sql in Supabase SQL editor
-- Role: postgres
-- ─────────────────────────────────────────────────────────────────────────────
-- Creates commission rows for any partner bookings that reached 'confirmed'
-- (or later statuses) BEFORE the trigger existed, and have no commission yet.
-- Safe to run multiple times (skips bookings that already have a commission).
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare
  rec                 record;
  v_exp_price         numeric(10,2);
  v_booking_value     numeric(10,2);
  v_partner_tier      text;
  v_partner_rate      numeric(5,2);
  v_commission_amount numeric(10,2);
begin
  for rec in
    select b.id,
           b.booking_ref,
           b.partner_id,
           b.experience_id,
           b.group_size,
           b.concierge_id
    from   bookings b
    where  b.source      = 'partner'
      and  b.partner_id  is not null
      and  b.status      in ('confirmed', 'completed', 'balance_due', 'paid_in_full')
      and  not exists (
             select 1 from commissions c where c.booking_id = b.id
           )
  loop

    select coalesce(public_price_usd, 0)
    into   v_exp_price
    from   experiences
    where  id = rec.experience_id;

    v_booking_value := round(
      coalesce(v_exp_price, 0) * coalesce(rec.group_size, 1),
      2
    );

    select commission_tier,
           coalesce(commission_rate, 12.00)
    into   v_partner_tier, v_partner_rate
    from   partners
    where  id = rec.partner_id;

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
      rec.id,
      rec.partner_id,
      v_booking_value,
      v_partner_tier,
      v_partner_rate,
      v_commission_amount,
      v_commission_amount,
      'pending'
    );

    raise notice 'Backfilled commission for booking % — USD %', rec.booking_ref, v_commission_amount;
  end loop;
end;
$$;

-- Verify result
select
  b.booking_ref,
  b.status,
  b.group_size,
  e.name          as experience,
  e.public_price_usd,
  c.booking_value_usd,
  c.commission_tier_at_booking as tier,
  c.commission_rate            as rate_pct,
  c.commission_amount_usd      as commission,
  c.status                     as comm_status
from   commissions c
join   bookings    b on b.id = c.booking_id
join   experiences e on e.id = b.experience_id
where  b.source = 'partner'
order  by c.created_at desc;
