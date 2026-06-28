-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Sanctuary Experiences — Ripples Awarded Seed Values
-- Run AFTER 05-partner-schema.sql
-- Sets correct SHER Ripples per booking category.
-- The seed default of 50 is correct for kayak and cultural.
-- Canoe, proposal, and occasion categories need updating per Section 5.3.
-- ─────────────────────────────────────────────────────────────────────────────

update experiences set ripples_awarded = 100
  where category = 'canoe';

update experiences set ripples_awarded = 150
  where category in ('proposal', 'occasion');

-- kayak (50) and cultural (50) already correct — no update needed
