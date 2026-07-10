/**
 * SHER Sanctuary — Buyer Tier 2 PDF Generator
 * Generates 6 branded PDF documents using Puppeteer.
 * Run: node generate-pdfs.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR = __dirname;
const LOGO_B64 = fs.readFileSync(path.join(__dirname, 'logo-b64.txt'), 'utf8').trim();
const TODAY = '9 July 2026';

const DISCLAIMER = `Artist's impression / design intent. Final design, pricing, specifications and approvals are subject to change. This document does not constitute a securities offering, a guarantee of returns, or confirmation of statutory approval.`;
const FOOTER_CO = `Safeport Security Services Limited · Reg. 2016-C251 · SHER Sanctuary Experiences · Savannes Bay, Micoud, Saint Lucia`;

// ─── SHARED BRAND SHELL ────────────────────────────────────────────────────
function shell(docRef, docTitle, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${docRef} — ${docTitle}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --green:  #1B3B36;
    --gold:   #C9A867;
    --gold-dk:#A88540;
    --cream:  #F5F0E8;
    --white:  #FAFAF7;
    --muted:  #6B7A72;
    --text:   #1A2420;
    --border: rgba(201,168,103,0.28);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.65;
    color: var(--text);
    background: #fff;
  }

  /* ── HEADER ── */
  .doc-header {
    background: var(--green);
    padding: 22px 36px 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid var(--gold);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-header img { height: 52px; width: auto; }
  .doc-header-right { text-align: right; }
  .doc-header-right .ref {
    font-family: 'Inter', sans-serif;
    font-size: 8.5pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .doc-header-right .title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 16pt;
    font-weight: 500;
    color: #F5F0E8;
    line-height: 1.2;
    margin-top: 3px;
  }

  /* ── BODY ── */
  .doc-body { padding: 32px 36px 20px; }

  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22pt;
    font-weight: 500;
    color: var(--green);
    margin-bottom: 6px;
    line-height: 1.15;
  }
  h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15pt;
    font-weight: 500;
    color: var(--green);
    margin: 20px 0 8px;
    padding-bottom: 5px;
    border-bottom: 1.5px solid var(--border);
  }
  h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 12.5pt;
    font-weight: 500;
    color: var(--green);
    margin: 16px 0 6px;
  }
  h4 {
    font-size: 9pt;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--gold-dk);
    margin: 14px 0 5px;
  }
  p { margin-bottom: 8px; }
  ul { padding-left: 18px; margin-bottom: 8px; }
  ul li { margin-bottom: 3px; }

  .lead {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 12pt;
    font-style: italic;
    color: var(--muted);
    margin-bottom: 20px;
    line-height: 1.7;
  }

  .eyebrow {
    display: block;
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--gold-dk);
    margin-bottom: 4px;
  }

  /* ── TABLES ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px;
    font-size: 9.5pt;
  }
  thead tr {
    background: var(--green);
    color: #F5F0E8;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  thead th {
    padding: 8px 10px;
    text-align: left;
    font-weight: 600;
    font-size: 8.5pt;
    letter-spacing: 0.04em;
  }
  tbody tr { border-bottom: 1px solid rgba(201,168,103,0.18); }
  tbody tr:nth-child(even) {
    background: rgba(245,240,232,0.6);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  tbody td { padding: 7px 10px; vertical-align: top; }
  .status-avail  { color: #1B3B36; font-weight: 600; }
  .status-retain { color: #8B6914; font-weight: 600; font-style: italic; }
  .status-poa    { color: var(--muted); font-style: italic; }

  /* ── CALLOUT BOX ── */
  .callout {
    background: rgba(245,240,232,0.7);
    border-left: 3px solid var(--gold);
    padding: 12px 16px;
    margin: 14px 0;
    border-radius: 0 4px 4px 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .callout p:last-child { margin-bottom: 0; }

  .green-band {
    background: var(--green);
    color: #F5F0E8;
    padding: 14px 18px;
    border-radius: 4px;
    margin: 16px 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .green-band p { color: rgba(245,240,232,0.85); margin-bottom: 4px; }
  .green-band p:last-child { margin-bottom: 0; }
  .green-band strong { color: var(--gold); }

  /* ── TWO COLUMN ── */
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 10px 0; }
  .col-block {
    background: var(--cream);
    border-radius: 5px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .col-block h4 { margin-top: 0; }

  /* ── PRODUCT CARD ── */
  .product-card {
    border: 1.5px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    margin: 18px 0;
    page-break-inside: avoid;
  }
  .product-card__header {
    background: var(--green);
    color: var(--cream);
    padding: 12px 18px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .product-card__header h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 14pt;
    font-weight: 500;
    color: var(--cream);
    margin: 0;
    border: none;
    padding: 0;
  }
  .product-card__badge {
    font-size: 8pt;
    font-weight: 600;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--gold);
    background: rgba(201,168,103,0.15);
    padding: 3px 10px;
    border-radius: 3px;
  }
  .product-card__body { padding: 14px 18px; }
  .product-card__body table { margin: 6px 0; }

  /* ── PAYMENT STEP ── */
  .pay-step {
    display: flex;
    gap: 14px;
    margin-bottom: 12px;
    page-break-inside: avoid;
    align-items: flex-start;
  }
  .pay-step__num {
    width: 32px; height: 32px;
    background: var(--green);
    color: var(--gold);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 11pt;
    flex-shrink: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .pay-step__body { flex: 1; padding-top: 4px; }
  .pay-step__body strong { display: block; color: var(--green); font-size: 10.5pt; margin-bottom: 2px; }

  /* ── STAT ROW ── */
  .stat-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin: 16px 0;
  }
  .stat-box {
    background: var(--cream);
    border: 1px solid var(--border);
    border-radius: 5px;
    padding: 12px 14px;
    text-align: center;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .stat-box .val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 18pt;
    font-weight: 600;
    color: var(--green);
    display: block;
    line-height: 1.1;
  }
  .stat-box .lbl { font-size: 8pt; color: var(--muted); margin-top: 2px; }

  /* ── PLOT REGISTER ── */
  .plot-table thead th { background: var(--green); }
  .plot-avail   { background: rgba(34,139,84,0.08); }
  .plot-retain  { background: rgba(201,168,103,0.1); }

  /* ── FOOTER ── */
  .doc-footer {
    margin-top: 24px;
    padding: 14px 36px 16px;
    border-top: 2px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    font-size: 7.5pt;
    color: var(--muted);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-footer .ref-block strong { color: var(--green); font-size: 8pt; display: block; margin-bottom: 2px; }
  .footer-disclaimer {
    max-width: 420px;
    font-size: 7pt;
    line-height: 1.5;
    font-style: italic;
    color: var(--muted);
    text-align: right;
  }

  /* ── PAGE BREAK ── */
  .page-break { page-break-after: always; }
  .no-break   { page-break-inside: avoid; }

  /* ── DRAFT NOTE ── */
  .draft-note {
    background: rgba(201,168,103,0.12);
    border: 1px dashed var(--gold);
    color: #7A6020;
    padding: 5px 10px;
    border-radius: 3px;
    font-size: 8pt;
    font-style: italic;
    display: inline-block;
    margin-left: 6px;
  }

  @page {
    size: A4;
    margin: 0;
  }
</style>
</head>
<body>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <div class="ref">${docRef} · Rev R01 · ${TODAY}</div>
    <div class="title">${docTitle}</div>
  </div>
</div>

<div class="doc-body">
${content}
</div>

<div class="doc-footer">
  <div class="ref-block">
    <strong>${docRef} · Revision R01</strong>
    Issued ${TODAY} · Confidential — Buyer Tier 2<br>
    ${FOOTER_CO}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

</body>
</html>`;
}

// ─── DOCUMENT 1 — SCHEDULE OF ACCOMMODATION & PRICING ─────────────────────
const doc1 = shell('SHER-BUYER-001-R01', 'Schedule of Accommodation &amp; Pricing', `

<span class="eyebrow">Buyer Tier 2 — Confidential</span>
<h1>Schedule of Accommodation &amp; Pricing</h1>
<p class="lead">Twenty residences across four product types. Placed on the estate with intention — each built from natural materials and aligned to the conservation covenant that defines the land.</p>

<div class="stat-row">
  <div class="stat-box"><span class="val">20</span><div class="lbl">Total residences</div></div>
  <div class="stat-box"><span class="val">16</span><div class="lbl">For sale</div></div>
  <div class="stat-box"><span class="val">4</span><div class="lbl">SHER-retained</div></div>
</div>

<!-- COTTAGE TYPE A -->
<div class="product-card">
  <div class="product-card__header">
    <h3>Cottage Type A — Hillside Cottage</h3>
    <span class="product-card__badge">For Sale · 6 Units</span>
  </div>
  <div class="product-card__body">
    <p><strong>Plot references:</strong> C-01 to C-06 &nbsp;|&nbsp; <strong>Estate zone:</strong> Lot F (C-01–C-03) and Lot (3) (C-04–C-06)</p>
    <table>
      <thead><tr><th>Space</th><th>Area (sq ft)</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>Enclosed interior</td><td>650 – 750</td><td>One-bedroom sanctuary suite with lounge, pantry, bathroom</td></tr>
        <tr><td>Covered veranda / deck</td><td>180 – 250</td><td>Primary outdoor living room — breakfast, pause, evening</td></tr>
        <tr><td>Outdoor shower / garden court</td><td>70 – 120</td><td>Private bathing ritual; screened for complete privacy</td></tr>
        <tr><td>Entry / storage / service</td><td>50 – 90</td><td>Discreet arrival, housekeeping, owner storage</td></tr>
        <tr><td><strong>Total experience area</strong></td><td><strong>900 – 1,100</strong></td><td>Full perceived value including outdoor living areas</td></tr>
      </tbody>
    </table>
    <table>
      <thead><tr><th>Plot</th><th>Zone</th><th>Indicative Price (USD)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>C-01</td><td>Lot F — northern cluster</td><td>From US$280,000</td><td class="status-avail">Available</td></tr>
        <tr><td>C-02</td><td>Lot F — cottage cluster</td><td>From US$280,000</td><td class="status-avail">Available</td></tr>
        <tr><td>C-03</td><td>Lot F — transition position</td><td>From US$280,000</td><td class="status-avail">Available</td></tr>
        <tr><td>C-04</td><td>Lot (3) — first southern cottage</td><td>From US$280,000</td><td class="status-avail">Available</td></tr>
        <tr><td>C-05</td><td>Lot (3) — mid-transition</td><td>From US$280,000</td><td class="status-avail">Available</td></tr>
        <tr><td>C-06</td><td>Lot (3) — final Type A position</td><td>From US$280,000</td><td class="status-avail">Available</td></tr>
      </tbody>
    </table>
    <p style="font-size:8.5pt;color:var(--muted);font-style:italic">Pricing subject to formal confirmation at reservation stage. Gross floor areas are target design ranges subject to survey, structural and planning confirmation.</p>
  </div>
</div>

<!-- VILLA TYPE A -->
<div class="product-card">
  <div class="product-card__header">
    <h3>Villa Type A — Luxury Villa</h3>
    <span class="product-card__badge">For Sale · 5 Units</span>
  </div>
  <div class="product-card__body">
    <p><strong>Plot references:</strong> V-01 to V-05 &nbsp;|&nbsp; <strong>Estate zone:</strong> Southern estate, Lot (3) — premium landscape privacy</p>
    <table>
      <thead><tr><th>Space</th><th>Area (sq ft)</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>Enclosed interior</td><td>1,800 – 2,200</td><td>Two/three-bedroom open living pavilion with full kitchen</td></tr>
        <tr><td>Covered veranda / deck</td><td>500 – 700</td><td>Deep shaded pavilion with outdoor dining and lounge</td></tr>
        <tr><td>Private pool terrace</td><td>300 – 500</td><td>Plunge or lap pool with privacy landscaping</td></tr>
        <tr><td>Outdoor / service areas</td><td>150 – 250</td><td>Private garden, outdoor shower, service access</td></tr>
        <tr><td><strong>Total experience area</strong></td><td><strong>2,750 – 3,650</strong></td><td>All areas — subject to survey and planning confirmation</td></tr>
      </tbody>
    </table>
    <table>
      <thead><tr><th>Plot</th><th>Position</th><th>Indicative Price (USD)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>V-01</td><td>Southern estate — villa cluster</td><td class="status-poa">Price on application</td><td class="status-avail">Available</td></tr>
        <tr><td>V-02</td><td>Southern estate — villa cluster</td><td class="status-poa">Price on application</td><td class="status-avail">Available</td></tr>
        <tr><td>V-03</td><td>Southern estate — villa cluster</td><td class="status-poa">Price on application</td><td class="status-avail">Available</td></tr>
        <tr><td>V-04</td><td>Southern estate — bay view</td><td class="status-poa">Price on application</td><td class="status-avail">Available</td></tr>
        <tr><td>V-05</td><td>Southern estate — premium south position</td><td>From US$980,000</td><td class="status-avail">Available</td></tr>
      </tbody>
    </table>
    <p style="font-size:8.5pt;color:var(--muted);font-style:italic">Formal pricing will be confirmed at reservation stage. "Price on application" units are priced individually according to plot position, view and configuration.</p>
  </div>
</div>

<!-- FLAGSHIP VILLA TYPE B -->
<div class="product-card">
  <div class="product-card__header">
    <h3>Flagship Villa Type B — Sanctuary Villa</h3>
    <span class="product-card__badge">For Sale · 1 Unit</span>
  </div>
  <div class="product-card__body">
    <p><strong>Plot reference:</strong> V-06 &nbsp;|&nbsp; <strong>Estate zone:</strong> Southern estate — maximum privacy, premium bay orientation</p>
    <p>The Flagship Villa is a single bespoke residence at the southern end of the estate. Larger than the Type A villas, individually designed and priced. Full specification available at Tier 3 subject to NDA.</p>
    <table>
      <thead><tr><th>Plot</th><th>Configuration</th><th>Indicative Price (USD)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>V-06</td><td>Flagship — bespoke, individual brief</td><td class="status-poa">Price on application</td><td class="status-avail">Available</td></tr>
      </tbody>
    </table>
  </div>
</div>

<!-- CONDO TYPE A -->
<div class="product-card">
  <div class="product-card__header">
    <h3>Condo Type A — Coastal Condominium</h3>
    <span class="product-card__badge">For Sale · 8 Units</span>
  </div>
  <div class="product-card__body">
    <p><strong>Plot references:</strong> Lot E — 8 boutique units structured under separate condominium title with its own legal and financing pathway</p>
    <table>
      <thead><tr><th>Space</th><th>Area (sq ft)</th><th>Notes</th></tr></thead>
      <tbody>
        <tr><td>Enclosed interior</td><td>900 – 1,100</td><td>Open-plan living, 1–2 bedrooms, kitchen, bathrooms</td></tr>
        <tr><td>Balcony / covered terrace</td><td>120 – 200</td><td>Private outdoor terrace with nature or bay view</td></tr>
        <tr><td><strong>Total area</strong></td><td><strong>1,020 – 1,300</strong></td><td>Subject to survey and planning confirmation</td></tr>
      </tbody>
    </table>
    <table>
      <thead><tr><th>Units</th><th>Estate zone</th><th>Indicative Price (USD)</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>Condo 01 – 08</td><td>Lot E — coastal condominium parcel</td><td>From US$380,000</td><td class="status-avail">Available</td></tr>
      </tbody>
    </table>
    <p style="font-size:8.5pt;color:var(--muted);font-style:italic">Individual unit pricing varies by floor level, aspect and view. Full unit matrix available at reservation stage. Condominium title allows separate financing pathway from freehold villa and cottage units.</p>
  </div>
</div>

<!-- COTTAGE TYPE B -->
<div class="product-card">
  <div class="product-card__header">
    <h3>Cottage Type B — Retained Estate Cottages</h3>
    <span class="product-card__badge">SHER-Retained · 4 Units</span>
  </div>
  <div class="product-card__body">
    <p><strong>Plot references:</strong> C-07 to C-10 &nbsp;|&nbsp; <strong>Estate zone:</strong> Lot (3) — premium retained southern zone</p>
    <p>Cottage Type B units are retained by SHER and managed as part of the hospitality operation. They are not available for individual sale. They are positioned immediately south of the Type A cottage cluster in the premium retained zone.</p>
    <table>
      <thead><tr><th>Plot</th><th>Position</th><th>Price</th><th>Status</th></tr></thead>
      <tbody>
        <tr><td>C-07</td><td>Lot (3) — retained zone</td><td>—</td><td class="status-retain">SHER-Retained</td></tr>
        <tr><td>C-08</td><td>Lot (3) — retained zone</td><td>—</td><td class="status-retain">SHER-Retained</td></tr>
        <tr><td>C-09</td><td>Lot (3) — retained zone</td><td>—</td><td class="status-retain">SHER-Retained</td></tr>
        <tr><td>C-10</td><td>Lot (3) — retained zone</td><td>—</td><td class="status-retain">SHER-Retained</td></tr>
      </tbody>
    </table>
  </div>
</div>

<div class="callout">
  <p><strong>Pricing note:</strong> All indicative prices are in United States Dollars (USD). Prices are preliminary and will be formally confirmed in the reservation agreement and Sale and Purchase Agreement. Nothing in this schedule constitutes a binding offer or a reservation of any unit.</p>
</div>
`);

// ─── DOCUMENT 2 — PURCHASE PAYMENT PLAN ──────────────────────────────────
const doc2 = shell('SHER-BUYER-002-R01', 'Purchase Payment Plan', `

<span class="eyebrow">Buyer Tier 2 — Confidential</span>
<h1>Purchase Payment Plan</h1>
<p class="lead">The standard staged payment structure for all for-sale SHER residential units — Cottage Type A, Villa Type A, Flagship Villa Type B, and Condo Type A.</p>

<div class="callout">
  <p><strong>Currency:</strong> All payments are denominated in United States Dollars (USD). Eastern Caribbean Dollar (XCD) equivalent may be accepted by arrangement — the prevailing EC Central Bank rate on the date of payment applies.</p>
</div>

<h2>Standard Staged Payment Schedule</h2>
<p>The following schedule applies to all for-sale units. The exact milestone schedule — particularly the construction stage dates — will be confirmed in the Sale and Purchase Agreement (SPA) executed with the buyer.</p>

<div class="pay-step">
  <div class="pay-step__num">1</div>
  <div class="pay-step__body">
    <strong>Reservation Deposit — 5% of Purchase Price</strong>
    Due within 7 days of verbal agreement to reserve a unit. Holds the selected unit exclusively for the buyer for 21 days. Refundable in full if the buyer does not proceed to contract within 21 days and notifies SHER in writing. Non-refundable once the Sale and Purchase Agreement is executed.
  </div>
</div>

<div class="pay-step">
  <div class="pay-step__num">2</div>
  <div class="pay-step__body">
    <strong>Contract Deposit — 10% of Purchase Price (less reservation paid)</strong>
    Due on execution of the Sale and Purchase Agreement (typically within 28 days of reservation). The reservation deposit of 5% is credited to this stage — the buyer pays the remaining 5% at contract execution. This deposit is held by the vendor's solicitor.
  </div>
</div>

<div class="pay-step">
  <div class="pay-step__num">3</div>
  <div class="pay-step__body">
    <strong>Construction Stage 1 — 15% of Purchase Price</strong>
    Due when foundations are complete and certified by the appointed structural engineer. SHER will issue a stage completion certificate and the buyer has 14 days to make payment. <span class="draft-note">Stage date TBC in SPA</span>
  </div>
</div>

<div class="pay-step">
  <div class="pay-step__num">4</div>
  <div class="pay-step__body">
    <strong>Construction Stage 2 — 20% of Purchase Price</strong>
    Due when the primary frame and roof structure are complete and certified. SHER issues a stage completion certificate; 14-day payment period applies. <span class="draft-note">Stage date TBC in SPA</span>
  </div>
</div>

<div class="pay-step">
  <div class="pay-step__num">5</div>
  <div class="pay-step__body">
    <strong>Construction Stage 3 — 15% of Purchase Price</strong>
    Due on practical completion of MEP rough-in, external envelope (walls, windows, roof cladding) and external works. Stage completion certificate issued by SHER. <span class="draft-note">Stage date TBC in SPA</span>
  </div>
</div>

<div class="pay-step">
  <div class="pay-step__num">6</div>
  <div class="pay-step__body">
    <strong>Construction Stage 4 — 10% of Purchase Price</strong>
    Due on practical completion of internal fit-out, finishes, joinery, fixtures and landscaping. The unit will be at snagging stage at this point. <span class="draft-note">Stage date TBC in SPA</span>
  </div>
</div>

<div class="pay-step">
  <div class="pay-step__num">7</div>
  <div class="pay-step__body">
    <strong>Balance on Completion — 25% of Purchase Price</strong>
    Due on legal completion — transfer of title and handover of keys. The balance is typically funded via the buyer's mortgage (if applicable) or cleared funds. Legal completion is coordinated between the vendor's and buyer's solicitors in Saint Lucia.
  </div>
</div>

<table>
  <thead><tr><th>Stage</th><th>% of Purchase Price</th><th>Cumulative</th><th>Trigger</th></tr></thead>
  <tbody>
    <tr><td>Reservation Deposit</td><td>5%</td><td>5%</td><td>Verbal agreement / unit hold</td></tr>
    <tr><td>Contract Deposit</td><td>10% (5% additional)</td><td>10%</td><td>Execution of Sale &amp; Purchase Agreement</td></tr>
    <tr><td>Stage 1</td><td>15%</td><td>25%</td><td>Foundation completion certificate</td></tr>
    <tr><td>Stage 2</td><td>20%</td><td>45%</td><td>Frame &amp; roof structure certificate</td></tr>
    <tr><td>Stage 3</td><td>15%</td><td>60%</td><td>Envelope &amp; MEP rough-in certificate</td></tr>
    <tr><td>Stage 4</td><td>15%</td><td>75%</td><td>Fit-out &amp; finishes completion</td></tr>
    <tr><td>Balance</td><td>25%</td><td>100%</td><td>Legal completion / title transfer</td></tr>
  </tbody>
</table>

<h2>Payment Methods Accepted</h2>
<div class="two-col">
  <div class="col-block">
    <h4>Accepted Methods</h4>
    <ul>
      <li>International wire transfer (USD or XCD)</li>
      <li>Cashier's cheque or banker's draft (USD)</li>
      <li>Mortgage drawdown direct from lender</li>
      <li>Attorney-to-attorney escrow transfer</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>Bank Account Details</h4>
    <p>SHER will provide verified wire transfer instructions through the vendor's appointed Saint Lucia solicitor. Do not transfer funds to any account not confirmed in writing by the solicitor. SHER will never request transfers by email alone.</p>
  </div>
</div>

<h2>Deposit Protection &amp; Unit Withdrawal</h2>
<p>All deposits received after execution of the Sale and Purchase Agreement are held by the vendor's solicitor in a client account until the relevant construction stage is certified. In the event that SHER is unable to complete a unit due to circumstances beyond the developer's control (force majeure, regulatory withdrawal, or structural impossibility), deposits paid will be returned to the buyer in full within 60 days, without penalty or interest. The Sale and Purchase Agreement will set out the full terms of deposit protection, refund conditions, and buyer remedies in the event of delay or non-performance.</p>

<div class="callout">
  <p><strong>Solicitor requirement:</strong> All buyers are required to engage an independent Saint Lucia solicitor to act on their behalf. SHER can provide a list of local firms experienced in foreign-buyer residential transactions. SHER's solicitor acts for the vendor only.</p>
</div>

<div class="green-band">
  <p><strong>Note on mortgage drawdown:</strong> Buyers using Republic Bank (Saint Lucia) Limited or another approved lender may align their drawdown schedule with the construction stage payment milestones above. SHER will issue certified stage completion certificates promptly to support mortgage drawdowns. See Document SHER-BUYER-004-R01 — Mortgage Partnership Note for details.</p>
</div>
`);

// ─── DOCUMENT 3 — HOA & RENTAL POOL SUMMARY ──────────────────────────────
const doc3 = shell('SHER-BUYER-003-R01', 'HOA &amp; Rental Pool Summary', `

<span class="eyebrow">Buyer Tier 2 — Confidential</span>
<h1>HOA &amp; Rental Pool Summary</h1>
<p class="lead">The SHER Homeowners Association (HOA) governs the shared estate. An optional HOA Rental Pool programme allows participating owners to generate rental income when not in residence.</p>

<h2>Homeowners Association</h2>

<div class="two-col">
  <div class="col-block">
    <h4>HOA Structure</h4>
    <p>The SHER HOA is a formal legal entity established under Saint Lucia law. All for-sale residence owners are mandatory members. HOA governance documents — the HOA Deed, Management Rules, and Schedule of Fees — will be provided to each buyer on reservation.</p>
    <p><em>HOA Deed to be executed and registered prior to first unit completion.</em></p>
  </div>
  <div class="col-block">
    <h4>Annual HOA Fee Basis</h4>
    <p>The annual HOA fee is assessed per residential unit. The exact fee is to be confirmed in the HOA Deed and annual budget, which will be approved by the HOA board each year.</p>
    <p><strong style="color:var(--green)">Indicative fee basis:</strong> <span style="color:var(--muted);font-style:italic">To be confirmed in HOA Deed</span></p>
    <p>Fees will be invoiced annually in advance in USD.</p>
  </div>
</div>

<h2>What the HOA Fee Covers</h2>
<table>
  <thead><tr><th>Service</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Estate landscaping &amp; grounds</td><td>Ongoing maintenance of all shared gardens, nature trails, arrival path, and common planting</td></tr>
    <tr><td>Conservation maintenance</td><td>Upkeep of the conservation covenant area, wetland buffer, and SHER's obligations to the RAMSAR protected zone</td></tr>
    <tr><td>Shared infrastructure</td><td>Estate roads, pathways, lighting, water infrastructure, solar and drainage systems serving all units</td></tr>
    <tr><td>Security</td><td>Estate entry management, perimeter monitoring, and site safety during non-occupancy periods</td></tr>
    <tr><td>Common area upkeep</td><td>Shared pavilions, reception areas, arrival zone, kayak operations base, and common guest amenities</td></tr>
    <tr><td>Insurance (shared structures)</td><td>Common area building and liability insurance — each owner carries their own unit insurance separately</td></tr>
    <tr><td>HOA administration</td><td>Annual accounts, HOA secretarial, legal and management costs</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>Cottage Type B note:</strong> The four retained Cottage Type B units (C-07 to C-10) are managed directly by SHER as part of the hospitality operation and are not subject to the HOA Rental Pool programme. Their maintenance costs are covered by SHER and are separate from the for-sale HOA budget.</p>
</div>

<h2>SHER Rental Pool Programme</h2>
<p>The SHER Rental Pool is an opt-in programme available to owners of for-sale Cottage Type A, Villa Type A, and Condo Type A residences. Participation is voluntary and may be revised at annual intervals subject to the Rental Pool terms.</p>

<div class="two-col">
  <div class="col-block">
    <h4>Opt-In Structure</h4>
    <ul>
      <li>Owners elect to participate at reservation or any subsequent annual renewal date</li>
      <li>Minimum rental pool commitment: <em>To be confirmed in HOA Deed</em></li>
      <li>SHER manages all bookings, guest relations, housekeeping and maintenance for pool units</li>
      <li>Owners receive a quarterly rental income statement and payment</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>Revenue Split</h4>
    <p><strong style="color:var(--green)">Owner share:</strong> <span style="color:var(--muted);font-style:italic">To be confirmed in HOA Deed</span></p>
    <p><strong style="color:var(--green)">SHER management share:</strong> <span style="color:var(--muted);font-style:italic">To be confirmed in HOA Deed</span></p>
    <p style="font-size:8.5pt;color:var(--muted);font-style:italic;margin-top:8px">The revenue split reflects SHER's full management responsibility including booking, housekeeping, maintenance scheduling, and guest management. Indicative splits will be discussed personally with each buyer.</p>
  </div>
</div>

<h2>Rental Management Responsibilities</h2>
<table>
  <thead><tr><th>Responsibility</th><th>Carried by</th></tr></thead>
  <tbody>
    <tr><td>Guest bookings and enquiry management</td><td>SHER Sanctuary Experiences</td></tr>
    <tr><td>Guest welcome, check-in and experience</td><td>SHER Sanctuary Experiences</td></tr>
    <tr><td>Housekeeping between stays</td><td>SHER Sanctuary Experiences</td></tr>
    <tr><td>Routine maintenance (fixtures, HVAC, minor repairs)</td><td>SHER Sanctuary Experiences — charged at cost to owner</td></tr>
    <tr><td>Major structural or system repair</td><td>Owner (with HOA contractor procurement support)</td></tr>
    <tr><td>Unit insurance</td><td>Owner — minimum cover to be specified in HOA Deed</td></tr>
    <tr><td>Saint Lucia accommodation tax / VAT compliance</td><td>SHER Sanctuary Experiences on behalf of pool owners</td></tr>
  </tbody>
</table>

<h2>Owner Usage Rights &amp; Blackout Periods</h2>
<div class="two-col">
  <div class="col-block">
    <h4>Owner Usage</h4>
    <p>Rental pool participants retain the right to use their unit for personal stays. All personal use periods must be booked through SHER's internal system. A minimum advance notice period applies.</p>
    <p><strong>Maximum personal use:</strong> <em>To be confirmed in Rental Pool Agreement — indicatively up to 90 days per year for pool participants.</em></p>
  </div>
  <div class="col-block">
    <h4>Blackout Periods</h4>
    <p>Owners may designate specific periods during which their unit is not available for guest rental. Any blackout period reduces projected rental income accordingly.</p>
    <p>SHER may designate a small number of estate-wide blackout dates for conservation or maintenance activities — these will be notified to all owners at least 60 days in advance.</p>
  </div>
</div>

<div class="green-band">
  <p><strong>Income projection note:</strong> SHER does not guarantee rental income or occupancy rates. Projected yields will be discussed personally during the buyer discovery follow-up. Performance will depend on seasonal demand, unit configuration, and the overall estate programme at the time of operation. <strong>No income projection in this document or any buyer conversation constitutes a guaranteed return.</strong></p>
</div>
`);

// ─── DOCUMENT 4 — MORTGAGE PARTNERSHIP NOTE ──────────────────────────────
const doc4 = shell('SHER-BUYER-004-R01', 'Mortgage Partnership Note', `

<span class="eyebrow">Buyer Tier 2 — Confidential</span>
<h1>Mortgage Partnership Note</h1>
<p class="lead">SHER Sanctuary has established a working relationship with Republic Bank (Saint Lucia) Limited as a preferred mortgage partner for qualifying residential buyers. This note introduces that relationship and outlines the indicative lending parameters.</p>

<div class="green-band">
  <p><strong>Preferred Mortgage Partner:</strong> Republic Bank (Saint Lucia) Limited</p>
  <p><strong>Branch:</strong> Micoud, Saint Lucia</p>
  <p><strong>Relationship type:</strong> Preferred lender — SHER will facilitate introductions for pre-qualified buyers</p>
</div>

<h2>About the Partnership</h2>
<p>SHER Sanctuary has engaged with Republic Bank (Saint Lucia) Limited — Micoud branch — as part of its commitment to providing accessible financing pathways for eligible property buyers, including foreign nationals and diaspora purchasers. The bank's Marketing Representative has provided preliminary guidance on lending parameters applicable to SHER residential products.</p>
<p>This relationship means that:</p>
<ul>
  <li>SHER will make a formal introduction on behalf of pre-qualified buyers who request mortgage support</li>
  <li>Republic Bank is familiar with the SHER project and its site, conservation context, and product types</li>
  <li>The bank's lending team can advise on the Saint Lucia mortgage process for foreign buyers from first enquiry</li>
</ul>

<h2>Indicative Lending Parameters</h2>
<p style="font-size:8.5pt;font-style:italic;color:var(--muted)">All parameters below are indicative only, provided for buyer orientation. Final mortgage terms are subject to Republic Bank's own credit assessment, valuation, and approval processes. SHER makes no guarantee of mortgage approval.</p>

<table>
  <thead><tr><th>Parameter</th><th>Indicative Position</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td>Eligible property types</td><td>Cottage Type A, Villa Type A, Condo Type A</td><td>Subject to bank's valuation and title confirmation</td></tr>
    <tr><td>Eligible borrowers</td><td>Saint Lucia nationals, CARICOM residents, foreign nationals with qualifying income</td><td>Additional documentation required for non-residents</td></tr>
    <tr><td>Loan-to-value (LTV)</td><td>Up to 70% — <em>indicative, subject to individual assessment</em></td><td>LTV may vary by product type and borrower profile</td></tr>
    <tr><td>Loan currency</td><td>XCD (Eastern Caribbean Dollar) primary; USD by arrangement</td><td>USD mortgage may be available for qualifying borrowers</td></tr>
    <tr><td>Loan term</td><td>Up to 25 years — <em>indicative</em></td><td>Subject to borrower age, income and bank policy</td></tr>
    <tr><td>Interest rate</td><td><em>To be confirmed at time of application</em></td><td>Republic Bank's prevailing mortgage rate at application date</td></tr>
    <tr><td>Mortgage drawdown</td><td>Stage drawdown aligned to construction milestones</td><td>Bank will require SHER's certified stage completion certificates</td></tr>
    <tr><td>Valuation</td><td>Bank-appointed valuer — cost borne by applicant</td><td>Valuation required before formal approval</td></tr>
  </tbody>
</table>

<h2>Saint Lucia Mortgage Process — Overview for Foreign Buyers</h2>
<p>The following is a general orientation for buyers unfamiliar with Saint Lucia's residential mortgage process. Your solicitor and Republic Bank's team will guide you through the specific requirements applicable to your situation.</p>

<div class="two-col">
  <div class="col-block">
    <h4>Typical Documentation Required</h4>
    <ul>
      <li>Valid passport (and residency permit where applicable)</li>
      <li>Most recent 3–6 months' bank statements</li>
      <li>Proof of income (employment letter, accounts, tax returns)</li>
      <li>Copy of Sale and Purchase Agreement</li>
      <li>Evidence of deposit funds</li>
      <li>Bank-appointed valuation report</li>
      <li>Title report from buyer's solicitor</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>Alien Landholding Licence</h4>
    <p>Foreign nationals (non-CARICOM citizens) purchasing land in Saint Lucia are required to obtain an Alien Landholding Licence from the Government of Saint Lucia before legal title can be transferred. SHER's solicitor will advise on the process. The application is typically submitted alongside or just after the SPA is executed.</p>
    <p style="font-size:8.5pt;color:var(--muted)">Current processing times should be confirmed with your solicitor at the time of application.</p>
  </div>
</div>

<h2>SHER's Role in the Mortgage Process</h2>
<ul>
  <li>SHER will provide a formal letter of introduction to Republic Bank (Saint Lucia) Limited — Micoud, on request, for pre-qualified buyers</li>
  <li>SHER will issue certified stage completion certificates promptly to support drawdown requests</li>
  <li>SHER's project team is available to liaise with the bank's appointed valuer when required</li>
  <li>SHER does not act as mortgage broker and does not receive any fee or commission from Republic Bank in connection with buyer mortgage applications</li>
</ul>

<div class="callout">
  <p><strong>Disclaimer:</strong> Mortgage approval is subject entirely to Republic Bank (Saint Lucia) Limited's own credit assessment, valuation, and lending policy at the time of application. SHER makes no representation, guarantee, or warranty regarding the availability, terms, or approval of any mortgage. All buyers are strongly advised to obtain independent legal and financial advice before committing to a purchase.</p>
</div>

<div class="callout">
  <p><strong>To request an introduction:</strong> Notify your SHER buyer contact in writing that you wish to be introduced to Republic Bank — Micoud. SHER will arrange the connection once your buyer discovery profile has been reviewed and your interest in a specific unit confirmed.</p>
</div>
`);

// ─── DOCUMENT 5 — RESIDENCE SPECIFICATION SHEET ──────────────────────────
const doc5 = shell('SHER-BUYER-005-R01', 'Residence Specification Sheet', `

<span class="eyebrow">Buyer Tier 2 — Confidential · Not for Construction</span>
<h1>Residence Specification Sheet</h1>
<p class="lead">Technical summary of design intent and specification basis for Cottage Type A and Villa Type A. Condo Type A specification will be issued separately.</p>

<div class="callout">
  <p><strong>Professional limitation:</strong> This document is a design intent summary prepared for buyer orientation only. It does not replace architectural, structural, civil, MEP, environmental, planning, fire or construction documents. All specifications are subject to detailed professional design, statutory approval, and site-specific survey confirmation. Not for construction. Artist's impression / design intent throughout.</p>
</div>

<!-- COTTAGE TYPE A -->
<h2>Cottage Type A — Hillside Cottage</h2>
<p><em>Plot references C-01 to C-06 &nbsp;|&nbsp; Six for-sale eco-luxury one-bedroom sanctuary cottages</em></p>

<div class="two-col">
  <div class="col-block">
    <h4>Floor Area Summary</h4>
    <table style="margin:0">
      <thead><tr><th>Space</th><th>Area (sq ft)</th></tr></thead>
      <tbody>
        <tr><td>Enclosed interior</td><td>650 – 750</td></tr>
        <tr><td>Covered veranda / deck</td><td>180 – 250</td></tr>
        <tr><td>Outdoor shower / garden court</td><td>70 – 120</td></tr>
        <tr><td>Entry / storage / service</td><td>50 – 90</td></tr>
        <tr><td><strong>Total experience area</strong></td><td><strong>900 – 1,100</strong></td></tr>
      </tbody>
    </table>
  </div>
  <div class="col-block">
    <h4>Structural System</h4>
    <p><strong>Primary frame:</strong> Marine-protected modular steel posts and beams — hot-dip galvanised or zinc-rich primer + marine epoxy + UV finish. Bolted connections, inspectable, separated from incompatible materials.</p>
    <p><strong>Secondary frame:</strong> Treated timber or engineered timber — soften the steel, support walls, decks, ceilings and screens.</p>
    <p><strong>Foundation:</strong> Light-touch piers, pads or micro-piles — confirmed by geotechnical and structural review. Raised construction to protect terrain and drainage.</p>
  </div>
</div>

<table>
  <thead><tr><th>Element</th><th>Specification Intent</th></tr></thead>
  <tbody>
    <tr><td>Roof type</td><td>Butterfly or split-butterfly — signature Cottage Type A roof language. Standing-seam or concealed-fix metal in dark bronze, charcoal or green-black tone. Deep overhangs for shade and wall protection. Hurricane-tied with engineer-designed uplift connections.</td></tr>
    <tr><td>Primary materials</td><td>Natural stone / locally sourced stone, lime/mineral plaster render, durable hardwood or thermally modified timber, premium metal roof</td></tr>
    <tr><td>Wall finish (exterior)</td><td>Natural stone base, lime render or high-quality textured mineral finish. Timber cladding in durable hardwood, thermally modified timber, or approved mineral rainscreen</td></tr>
    <tr><td>Wall finish (interior)</td><td>Lime/mineral plaster, warm neutral low-VOC paint, selective timber accents</td></tr>
    <tr><td>Flooring</td><td>Engineered timber, premium porcelain stone or approved timber-look material suitable for humidity and cleaning</td></tr>
    <tr><td>Ceiling</td><td>Timber-lined or timber-accented volume under the butterfly roof</td></tr>
    <tr><td>Bathroom</td><td>Stone or porcelain slab, walk-in shower, refined fixtures, safe drainage. Timber cabinetry with stone or premium solid-surface vanity top</td></tr>
    <tr><td>Glazing / openings</td><td>Hurricane-rated sliding, folding or fixed systems. Independent removable fine insect screens. Operating modes: open screened natural / closed conditioned-dehumidified</td></tr>
    <tr><td>Joinery</td><td>Built-in wardrobe, minibar, luggage bench, owner storage — prevent clutter. Every touched element to feel intentional and durable.</td></tr>
    <tr><td>Lighting</td><td>Warm, dimmable, low-glare and layered. No blue-white floodlit interior. No floodlighting of wetland edges.</td></tr>
  </tbody>
</table>

<h4>MEP Approach</h4>
<div class="two-col">
  <div class="col-block">
    <p><strong>Mechanical:</strong> Quiet fan or dehumidified mode for sleeping suite. HVAC concealed and acoustically controlled. No visible service clutter in guest sightlines. Mechanical plant separated from guest arrival.</p>
    <p><strong>Electrical:</strong> Solar contribution where structurally appropriate. Warm LED dimmable throughout. No exposed utility clutter.</p>
  </div>
  <div class="col-block">
    <p><strong>Plumbing:</strong> Reliable supply pressure, concealed runs, overflow-safe drainage. Outdoor shower drainage to safe collection point.</p>
    <p><strong>Communications:</strong> Concealed data/AV provisions to all key positions. No cable clutter in guest areas.</p>
  </div>
</div>

<div class="page-break"></div>

<!-- VILLA TYPE A -->
<div class="doc-header" style="background:var(--green);padding:22px 36px 18px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid var(--gold)">
  <img src="${LOGO_B64}" alt="SHER Sanctuary" style="height:52px">
  <div style="text-align:right">
    <div style="font-size:8.5pt;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:var(--gold)">SHER-BUYER-005-R01 · Rev R01 · ${TODAY}</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:16pt;font-weight:500;color:#F5F0E8;margin-top:3px">Residence Specification Sheet</div>
  </div>
</div>

<div style="padding: 28px 0 0">

<h2 style="margin-top:0">Villa Type A — Luxury Villa</h2>
<p><em>Plot references V-01 to V-05 &nbsp;|&nbsp; Five for-sale luxury villas — southern estate, maximum privacy</em></p>

<div class="two-col">
  <div class="col-block">
    <h4>Floor Area Summary</h4>
    <table style="margin:0">
      <thead><tr><th>Space</th><th>Area (sq ft)</th></tr></thead>
      <tbody>
        <tr><td>Enclosed interior</td><td>1,800 – 2,200</td></tr>
        <tr><td>Covered veranda / pavilion</td><td>500 – 700</td></tr>
        <tr><td>Private pool terrace</td><td>300 – 500</td></tr>
        <tr><td>Outdoor / service areas</td><td>150 – 250</td></tr>
        <tr><td><strong>Total experience area</strong></td><td><strong>2,750 – 3,650</strong></td></tr>
      </tbody>
    </table>
    <p style="font-size:7.5pt;color:var(--muted);font-style:italic;margin-top:6px">Subject to survey, structural and planning confirmation. Villa areas vary by plot position.</p>
  </div>
  <div class="col-block">
    <h4>Structural System</h4>
    <p><strong>Primary frame:</strong> Marine-grade structural system — steel, reinforced masonry, or hybrid as determined by structural engineer for hurricane-rated performance. Continuous load path from roof to foundations.</p>
    <p><strong>Secondary elements:</strong> Timber framing, screens, deck structure and architectural cladding system to be confirmed in detailed structural brief.</p>
    <p><strong>Foundation:</strong> Confirmed by geotechnical survey — type to be determined by engineer based on slope, soil and drainage conditions at each villa plot.</p>
  </div>
</div>

<table>
  <thead><tr><th>Element</th><th>Specification Intent</th></tr></thead>
  <tbody>
    <tr><td>Roof type</td><td>Butterfly or mono-pitch — to be confirmed in Villa Gate 4 technical handoff. Hurricane-tied structure with engineer-designed uplift connections. Metal standing-seam or concealed-fix finish in dark bronze or charcoal tone.</td></tr>
    <tr><td>Primary materials</td><td>Timber frame and cladding, natural stone (locally sourced), lime/mineral render, clay brick (where structurally appropriate), metal roof. Note: reclaimed timber is not used in SHER residential construction.</td></tr>
    <tr><td>Exterior wall</td><td>Natural stone base, lime render panels, or stone/timber combination. No synthetic cladding systems. All exterior materials to weather authentically and require only natural maintenance regimes.</td></tr>
    <tr><td>Interior</td><td>Lime/mineral plaster, warm low-VOC tones, engineered timber floors, timber ceiling elements. Open-plan living pavilion principle — fluid indoor-outdoor connection.</td></tr>
    <tr><td>Bathroom(s)</td><td>Premium stone slab, large-format walk-in shower, freestanding bath where room programme allows, refined vanity, private outdoor bathing element. Multiple bathrooms per configuration.</td></tr>
    <tr><td>Pool</td><td>Private plunge or lap pool at each Villa Type A position. Pool edge treatment, overflow system and landscape integration to be confirmed in detailed design. No floodlighting of pool toward conservation boundary.</td></tr>
    <tr><td>Glazing / openings</td><td>Wide-format hurricane-rated openings — folding or sliding systems to the veranda and landscape edge. Fine insect screens. Full privacy capability when closed.</td></tr>
    <tr><td>Lighting</td><td>Low-glare warm layered scheme. Exterior lighting strictly controlled — no habitat spillover toward wetland edges. No blue-white exterior fittings.</td></tr>
  </tbody>
</table>

<h4>Conservation Controls (all residences)</h4>
<table>
  <thead><tr><th>Control</th><th>Requirement</th></tr></thead>
  <tbody>
    <tr><td>Wetland edge lighting</td><td>No floodlighting or directed beam lighting toward conservation zone edges, mangrove buffer, or bay. Warm low-lumen only within 30m of conservation boundary.</td></tr>
    <tr><td>Utility clutter</td><td>No exposed services, meters, tanks, condensers or utility boxes in guest or owner sightlines. All services to be concealed, screened or positioned on the service side of the building.</td></tr>
    <tr><td>Wildlife exclusion</td><td>Sealed soffits, screened vents, no decorative roosting cavities. Bat-safe construction details throughout.</td></tr>
    <tr><td>Vegetation clearance</td><td>Minimal clearance for construction access only. No clearing beyond the building footprint and immediate service area. Planting plan required for each unit position.</td></tr>
    <tr><td>Drainage</td><td>No direct run-off to the conservation zone or bay edge. Contained drainage to be confirmed by civil engineer per plot.</td></tr>
  </tbody>
</table>

<h4>The Six Design Pillars — SHER Charter R02</h4>
<p style="font-size:8.5pt;color:var(--muted);font-style:italic">These six pillars govern every design decision at SHER. Any element that fails one of these pillars is not a SHER element.</p>
<div class="two-col">
  <div class="col-block">
    <ol style="padding-left:16px">
      <li style="margin-bottom:6px"><strong>Preservation</strong> — Low-footprint foundations, limited clearing, protected drainage, conservation covenant compliance</li>
      <li style="margin-bottom:6px"><strong>Wellness</strong> — Clean air, calm sleep, generous bathing, screened nature connection, tactile natural materials</li>
      <li style="margin-bottom:6px"><strong>Tranquillity</strong> — No vehicle-dominated arrival, no visible service clutter, privacy from neighbours, night-time calm</li>
    </ol>
  </div>
  <div class="col-block">
    <ol style="padding-left:16px" start="4">
      <li style="margin-bottom:6px"><strong>Luxury</strong> — Crafted details, premium bathrooms, refined material junctions, effortless indoor-outdoor living</li>
      <li style="margin-bottom:6px"><strong>Safety &amp; Resilience</strong> — Hurricane load path, insect and bat exclusion, moisture control, fire access planning, maintainable assemblies</li>
      <li style="margin-bottom:6px"><strong>Rebirth &amp; Identity</strong> — A sanctuary that communicates renewal, privacy, protection and connection to Saint Lucian nature</li>
    </ol>
  </div>
</div>

<div class="callout">
  <p><strong>Condo Type A specification:</strong> The Condo Type A (Lot E, 8 units) specification sheet will be issued separately as SHER-BUYER-005B-R01, following acceptance of the Condo visual record. The Condo uses a steel I-beam primary structural strategy distinct from the cottage and villa systems. Current design status: Gate 4 complete — visual acceptance pending.</p>
</div>

</div>
`);

// ─── DOCUMENT 6 — SITE PLAN & AVAILABLE PLOT REGISTER ────────────────────
const doc6 = shell('SHER-BUYER-006-R01', 'Site Plan &amp; Available Plot Register', `

<span class="eyebrow">Buyer Tier 2 — Confidential</span>
<h1>Site Plan &amp; Available Plot Register</h1>
<p class="lead">Estate overview and residential plot register for the SHER Sanctuary development at Savannes Bay, Micoud, Saint Lucia.</p>

<h2>Section 1 — Estate Overview</h2>

<div class="stat-row">
  <div class="stat-box"><span class="val">204,148</span><div class="lbl">Total estate area (sq ft) &middot; 4.69 acres</div></div>
  <div class="stat-box"><span class="val">108,774</span><div class="lbl">Developable area (sq ft) &middot; 2.50 acres</div></div>
  <div class="stat-box"><span class="val">95,374</span><div class="lbl">Conservation zone (sq ft) &middot; 2.19 acres &middot; 46.7%</div></div>
</div>

<div class="callout">
  <p><strong>Conservation commitment:</strong> 46.7% of the total estate area — 95,374 sq ft / 2.19 acres — is designated as conservation land. This area encompasses the mangrove fringe, wetland buffer, and bay edge, and is subject to the SHER conservation covenant and RAMSAR obligations. No residential or commercial construction is permitted in the conservation zone.</p>
</div>

<h2>Parcel References &amp; Estate Roles</h2>
<table>
  <thead><tr><th>Parcel</th><th>Block</th><th>Area (approx.)</th><th>Role / Use</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Lot 890</td><td>Block 1621B</td><td>Anchor parcel</td><td>Gateway &amp; reception zone — hospitality pavilion, café, kayak operations, guest arrival, staff facilities, solar, wastewater</td><td>Purchased — title registration pending</td></tr>
    <tr><td>Lot 897</td><td>Block 1421B/1621B</td><td>Upper slope</td><td>Accommodation zone — eco-cottages and villas; primary residential development zone</td><td>Subject to acquisition agreement</td></tr>
    <tr><td>Lot 905</td><td>Block 1421B/1621B</td><td>Mid-slope</td><td>Transition zone — nature trail, eco-tourism activity, lower accommodation zone</td><td>Subject to acquisition agreement</td></tr>
    <tr><td>Lot 12</td><td>Block 1421B/1621B</td><td>Lower coastal</td><td>Mangrove buffer / transition — kayak launch, raised boardwalk, nature trail terminus. No permanent foundations.</td><td>Subject to acquisition agreement</td></tr>
    <tr><td>Lot 13</td><td>Block 1421B/1621B</td><td>Lower coastal</td><td>Conservation / mangrove buffer — passive observation only via designated paths</td><td>Subject to acquisition agreement</td></tr>
    <tr><td>Lot 7 (Lot F/Crown)</td><td>Crown / SLNT</td><td>Peninsula</td><td>SLNT-managed buffer zone — non-permanent eco-tour structures by SLNT agreement only. Guided visits only. Not owned by SHER.</td><td>Crown / SLNT — formal use-rights by agreement</td></tr>
    <tr><td>Lot E</td><td>Estate</td><td>Condominium parcel</td><td>Condo Type A — 8 boutique units under separate condominium title</td><td>Development parcel — subject to planning</td></tr>
    <tr><td>Lot (3)</td><td>Estate</td><td>Southern premium zone</td><td>Villa Type A (V-01 to V-05), Flagship Villa V-06, and retained Cottages C-04 to C-10</td><td>Development parcel — subject to planning</td></tr>
    <tr><td>Lot F</td><td>Estate</td><td>Northern residential zone</td><td>Cottage Type A (C-01 to C-03)</td><td>Development parcel — subject to planning</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>Title note:</strong> Parcel references and areas above are drawn from current planning documents. Final surveyed areas, confirmed title positions, and parcel boundary details are available at Tier 3 subject to NDA. All buyers are advised to obtain title confirmation from their Saint Lucia solicitor before reservation.</p>
</div>

<h2>Section 2 — Residential Plot Register</h2>
<p>All 20 residential plots — status as at ${TODAY}.</p>

<table class="plot-table">
  <thead>
    <tr>
      <th>Plot Ref</th>
      <th>Product Type</th>
      <th>Approx. GFA (sq ft)</th>
      <th>Orientation / View Notes</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr class="plot-avail"><td>C-01</td><td>Cottage Type A — Hillside Cottage</td><td>900 – 1,100</td><td>Northern cluster; Lot F; screened pedestrian arrival; privacy planting</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>C-02</td><td>Cottage Type A — Hillside Cottage</td><td>900 – 1,100</td><td>Lot F cottage cluster; screened from neighbours; Lot F garden views</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>C-03</td><td>Cottage Type A — Hillside Cottage</td><td>900 – 1,100</td><td>Lot F transition; views protected; no vehicle dominance</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>C-04</td><td>Cottage Type A — Hillside Cottage</td><td>900 – 1,100</td><td>First Lot (3) cottage; quieter southern zone; staged privacy from C-03</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>C-05</td><td>Cottage Type A — Hillside Cottage</td><td>900 – 1,100</td><td>Lot (3) mid-transition; carefully staged privacy from neighbours; elevated</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>C-06</td><td>Cottage Type A — Hillside Cottage</td><td>900 – 1,100</td><td>Final Type A position; boundary to retained zone; maximum privacy from C-07</td><td class="status-avail">Available</td></tr>
    <tr class="plot-retain"><td>C-07</td><td>Cottage Type B — Retained</td><td>TBC</td><td>Lot (3) premium retained zone; SHER-managed only</td><td class="status-retain">SHER-Retained</td></tr>
    <tr class="plot-retain"><td>C-08</td><td>Cottage Type B — Retained</td><td>TBC</td><td>Lot (3) premium retained zone; SHER-managed only</td><td class="status-retain">SHER-Retained</td></tr>
    <tr class="plot-retain"><td>C-09</td><td>Cottage Type B — Retained</td><td>TBC</td><td>Lot (3) premium retained zone; SHER-managed only</td><td class="status-retain">SHER-Retained</td></tr>
    <tr class="plot-retain"><td>C-10</td><td>Cottage Type B — Retained</td><td>TBC</td><td>Lot (3) premium retained zone; SHER-managed only</td><td class="status-retain">SHER-Retained</td></tr>
    <tr class="plot-avail"><td>V-01</td><td>Villa Type A — Luxury Villa</td><td>2,750 – 3,650</td><td>Southern estate villa cluster; deep landscape privacy; tropical canopy setting</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>V-02</td><td>Villa Type A — Luxury Villa</td><td>2,750 – 3,650</td><td>Southern estate villa cluster; screened from neighbours; garden aspect</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>V-03</td><td>Villa Type A — Luxury Villa</td><td>2,750 – 3,650</td><td>Southern estate villa cluster; elevated; bay glimpse potential</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>V-04</td><td>Villa Type A — Luxury Villa</td><td>2,750 – 3,650</td><td>Southern estate; bay orientation; premium southward aspect</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>V-05</td><td>Villa Type A — Luxury Villa</td><td>2,750 – 3,650</td><td>Premium south position; maximum bay and landscape views; highest privacy</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>V-06</td><td>Flagship Villa Type B — Sanctuary Villa</td><td>TBC — bespoke</td><td>Southernmost estate position; individually designed; full bay aspect</td><td class="status-avail">Available</td></tr>
    <tr class="plot-avail"><td>Condo 01–08</td><td>Condo Type A — Coastal Condominium</td><td>1,020 – 1,300 per unit</td><td>Lot E — coastal condominium parcel; varies by level and aspect; bay orientation possible</td><td class="status-avail">Available</td></tr>
  </tbody>
</table>

<div class="green-band">
  <p><strong>Site plan note:</strong> A diagrammatic estate plan is available within the current approved drawing set (SHER Approved Current Drawing Set, 22 June 2026). The full plan — including surveyed boundaries, plot positions, conservation zone edge, and detailed residential plot layout — is available at Tier 3 subject to NDA execution.</p>
  <p><strong>To request the Tier 3 materials:</strong> Complete the buyer discovery form and indicate that you wish to proceed to Tier 3 review. SHER will contact you directly.</p>
</div>

<p style="font-size:8.5pt;color:var(--muted);font-style:italic;margin-top:16px">Parcel areas, orientations and plot positions are indicative only and subject to survey, planning, structural and environmental confirmation. This register does not constitute a binding offer or reservation of any plot. Status figures are current as at ${TODAY} and subject to change. Final plot register will be attached to each Sale and Purchase Agreement as a schedule.</p>
`);

// ─── RENDER ALL 6 DOCS ────────────────────────────────────────────────────
const DOCS = [
  { ref: 'SHER-BUYER-001-R01', filename: 'SHER-BUYER-001-R01.pdf', html: doc1 },
  { ref: 'SHER-BUYER-002-R01', filename: 'SHER-BUYER-002-R01.pdf', html: doc2 },
  { ref: 'SHER-BUYER-003-R01', filename: 'SHER-BUYER-003-R01.pdf', html: doc3 },
  { ref: 'SHER-BUYER-004-R01', filename: 'SHER-BUYER-004-R01.pdf', html: doc4 },
  { ref: 'SHER-BUYER-005-R01', filename: 'SHER-BUYER-005-R01.pdf', html: doc5 },
  { ref: 'SHER-BUYER-006-R01', filename: 'SHER-BUYER-006-R01.pdf', html: doc6 },
];

(async () => {
  console.log('Launching Puppeteer…');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const doc of DOCS) {
    console.log(`  Generating ${doc.filename}…`);
    const htmlPath = path.join(OUT_DIR, doc.filename.replace('.pdf', '.html'));
    fs.writeFileSync(htmlPath, doc.html, 'utf8');

    const page = await browser.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.pdf({
      path: path.join(OUT_DIR, doc.filename),
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await page.close();
    console.log(`  ✓ ${doc.filename} done`);
  }

  await browser.close();
  console.log('\nAll 6 PDFs generated.');
})();
