# SHER TMS Phase 2 — How to Run

## Before you start
Phase 1 must be live and confirmed. The master spreadsheet must exist.
Verify the `SS_ID` constant in `build-tms-phase2.gs` matches your spreadsheet URL.

## Steps

1. Go to [script.google.com](https://script.google.com)
2. Open the **SHER TMS Builder** project (same as Phase 1)
3. Click **File → New → Script file** — name it `phase2`
4. Paste the entire contents of `build-tms-phase2.gs`
5. Click **Save** (Ctrl+S)
6. Click **Run** → select `buildSHERTMSPhase2`
7. Approve permissions — Gmail, Sheets, Forms, Drive
8. Wait ~90 seconds
9. Click **View → Execution log**

The log confirms:
- Form 2 URL (Guest Date Flexibility — add to website)
- Form 5 URL (Post-Tour Feedback — send to guests after experience)
- All 8 trigger installations

---

## What was built

### Part A — Two new forms

| Form | Purpose | Who uses it |
|---|---|---|
| Form 2 — Guest Date Flexibility | Waitlist for guests who can't find a date | Website-facing |
| Form 5 — Post-Tour Feedback | Star rating + questions sent after experience | Guests (link sent by Automation 6) |

### Part B — Eight automations

| # | Trigger | What it does |
|---|---|---|
| 1 | Form 1 submitted | Sends auto-reply to guest + internal alert to bookings@ |
| 2 | Form 4 submitted | Sends booking confirmation email to guest, updates Master Bookings |
| 3 | Form 6 submitted (Mystic Morning) | Logs conservation contribution, writes guest credit, schedules email |
| 4 | Nightly 8 PM | Sends 48-hour reminder to guests with bookings in 2 days |
| 5 | Daily 4:30 AM | Sends morning brief to bookings@ for all bookings that day |
| 6 | 11 AM + 6 PM | Sends Form 5 link to guests whose experience status = Completed |
| 7 | Monday 7 AM | Sends weekly revenue + operations report to bookings@ |
| 8 | Form 4 submitted | Checks Availability Calendar for conflicts before confirming |

---

## After running

### Add Form 2 to the website
Copy the Form 2 URL from the execution log. Add a "Can't find the right date?" link
on each experience booking page pointing to this URL.

### Test each automation
The script includes test functions at the bottom. Run them individually:
- `TEST_weeklyReport()` — sends the weekly report email now
- `TEST_guideBrief()` — sends the morning brief for today
- `TEST_feedbackRequests()` — processes any pending feedback sends
- `TEST_48hReminders()` — checks and sends any 48-hour reminders due

### Mark bookings as Completed
For Automation 6 to send feedback requests, change the status of completed
bookings in **1. MASTER BOOKINGS** from `Confirmed` to `Completed`.
The automation checks twice daily and sends Form 5 to any Completed booking
where `Feedback Sent ≠ Y`.

### Mystic Morning email timing
The Mystic Morning delayed email runs daily at 3 PM via the
`_processMysticMorningEmails` trigger. Emails queued during a 5:15 AM tour
will send by 3 PM that afternoon (roughly 8–10 hours after the experience,
not exactly 3 hours). For true 3-hour delivery, move the trigger to 10 AM and
ensure the daily morning log is completed by 8 AM.

---

## Trigger schedule summary

| Time | Function | Frequency |
|---|---|---|
| 4:00 AM daily | Guide morning brief | Every day |
| 8:00 PM daily | 48-hour reminders | Every day |
| 11:00 AM daily | Feedback requests | Every day |
| 6:00 PM daily | Feedback requests | Every day |
| 3:00 PM daily | Mystic Morning emails | Every day |
| Monday 7:00 AM | Weekly revenue report | Weekly |
| On Form submit | Dispatcher (Forms 1, 4, 5, 6) | On each submission |
