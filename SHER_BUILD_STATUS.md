# SHER Eco Sanctuary — Build Status Report
**Date:** 29 June 2026  
**Repo:** `C:\Projects\sher-ecotours` → single GitHub repo, four Netlify sites  
**Backend:** Supabase (`hvxqettaonfxmmntrsmd.supabase.co`)

---

## DEPLOYMENT URLS

| Site | URL | Netlify Base Dir |
|---|---|---|
| Public Website | shersanctuary.com | `/` |
| TMS | tms.shersanctuary.com | `/tms/` |
| Guide PWA | guide.shersanctuary.com | `/guide/` |
| Partner Portal | partners.shersanctuary.com | `/partners/` |

---

## ✅ BUILT & DEPLOYED

### 1 — Supabase Database (9 migration files)

| File | What it does | Status |
|---|---|---|
| `00-schema.sql` | Core tables: bookings, experiences, partners, commissions, blocked_dates, waitlist, equipment, conservation_log | ✅ Run |
| `01-rls.sql` | Row-Level Security policies for all four roles (admin, guide, partner, concierge) | ✅ Run |
| `02-seed.sql` | Experience data (Calm Reflections, Scorpio's Secret, Mystic Morning, etc.) | ✅ Run |
| `03-equipment-seed.sql` | Equipment inventory (kayaks, canoes, life vests, etc.) | ✅ Run |
| `04-staff-forms.sql` | Tables for guide forms: tour_logs, equipment_inspections, incident_reports, post_tour_resets, medical_reports, photography_sessions | ✅ Run |
| `05-partner-schema.sql` | Adds concierge role, ripples_ledger, redemptions, payouts tables; expands commissions and partners tables; RLS for all partner/concierge access | ✅ Run |
| `05b-partner-rls-patch.sql` | Sets ripples_awarded values on experiences (kayak=50, canoe=100, proposal/occasion=150) | ✅ Run |
| `06-commission-ripples-trigger.sql` | AFTER UPDATE trigger on bookings: auto-creates commission row when partner booking confirmed; auto-credits concierge Ripples points | ✅ Run |
| `06b-backfill-existing-commissions.sql` | One-shot backfill for any confirmed partner bookings before the trigger existed | ✅ Run |

**Roles in Supabase Auth:**
- `admin` → TMS access only
- `guide` → Guide PWA access only
- `partner` → Partner PWA (property login), can see all bookings for their property
- `concierge` → Partner PWA (individual desk staff login), earns Ripples

**Helper RPC functions in DB:**
- `get_my_role()` — returns the logged-in user's role
- `get_my_partner_id()` — returns partner UUID for partner/concierge users
- `get_my_concierge_id()` — returns concierge UUID
- `compute_partner_tiers()` — recalculates and locks commission tier for all active partners (call at month start)

---

### 2 — TMS (`tms.shersanctuary.com`)

**Auth:**
- Email + password login (admin role only)
- Forgot password → sends reset email with redirect to `tms.shersanctuary.com`
- `PASSWORD_RECOVERY` handler → set new password screen

**Dashboard:**
- Stat cards: Pending Enquiries, Partner Requests (with live badge), Today's Tours, This Week, Active Partners
- **Today's Special Occasions** — appears automatically when any confirmed tour today has an occasion type; shows booking ref, guest, experience, departure time, occasion badge, partner requirements
- Recent Bookings table (last 10)

**Bookings:**
- Filter tabs: All / Enquiry / Qualified / Confirmed / Completed / Cancelled / Deferred / Pending
- Search by ref, name, email
- Click any row → Detail panel with full guest info
- Status workflow buttons by current status:
  - Enquiry → **Mark Qualified** → **Confirm Booking** → **Mark Completed**
  - Any active → **Cancel** or **Defer**
  - Deferred → **Re-open** (back to enquiry)
  - Partner source + enquiry → **Approve** (direct to confirmed) or **Decline**
- Shows `special_requirements` (amber callout, labelled "Partner Special Requirements") and `notes` (internal) separately

**Partner Requests** (new dedicated section):
- Sidebar nav item with live gold badge count of pending partner bookings
- Cards for each pending booking with **Confirm** and **Decline** buttons (one click, no qualify step)
- Recently actioned partner bookings table below

**Today:**
- Cards for each confirmed tour today
- Shows occasion type (gold), departure time, group size, guide assigned, waiver status, contact
- Shows partner special requirements as amber left-border callout
- Shows internal notes below

**Experiences:** Read-only list of all experiences with status, price, capacity, category

**Partners:** List of active partners with status

**Equipment:** Inventory view

**Conservation:** Log of conservation observations

**Waitlist:** Guest waitlist management

**Mobile:** Responsive CSS at 820px (sidebar collapses to hamburger), 600px (tables convert to card-style stacked rows, font sizes increase, touch targets enlarged), 380px (single-column stats)

---

### 3 — Guide PWA (`guide.shersanctuary.com`)

**Auth:** Email + password (guide role only)

**Home:**
- Date display + "N Tours Confirmed Today" briefing card
- 6 form launcher cards

**Today's Briefing (rebuilt):**
Each confirmed tour today shows a full **Preparation Brief**:
- Header: booking ref, guest name, experience, departure time, guest count, tap-to-call phone
- **Occasion Banner** (colour-coded): gold for Proposal/Honeymoon/Rekindle, green for Anniversary/Remarriage, blue for Birthday, teal for Leisure
- **Default Preparation Checklist** (occasion-specific):
  - Proposal 💍 → petals, champagne + 2 flutes, ring viewpoint, photographer on standby
  - Anniversary 🥂 → champagne, flowers, scenic pause
  - Birthday 🎂 → cake/dessert, balloons, confetti, birthday song
  - Honeymoon 🌹 → champagne, tropical flowers, personalised note
  - Rekindle / Remarriage / New Life Chapter → champagne, petals, celebratory setup
  - Holiday/Leisure 🌴 → refreshments, relaxed pace
- **Partner's Specific Instructions** — exact text from booking's `special_requirements` field in a gold-bordered callout
- If no occasion and no requirements: "Standard tour — no special setup required"

**Forms available:**
| Form | Purpose |
|---|---|
| Form 6 — Tour Log | Post-experience report: conditions, wildlife, guest mood, guide notes |
| Form 7 — Equipment Check | Pre-launch inspection of all kayaks, canoes, life vests, bay conditions |
| Form 8 — Incident Report | Safety incident documentation |
| Form 9 — Post-Tour Reset | Equipment return, cleanliness, lost property |
| Medical Report | Clinical incident record (nurse use) |
| Photo Session Brief | Photographer briefing: occasion, mood, must-have shots, delivery format |

---

### 4 — Partner PWA (`partners.shersanctuary.com`)

**Auth:** Email + password (partner OR concierge role)
- Forgot password → reset email with redirect to `partners.shersanctuary.com`
- `PASSWORD_RECOVERY` handler → set new password screen
- Role detection on login: partner sees property-level data; concierge sees personal data

**Role badge bar:** Shows property name, commission tier badge (Standard/Preferred/Elite), Trusted Partner badge, concierge Ripples balance mini-display

**5 tabs (partner login):**

| Tab | What it shows |
|---|---|
| Experiences | Live experience cards with price, capacity, availability, "Book Now" button |
| New Booking | Full booking form: experience, date, guests, lead guest details, occasion type, special requirements |
| Bookings | Property booking history cards (ref, guest, experience, date, status) |
| Commission | Tier card (current tier + rate %), summary cards (pending/approved/paid totals), commission ledger rows linked to bookings — **auto-populated by DB trigger on confirmation** |
| Payouts | Payout history (amount, method, date, reference) |

**5 tabs (concierge login):**

| Tab | What it shows |
|---|---|
| Experiences | Same as partner |
| New Booking | Same as partner (booking tagged with concierge_id) |
| My Sales | Concierge's own bookings only |
| My Ripples | Ripples balance hero, earned/redeemed totals, ledger — **auto-populated by DB trigger on confirmation** |
| Redeem | Redemption options (300pts=free kayak, 500pts=free Scorpio's Secret or USD$25, 1000pts=USD$50), submit redemption request |

**Commission tiers (auto-set by `compute_partner_tiers()` at month start):**
- Standard: 1–5 bookings/month → 12%
- Preferred: 6–12 bookings/month → 15%
- Elite: 13+ bookings/month → 18%

**Auto-commission trigger:**  
When TMS admin confirms a partner booking → commission row inserted automatically using partner's locked tier rate. If concierge submitted the booking → Ripples credited automatically to that concierge's balance.

---

## ❌ NOT YET BUILT

### A — Email Notifications (IMMEDIATE — Resend account exists)

**What's needed:**
1. Supabase Edge Function: `notify-partner-booking`
   - Fires via database webhook when booking inserted with `source='partner'`
   - Sends email to `bookings@shersanctuary.com`: guest name, property, experience, date, occasion, requirements
2. Optional additional emails:
   - Guest confirmation when booking is confirmed by SHER
   - Partner notification when their booking is approved/declined

**To build:** Edge Function file + Supabase webhook config + Resend API key in Edge Function secrets

---

### B — Supabase Redirect URL (5-minute fix)

Go to: **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**  
Add: `https://tms.shersanctuary.com`

Without this, the forgot-password link for TMS will show a "redirect not allowed" error.

---

### C — Public Website (`shersanctuary.com`)

The homepage has not been built. It was originally planned but the TMS, Guide PWA, and Partner PWA were prioritised first.

**What it needs:**
- Hero section (Savannes Bay, RAMSAR wetland)
- Experience listings with public booking form
- About SHER section
- Contact / location
- Public booking form that writes to `bookings` table with `source='website'`, `status='enquiry'`

---

### D — Phase 6 TMS Expansion (Commission & Partner Management)

These sections exist in the TMS nav but currently show placeholder/read-only data:

| Feature | What it needs |
|---|---|
| Commission Approvals | View pending commissions, click Approve (sets `status='approved'`, records `approved_at`) |
| Payouts Management | Create a payout for a partner (inserts into payouts table, links approved commissions to payout_id, marks them `status='paid'`) |
| Ripples Redemption Queue | View pending redemption requests from concierges; mark Fulfilled or Declined |
| Partner Edit | Edit partner details: name, contact, commission tier override, trusted status, confirmation mode |
| compute_partner_tiers() button | A "Run Month-End Tier Update" button in TMS Partners section that calls the DB function |

---

### E — Payment Processing

No payment gateway is integrated. Currently `payment_status` and `revenue_usd` on bookings are updated manually by the TMS operator.

**When ready to build:** Stripe integration is the recommended path — create a Stripe payment session from the TMS or public website, use a Stripe webhook to update `payment_status` on the booking automatically.

---

### F — PWA Icons (Minor)

`tms/` and `guide/` are missing `icon-192.png` and `icon-512.png` for proper PWA installation on mobile home screens. The partner PWA uses an SVG icon. PNG icons need to be generated from the SHER logo and placed in each PWA folder.

---

### G — Concierge User Creation Process

No UI exists for creating concierge accounts. Currently done via Supabase SQL editor (3 steps):
1. Create Supabase Auth user
2. Insert into `concierges` table (get the UUID back)
3. Insert into `user_roles` with `role='concierge'`, `partner_id`, `concierge_id`

A simple "Add Concierge" form in the TMS Partners section would make this self-service.

---

## IMMEDIATE ACTIONS REQUIRED

1. **Push to Netlify** — 5 commits made locally since last deploy:
   - `95d6981` TMS forgot password + partner requests
   - `4242ed5` Mobile UI improvements + Defer action
   - `4bd901a` Commission trigger SQL files
   - `ce4ecbc` Occasion prep brief (Guide PWA + TMS)
   - *(plus current mobile CSS session changes)*

2. **Supabase redirect URL** — add `https://tms.shersanctuary.com` to Auth redirect URLs

3. **Email notifications** — Resend Edge Function (you have the account already)

---

## ARCHITECTURE SUMMARY

```
GitHub repo (sher-ecotours)
│
├── /           → shersanctuary.com (public site — NOT YET BUILT)
├── /tms/       → tms.shersanctuary.com (admin TMS — BUILT)
├── /guide/     → guide.shersanctuary.com (staff PWA — BUILT)
└── /partners/  → partners.shersanctuary.com (partner PWA — BUILT)
                       ↓
              Supabase (Auth + Database + RLS)
              - 4 roles: admin / guide / partner / concierge
              - Auto-commission trigger on booking confirmation
              - Auto-Ripples trigger on booking confirmation
              - compute_partner_tiers() runs at month start
```
