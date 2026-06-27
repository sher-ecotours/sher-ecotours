-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Eco Sanctuary — Staff Forms Migration
-- Run AFTER 03-equipment-seed.sql
-- Adds: medical_reports (nurse), photography_sessions (photographer)
-- ─────────────────────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 18 — medical_reports
-- Filed by the nurse for any health incident involving guests or staff.
-- Separate from guide_incidents which covers operational/safety events.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists medical_reports (
  id                       uuid        primary key default gen_random_uuid(),
  created_at               timestamptz default now(),
  nurse_user_id            uuid        references auth.users(id),
  booking_id               uuid        references bookings(id),

  -- Patient
  patient_name             text        not null,
  patient_type             text        not null check (patient_type in ('guest','staff','visitor')),
  date_of_incident         text,
  time_of_incident         text,
  location                 text,

  -- Clinical
  chief_complaint          text,
  symptoms                 text,
  vital_signs              text,        -- free text: BP, pulse, SpO2, temp
  medical_history_relevant text,        -- any known conditions from waiver or verbal
  treatment_given          text,
  medications_administered text,

  -- Outcome
  outcome                  text        check (outcome in (
                             'treated_on_site','referred_to_clinic',
                             'hospitalized','no_action_required','other'
                           )),
  outcome_notes            text,
  follow_up_required       bool        not null default false,
  follow_up_notes          text,
  external_services        text,        -- ambulance, hospital name, etc.

  -- Sign-off
  nurse_name               text,
  nurse_notes              text
);

create index medical_reports_booking_idx on medical_reports (booking_id);
create index medical_reports_date_idx    on medical_reports (created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE 19 — photography_sessions
-- Filed by the photographer before or during a tour.
-- Captures guest background, occasion, shot list, and delivery instructions.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists photography_sessions (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz default now(),
  photographer_user_id uuid       references auth.users(id),
  booking_id          uuid        references bookings(id),

  -- Guest profile
  guest_names         text        not null,
  guest_origin        text,        -- where they are from
  how_they_found_sher text,        -- referral, Instagram, hotel, etc.
  group_composition   text,        -- couple, family, solo, group

  -- Occasion
  occasion            text,        -- proposal, anniversary, honeymoon, birthday, etc.
  occasion_details    text,        -- specific story or context
  mood_tone           text,        -- romantic, adventurous, serene, playful

  -- Preferences
  style_preferences   text,        -- candid, posed, documentary, dramatic
  must_have_shots     text,        -- non-negotiable shots requested
  avoid              text,        -- anything to avoid
  special_props      text,        -- ring box, flowers, signage, etc.

  -- Shot list
  shot_list           text,        -- full ordered shot list

  -- Delivery
  delivery_format     text        check (delivery_format in (
                        'digital_download','usb','both','print_package'
                      )),
  delivery_deadline   text,
  delivery_notes      text,

  -- Notes
  photographer_notes  text
);

create index photography_sessions_booking_idx on photography_sessions (booking_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — medical_reports
-- ─────────────────────────────────────────────────────────────────────────────

alter table medical_reports enable row level security;

create policy "guide insert medical report"
  on medical_reports for insert to authenticated
  with check (get_my_role() = 'guide' and nurse_user_id = auth.uid());

create policy "guide read own medical reports"
  on medical_reports for select to authenticated
  using (get_my_role() = 'guide' and nurse_user_id = auth.uid());

create policy "admin all medical reports"
  on medical_reports for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — photography_sessions
-- ─────────────────────────────────────────────────────────────────────────────

alter table photography_sessions enable row level security;

create policy "guide insert photography session"
  on photography_sessions for insert to authenticated
  with check (get_my_role() = 'guide' and photographer_user_id = auth.uid());

create policy "guide read own photography sessions"
  on photography_sessions for select to authenticated
  using (get_my_role() = 'guide' and photographer_user_id = auth.uid());

create policy "admin all photography sessions"
  on photography_sessions for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');
