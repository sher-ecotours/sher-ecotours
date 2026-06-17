-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Eco Sanctuary — Experience Catalogue Seed
-- 19 experiences across 5 categories
-- Source of truth: SHER Master Build Briefing v1.0
-- Run AFTER 01-rls.sql
--
-- IMPORTANT: All experience names are brand-protected.
-- No variation in spelling, capitalisation, or punctuation is permitted.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Category 1 — Bay Kayak Tours ──────────────────────────────────────────────

insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  public_price_usd, max_capacity, min_guests, duration_minutes,
  departure_time, deposit_percent, concierge_points, active
) values
  (1, 'Golden Mirror',           'Bay Kayak Tours', 'live',   'standard', 'per_person', 175,  6, 1, 120, '05:30',    30, 50, true),
  (2, 'Calm Reflections',        'Bay Kayak Tours', 'live',   'standard', 'per_person', 150,  6, 1, 120, '09:00',    30, 50, true),
  (3, 'Sunset Paddle',           'Bay Kayak Tours', 'future', 'standard', 'per_person', null, 6, 1, 120, '17:00',    30, 50, true),
  (4, 'School / Group Eco Tour', 'Bay Kayak Tours', 'future', 'standard', 'per_group',  null,20, 8, 150, 'Flexible', 30, 50, true);

-- ── Category 2 — Canoe Experiences ───────────────────────────────────────────

insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  public_price_usd, max_capacity, min_guests, duration_minutes,
  departure_time, deposit_percent, concierge_points, active
) values
  (5, 'Scorpio''s Secret',          'Canoe Experiences', 'live',   'standard', 'per_couple', 420,  2, 2, 150, 'Flexible', 30, 100, true),
  (6, 'Glide — Leisure Canoe Ride', 'Canoe Experiences', 'future', 'standard', 'per_person', null, 4, 1,  90, 'Flexible', 30, 100, true);

-- ── Category 3 — The Proposal Collection ─────────────────────────────────────

insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  max_capacity, min_guests, departure_time, occasion_type,
  deposit_percent, concierge_points, active
) values
  (7, 'First Light Proposal', 'The Proposal Collection', 'coming_soon', 'bespoke', 'by_arrangement', 2, 2, 'Flexible', 'proposal',   50, 150, true),
  (8, 'Renewal on the Water', 'The Proposal Collection', 'coming_soon', 'bespoke', 'by_arrangement', 2, 2, 'Flexible', 'rekindle',   50, 150, true),
  (9, 'Royal Sanctuary',      'The Proposal Collection', 'coming_soon', 'bespoke', 'by_enquiry',     2, 2, 'Sunset',   'remarriage', 50, 150, true);

-- ── Category 4 — The Occasion Collection ─────────────────────────────────────

insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  max_capacity, min_guests, departure_time, occasion_type,
  deposit_percent, concierge_points, active
) values
  (10, 'Honeymoon on the Bay', 'The Occasion Collection', 'coming_soon', 'bespoke', 'by_arrangement', 2, 2, 'Flexible', 'honeymoon',  50, 150, true),
  (11, 'Our Day',              'The Occasion Collection', 'coming_soon', 'bespoke', 'by_arrangement', 4, 2, 'Flexible', 'anniversary',50, 150, true),
  (12, 'Another Orbit',        'The Occasion Collection', 'coming_soon', 'bespoke', 'by_arrangement', 6, 2, 'Flexible', 'birthday',   50, 150, true),
  (13, 'New Life',             'The Occasion Collection', 'coming_soon', 'bespoke', 'by_arrangement', 6, 2, 'Flexible', 'new_life',   50, 150, true);

-- ── Category 5 — Cultural & Eco Immersion ────────────────────────────────────

-- Table d'Eau: parent record — not directly bookable (is_parent = true)
insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  is_parent, deposit_percent, concierge_points, active
) values
  (14, 'Table d''Eau', 'Cultural & Eco Immersion', 'future', 'bespoke', 'by_arrangement', true, 50, 50, true);

-- L'Aube and L'Estuaire: children of Table d'Eau
insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  departure_time, parent_experience_id, deposit_percent, concierge_points, active
) values
  (15, 'L''Aube',     'Cultural & Eco Immersion', 'future', 'bespoke', 'per_cover', 'Sunrise',
   (select id from experiences where name = 'Table d''Eau'), 50, 50, true),
  (16, 'L''Estuaire', 'Cultural & Eco Immersion', 'future', 'bespoke', 'per_cover', 'Dusk',
   (select id from experiences where name = 'Table d''Eau'), 50, 50, true);

-- Standalone Cultural & Eco experiences
insert into experiences (
  sort_order, name, category, status, booking_flow, pricing_model,
  departure_time, deposit_percent, concierge_points, active
) values
  (17, 'Mangrove Immersion Trail', 'Cultural & Eco Immersion', 'future', 'standard', 'per_person', 'Flexible', 30, 50, true),
  (18, 'Sea Moss Experience',      'Cultural & Eco Immersion', 'future', 'standard', 'per_person', 'Flexible', 30, 50, true),
  (19, 'Private Bay Charter',      'Cultural & Eco Immersion', 'future', 'bespoke',  'flat_rate',  'Flexible', 50, 50, true);

-- ── Verification ──────────────────────────────────────────────────────────────
-- After running, confirm with:
-- select sort_order, name, category, status from experiences order by sort_order;
-- Expected: 19 rows
