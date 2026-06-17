-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Eco Sanctuary — Supabase Schema v1.0
-- Project: hvxqettaonfxmmntrsmd.supabase.co
-- Run in order: 00-schema.sql → 01-rls.sql → 02-seed.sql → 03-equipment-seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Clean slate (safe to re-run) ──────────────────────────────────────────────
drop table if exists conservation_contributions  cascade;
drop table if exists feedback                     cascade;
drop table if exists waivers                      cascade;
drop table if exists guide_post_tour_resets       cascade;
drop table if exists guide_incidents              cascade;
drop table if exists guide_equipment_inspections  cascade;
drop table if exists guide_morning_logs           cascade;
drop table if exists staff_schedule               cascade;
drop table if exists equipment                    cascade;
drop table if exists commissions                  cascade;
drop table if exists blocked_dates                cascade;
drop table if exists waitlist                     cascade;
drop table if exists bookings                     cascade;
drop table if exists guests                       cascade;
drop table if exists partners                     cascade;
drop table if exists experiences                  cascade;
drop table if exists user_roles                   cascade;
drop table if exists enquiries                    cascade;
drop table if exists today_bookings               cascade;

drop sequence  if exists booking_seq;
drop function  if exists generate_booking_ref();
drop function  if exists get_my_role();
drop function  if exists get_my_partner_id();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 1 — user_roles
-- Created first so helper functions can reference it.
-- Roles: admin (operator), guide (field staff), partner (hotels/guesthouses)
-- ─────────────────────────────────────────────────────────────────────────────

create table user_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null check (role in ('admin', 'guide', 'partner')),
  partner_id uuid,                          -- populated for partner users only
  created_at timestamptz default now()
);

-- ─────────────────────────────────────────────────────────────────────────────
-- HELPER FUNCTIONS
-- Defined after user_roles so Postgres can validate the function bodies.
-- ─────────────────────────────────────────────────────────────────────────────

create sequence booking_seq start 1;

-- Generates SHER-YYYY-NNNN reference numbers
create or replace function generate_booking_ref()
returns text language sql as $$
  select 'SHER-' || extract(year from now())::int::text
         || '-' || lpad(nextval('booking_seq')::text, 4, '0')
$$;

-- Returns the role of the currently authenticated user (server-side only)
create or replace function get_my_role()
returns text language sql security definer stable as $$
  select role from user_roles where user_id = auth.uid()
$$;

-- Returns the partner_id of the currently authenticated partner user
create or replace function get_my_partner_id()
returns uuid language sql security definer stable as $$
  select partner_id from user_roles where user_id = auth.uid()
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 2 — experiences
-- The product catalogue. 19 experiences across 5 categories.
-- Names are brand-protected — seeded exactly once in 02-seed.sql.
-- ─────────────────────────────────────────────────────────────────────────────

create table experiences (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  sort_order           int         unique not null,
  name                 text        not null unique,
  category             text        not null,
  status               text        not null check (status in ('live', 'future', 'coming_soon')),
  booking_flow         text        not null check (booking_flow in ('standard', 'bespoke')),
  pricing_model        text        not null,  -- per_person / per_couple / per_group /
                                              -- per_cover / flat_rate / by_arrangement / by_enquiry
  public_price_usd     numeric,               -- null for future/bespoke
  partner_price_usd    numeric,               -- null until partner pricing is set
  resident_price_xcd   numeric,               -- 30% reduction for Saint Lucian nationals
  max_capacity         int,
  min_guests           int         not null default 1,
  duration_minutes     int,                   -- null for bespoke
  departure_time       text,                  -- 05:30 / 09:00 / 17:00 / Flexible / Sunset / Bespoke
  occasion_type        text,                  -- proposal / rekindle / remarriage /
                                              -- honeymoon / anniversary / birthday / new_life
  deposit_percent      int         not null default 30,  -- 30 standard, 50 bespoke
  concierge_points     int         not null default 50,  -- points earned by partner per booking
  islet_landing        bool        not null default false,
  celebration_kit      bool        not null default false,
  is_parent            bool        not null default false,  -- true for Table d'Eau only
  parent_experience_id uuid        references experiences(id),
  refreshment_profile  text,
  variable_cost_usd    numeric,
  active               bool        not null default true
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 3 — guests
-- Guest CRM. Created when an enquiry is confirmed.
-- ─────────────────────────────────────────────────────────────────────────────

create table guests (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  full_name         text        not null,
  email             text        unique,
  whatsapp_phone    text,
  nationality       text,
  first_visit_date  date,
  total_visits      int         not null default 0,
  total_spend_usd   numeric     not null default 0,
  active_credit_usd numeric     not null default 0,  -- Mystic Morning credits
  credit_expires_at timestamptz,
  marketing_consent bool        not null default false,
  notes             text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 4 — partners
-- Hotel and guesthouse register.
-- ─────────────────────────────────────────────────────────────────────────────

create table partners (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  name              text        not null,
  type              text,                    -- Luxury resort / Boutique hotel / Villa manager /
                                             -- Wellness retreat / Driver
  contact_name      text,
  contact_email     text,
  contact_whatsapp  text,
  commission_rate   numeric,                 -- percentage
  commission_method text,                    -- invoice_deduction / direct_payment
  date_onboarded    date,
  fam_tour_taken    bool        not null default false,
  fam_tour_date     date,
  status            text        not null default 'active'
                      check (status in ('active', 'inactive', 'paused')),
  notes             text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 5 — bookings
-- Single unified table from first enquiry through completion.
-- Status flow: enquiry → qualified → confirmed → completed → cancelled/deferred
-- Source: website (public) or partner (Partner PWA)
-- ─────────────────────────────────────────────────────────────────────────────

create table bookings (
  id                     uuid        primary key default gen_random_uuid(),
  created_at             timestamptz default now(),
  booking_ref            text        unique default generate_booking_ref(),
  status                 text        not null default 'enquiry'
                           check (status in ('enquiry','qualified','confirmed',
                                             'completed','cancelled','deferred')),
  source                 text        not null default 'website'
                           check (source in ('website','partner','walk_in','phone')),

  -- Experience & scheduling
  experience_id          uuid        references experiences(id),
  booking_date           date,
  departure_time         text,
  group_size             int,
  occasion_type          text,
  special_requirements   text,

  -- Guest identity (captured at enquiry, before guest record exists)
  lead_name              text        not null,
  lead_email             text        not null,
  lead_phone             text,
  nationality            text,
  how_heard              text,
  date_flexibility       text,
  preferred_dates        text[],              -- up to 3 preferred dates

  -- Guest CRM record (linked when enquiry is confirmed)
  guest_id               uuid        references guests(id),

  -- Partner (populated for source = 'partner')
  partner_id             uuid        references partners(id),

  -- Revenue
  revenue_usd            numeric,
  partner_commission_usd numeric,
  net_revenue_usd        numeric,
  payment_status         text        not null default 'unpaid'
                           check (payment_status in ('unpaid','deposit','paid')),
  payment_ref            text,                -- FYGARO reference

  -- Operations
  guide_assigned         text,
  waiver_status          text        not null default 'not_sent'
                           check (waiver_status in ('not_sent','sent','signed')),
  weather_condition      text,
  gift_issued            text,
  conservation_xcd       numeric,
  feedback_rating        int         check (feedback_rating between 1 and 5),
  notes                  text,

  -- Timestamps
  confirmed_at           timestamptz,
  completed_at           timestamptz,
  response_sent_at       timestamptz
);

create index bookings_date_idx       on bookings (booking_date);
create index bookings_status_idx     on bookings (status);
create index bookings_partner_idx    on bookings (partner_id);
create index bookings_guest_idx      on bookings (guest_id);
create index bookings_experience_idx on bookings (experience_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 6 — commissions
-- One row per confirmed booking that has a partner referral.
-- ─────────────────────────────────────────────────────────────────────────────

create table commissions (
  id                      uuid        primary key default gen_random_uuid(),
  created_at              timestamptz default now(),
  booking_id              uuid        not null references bookings(id),
  partner_id              uuid        not null references partners(id),
  amount_usd              numeric     not null,
  concierge_points_earned int         not null default 0,
  status                  text        not null default 'pending'
                            check (status in ('pending', 'paid')),
  paid_at                 timestamptz,
  notes                   text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 7 — blocked_dates
-- Prevents bookings on closed/blocked days.
-- experience_id null = all experiences blocked on that date.
-- ─────────────────────────────────────────────────────────────────────────────

create table blocked_dates (
  id            uuid        primary key default gen_random_uuid(),
  created_at    timestamptz default now(),
  date          date        not null,
  experience_id uuid        references experiences(id),
  reason        text,
  created_by    uuid        references auth.users(id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 8 — waivers
-- Pre-tour health and liability declaration (Form 3).
-- Submitted by guest via link in booking confirmation email.
-- ─────────────────────────────────────────────────────────────────────────────

create table waivers (
  id                       uuid        primary key default gen_random_uuid(),
  created_at               timestamptz default now(),
  booking_id               uuid        not null references bookings(id),
  guest_name               text        not null,
  booking_date             date,
  swimming_ability         text,
  weight_range             text,
  medical_conditions       text,
  pregnancy                bool,
  emergency_contact_name   text,
  emergency_contact_phone  text,
  liability_acknowledged   bool        not null default false,
  conservation_code_agreed bool        not null default false,
  photography_consent      bool        not null default false
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 9 — feedback
-- Post-tour feedback (Form 5). Sent 3 hours after experience concludes.
-- ─────────────────────────────────────────────────────────────────────────────

create table feedback (
  id                     uuid        primary key default gen_random_uuid(),
  created_at             timestamptz default now(),
  booking_id             uuid        not null references bookings(id),
  overall_rating         int         check (overall_rating between 1 and 5),
  memorable_moment       text,
  guide_rating           text,
  weather_delivered      text,
  mystic_morning_feeling text,
  would_return           text,
  would_recommend        text,
  suggestions            text,
  share_consent          text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 10 — waitlist
-- Guests who cannot find a suitable date (Form 2).
-- ─────────────────────────────────────────────────────────────────────────────

create table waitlist (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  full_name         text        not null,
  email_address     text        not null,
  whatsapp_phone    text,
  experience_id     uuid        references experiences(id),
  available_from    date,
  available_until   date,
  days_preferred    text[],
  time_preferred    text,
  occasion          text,
  flexibility_level text,
  notes             text,
  status            text        not null default 'active'
                      check (status in ('active', 'contacted', 'booked', 'expired'))
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 11 — staff_schedule
-- Guide assignments per day. Replaces the GAS 5 AM sync.
-- ─────────────────────────────────────────────────────────────────────────────

create table staff_schedule (
  id             uuid        primary key default gen_random_uuid(),
  created_at     timestamptz default now(),
  date           date        not null,
  guide_user_id  uuid        references auth.users(id),
  guide_name     text        not null,
  role           text,                    -- Lead Guide / Supporting Guide / Celebration Coordinator
  experience_ids uuid[],
  departure_time text,
  briefing_notes text,
  occasion_type  text,
  completed      bool        not null default false,
  hours_worked   numeric,
  notes          text
);

create index staff_schedule_date_idx on staff_schedule (date);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 12 — equipment
-- Physical equipment register.
-- ─────────────────────────────────────────────────────────────────────────────

create table equipment (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  equipment_label      text        not null unique,  -- GT-01, GT-02, LG-01, SG-01, RD-01…
  name                 text        not null,
  type                 text,                         -- Tandem kayak / Guide kayak /
                                                     -- Rescue dinghy / PFD / Paddle
  condition            text        not null default 'Good'
                         check (condition in ('Excellent','Good','Needs attention','Out of service')),
  last_inspection_date date,
  next_inspection_due  date,
  maintenance_notes    text,
  retired_date         date,
  active               bool        not null default true
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 13 — guide_morning_logs (Form 6)
-- Filed by lead guide before or immediately after each experience.
-- Feeds the weather log, triggers conservation contribution if Mystic Morning.
-- ─────────────────────────────────────────────────────────────────────────────

create table guide_morning_logs (
  id                     uuid        primary key default gen_random_uuid(),
  created_at             timestamptz default now(),
  guide_user_id          uuid        references auth.users(id),
  booking_id             uuid        references bookings(id),
  experience_delivered   text,
  sky_condition          text,
  experience_mode        text,        -- Golden Mirror / Mystic Morning / Calm Reflections / Modified / Cancelled
  number_of_guests       text,
  mystic_bundle_issued   text,
  water_condition        text,
  wildlife_observation   text,
  equipment_condition    text,
  equipment_notes        text,
  guest_mood             text,
  guide_notes            text,
  conservation_triggered bool        not null default false
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 14 — guide_equipment_inspections (Form 7)
-- ─────────────────────────────────────────────────────────────────────────────

create table guide_equipment_inspections (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  guide_user_id        uuid        references auth.users(id),
  guide_name           text,
  inspection_date      text,
  kayak_gt01           text,
  kayak_gt02           text,
  kayak_lg01           text,
  kayak_sg01           text,
  rd_hull              text,
  rd_fittings          text,
  rd_motor_mount       text,
  rd_motor_test        text,
  rd_battery_charge    text,
  rd_battery_terminals text,
  pfds_checked         text,
  first_aid_kit        text,
  safety_equipment     text,
  communication_device text,
  paddles              text,
  refreshment_kit      text,
  bay_conditions       text,
  launch_area          text,
  any_item_flagged     text,
  inspection_notes     text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 15 — guide_incidents (Form 8)
-- ─────────────────────────────────────────────────────────────────────────────

create table guide_incidents (
  id                uuid        primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
  guide_user_id     uuid        references auth.users(id),
  incident_level    text,
  incident_type     text,
  incident_datetime text,
  guide_name        text,
  location          text,
  description       text,
  guests_involved   text,
  guest_names       text,
  immediate_action  text,
  medical_attention text,
  external_services text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 16 — guide_post_tour_resets (Form 9)
-- ─────────────────────────────────────────────────────────────────────────────

create table guide_post_tour_resets (
  id                   uuid        primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  guide_user_id        uuid        references auth.users(id),
  guide_name           text,
  experience_delivered text,
  guests_returned      text,
  equipment_stowed     text,
  kayaks_secured       text,
  pfds_stored          text,
  launch_cleared       text,
  access_secured       text,
  guest_mood           text,
  lost_property_found  text,
  lost_property_desc   text,
  guide_notes          text
);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 17 — conservation_contributions
-- PSEPA Stewardship Fund tracker.
-- Auto-created by Edge Function when morning log mode = Mystic Morning.
-- ─────────────────────────────────────────────────────────────────────────────

create table conservation_contributions (
  id                       uuid        primary key default gen_random_uuid(),
  created_at               timestamptz default now(),
  booking_id               uuid        references bookings(id),
  morning_log_id           uuid        references guide_morning_logs(id),
  contribution_type        text        not null
                             check (contribution_type in ('mystic_morning','voluntary','corporate')),
  amount_xcd               numeric     not null,
  guest_names              text,
  certificate_issued       bool        not null default false,
  transfer_date            date,
  acknowledgement_received bool        not null default false
);
