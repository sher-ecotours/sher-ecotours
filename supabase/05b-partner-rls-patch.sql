-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Sanctuary Experiences — Partner RLS Patch
-- Run AFTER 05-partner-schema.sql (which failed mid-way through Step 8)
-- This file picks up from the commissions error and completes all remaining
-- policy work. Safe to re-run — all statements use DROP IF EXISTS first.
-- ─────────────────────────────────────────────────────────────────────────────


-- ── commissions ───────────────────────────────────────────────────────────────
-- Policy already exists from 01-rls.sql and covers partner reads correctly.
-- No change needed. Concierge intentionally has no access to commissions.


-- ── bookings ─────────────────────────────────────────────────────────────────

-- Update insert policy to cover concierge role and partner_pwa source
drop policy if exists "partner insert own booking" on bookings;
create policy "partner insert own booking"
  on bookings for insert to authenticated
  with check (
    get_my_role() in ('partner', 'concierge')
    and source in ('partner', 'partner_pwa')
    and partner_id = get_my_partner_id()
  );

-- New: concierge can read bookings they personally submitted
drop policy if exists "concierge read own submitted bookings" on bookings;
create policy "concierge read own submitted bookings"
  on bookings for select to authenticated
  using (get_my_role() = 'concierge' and concierge_id = get_my_concierge_id());


-- ── partners ─────────────────────────────────────────────────────────────────

-- New: concierge can read their own property record (for property name display)
drop policy if exists "concierge read own property" on partners;
create policy "concierge read own property"
  on partners for select to authenticated
  using (get_my_role() = 'concierge' and id = get_my_partner_id());


-- ── experiences ──────────────────────────────────────────────────────────────

-- Update existing policy to also cover concierge role
drop policy if exists "partner read live experiences" on experiences;
create policy "partner read live experiences"
  on experiences for select to authenticated
  using (
    get_my_role() in ('partner', 'concierge')
    and active = true
    and status in ('live', 'coming_soon')
    and is_parent = false
  );


-- ── STEP 9 — Tier auto-compute function ──────────────────────────────────────

create or replace function compute_partner_tiers()
returns void language plpgsql security definer as $$
declare
  rec  record;
  vol  integer;
  tier text;
  rate numeric;
begin
  for rec in select id from partners where status = 'active' loop
    select count(*) into vol
    from bookings
    where partner_id = rec.id
      and status in ('confirmed','balance_due','paid_in_full','completed')
      and created_at >= date_trunc('month', now() - interval '1 month')
      and created_at <  date_trunc('month', now());

    if vol >= 13 then
      tier := 'elite';     rate := 18.00;
    elsif vol >= 6 then
      tier := 'preferred'; rate := 15.00;
    else
      tier := 'standard';  rate := 12.00;
    end if;

    update partners
    set commission_tier = tier,
        commission_rate = coalesce(commission_rate_override, rate),
        tier_locked_at  = current_date,
        bookings_count  = bookings_count + vol
    where id = rec.id;
  end loop;
end;
$$;


-- ── ripples_awarded seed values ───────────────────────────────────────────────
-- Set correct Ripples per booking category (default of 50 from seed is correct
-- for kayak; canoe, proposal, and occasion categories need updating).

update experiences set ripples_awarded = 100
  where category = 'canoe';

update experiences set ripples_awarded = 150
  where category in ('proposal', 'occasion');

-- kayak and cultural remain at 50 (already correct from seed default)
