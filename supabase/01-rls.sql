-- ─────────────────────────────────────────────────────────────────────────────
-- SHER Eco Sanctuary — Row Level Security Policies
-- Run AFTER 00-schema.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable RLS on every table
alter table user_roles                   enable row level security;
alter table experiences                  enable row level security;
alter table guests                       enable row level security;
alter table partners                     enable row level security;
alter table bookings                     enable row level security;
alter table commissions                  enable row level security;
alter table blocked_dates                enable row level security;
alter table waivers                      enable row level security;
alter table feedback                     enable row level security;
alter table waitlist                     enable row level security;
alter table staff_schedule               enable row level security;
alter table equipment                    enable row level security;
alter table guide_morning_logs           enable row level security;
alter table guide_equipment_inspections  enable row level security;
alter table guide_incidents              enable row level security;
alter table guide_post_tour_resets       enable row level security;
alter table conservation_contributions   enable row level security;

-- ─────────────────────────────────────────────────────────────────────────────
-- EXPERIENCES
-- Public sees live/coming_soon experiences, never the parent Table d'Eau entry.
-- Partners see live only. Guides and admin see all active.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "anon read live experiences"
  on experiences for select to anon
  using (active = true and status in ('live','coming_soon') and is_parent = false);

create policy "partner read live experiences"
  on experiences for select to authenticated
  using (get_my_role() = 'partner' and active = true and status = 'live' and is_parent = false);

create policy "guide read active experiences"
  on experiences for select to authenticated
  using (get_my_role() = 'guide' and active = true);

create policy "admin all experiences"
  on experiences for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- BOOKINGS
-- Anon: insert enquiry only (website public form).
-- Guide: read today's confirmed bookings (morning briefing screen).
-- Partner: insert own bookings, read own bookings.
-- Admin: full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "anon insert enquiry"
  on bookings for insert to anon
  with check (status = 'enquiry' and source = 'website');

create policy "guide read today confirmed"
  on bookings for select to authenticated
  using (
    get_my_role() = 'guide'
    and booking_date = current_date
    and status = 'confirmed'
  );

create policy "partner insert own booking"
  on bookings for insert to authenticated
  with check (
    get_my_role() = 'partner'
    and source = 'partner'
    and partner_id = get_my_partner_id()
  );

create policy "partner read own bookings"
  on bookings for select to authenticated
  using (
    get_my_role() = 'partner'
    and partner_id = get_my_partner_id()
  );

create policy "admin all bookings"
  on bookings for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- GUESTS
-- Admin only. Guest data is never exposed to anon, guides, or partners.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "admin all guests"
  on guests for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- PARTNERS
-- Partners can read their own record. Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "partner read own record"
  on partners for select to authenticated
  using (get_my_role() = 'partner' and id = get_my_partner_id());

create policy "admin all partners"
  on partners for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- COMMISSIONS
-- Partners read own commission records only. Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "partner read own commissions"
  on commissions for select to authenticated
  using (get_my_role() = 'partner' and partner_id = get_my_partner_id());

create policy "admin all commissions"
  on commissions for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- BLOCKED DATES
-- All surfaces read (needed for availability display). Admin manages.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "anon read blocked dates"
  on blocked_dates for select to anon
  using (true);

create policy "authenticated read blocked dates"
  on blocked_dates for select to authenticated
  using (true);

create policy "admin all blocked dates"
  on blocked_dates for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- WAIVERS
-- Anon can insert (guest submits via link in confirmation email).
-- Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "anon insert waiver"
  on waivers for insert to anon
  with check (true);

create policy "admin all waivers"
  on waivers for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- FEEDBACK
-- Anon can insert (guest submits via link in post-tour email).
-- Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "anon insert feedback"
  on feedback for insert to anon
  with check (true);

create policy "admin all feedback"
  on feedback for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- WAITLIST
-- Anon and partner can insert. Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "anon insert waitlist"
  on waitlist for insert to anon
  with check (true);

create policy "partner insert waitlist"
  on waitlist for insert to authenticated
  with check (get_my_role() in ('partner','admin'));

create policy "admin all waitlist"
  on waitlist for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- STAFF SCHEDULE
-- Guides read their own schedule. Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "guide read own schedule"
  on staff_schedule for select to authenticated
  using (get_my_role() = 'guide' and guide_user_id = auth.uid());

create policy "admin all staff_schedule"
  on staff_schedule for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- EQUIPMENT
-- Guides and admin read active equipment. Admin manages.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "guide read active equipment"
  on equipment for select to authenticated
  using (get_my_role() in ('guide','admin') and active = true);

create policy "admin all equipment"
  on equipment for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- GUIDE MORNING LOGS (Form 6)
-- Guides insert and read their own logs. Admin has full access.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "guide insert morning log"
  on guide_morning_logs for insert to authenticated
  with check (get_my_role() = 'guide' and guide_user_id = auth.uid());

create policy "guide read own morning logs"
  on guide_morning_logs for select to authenticated
  using (get_my_role() = 'guide' and guide_user_id = auth.uid());

create policy "admin all morning logs"
  on guide_morning_logs for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- GUIDE EQUIPMENT INSPECTIONS (Form 7)
-- ─────────────────────────────────────────────────────────────────────────────

create policy "guide insert equipment inspection"
  on guide_equipment_inspections for insert to authenticated
  with check (get_my_role() = 'guide' and guide_user_id = auth.uid());

create policy "guide read own inspections"
  on guide_equipment_inspections for select to authenticated
  using (get_my_role() = 'guide' and guide_user_id = auth.uid());

create policy "admin all inspections"
  on guide_equipment_inspections for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- GUIDE INCIDENTS (Form 8)
-- Guides can insert. Admin has full access (incidents are never self-editable).
-- ─────────────────────────────────────────────────────────────────────────────

create policy "guide insert incident"
  on guide_incidents for insert to authenticated
  with check (get_my_role() = 'guide');

create policy "admin all incidents"
  on guide_incidents for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- GUIDE POST-TOUR RESETS (Form 9)
-- ─────────────────────────────────────────────────────────────────────────────

create policy "guide insert post tour reset"
  on guide_post_tour_resets for insert to authenticated
  with check (get_my_role() = 'guide' and guide_user_id = auth.uid());

create policy "admin all post tour resets"
  on guide_post_tour_resets for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- CONSERVATION CONTRIBUTIONS
-- Admin only. Financial stewardship records are never public.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "admin all conservation"
  on conservation_contributions for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');

-- ─────────────────────────────────────────────────────────────────────────────
-- USER ROLES
-- Each user can read their own role. Admin manages all.
-- ─────────────────────────────────────────────────────────────────────────────

create policy "read own role"
  on user_roles for select to authenticated
  using (user_id = auth.uid());

create policy "admin all user_roles"
  on user_roles for all to authenticated
  using (get_my_role() = 'admin')
  with check (get_my_role() = 'admin');
