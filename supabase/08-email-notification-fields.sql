-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 08 — Email notification tracking fields on bookings
-- Run in Supabase SQL editor   ▸  Role: postgres
-- ─────────────────────────────────────────────────────────────────────────────
-- Adds confirmation_sent_at to bookings.
-- Stamped by the notify-new-booking Edge Function when it sends the guest
-- confirmation email on status → 'confirmed'. Visible in TMS booking detail
-- so operator can see at a glance whether the guest has been notified.
--
-- NOTE: deposit_amount_usd, balance_amount_usd, balance_due_date were already
-- added in migration 05-partner-schema.sql (Step 5). No action needed for those.
-- ─────────────────────────────────────────────────────────────────────────────

alter table bookings
  add column if not exists confirmation_sent_at timestamptz;

-- Verify
select column_name, data_type, is_nullable
from   information_schema.columns
where  table_name = 'bookings'
  and  column_name = 'confirmation_sent_at';
