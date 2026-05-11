-- ── SHER Guide PWA — Supabase Database Setup ─────────────────────────────────
-- Run this entire script once in the Supabase SQL editor (SQL → New query)
-- Project: SHER TMA PWA · https://zbklfuhsmnmcwcqcpdxk.supabase.co

-- ── 1. Guide Morning Logs (Form 6) ───────────────────────────────────────────

create table guide_morning_logs (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz default now(),
  experience_delivered  text,
  sky_condition         text,
  experience_mode       text,
  number_of_guests      text,
  mystic_bundle_issued  text,
  water_condition       text,
  wildlife_observation  text,
  equipment_condition   text,
  equipment_notes       text,
  guest_mood            text,
  guide_notes           text
);

alter table guide_morning_logs enable row level security;

create policy "anon insert morning logs"
  on guide_morning_logs for insert to anon with check (true);

-- ── 2. Equipment Inspections (Form 7) ────────────────────────────────────────

create table guide_equipment_inspections (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
  guide_name           text,
  inspection_date      text,
  -- Guest kayaks
  kayak_gt01           text,
  kayak_gt02           text,
  -- Guide kayaks
  kayak_lg01           text,
  kayak_sg01           text,
  -- Rescue dinghy
  rd_hull              text,
  rd_fittings          text,
  rd_motor_mount       text,
  rd_motor_test        text,
  rd_battery_charge    text,
  rd_battery_terminals text,
  -- Safety & launch
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

alter table guide_equipment_inspections enable row level security;

create policy "anon insert equipment inspections"
  on guide_equipment_inspections for insert to anon with check (true);

create policy "anon read equipment inspections"
  on guide_equipment_inspections for select to anon using (true);

-- ── 3. Incident Reports (Form 8) ─────────────────────────────────────────────

create table guide_incidents (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz default now(),
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

alter table guide_incidents enable row level security;

create policy "anon insert incidents"
  on guide_incidents for insert to anon with check (true);

-- ── 4. Post-Tour Resets (Form 9) ─────────────────────────────────────────────

create table guide_post_tour_resets (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz default now(),
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

alter table guide_post_tour_resets enable row level security;

create policy "anon insert post tour resets"
  on guide_post_tour_resets for insert to anon with check (true);

-- ── 5. Website Enquiries ──────────────────────────────────────────────────────

create table enquiries (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz default now(),
  full_name        text,
  email_address    text,
  whatsapp_phone   text,
  experience       text,
  preferred_date   text,
  number_of_guests text,
  special_occasion text,
  how_heard        text,
  notes            text
);

alter table enquiries enable row level security;

create policy "anon insert enquiries"
  on enquiries for insert to anon with check (true);

-- ── 6. Website Waitlist ───────────────────────────────────────────────────────

create table waitlist (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz default now(),
  full_name          text,
  email_address      text,
  whatsapp_phone     text,
  available_from     text,
  available_until    text,
  experience         text,
  contact_preference text
);

alter table waitlist enable row level security;

create policy "anon insert waitlist"
  on waitlist for insert to anon with check (true);

-- ── 7. Today's Bookings (ops-managed via Supabase dashboard) ─────────────────

create table today_bookings (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz default now(),
  booking_date text not null,
  guest_name   text,
  experience   text,
  departure    text,
  group_size   text,
  occasion     text,
  notes        text
);

alter table today_bookings enable row level security;

create policy "anon read today bookings"
  on today_bookings for select to anon using (true);

create policy "anon insert today bookings"
  on today_bookings for insert to anon with check (true);

create policy "anon delete today bookings"
  on today_bookings for delete to anon using (true);

-- ── Done ──────────────────────────────────────────────────────────────────────
-- After running, verify all 7 tables appear in the Table Editor.
-- today_bookings allows anon select/insert/delete — written by GAS sync only.
-- All other tables allow anon insert only (guide app + website forms).
