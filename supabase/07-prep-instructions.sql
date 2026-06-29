-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 07 — Tour Preparation Instructions field on bookings
-- Run in Supabase SQL editor   ▸  Role: postgres
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds two columns to bookings:
--   prep_instructions          text, nullable
--     Free-text operational instructions written by TMS admin at any point
--     before the tour. Editable live; guide always sees the latest version.
--     Distinct from occasion_notes (set at booking time) and
--     special_requirements (supplied by partner). This is SHER ops speaking
--     to the guide directly — stock availability, substitutions, specific
--     setup instructions, last-minute changes.
--
--   prep_instructions_updated_at  timestamptz, nullable
--     Stamped every time prep_instructions is saved. Shown to the guide so
--     they can see if instructions changed recently (e.g. updated at 07:45
--     the morning of the tour signals something important changed).
-- ─────────────────────────────────────────────────────────────────────────────

alter table bookings
  add column if not exists prep_instructions            text,
  add column if not exists prep_instructions_updated_at timestamptz;

-- Verify
select column_name, data_type, is_nullable
from   information_schema.columns
where  table_name = 'bookings'
  and  column_name in ('prep_instructions','prep_instructions_updated_at')
order  by column_name;
