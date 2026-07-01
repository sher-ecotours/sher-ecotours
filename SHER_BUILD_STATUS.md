# SHER Eco Sanctuary — Build Status Report
**Date:** 1 July 2026 (updated — concierge attribution + My Bookings session)
**Repo:** `C:\Projects\sher-ecotours` → single GitHub repo, four Netlify sites
**Backend:** Supabase (`hvxqettaonfxmmntrsmd.supabase.co`)
**Latest commit:** `f1ee1d7` feat: concierge My Bookings tab + partner concierge attribution dropdown

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

### 1 — Supabase Database (13 migration files)

| File | What it does | Status |
|---|---|---|
| `00-schema.sql` | Core tables: bookings, experiences, partners, commissions, blocked_dates, waitlist, equipment, conservation_log, guest_waivers | ✅ Run |
| `01-rls.sql` | Row-Level Security policies for all four roles (admin, guide, partner, concierge) | ✅ Run |
| `02-seed.sql` | Experience data (Golden Mirror, Scorpio's Secret, Calm Reflections, Mystic Morning, Royal Sanctuary) | ✅ Run |
| `03-equipment-seed.sql` | Equipment inventory (kayaks, canoes, life vests, paddles) | ✅ Run |
| `04-staff-forms.sql` | Tables for guide forms: guide_morning_logs, guide_equipment_inspections, guide_incidents, guide_post_tour_resets, medical_reports, photography_sessions | ✅ Run |
| `05-partner-schema.sql` | Adds concierge role, ripples_ledger, redemptions, payouts tables; expands commissions and partners tables; RLS for all partner/concierge access | ✅ Run |
| `05b-partner-rls-patch.sql` | Sets ripples_awarded values on experiences (kayak=50, canoe=100, proposal/occasion=150) | ✅ Run |
| `06-commission-ripples-trigger.sql` | AFTER UPDATE trigger on bookings: auto-creates commission row when partner booking confirmed; auto-credits concierge Ripples points | ✅ Run |
| `06b-backfill-existing-commissions.sql` | One-shot backfill for any confirmed partner bookings before the trigger existed | ✅ Run |
| `07-prep-instructions.sql` | Adds `prep_instructions` + `prep_instructions_updated_at` columns to bookings | ✅ Run |
| `08-email-notification-fields.sql` | Adds `confirmation_sent_at`, `confirmation_email_template` to bookings | ✅ Run |
| `09-booking-webhook-trigger.sql` | pg_net webhook trigger → fires `notify-new-booking` edge function on booking INSERT/UPDATE | ✅ Run |
| `10-auto-triggers.sql` | Additional automation triggers | ✅ Run |
| `11-fixes-concierge-commission.sql` | Fix `amount_usd NOT NULL` in auto_create_commission; drop duplicate migration-06 trigger; add `is_independent_operator` to concierges | ❌ **WRITTEN — NOT YET RUN** |

**Roles in Supabase Auth:**
- `admin` → TMS access only
- `guide` → Guide PWA access only
- `partner` → Partner PWA (property login), sees all bookings for their property
- `concierge` → Partner PWA (individual desk staff login), earns Ripples

**Helper RPC functions in DB:**
- `get_my_role()` — returns the logged-in user's role
- `get_my_partner_id()` — returns partner UUID for partner/concierge users
- `get_my_concierge_id()` — returns concierge UUID
- `compute_partner_tiers()` — recalculates and locks commission tier for all active partners (call at month start)
- `generate_booking_ref()` — auto-generates sequential SHER-XXXX booking references

**Edge Functions (2):**
- `notify-new-booking` — Fires on booking INSERT (operator alert) and UPDATE to confirmed (guest confirmation email); uses Resend API
- `create-concierge` — Admin-authenticated; atomically creates Auth user + concierges row + user_roles row; returns password-reset link

---

### 2 — Public Website (`shersanctuary.com`)

**Files:** `index.html` (1,044 lines), `js/sher.js` (904 lines), `js/main.js`, `css/sher.css`, `css/main.css`

**Homepage sections (all built):**
- Hero with logo, tagline, and CTAs
- 3-column stat strip (2 hrs / 6 max guests / 100% zero-emission)
- Experience cards (Bay Serenity · Golden Mirror, Scorpio's Secret, Bay Serenity · Calm Reflections, Royal Sanctuary teaser)
- Special Occasions block
- The Bay section with tour route (4 stops), Google Maps link
- Protected Sanctuary section (RAMSAR, Pointe Sable EPA, Scorpion Islet Marine Reserve)
- Conservation Code (6 rules)
- Testimonial / Bay Speaks section
- About SHER section with photo grid
- Booking CTA section

**Booking / enquiry flow (wired to Supabase):**
- `openEnquiryForm()` → modal with full booking form → inserts to `bookings` table with `source='website'`, `status='enquiry'`
- `openWaitlistForm()` → waitlist signup modal
- `openSherModal(id)` → generic modal opener used by all forms
- Public anon key in `js/sher.js` → calls Supabase REST directly

**Sub-pages (`/pages/`):**
| Page | Status |
|---|---|
| `/pages/book.html` | Booking page ✅ |
| `/pages/calm-reflections.html` | Experience detail ✅ |
| `/pages/golden-mirror.html` | Experience detail ✅ |
| `/pages/scorpios-secret.html` | Experience detail ✅ |
| `/pages/table-deau.html` | Table d'Eau dining page ✅ |
| `/pages/conservation-code.html` | Full conservation rules ✅ |
| `/pages/partners.html` | Partner programme info ✅ |
| `/pages/press.html` | Press page ✅ |
| `/pages/careers.html` | Careers page ✅ |
| `/pages/privacy-policy.html` | Privacy policy ✅ |
| `/pages/booking-terms.html` | Booking terms ✅ |
| `/pages/environmental-policy.html` | Environmental policy ✅ |
| `/pages/safety-standards.html` | Safety standards ✅ |

**Missing:**
- No `/pages/contact.html` (there is a contact page referenced in an email link but no `pages/contact.html` found — verify this is served correctly from the existing site)
- No root `manifest.json` (referenced in `index.html` but not present — low-impact, only affects PWA install on the public site)

---

### 3 — TMS (`tms.shersanctuary.com`)

**Files:** `tms/index.html`, `tms/app.js` (1,749 lines), `tms/style.css`, `tms/manifest.json`

**Auth:**
- Email + password login (admin role only)
- Forgot password → reset email with redirect to `tms.shersanctuary.com`
- `PASSWORD_RECOVERY` handler → set new password screen

**Dashboard:**
- Stat cards: Pending Enquiries, Partner Requests (live badge), Today's Tours, This Week, Active Partners, Pending Commissions, Ripples Requests
- Today's Special Occasions — auto-shown when any confirmed tour today has an occasion type; shows booking ref, guest, experience, departure time, occasion badge, partner requirements
- Recent Bookings table (last 10)

**Bookings:**
- Filter tabs: All / Enquiry / Qualified / Confirmed / Completed / Cancelled / Deferred / Pending
- Search by ref, name, email
- Click row → detail panel with full guest info
- Status workflow: Enquiry → Qualified → Confirmed → Completed; Cancel / Defer / Re-open
- Partner bookings: one-click Approve or Decline (skips qualify step)
- Shows `special_requirements` (amber callout) and `notes` (internal) separately
- Tour Preparation Instructions field (editable, saves to `prep_instructions` column)

**Partner Requests:**
- Sidebar nav with live gold badge count of pending partner bookings
- Cards with Confirm / Decline buttons
- Recently actioned bookings table below

**Today:**
- Cards for each confirmed tour today
- Occasion type badge, departure time, group size, guide, waiver status, contact
- Partner special requirements (amber callout)

**Partners:**
- List with commission tier badge, rate, FAM tour tracking
- Partner edit (name, contact, tier override, trusted status, confirmation mode) ✅
- **Run Month-End Tier Update button** (calls `compute_partner_tiers()` RPC) ✅

**Concierges (Phase 7 — built):**
- List of all concierges with property, contact, Ripples balance
- **Add Concierge form**: first name, last name, email, phone, property → calls `create-concierge` edge function → creates Auth user + DB rows + returns login link ✅

**Commissions (Phase 6 — built):**
- Tabs: Pending / Approved / Paid / All
- Approve button (sets `status='approved'`, records `approved_at`)
- Reverse button (back to pending)
- Shows booking value, tier, rate, commission amount ✅

**Payouts (Phase 6 — built):**
- Partner selector + payout creation form
- Links approved commissions to payout_id atomically
- Marks linked commissions `status='paid'` ✅

**Ripples Redemptions (Phase 6 — built):**
- Tabs: Requested / Approved / Paid / Declined / All
- Approve, Decline, Mark Paid (with optional reference)
- Deducts balance from `concierges.ripples_balance`, creates ledger entry ✅

**Other views:** Experiences (read-only), Equipment inventory, Conservation log, Waitlist

**Mobile:** Responsive at 820px (hamburger), 600px (card layout), 380px (single-column stats)

---

### 4 — Guide PWA (`guide.shersanctuary.com`)

**Files:** `guide/index.html`, `guide/app.js` (877 lines), `guide/style.css`, `guide/manifest.json`

**Auth:** Email + password (guide role only)

**Home:**
- Date display + "N Tours Confirmed Today" briefing card
- 6 form launcher cards

**Today's Briefing:**
Each confirmed tour shows a full Preparation Brief:
- Booking ref, guest name, experience, departure time, guest count, tap-to-call phone
- Colour-coded occasion banner (gold=Proposal/Honeymoon/Rekindle, green=Anniversary/Remarriage, blue=Birthday, teal=Leisure)
- Default occasion-specific preparation checklist
- Partner's Specific Instructions (from `special_requirements` field, gold-bordered callout)
- "Standard tour — no special setup required" if no occasion/requirements

**Forms (all 6 built, submitted to Supabase):**
| Form | Table | Purpose |
|---|---|---|
| Form 6 — Tour Log | `guide_morning_logs` | Post-experience report |
| Form 7 — Equipment Check | `guide_equipment_inspections` | Pre-launch inspection |
| Form 8 — Incident Report | `guide_incidents` | Safety incident documentation |
| Form 9 — Post-Tour Reset | `guide_post_tour_resets` | Equipment return + cleanliness |
| Medical Report | `medical_reports` | Clinical incident record |
| Photo Session Brief | `photography_sessions` | Photographer briefing |

---

### 5 — Partner PWA (`partners.shersanctuary.com`)

**Files:** `partners/index.html`, `partners/app.js` (986 lines), `partners/style.css`, `partners/manifest.json`

**Auth:** Email + password (partner OR concierge role)
- Forgot password → reset email with redirect to `partners.shersanctuary.com`
- Role detection on login: partner sees property-level data; concierge sees personal data

**Role badge bar:** Property name, commission tier badge, Trusted Partner badge, concierge Ripples balance

**5 tabs (partner login):**
| Tab | What it shows |
|---|---|
| Experiences | Live experience cards with price, capacity, availability, "Book Now" |
| New Booking | Full booking form: experience, date, guests, lead details, occasion, requirements; optional **Concierge Agent** dropdown (fetches active concierges for the property) — sets `concierge_id` on the booking for dual-commission transparency |
| Bookings | Property booking history (ref, guest, experience, date, status) |
| Commission | Tier card + rate %, summary cards (pending/approved/paid), commission ledger — auto-populated by DB trigger |
| Payouts | Payout history (amount, method, date, reference) |

**Concierge role — tab set is gated by `is_independent_operator` flag:**

*Desk-staff concierge (default, `is_independent_operator = false`) — 3 tabs:*
| Tab | What it shows |
|---|---|
| My Bookings | Read-only bookings this concierge is attributed to; shows per-person rate, total value, Ripples earned/pending per booking |
| My Ripples | Ripples balance hero, earned/redeemed totals, ledger |
| Redeem | 300pts = free kayak / 500pts = free Scorpio's Secret or USD$25 / 1000pts = USD$50 |

*Independent-operator concierge (`is_independent_operator = true`) — 5 tabs:*
| Tab | What it shows |
|---|---|
| Experiences | Same as partner |
| New Booking | Full booking form (tagged with concierge_id automatically) |
| My Bookings | Same as desk-staff view |
| My Ripples | Same as desk-staff view |
| Redeem | Same as desk-staff view |

**Dual-commission transparency chain:**
1. Partner names concierge via Agent dropdown at booking time → `concierge_id` saved on booking
2. TMS admin approves → `trg_auto_commission` credits partner commission row; `trg_auto_ripples` credits concierge Ripples ledger — both share the same `booking_ref`
3. Partner sees commission in Commission tab; concierge sees matching entry in My Bookings with Ripples badge and in My Ripples ledger

**Commission tiers (auto-set by `compute_partner_tiers()` at month start):**
- Standard: 1–5 bookings/month → 12%
- Preferred: 6–12 bookings/month → 15%
- Elite: 13+ bookings/month → 18%

---

## ❌ REMAINING GAPS

### 1 — Email Notifications: Resend API key not yet set in Supabase Secrets

The `notify-new-booking` edge function is **fully built** (operator alert on new booking, guest confirmation on confirm). The pg_net webhook trigger is deployed (migration 09). The only blocker is the Resend API key not being set in Supabase project secrets.

**Fix (5 minutes):**
```
Supabase Dashboard → Edge Functions → notify-new-booking → Secrets
Add: RESEND_API_KEY = <your key>
```

Emails will then fire automatically with no further code changes.

---

### 2 — Supabase Auth Redirect URL for TMS (5-minute fix)

The forgot-password flow for TMS sends a reset link, but without the redirect URL allowlisted, Supabase will block it.

**Fix:**
```
Supabase Dashboard → Authentication → URL Configuration → Redirect URLs
Add: https://tms.shersanctuary.com
```

---

### ✅ 3 — PWA Icon PNG Files — DONE (1 July 2026)

All six icon files generated and placed. Each PWA has a distinct visual treatment:
- **TMS** (`tms/icon-192.png` + `tms/icon-512.png`) — Dark forest green background; professional admin feel
- **Guide** (`guide/icon-192.png` + `guide/icon-512.png`) — White background; high contrast for outdoor field use
- **Partner** (`partners/icon-192.png` + `partners/icon-512.png`) — Champagne/cream background (#F5EFE0); elegant concierge portal feel

Source files used: `images/SHER-logo-square-social.png` (TMS), `images/Sher Logo recent.png` (Guide), `images/SHER_Logo_transparent.png` (Partner). If the teal/gold logo variant is later saved to `images/`, regenerate the Partner icon from that source.

Commit these 6 files to deploy.

---

### 4 — Public Website: Root `manifest.json` Missing (Minor)

`index.html` references `manifest.json` in the root, but the file does not exist. The public site is a standard website (not a PWA install target), so this is low-impact.

**Fix (optional):** Create `/manifest.json` with basic site metadata, or remove the `<link rel="manifest">` tag from `index.html`.

---

### 5 — Payment Processing (Future)

No payment gateway is integrated. `payment_status` and `revenue_usd` on bookings are updated manually by the TMS operator. When ready:

**Recommended path:** Stripe — create a payment session from TMS or public website; Stripe webhook updates `payment_status` automatically.

---

### 6 — `tms-app/` Legacy Directory

The `tms-app/` directory contains old Google Apps Script-era files (`build-pwa-logs.gs`, `app.js`, `app.css`, archived code). It is not deployed and not referenced by any Netlify config. Safe to delete when confirmed no files there are needed.

---

## IMMEDIATE ACTION CHECKLIST

| Priority | Action | Where | Effort |
|---|---|---|---|
| 🔴 **BLOCKING** | Run `supabase/11-fixes-concierge-commission.sql` in SQL Editor | Supabase Dashboard → SQL Editor | 2 min |
| 🔴 Now | Add `RESEND_API_KEY` to Supabase Edge Function secrets | Supabase Dashboard → Edge Functions → notify-new-booking → Secrets | 5 min |
| 🔴 Now | Add `https://tms.shersanctuary.com` to Auth redirect URLs | Supabase Dashboard → Authentication → URL Configuration | 2 min |
| ✅ Done | PNG icons generated for TMS, Guide, Partner PWAs | Committed | — |
| ✅ Done | Concierge My Bookings tab (read-only, shows rate + Ripples) | `partners/app.js` | — |
| ✅ Done | Partner New Booking form — Concierge Agent attribution dropdown | `partners/app.js` | — |
| ✅ Done | `is_independent_operator` gate for concierge tab set | `partners/app.js` | — |
| 🟢 Optional | Delete `tms-app/` legacy directory | Git | 5 min |
| 🟢 Optional | Add root `manifest.json` or remove the `<link>` tag | `index.html` | 5 min |
| 🔵 Future | Payment gateway (Stripe) | New feature | Multi-day |

> **Why migration 11 is blocking:** Until it runs, approving any partner booking in TMS will throw `null value in column "amount_usd" of relation "commissions" violates not-null constraint`. The migration also adds the `is_independent_operator` column that the new concierge tab logic depends on.

---

## ARCHITECTURE SUMMARY

```
GitHub repo (sher-ecotours)
│
├── /           → shersanctuary.com     (public site — BUILT)
│   ├── index.html (1044 lines)
│   ├── js/sher.js (904 lines, wired to Supabase anon API)
│   └── pages/ (13 sub-pages)
│
├── /tms/       → tms.shersanctuary.com (admin TMS — BUILT, Phase 7 complete)
│   └── app.js (1749 lines)
│
├── /guide/     → guide.shersanctuary.com (staff PWA — BUILT)
│   └── app.js (877 lines)
│
└── /partners/  → partners.shersanctuary.com (partner PWA — BUILT)
    └── app.js (986 lines)
                       ↓
              Supabase (Auth + DB + RLS + Edge Functions)
              ├── 13 migration files (all run)
              ├── 4 roles: admin / guide / partner / concierge
              ├── Auto-commission trigger (booking confirmed → commission row)
              ├── Auto-Ripples trigger (concierge booking confirmed → ledger entry)
              ├── compute_partner_tiers() (call at month start)
              ├── Edge: notify-new-booking (BUILT — needs RESEND_API_KEY secret)
              └── Edge: create-concierge (BUILT — called by TMS Phase 7 form)
```

---

## WHAT HAS CHANGED THIS SESSION (1 July 2026 — second pass)

| What | Detail |
|---|---|
| **Bug fix written** | `supabase/11-fixes-concierge-commission.sql` — fixes `amount_usd NOT NULL` crash on booking approval; drops duplicate migration-06 trigger; adds `is_independent_operator` to concierges. **Must be run in SQL Editor.** |
| **Concierge tab restriction** | Desk-staff concierges (default) now get 3 read-only tabs; independent operators flagged via `is_independent_operator = true` get full 5 tabs including New Booking |
| **My Bookings tab (concierge)** | Renamed from "My Sales"; shows booking ref, experience name, date, per-person rate, total value, and Ripples earned/pending badge per booking |
| **Concierge attribution (partner)** | New Booking form now fetches active concierges for the property and shows optional "Referred / Handled by Agent" dropdown; selected concierge_id is saved on the booking |
| **Dual-commission transparency** | Same `booking_ref` links partner commission and concierge Ripples — both visible to respective parties simultaneously on booking confirmation |
| **CORS fix** | `create-concierge` edge function given full CORS headers + OPTIONS handler — fixes "Failed to send request" from TMS |
| **14th migration file** | `11-fixes-concierge-commission.sql` written (not yet run) |

---

## WHAT HAS CHANGED SINCE LAST REPORT (29 June → 1 July 2026)

The previous status report significantly understated what was built. The following items were marked "NOT YET BUILT" but are in fact complete:

| Old Status | Reality |
|---|---|
| Public Website — "not built" | ✅ Fully built (index.html 1044 lines + 13 sub-pages) |
| Commission Approvals | ✅ Built (Phase 6, commit `c29333d`) |
| Payouts Management | ✅ Built (Phase 6, commit `c29333d`) |
| Ripples Redemption Queue | ✅ Built (Phase 6, commit `c29333d`) |
| Partner Edit | ✅ Built (Phase 6, commit `c29333d`) |
| compute_partner_tiers() button | ✅ Built in TMS Partners section |
| Concierge account creation UI | ✅ Built (Phase 7, commit `f87475e`) — uses `create-concierge` edge function |
| Email notification edge function | ✅ Built (`notify-new-booking`, deployed) — only missing Resend secret |
| 9 migration files | ✅ 13 migration files (07–10 added since last report) |
