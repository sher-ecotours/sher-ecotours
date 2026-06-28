-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Sanctuary Experiences — Partner & Commission Schema
-- Run AFTER 04-staff-forms.sql
-- Adds: concierge role, tiered commissions, payouts, SHER Ripples, redemptions,
--       availability table, and updates existing partner/commission/bookings tables
-- ─────────────────────────────────────────────────────────────────────────────


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1 — user_roles: add concierge role + concierge_id column
-- ─────────────────────────────────────────────────────────────────────────────

alter table user_roles
  drop constraint if exists user_roles_role_check;

alter table user_roles
  add constraint user_roles_role_check
  check (role in ('admin', 'guide', 'partner', 'concierge'));

alter table user_roles
  add column if not exists concierge_id uuid;   -- FK added after concierges table created


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2 — helper functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Returns the concierge record id for the authenticated user
create or replace function get_my_concierge_id()
returns uuid language sql security definer stable as $$
  select concierge_id from user_roles where user_id = auth.uid()
$$;

-- Returns the partner_id for the authenticated user (works for both partner + concierge)
create or replace function get_my_partner_id()
returns uuid language sql security definer stable as $$
  select partner_id from user_roles where user_id = auth.uid()
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3 — experiences: rename concierge_points → ripples_awarded
-- ─────────────────────────────────────────────────────────────────────────────

alter table experiences
  rename column concierge_points to ripples_awarded;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4 — partners: add tiered commission and trust fields
-- ─────────────────────────────────────────────────────────────────────────────

alter table partners
  add column if not exists commission_tier text not null default 'standard',
  add column if not exists tier_locked_at  date,
  add column if not exists commission_rate_override numeric(5,2),
  add column if not exists confirmation_mode text not null default 'standard',
  add column if not exists trusted_since   date,
  add column if not exists bookings_count  integer not null default 0,
  add column if not exists onboarded_at    date;

alter table partners
  add constraint partners_commission_tier_check
  check (commission_tier in ('standard', 'preferred', 'elite'));

alter table partners
  add constraint partners_confirmation_mode_check
  check (confirmation_mode in ('standard', 'trusted'));

-- commission_rate already exists as numeric — update it to reflect tier rates (12/15/18)
-- Existing rows will keep their current value until first tier lock.


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 5 — bookings: add concierge, payment model, and balance fields
--          Expand status to match spec (keep backward-compat values too)
-- ─────────────────────────────────────────────────────────────────────────────

alter table bookings
  drop constraint if exists bookings_status_check;

alter table bookings
  add constraint bookings_status_check
  check (status in (
    'enquiry', 'pending', 'qualified', 'confirmed',
    'balance_due', 'paid_in_full', 'completed',
    'cancelled', 'deferred', 'no_show'
  ));

alter table bookings
  add column if not exists concierge_id       uuid,   -- FK added after concierges table
  add column if not exists payment_model      text default 'standard'
                             check (payment_model in ('standard', 'bespoke')),
  add column if not exists total_value_usd    numeric(10,2),
  add column if not exists deposit_amount_usd numeric(10,2),
  add column if not exists balance_amount_usd numeric(10,2),
  add column if not exists balance_due_date   date;


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 6 — commissions: expand to match full spec
-- ─────────────────────────────────────────────────────────────────────────────

alter table commissions
  add column if not exists booking_value_usd          numeric(10,2),
  add column if not exists commission_tier_at_booking text
                             check (commission_tier_at_booking in ('standard','preferred','elite')),
  add column if not exists commission_rate            numeric(5,2),
  add column if not exists commission_amount_usd      numeric(10,2),
  add column if not exists concierge_id               uuid,   -- FK added after concierges table
  add column if not exists approved_at                timestamptz,
  add column if not exists payout_id                  uuid;   -- FK added after payouts table

alter table commissions
  drop constraint if exists commissions_status_check;

alter table commissions
  add constraint commissions_status_check
  check (status in ('pending', 'approved', 'paid', 'reversed'));


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 20 — concierges
-- Individual tour desk staff. SHER Ripples balance follows the person, not the property.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists concierges (
  id                      uuid        primary key default gen_random_uuid(),
  user_id                 uuid        not null references auth.users(id) on delete cascade,
  partner_id              uuid        not null references partners(id),
  first_name              text        not null,
  last_name               text        not null,
  email                   text        not null,
  phone                   text,
  ripples_balance         integer     not null default 0,
  ripples_earned_total    integer     not null default 0,
  ripples_redeemed_total  integer     not null default 0,
  status                  text        not null default 'active'
                            check (status in ('active', 'inactive')),
  created_at              timestamptz default now()
);

create index if not exists concierges_partner_idx on concierges (partner_id);
create index if not exists concierges_user_idx    on concierges (user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 21 — payouts
-- Commission payout batches from operator to partner property.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists payouts (
  id                  uuid        primary key default gen_random_uuid(),
  partner_id          uuid        not null references partners(id),
  payout_amount_usd   numeric(10,2) not null,
  commission_ids      uuid[],
  payout_method       text        check (payout_method in ('bank_transfer','cheque','mobile_money')),
  reference           text,
  paid_at             date,
  notes               text,
  created_at          timestamptz default now()
);

create index if not exists payouts_partner_idx on payouts (partner_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 22 — ripples_ledger
-- Every SHER Ripples earning and redemption for every concierge.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists ripples_ledger (
  id                uuid        primary key default gen_random_uuid(),
  concierge_id      uuid        not null references concierges(id),
  booking_id        uuid        references bookings(id),
  redemption_id     uuid,   -- FK added after redemptions table
  transaction_type  text        not null
                      check (transaction_type in ('earned','redeemed','reversed','adjusted')),
  ripples_delta     integer     not null,   -- positive = earned, negative = spent/reversed
  balance_after     integer     not null,
  notes             text,
  created_at        timestamptz default now()
);

create index if not exists ripples_ledger_concierge_idx on ripples_ledger (concierge_id);
create index if not exists ripples_ledger_booking_idx   on ripples_ledger (booking_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 23 — redemptions
-- Concierge redemption requests: free tour or cash payout.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists redemptions (
  id                  uuid        primary key default gen_random_uuid(),
  concierge_id        uuid        not null references concierges(id),
  redemption_type     text        not null check (redemption_type in ('free_tour','cash')),
  experience_id       uuid        references experiences(id),   -- for free_tour type
  ripples_cost        integer     not null,
  cash_value_usd      numeric(10,2),   -- for cash type (USD $25 or $50)
  payout_method       text        check (payout_method in ('bank_transfer','mobile_money')),
  payout_reference    text,
  status              text        not null default 'requested'
                        check (status in ('requested','approved','paid','declined')),
  approved_at         timestamptz,
  paid_at             date,
  created_at          timestamptz default now()
);

create index if not exists redemptions_concierge_idx on redemptions (concierge_id);
create index if not exists redemptions_status_idx    on redemptions (status);


-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 24 — availability
-- One row per experience per date. Used by Partner PWA to show open slots.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists availability (
  id                      uuid    primary key default gen_random_uuid(),
  experience_id           uuid    not null references experiences(id),
  date                    date    not null,
  capacity_total          integer,
  capacity_remaining      integer,
  status                  text    not null default 'open'
                            check (status in ('open','closed','full','cancelled','blocked')),
  departure_time_override text,
  notes                   text,
  created_at              timestamptz default now(),
  unique (experience_id, date)
);

create index if not exists availability_date_idx on availability (date);
create index if not exists availability_exp_idx  on availability (experience_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 7 — deferred foreign keys (tables now exist)
-- ─────────────────────────────────────────────────────────────────────────────

-- user_roles → concierges
alter table user_roles
  add constraint user_roles_concierge_id_fkey
  foreign key (concierge_id) references concierges(id);

-- bookings → concierges
alter table bookings
  add constraint bookings_concierge_id_fkey
  foreign key (concierge_id) references concierges(id);

-- commissions → concierges
alter table commissions
  add constraint commissions_concierge_id_fkey
  foreign key (concierge_id) references concierges(id);

-- commissions → payouts
alter table commissions
  add constraint commissions_payout_id_fkey
  foreign key (payout_id) references payouts(id);

-- ripples_ledger → redemptions
alter table ripples_ledger
  add constraint ripples_ledger_redemption_id_fkey
  foreign key (redemption_id) references redemptions(id);


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 8 — Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

-- ── concierges ───────────────────────────────────────────────────────────────

alter table concierges enable row level security;

-- Concierge can read and update their own record only
create policy "concierge read own record"
  on concierges for select to authenticated
  using (user_id = auth.uid());

create policy "concierge update own record"
  on concierges for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Partner (property login) can see concierges at their own property — but NOT Ripples fields
-- (Full row visible via RLS; column-level privacy is enforced in app.js by not querying
--  ripples_* columns in partner-role queries)
create policy "partner read own property concierges"
  on concierges for select to authenticated
  using (get_my_role() = 'partner' and partner_id = get_my_partner_id());

-- Admin full access
create policy "admin all concierges"
  on concierges for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');


-- ── payouts ──────────────────────────────────────────────────────────────────

alter table payouts enable row level security;

-- Partner (property login) can read their own payouts
create policy "partner read own payouts"
  on payouts for select to authenticated
  using (get_my_role() = 'partner' and partner_id = get_my_partner_id());

-- Concierge cannot see payouts at all (no policy granted)

-- Admin full access
create policy "admin all payouts"
  on payouts for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');


-- ── ripples_ledger ───────────────────────────────────────────────────────────

alter table ripples_ledger enable row level security;

-- Concierge can only read their own ledger
create policy "concierge read own ripples ledger"
  on ripples_ledger for select to authenticated
  using (concierge_id = get_my_concierge_id());

-- Partner (property login) cannot see Ripples ledger at all (no policy granted)

-- Admin full access
create policy "admin all ripples ledger"
  on ripples_ledger for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');


-- ── redemptions ──────────────────────────────────────────────────────────────

alter table redemptions enable row level security;

-- Concierge can submit redemption requests and read their own
create policy "concierge insert redemption"
  on redemptions for insert to authenticated
  with check (get_my_role() = 'concierge' and concierge_id = get_my_concierge_id());

create policy "concierge read own redemptions"
  on redemptions for select to authenticated
  using (concierge_id = get_my_concierge_id());

-- Partner (property login) cannot see redemptions (no policy granted)

-- Admin full access
create policy "admin all redemptions"
  on redemptions for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');


-- ── availability ─────────────────────────────────────────────────────────────

alter table availability enable row level security;

-- Anyone authenticated (partner, concierge) can read availability
create policy "authenticated read availability"
  on availability for select to authenticated
  using (true);

-- Admin full access
create policy "admin all availability"
  on availability for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');


-- ── commissions — extend existing RLS ────────────────────────────────────────
-- (RLS already enabled in 01-rls.sql; add partner-read policy)

create policy "partner read own commissions"
  on commissions for select to authenticated
  using (get_my_role() = 'partner' and partner_id = get_my_partner_id());

-- Concierge cannot see commissions (no policy granted)


-- ── bookings — extend existing RLS for partner + concierge ───────────────────

-- Partner can read all bookings from their property
create policy "partner read own bookings"
  on bookings for select to authenticated
  using (get_my_role() = 'partner' and partner_id = get_my_partner_id());

-- Partner can insert new bookings (booking requests)
create policy "partner insert booking"
  on bookings for insert to authenticated
  with check (
    get_my_role() in ('partner','concierge')
    and partner_id = get_my_partner_id()
    and source = 'partner_pwa'
  );

-- Concierge can read bookings they personally submitted
create policy "concierge read own submitted bookings"
  on bookings for select to authenticated
  using (get_my_role() = 'concierge' and concierge_id = get_my_concierge_id());


-- ── partners — read access for partner + concierge ───────────────────────────

-- Partner can read their own property record
create policy "partner read own property"
  on partners for select to authenticated
  using (get_my_role() = 'partner' and id = get_my_partner_id());

-- Concierge can read their own property record (name only — no financial columns queried in app)
create policy "concierge read own property"
  on partners for select to authenticated
  using (get_my_role() = 'concierge' and id = get_my_partner_id());


-- ── experiences — read access for partner + concierge ────────────────────────

-- Partner and concierge can read all Live and Coming Soon experiences
create policy "partner read live experiences"
  on experiences for select to authenticated
  using (
    get_my_role() in ('partner','concierge')
    and status in ('live','coming_soon')
  );


-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 9 — Tier auto-compute function
-- Called manually in TMS at month start (Phase 6 expansion).
-- Records trailing confirmed bookings for each partner and locks tier.
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function compute_partner_tiers()
returns void language plpgsql security definer as $$
declare
  rec record;
  vol integer;
  tier text;
  rate numeric;
begin
  for rec in select id from partners where status = 'active' loop
    -- Count confirmed bookings in the prior calendar month
    select count(*) into vol
    from bookings
    where partner_id = rec.id
      and status in ('confirmed','balance_due','paid_in_full','completed')
      and created_at >= date_trunc('month', now() - interval '1 month')
      and created_at <  date_trunc('month', now());

    -- Resolve tier
    if vol >= 13 then
      tier := 'elite';    rate := 18.00;
    elsif vol >= 6 then
      tier := 'preferred'; rate := 15.00;
    else
      tier := 'standard';  rate := 12.00;
    end if;

    -- Manual override takes precedence
    update partners
    set commission_tier    = tier,
        commission_rate    = coalesce(commission_rate_override, rate),
        tier_locked_at     = current_date,
        bookings_count     = bookings_count + vol
    where id = rec.id;
  end loop;
end;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- Notes for operator
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. New partners start at Standard (12%) until compute_partner_tiers() runs.
--    Call this function from TMS at the start of each month (Phase 6 button).
-- 2. concierge_id in user_roles must be populated when a concierge account is created.
--    Pattern: INSERT into concierges first → use returned id → INSERT into user_roles.
-- 3. ripples_ledger rows are written by the TMS/Edge Function when a booking is
--    confirmed, not by the Partner PWA directly.
-- 4. experiences.ripples_awarded defaults: kayak=50, canoe=100, proposal=150, occasion=150.
--    Update these via TMS or SQL if needed.
-- ─────────────────────────────────────────────────────────────────────────────
