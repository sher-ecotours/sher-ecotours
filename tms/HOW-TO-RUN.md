# SHER TMS Phase 1 — How to Run

## What this builds
One Google Apps Script run creates everything in Phase 1:

- **Drive folder structure** — 7 folders under SHER TMS/
- **Master Spreadsheet** — 11 sheets, headers, data validation, season colours
- **Experience Catalogue** — all 11 experiences pre-populated with prices
- **Availability Calendar** — all 365 days of 2026, season-tagged
- **Form 1** — Guest Enquiry (link this from the website)
- **Form 3** — Pre-Tour Waiver (send to guests 72hrs before)
- **Form 4** — Booking Confirmation (internal staff only)
- **Form 6** — Daily Morning Log (guide uses each operating day)

## Steps

1. Go to [script.google.com](https://script.google.com) — sign in with the SHER Google account
2. Click **New project**
3. Delete the default `function myFunction() {}` content
4. Paste the entire contents of `build-tms-phase1.gs`
5. Click **Save** (Ctrl+S) — name the project `SHER TMS Builder`
6. Click **Run** → select `buildSHERTMSPhase1`
7. Click **Review permissions** → **Allow** when prompted
8. Wait ~60–90 seconds for the script to complete
9. Click **View** → **Execution log**

The log shows the URLs of:
- The master spreadsheet
- All four forms (published URL + edit URL)

## After running

### Link Form 1 to the website
Copy the Form 1 published URL from the execution log.
This is the guest-facing enquiry form — it should be linked from
every booking page on safehavenecotours.com.

### Share forms with the team
- Form 4 (Booking Confirmation) — share edit URL with Kemble and Sabina only
- Form 6 (Morning Log) — share published URL with guides

### Send Form 3 to guests
Form 3 (Waiver) is sent to each confirmed guest 72 hours before their experience.
Keep the published URL in your email templates.

### Check form responses land in the right sheets
Each form response writes to a new tab in the Master Spreadsheet.
Rename those response tabs to match the sheet they feed if needed.

## What Phase 2 adds (Automations)
Phase 2 adds 8 Google Apps Script automations (enquiry auto-reply,
booking confirmation email, Mystic Morning trigger, 48h guest reminder,
guide morning brief, post-tour feedback request, weekly revenue report,
availability conflict check). Build Phase 2 only after Phase 1 is
tested and trusted in live operation.
