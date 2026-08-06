-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Eco Sanctuary — La Collection Papiyon
-- Migration 08: cottage_collection table + seed
-- Source of truth: /data/collection-papiyon.json
-- Run AFTER 07-prep-instructions.sql
--
-- IMPORTANT: All cottage names and species data are brand-controlled.
-- No variation in spelling, diacritics, capitalisation or punctuation is permitted.
-- The canonical record is /data/collection-papiyon.json.
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop and recreate (safe to re-run)
drop table if exists cottage_collection cascade;

create table cottage_collection (
  ref               text        primary key,          -- C-01 … C-10
  signature_name    text        not null,             -- e.g. "Le Polydamas"
  common_name       text        not null,             -- e.g. "Polydamas Swallowtail"
  scientific_name   text        not null,             -- e.g. "Battus polydamas lucianus"
  slug              text        unique not null,      -- e.g. "le-polydamas"
  saint_lucia_status text       not null,
  is_signature      boolean     not null default false,
  signature_note    text,                             -- populated for C-06 only
  colour_token      text        not null,             -- hex e.g. "#C9A22A"
  for_sale          boolean     not null default true,
  sher_retained     boolean     not null default false,
  phase             text,                             -- "Phase 1" / null for retained
  image_refs        jsonb       not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);

comment on table cottage_collection is
  'Canonical record for La Collection Papiyon. Do not hardcode cottage names on any surface — read from this table. Source: /data/collection-papiyon.json';

-- ── Seed ──────────────────────────────────────────────────────────────────────

insert into cottage_collection
  (ref, signature_name, common_name, scientific_name, slug,
   saint_lucia_status, is_signature, signature_note, colour_token,
   for_sale, sher_retained, phase)
values
  ('C-01', 'Le Damier d''Orcus',   'Orcus Checkered-Skipper', 'Burnsius orcus',
   'le-damier-d-orcus',   'recorded',                  false, null,
   '#3D2B1F', true,  false, 'Phase 1'),

  -- C-02 replaces "La Blanche de Cuba" (Cuban White / Ganyra menciae) retired Rev B.
  -- G. menciae is a Cuban species with only a stray Saint Lucia record.
  ('C-02', 'La Malachite',         'Malachite',               'Siproeta stelenes',
   'la-malachite',         'resident',                  false, null,
   '#2E7D45', true,  false, 'Phase 1'),

  ('C-03', 'La Flamme Dorée',      'Fiery Skipper',           'Hylephila phyleus',
   'la-flamme-doree',      'recorded',                  false, null,
   '#E06820', true,  false, 'Phase 1'),

  ('C-04', 'La Grande Blanche',    'Great Southern White',    'Ascia monuste virginia',
   'la-grande-blanche',    'Lesser Antillean race',     false, null,
   '#E8E6DF', true,  false, 'Phase 1'),

  ('C-05', 'Le Monarque',          'Monarch (Antillean race)','Danaus plexippus megalippe',
   'le-monarque',          'non-migratory resident',    false, null,
   '#E07818', true,  false, 'Phase 1'),

  -- C-06 is the collection signature: endemic subspecies found only in Saint Lucia.
  ('C-06', 'Le Polydamas',         'Polydamas Swallowtail',   'Battus polydamas lucianus',
   'le-polydamas',         'FOUND ONLY IN SAINT LUCIA', true,
   'B. p. lucianus is a subspecies described from Saint Lucia and found nowhere else in the world. Collection signature.',
   '#C9A22A', true,  false, 'Phase 1'),

  -- C-07 to C-10 are SHER-retained operational residences — not available for purchase.
  ('C-07', 'Le Bleu Hanno',        'Hanno / Ceraunus Blue',   'Hemiargus ceraunus watsoni',
   'le-bleu-hanno',        'Lesser Antillean race',     false, null,
   '#4A72B8', false, true,  null),

  ('C-08', 'La Statira',           'Statira Sulphur',         'Aphrissa statira',
   'la-statira',           'recorded',                  false, null,
   '#E8C22A', false, true,  null),

  ('C-09', 'Le Flambeau Argenté',  'Gulf Fritillary',         'Agraulis vanillae',
   'le-flambeau-argente',  'recorded',                  false, null,
   '#C84A14', false, true,  null),

  ('C-10', 'Le Paon Blanc',        'White Peacock',           'Anartia jatrophae',
   'le-paon-blanc',        'resident, common',          false, null,
   '#C4A882', false, true,  null);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table cottage_collection enable row level security;

-- Public read (used by buyers portal, public site)
create policy "cottage_collection_public_read"
  on cottage_collection for select
  using (true);

-- Admin write only
create policy "cottage_collection_admin_write"
  on cottage_collection for all
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');
