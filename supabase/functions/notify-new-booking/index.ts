// ─────────────────────────────────────────────────────────────────────────────
// notify-new-booking — Supabase Edge Function
// Triggered by two Supabase Database Webhooks on the bookings table:
//   1. INSERT  → notify operator when a guest or partner books
//   2. UPDATE  → send guest confirmation when status changes to 'confirmed'
//
// Required secrets (Supabase Dashboard → Edge Functions → Secrets):
//   RESEND_API_KEY        — Resend API key
//   SUPABASE_URL          — auto-available in Edge Functions
//   SUPABASE_SERVICE_ROLE_KEY — auto-available in Edge Functions
//
// From address: bookings@shersanctuary.com
//   Requires shersanctuary.com to be verified in Resend Dashboard → Domains.
//   Temporary alternative: replace FROM with 'onboarding@resend.dev' until verified.
// ─────────────────────────────────────────────────────────────────────────────

import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Config ────────────────────────────────────────────────────────────────────
const RESEND_KEY = Deno.env.get('RESEND_API_KEY')!
const SB_URL     = Deno.env.get('SUPABASE_URL')!
const SB_KEY     = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const OPS_EMAIL   = 'bookings@shersanctuary.com'
const FROM        = 'SHER Sanctuary <bookings@shersanctuary.com>'
const TMS_BASE    = 'https://tms.shersanctuary.com'
const WHATSAPP_NO = '+1 (758) 716-5206'

// ── Supabase admin client ─────────────────────────────────────────────────────
const sb = createClient(SB_URL, SB_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Main handler ──────────────────────────────────────────────────────────────
serve(async (req: Request) => {
  try {
    const payload = await req.json()
    const { type, record: rec, old_record: old } = payload

    if (type === 'INSERT') {
      await handleNewBooking(rec)
    } else if (type === 'UPDATE') {
      await handleBookingUpdate(rec, old ?? {})
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('notify-new-booking error:', err)
    // Always return 200 so Supabase webhooks don't retry endlessly
    return new Response('error logged', { status: 200 })
  }
})

// ── INSERT handler — notify operator ─────────────────────────────────────────
async function handleNewBooking(rec: Record<string, unknown>) {
  const source = rec.source as string

  // Operator-created bookings — they already know, skip
  if (source === 'walk_in' || source === 'phone') return

  // Fetch experience
  const { data: exp } = await sb
    .from('experiences')
    .select('name, departure_time')
    .eq('id', rec.experience_id)
    .single()

  const expName   = exp?.name ?? 'Experience TBC'
  const deptTime  = (rec.departure_time as string) || exp?.departure_time || ''
  const tourDate  = fmtDate(rec.booking_date as string)
  const ref       = rec.booking_ref as string
  const guestFull = (rec.lead_name as string) ?? ''
  const guestEmail = rec.lead_email as string
  const guestPhone = (rec.lead_phone as string) ?? '—'
  const guests    = (rec.group_size as number) ?? 1
  const occasion  = (rec.special_requirements as string) ?? ''
  const tmsLink   = `${TMS_BASE}/#bookings`

  if (source === 'partner') {
    const { data: partner } = await sb
      .from('partners')
      .select('name')
      .eq('id', rec.partner_id)
      .single()

    let concierge = ''
    if (rec.concierge_id) {
      const { data: conc } = await sb
        .from('concierges')
        .select('first_name, last_name')
        .eq('id', rec.concierge_id)
        .single()
      if (conc) concierge = `${conc.first_name} ${conc.last_name}`
    }

    const propName = partner?.name ?? 'Partner Property'
    const subject  = `[Partner Booking] ${propName} — ${expName} · ${ref}`
    await sendEmail(OPS_EMAIL, subject, operatorPartnerHtml({
      ref, propName, concierge, expName, tourDate, deptTime,
      guests, guestFull, guestEmail, guestPhone, occasion, tmsLink,
    }))

  } else if (source === 'website') {
    const subject = `[Website Booking] ${expName} — ${tourDate} · ${ref}`
    await sendEmail(OPS_EMAIL, subject, operatorWebsiteHtml({
      ref, expName, tourDate, deptTime,
      guests, guestFull, guestEmail, guestPhone, occasion, tmsLink,
    }))
  }
}

// ── UPDATE handler — guest confirmation ───────────────────────────────────────
async function handleBookingUpdate(
  rec: Record<string, unknown>,
  old: Record<string, unknown>,
) {
  // Only fire when status transitions TO 'confirmed'
  if (old.status === 'confirmed' || rec.status !== 'confirmed') return

  const email = rec.lead_email as string
  if (!email) return

  const { data: exp } = await sb
    .from('experiences')
    .select('name, departure_time')
    .eq('id', rec.experience_id)
    .single()

  const ref       = rec.booking_ref as string
  const firstName = ((rec.lead_name as string) ?? '').split(' ')[0] || 'Guest'
  const expName   = exp?.name ?? 'SHER Experience'
  const deptTime  = (rec.departure_time as string) || exp?.departure_time || ''
  const tourDate  = fmtDate(rec.booking_date as string)
  const guests    = (rec.group_size as number) ?? 1
  const deposit   = rec.deposit_amount_usd as number | null
  const balance   = rec.balance_amount_usd as number | null
  const balDue    = fmtDate(rec.balance_due_date as string | null)
  const paidFull  = balance === null || balance === 0

  const subject = `Your SHER experience is confirmed — ${ref}`
  await sendEmail(email, subject, guestConfirmationHtml({
    ref, firstName, expName, tourDate, deptTime,
    guests, deposit, balance, balDue, paidFull,
  }))

  // Stamp confirmation_sent_at
  await sb
    .from('bookings')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('id', rec.id)
}

// ── Resend sender ─────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to, reply_to: OPS_EMAIL, subject, html }),
  })
  if (!res.ok) {
    const body = await res.text()
    console.error(`Resend failed (${res.status}):`, body)
    throw new Error(`Resend ${res.status}: ${body}`)
  }
}

// ── Date formatter ────────────────────────────────────────────────────────────
function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  // Parse as local date (add noon to avoid timezone shift on date-only strings)
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
}

function usd(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—'
  return Number(n).toFixed(2)
}

// ── HTML: Guest Confirmation Email ────────────────────────────────────────────
interface GuestEmailData {
  ref: string; firstName: string; expName: string
  tourDate: string; deptTime: string; guests: number
  deposit: number | null; balance: number | null
  balDue: string; paidFull: boolean
}

function guestConfirmationHtml(d: GuestEmailData): string {
  const paymentBlock = d.paidFull
    ? `<tr><td style="padding:20px 0 0;font-size:16px;color:#f0e6c8;font-weight:500">
         Paid in full — nothing further required before your tour.
       </td></tr>`
    : `<tr><td style="padding:20px 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:rgba(240,230,200,0.5)">What's settled</td></tr>
       <tr><td style="font-size:16px;color:#f0e6c8;padding-bottom:8px">
         Deposit received: <strong>USD $${usd(d.deposit)}</strong>
       </td></tr>
       <tr><td style="font-size:16px;color:#d4a843">
         Balance due: <strong>USD $${usd(d.balance)}</strong>, by ${d.balDue}
       </td></tr>`

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Your SHER experience is confirmed</title>
</head>
<body style="margin:0;padding:0;background:#f5f2ec;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">

<!-- Header -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080f0a">
<tr><td align="center" style="padding:32px 24px 28px">
  <div style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#d4a843;margin-bottom:10px">SHER · SANCTUARY EXPERIENCES</div>
  <div style="font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:rgba(240,230,200,0.4)">Savannes Bay · Micoud · Saint Lucia</div>
</td></tr>
</table>

<!-- Body wrapper -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f2ec">
<tr><td align="center" style="padding:0 16px 48px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">

  <!-- Eyebrow -->
  <tr><td style="padding:36px 0 10px;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#d4a843">Come SHER the Experience.</td></tr>

  <!-- Headline -->
  <tr><td style="padding:0 0 28px;font-size:24px;font-weight:300;color:#0a160b;line-height:1.4">
    Your tour is confirmed, ${d.firstName}.<br>The bay is expecting you.
  </td></tr>

  <!-- Booking card (dark) -->
  <tr><td style="background:#080f0a;border-radius:12px;padding:28px 28px 24px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">

    <!-- Experience name -->
    <tr><td style="font-size:22px;font-weight:500;color:#f0e6c8;padding-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08)">${d.expName}</td></tr>

    <!-- Date & time -->
    <tr><td style="padding-top:20px;font-size:15px;color:rgba(240,230,200,0.6)">Date &amp; Time</td></tr>
    <tr><td style="font-size:18px;color:#f0e6c8;font-weight:500;padding-bottom:16px">${d.tourDate}${d.deptTime ? `, departing <span style="color:#d4a843">${d.deptTime}</span>` : ''}</td></tr>

    <!-- Guests -->
    <tr><td style="font-size:15px;color:rgba(240,230,200,0.6)">Guests</td></tr>
    <tr><td style="font-size:18px;color:#f0e6c8;font-weight:500;padding-bottom:16px">${d.guests} guest${d.guests !== 1 ? 's' : ''}</td></tr>

    <!-- Ref -->
    <tr><td style="font-size:15px;color:rgba(240,230,200,0.6)">Booking reference</td></tr>
    <tr><td style="font-size:20px;color:#d4a843;font-weight:700;letter-spacing:.04em">${d.ref}</td></tr>

    <!-- Payment -->
    ${paymentBlock}

  </table>
  </td></tr>

  <!-- Before you arrive -->
  <tr><td style="padding:32px 0 8px;font-size:13px;letter-spacing:.1em;text-transform:uppercase;color:#6a8a6e">Before you arrive</td></tr>
  <tr><td style="font-size:15px;color:#2a3a2a;line-height:1.8;padding-bottom:16px">
    Please arrive 15 minutes before departure at the SHER launch point, Savannes Bay, Micoud.
    Wear comfortable clothing you don't mind getting splashed, and bring sun protection —
    the bay offers little shade on the water.
  </td></tr>
  <tr><td style="font-size:15px;color:#2a3a2a;line-height:1.8;padding-bottom:28px">
    All tours are guide-led, zero-emission, and operate under the Conservation Code that protects
    this RAMSAR-designated wetland. Your guide will brief you fully on arrival.
  </td></tr>

  <!-- CTA links -->
  <tr><td style="padding-bottom:32px;border-bottom:1px solid #e0d8cc">
    <a href="mailto:${OPS_EMAIL}?subject=Booking ${d.ref}" style="color:#d4a843;font-size:15px;text-decoration:none">View your booking</a>
    <span style="color:#b0a890;padding:0 10px">·</span>
    <a href="mailto:${OPS_EMAIL}?subject=Reschedule ${d.ref}" style="color:#d4a843;font-size:15px;text-decoration:none">Reschedule or contact us</a>
  </td></tr>

  <!-- WhatsApp contact -->
  <tr><td style="padding-top:24px;font-size:14px;color:#5a6a5a;line-height:1.7">
    Questions before your tour? Reply to this email or reach us on WhatsApp:
    <strong style="color:#0a160b">${WHATSAPP_NO}</strong>
  </td></tr>

</table>
</td></tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080f0a">
<tr><td align="center" style="padding:28px 24px">
  <div style="font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#d4a843;margin-bottom:10px">Nature Whispers · Souls Listen</div>
  <div style="font-size:11px;color:rgba(240,230,200,0.35)">SHER Sanctuary Experiences — Savannes Bay, Micoud, Saint Lucia</div>
</td></tr>
</table>

</body>
</html>`
}

// ── HTML: Operator Alert — Partner Booking ────────────────────────────────────
interface PartnerAlertData {
  ref: string; propName: string; concierge: string
  expName: string; tourDate: string; deptTime: string
  guests: number; guestFull: string; guestEmail: string
  guestPhone: string; occasion: string; tmsLink: string
}

function operatorPartnerHtml(d: PartnerAlertData): string {
  const conciergeRow = d.concierge
    ? `<tr><td style="padding:6px 0;font-size:15px;color:#2a3a2a">Submitted by: <strong>${d.concierge}</strong></td></tr>`
    : ''
  const occasionRow = d.occasion
    ? `<tr><td style="padding:12px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a6a20">Occasion / Special Requirements</td></tr>
       <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:6px">${d.occasion}</td></tr>`
    : ''

  return operatorBaseHtml({
    urgencyLabel: 'New partner booking request — action needed within 2 hours.',
    ref: d.ref,
    rows: `
      <tr><td style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6a8a6e;padding-bottom:4px">Property</td></tr>
      <tr><td style="font-size:18px;font-weight:600;color:#0a160b;padding-bottom:4px">${d.propName}</td></tr>
      ${conciergeRow}
      <tr><td style="padding:16px 0 4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6a8a6e">Experience</td></tr>
      <tr><td style="font-size:18px;color:#0a160b;font-weight:500;padding-bottom:12px">${d.expName}</td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:4px">Date: <strong>${d.tourDate}${d.deptTime ? ', ' + d.deptTime : ''}</strong></td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:16px">Guests: <strong>${d.guests}</strong></td></tr>
      <tr><td style="padding-bottom:4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6a8a6e">Lead Guest</td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:4px"><strong>${d.guestFull}</strong></td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:4px">
        <a href="mailto:${d.guestEmail}" style="color:#2a6a4a">${d.guestEmail}</a>
      </td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:16px">${d.guestPhone}</td></tr>
      ${occasionRow}
    `,
    tmsLink: d.tmsLink,
  })
}

// ── HTML: Operator Alert — Website Booking ────────────────────────────────────
interface WebsiteAlertData {
  ref: string; expName: string; tourDate: string; deptTime: string
  guests: number; guestFull: string; guestEmail: string
  guestPhone: string; occasion: string; tmsLink: string
}

function operatorWebsiteHtml(d: WebsiteAlertData): string {
  const occasionRow = d.occasion
    ? `<tr><td style="padding:12px 0 6px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a6a20">Occasion / Special Requirements</td></tr>
       <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:6px">${d.occasion}</td></tr>`
    : ''

  return operatorBaseHtml({
    urgencyLabel: 'New booking request from the website — action needed within 2 hours.',
    ref: d.ref,
    rows: `
      <tr><td style="padding-bottom:4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6a8a6e">Experience</td></tr>
      <tr><td style="font-size:18px;color:#0a160b;font-weight:500;padding-bottom:12px">${d.expName}</td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:4px">Date: <strong>${d.tourDate}${d.deptTime ? ', ' + d.deptTime : ''}</strong></td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:16px">Guests: <strong>${d.guests}</strong></td></tr>
      <tr><td style="padding-bottom:4px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6a8a6e">Lead Guest</td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:4px"><strong>${d.guestFull}</strong></td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:4px">
        <a href="mailto:${d.guestEmail}" style="color:#2a6a4a">${d.guestEmail}</a>
      </td></tr>
      <tr><td style="font-size:15px;color:#2a3a2a;padding-bottom:16px">${d.guestPhone}</td></tr>
      ${occasionRow}
    `,
    tmsLink: d.tmsLink,
  })
}

// ── HTML: Operator base template ──────────────────────────────────────────────
function operatorBaseHtml(o: {
  urgencyLabel: string; ref: string; rows: string; tmsLink: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
</head>
<body style="margin:0;padding:0;background:#f0f0f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif">

<!-- Header -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080f0a">
<tr><td style="padding:20px 28px">
  <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#d4a843">SHER OPERATIONS ALERT</div>
</td></tr>
</table>

<!-- Urgency banner -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#b85c00">
<tr><td style="padding:14px 28px;font-size:14px;font-weight:600;color:#fff;letter-spacing:.03em">${o.urgencyLabel}</td></tr>
</table>

<!-- Body -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f8f6">
<tr><td style="padding:0 16px 40px">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;margin:0 auto">

  <!-- Reference -->
  <tr><td style="padding:28px 0 20px;border-bottom:1px solid #ddd">
    <span style="font-size:12px;color:#888;letter-spacing:.1em;text-transform:uppercase">Reference</span>
    <span style="font-size:18px;font-weight:700;color:#d4a843;margin-left:12px;letter-spacing:.04em">${o.ref}</span>
  </td></tr>

  <!-- Dynamic rows -->
  <tr><td style="padding-top:20px">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    ${o.rows}
  </table>
  </td></tr>

  <!-- TMS CTA -->
  <tr><td style="padding-top:28px">
    <a href="${o.tmsLink}"
       style="display:inline-block;background:#080f0a;color:#d4a843;font-size:15px;font-weight:600;
              text-decoration:none;padding:14px 28px;border-radius:8px;letter-spacing:.04em">
      Open in TMS →
    </a>
  </td></tr>

</table>
</td></tr>
</table>

<!-- Footer -->
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#080f0a">
<tr><td style="padding:18px 28px;font-size:11px;color:rgba(240,230,200,0.35)">
  SHER Sanctuary Experiences — bookings@shersanctuary.com
</td></tr>
</table>

</body>
</html>`
}
