-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Eco Sanctuary — Equipment Register Seed
-- Known fleet items from guide operations
-- Run AFTER 02-seed.sql
-- Add or update equipment via the TMS Equipment screen going forward.
-- ─────────────────────────────────────────────────────────────────────────────

insert into equipment (equipment_label, name, type, condition, active) values
  -- Guest tandem kayaks
  ('GT-01', 'Guest Tandem Kayak 1',    'Tandem kayak', 'Good', true),
  ('GT-02', 'Guest Tandem Kayak 2',    'Tandem kayak', 'Good', true),

  -- Guide kayaks
  ('LG-01', 'Lead Guide Kayak',        'Guide kayak',  'Good', true),
  ('SG-01', 'Supporting Guide Kayak',  'Guide kayak',  'Good', true),

  -- Rescue dinghy
  ('RD-01', 'Rescue Dinghy',           'Rescue dinghy','Good', true),

  -- Safety equipment (tracked as items, not per-unit)
  ('PFD-SET', 'PFD Set (full fleet)',  'PFD',          'Good', true),
  ('PAD-SET', 'Paddle Set (full fleet)','Paddle',      'Good', true),
  ('FAK-01',  'First Aid Kit',         'Safety',       'Good', true),
  ('COM-01',  'Communication Device',  'Safety',       'Good', true);
