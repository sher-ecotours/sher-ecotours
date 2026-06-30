-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 10 — Auto-commission and auto-Ripples triggers
-- Run in Supabase SQL editor   ▸  Role: postgres
-- Fires on bookings UPDATE: status → 'confirmed'
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Auto-create commission when partner booking is confirmed ──────────────────

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

    v_value  := coalesce(new.total_value_usd, new.revenue_usd, 0);
    v_amount := round((v_value * v_rate / 100)::numeric, 2);

    insert into commissions (
      booking_id, partner_id, concierge_id, status,
      booking_value_usd, commission_tier_at_booking, commission_rate, commission_amount_usd
    )
    select new.id, new.partner_id, new.concierge_id, 'pending',
           v_value, v_tier, v_rate, v_amount
    where not exists (select 1 from commissions where booking_id = new.id);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_commission on bookings;
create trigger trg_auto_commission
  after update on bookings
  for each row execute function auto_create_commission();


-- ── Auto-award Ripples when booking with concierge is confirmed ───────────────

create or replace function auto_award_ripples()
returns trigger language plpgsql security definer as $$
declare
  v_ripples     integer;
  v_new_balance integer;
begin
  if new.status = 'confirmed'
     and old.status is distinct from 'confirmed'
     and new.concierge_id is not null
  then
    select coalesce(ripples_awarded, 50) into v_ripples
    from experiences where id = new.experience_id;

    update concierges
    set ripples_balance      = ripples_balance + v_ripples,
        ripples_earned_total = ripples_earned_total + v_ripples
    where id = new.concierge_id
    returning ripples_balance into v_new_balance;

    insert into ripples_ledger (
      concierge_id, booking_id, transaction_type, ripples_delta, balance_after
    ) values (
      new.concierge_id, new.id, 'earned', v_ripples, coalesce(v_new_balance, v_ripples)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_ripples on bookings;
create trigger trg_auto_ripples
  after update on bookings
  for each row execute function auto_award_ripples();


-- Verify
select tgname, tgenabled
from   pg_trigger
where  tgrelid = 'bookings'::regclass
  and  tgname in ('trg_auto_commission','trg_auto_ripples');
