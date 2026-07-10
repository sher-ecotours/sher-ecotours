/**
 * SHER Sanctuary — Investor Tier 2 PDF Generator
 * Generates 6 branded investor-facing PDFs using Puppeteer.
 * Run: node generate-investor-pdfs.js  (NODE_PATH must point to global node_modules)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR  = __dirname;
const LOGO_B64 = fs.readFileSync(path.join(__dirname, '../buyer-tier2/logo-b64.txt'), 'utf8').trim();
const TODAY    = '11 July 2026';
const ENTITY   = 'Safeport Security Services Limited';
const REG      = 'Reg. 2016-C251 · Saint Lucia';
const SITE     = 'shersanctuary.com';

const DISCLAIMER = `This document is provided for preliminary information purposes only and does not constitute a prospectus, securities offering, regulated financial promotion, investment advice, or representation of fact. All financial figures, projections, and development information are preliminary, unaudited, and subject to independent verification. Prospective investors must obtain independent financial, legal, and tax advice before making any investment decision. Governed by the laws of Saint Lucia.`;

// ─── SHARED BRAND SHELL ────────────────────────────────────────────────────
function shell(docRef, docTitle, accessTier, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docRef} — ${docTitle}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --green:  #1B3B36;
    --gold:   #C9A867;
    --gold-dk:#A88540;
    --cream:  #F5F0E8;
    --muted:  #6B7A72;
    --text:   #1A2420;
    --border: rgba(201,168,103,0.28);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.7; color: var(--text); background: #fff;
  }
  .doc-header {
    background: var(--green); padding: 20px 36px 16px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 3px solid var(--gold);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc-header img { height: 50px; width: auto; }
  .doc-header-right { text-align: right; }
  .doc-header-right .tier-badge {
    display: inline-block; font-size: 7.5pt; font-weight: 700;
    letter-spacing: 0.14em; text-transform: uppercase;
    background: var(--gold); color: var(--green);
    padding: 2px 9px; border-radius: 3px; margin-bottom: 5px;
  }
  .doc-header-right .ref {
    display: block; font-size: 8pt; font-weight: 600;
    letter-spacing: 0.1em; text-transform: uppercase; color: rgba(245,240,232,0.7);
    margin-bottom: 2px;
  }
  .doc-header-right .title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15pt; font-weight: 500; color: #F5F0E8;
    line-height: 1.2;
  }
  .doc-body { padding: 28px 36px 16px; }
  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 21pt; font-weight: 500; color: var(--green);
    margin-bottom: 4px; line-height: 1.15;
  }
  h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13.5pt; font-weight: 500; color: var(--green);
    margin: 18px 0 7px; padding-bottom: 4px;
    border-bottom: 1.5px solid var(--border);
  }
  h3 {
    font-size: 9.5pt; font-weight: 600; color: var(--green);
    margin: 13px 0 4px; text-transform: uppercase; letter-spacing: 0.05em;
  }
  p { margin-bottom: 7px; }
  ul { padding-left: 18px; margin-bottom: 7px; }
  ul li { margin-bottom: 3px; }
  ol { padding-left: 18px; margin-bottom: 7px; }
  ol li { margin-bottom: 3px; }
  .lead {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 11.5pt; font-style: italic; color: var(--muted);
    margin-bottom: 18px; line-height: 1.65;
  }
  .eyebrow {
    display: block; font-size: 7.5pt; font-weight: 600;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--gold-dk); margin-bottom: 3px;
  }
  .callout {
    background: rgba(245,240,232,0.75); border-left: 3px solid var(--gold);
    padding: 10px 14px; margin: 12px 0; border-radius: 0 4px 4px 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .callout p:last-child { margin-bottom: 0; }
  .green-band {
    background: var(--green); color: #F5F0E8;
    padding: 12px 16px; border-radius: 4px; margin: 14px 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .green-band p { color: rgba(245,240,232,0.85); margin-bottom: 3px; }
  .green-band p:last-child { margin-bottom: 0; }
  .green-band strong { color: var(--gold); }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9pt; }
  thead tr { background: var(--green); color: #F5F0E8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead th { padding: 7px 10px; text-align: left; font-size: 8.5pt; font-weight: 600; }
  tbody tr { border-bottom: 1px solid rgba(201,168,103,0.18); }
  tbody tr:nth-child(even) { background: rgba(245,240,232,0.5); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  tbody td { padding: 6px 10px; vertical-align: top; }
  .stat-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0;
  }
  .stat-box {
    background: var(--cream); border: 1px solid var(--border);
    border-radius: 5px; padding: 12px 14px; text-align: center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .stat-box .val {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 17pt; font-weight: 600; color: var(--green);
    display: block; line-height: 1.1;
  }
  .stat-box .lbl { font-size: 7.5pt; color: var(--muted); margin-top: 2px; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 10px 0; }
  .col-block {
    background: var(--cream); border-radius: 5px; padding: 12px 14px;
    border: 1px solid var(--border);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .col-block h4 { font-size: 8.5pt; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--green); margin-bottom: 6px; }
  .product-band {
    background: var(--green); color: var(--cream);
    padding: 10px 16px; border-radius: 4px; margin: 14px 0 6px;
    display: flex; justify-content: space-between; align-items: center;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .product-band h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13pt; font-weight: 500; color: var(--cream);
    text-transform: none; letter-spacing: 0; margin: 0;
  }
  .product-band .badge {
    font-size: 8pt; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,103,0.15); padding: 3px 9px; border-radius: 3px;
  }
  .status-pending  { color: #7A6020; font-style: italic; }
  .status-approved { color: #1B3B36; font-weight: 600; }
  .status-review   { color: #8B6914; }
  .progress-bar-wrap { margin: 6px 0 14px; }
  .progress-bar-label { font-size: 8pt; color: var(--muted); margin-bottom: 3px; display: flex; justify-content: space-between; }
  .progress-bar-track { height: 8px; background: rgba(201,168,103,0.2); border-radius: 4px; overflow: hidden; }
  .progress-bar-fill { height: 100%; background: var(--green); border-radius: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .doc-footer {
    margin-top: 20px; padding: 12px 36px 14px;
    border-top: 2px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 7pt; color: var(--muted);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc-footer .ref-block strong { color: var(--green); font-size: 7.5pt; display: block; margin-bottom: 2px; }
  .footer-disclaimer { max-width: 430px; font-size: 6.5pt; line-height: 1.5; font-style: italic; color: var(--muted); text-align: right; }
  .page-break { page-break-after: always; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">${accessTier}</span>
    <span class="ref">${docRef} · Rev R01 · ${TODAY}</span>
    <div class="title">${docTitle}</div>
  </div>
</div>

<div class="doc-body">
${content}
</div>

<div class="doc-footer">
  <div class="ref-block">
    <strong>${docRef} · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor ${accessTier}<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

</body>
</html>`;
}


// ══════════════════════════════════════════════════════════════════════════
// DOC 1 — DEVELOPMENT FINANCIAL MODEL SUMMARY
// ══════════════════════════════════════════════════════════════════════════
const doc1 = shell('SHER-INV-001-R01', 'Development Financial Model Summary', 'Tier 2 · Investor Confidential', `
<span class="eyebrow">Investor Tier 2 · Development Economics</span>
<h1>Development Financial Model Summary</h1>
<p class="lead">A high-level summary of the SHER Sanctuary residential development financial model. All figures are preliminary, unaudited, and subject to independent professional verification. This summary is provided for investor orientation only — it is not an offer of investment and does not replace independent due diligence.</p>

<div class="green-band">
  <p><strong>Access note:</strong> The full Development Financial Model, including detailed cost breakdown, phasing schedule, sensitivity analysis, and SPV structure, is available at Tier 3 following execution of the Non-Disclosure Agreement (SHER-LEGAL-006-R01). Contact SHER to request Tier 3 access.</p>
</div>

<h2>1. Capital Structure — Summary</h2>

<div class="stat-row">
  <div class="stat-box"><span class="val">US$3.5M</span><div class="lbl">Working capital requirement<br>Residential construction phase</div></div>
  <div class="stat-box"><span class="val">US$10.2M</span><div class="lbl">Base for-sale revenue<br>Pre-financing costs</div></div>
  <div class="stat-box"><span class="val">~2.9×</span><div class="lbl">Gross revenue-to-capital ratio<br>Base model</div></div>
</div>

<p>The US$3.5M working capital requirement funds the construction phase of the 20 for-sale residences and supporting estate infrastructure. Hospitality operations (lodge, restaurant, kayak programme) are capitalised and operated separately and are not included in these residential development figures.</p>

<h2>2. Revenue Composition — By Residence Type</h2>
<table>
  <thead><tr><th>Residence Type</th><th>Units For Sale</th><th>Indicative Price Range (USD)</th><th>Revenue Contribution<br>(Base Model)</th><th>Build Phase</th></tr></thead>
  <tbody>
    <tr><td>Hillside Cottage (Type A)</td><td>6</td><td>US$280,000 – US$340,000</td><td>US$1.9M (base)</td><td>Phase 1</td></tr>
    <tr><td>Coastal Condominium (Type A)</td><td>8</td><td>US$380,000 – US$480,000</td><td>US$3.4M (base)</td><td>Phase 1 / 2</td></tr>
    <tr><td>Villa Type A</td><td>5</td><td>US$980,000 – US$1,150,000</td><td>US$4.9M (base)</td><td>Phase 2</td></tr>
    <tr><td>Flagship Villa (Type B)</td><td>1</td><td>Price on application</td><td>US$0+</td><td>Phase 2</td></tr>
    <tr><td><strong>Total</strong></td><td><strong>20</strong></td><td>—</td><td><strong>US$10.2M+ (base)</strong></td><td>12–18 months</td></tr>
  </tbody>
</table>
<p style="font-size:8pt;color:var(--muted);font-style:italic">Pricing is preliminary and indicative. Cottage Type B (4 units, C-07–C-10) are SHER-retained and not included in for-sale revenue. Flagship Villa (V-06) price is negotiated directly with the buyer.</p>

<h2>3. Investment Participation Structures</h2>
<table>
  <thead><tr><th>Structure</th><th>Priority</th><th>Indicative Target Return</th><th>Security / Terms</th></tr></thead>
  <tbody>
    <tr><td>Senior secured lending</td><td>First priority</td><td>9–11% p.a. (indicative)</td><td>Charge over titled land; stage drawdown aligned to construction milestones</td></tr>
    <tr><td>Preferred equity</td><td>Preferred distribution before participating equity</td><td>18–22% IRR target</td><td>SPV equity with preferred waterfall defined in shareholders agreement</td></tr>
    <tr><td>Participating equity</td><td>Pro-rata after preferred return and capital</td><td>Project upside — uncapped</td><td>SPV equity, pari passu with other participating equity after preferred</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>Waterfall note:</strong> Preferred equity investors receive their capital plus preferred return before participating equity receives any distribution. The precise waterfall, hurdle rates, catch-up provisions, and exit mechanisms are defined in the SPV shareholders agreement — a draft of which is available at Tier 3. The terms summarised above are indicative and subject to negotiation.</p>
</div>

<h2>4. Use of Capital</h2>
<div class="two-col">
  <div class="col-block">
    <h4>Construction — Residential</h4>
    <ul>
      <li>6 Hillside Cottages (Phase 1)</li>
      <li>8 Coastal Condominiums (Phase 1/2)</li>
      <li>5 Villa Type A units (Phase 2)</li>
      <li>1 Flagship Villa (Phase 2)</li>
      <li>4 SHER-retained Cottage Type B units</li>
    </ul>
    <p style="font-size:8pt;color:var(--muted);font-style:italic;margin-top:6px">Retained units form part of SHER's hospitality revenue stream — not for sale</p>
  </div>
  <div class="col-block">
    <h4>Estate Infrastructure</h4>
    <ul>
      <li>Internal estate roads and pedestrian pathways</li>
      <li>Solar energy infrastructure</li>
      <li>Water supply, storage and distribution</li>
      <li>Wastewater treatment and drainage</li>
      <li>Conservation zone maintenance and trail</li>
      <li>Landscaping and planting programme</li>
      <li>Estate security and entry management</li>
    </ul>
  </div>
</div>

<h2>5. Development Timeline — Indicative</h2>
<table>
  <thead><tr><th>Phase</th><th>Activity</th><th>Indicative Period</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Pre-construction</td><td>DCA planning application; regulatory approvals; land acquisition completion; contractor procurement</td><td>Q3–Q4 2026</td><td class="status-pending">In progress</td></tr>
    <tr><td>Phase 1</td><td>Cottages Type A (C-01–C-06) + Condominiums (8 units); estate infrastructure Stage 1</td><td>Q1–Q3 2027</td><td class="status-pending">Pending approvals</td></tr>
    <tr><td>Phase 2</td><td>Villas Type A (V-01–V-05) + Flagship Villa (V-06); estate infrastructure Stage 2; hospitality soft launch</td><td>Q4 2027–Q2 2028</td><td class="status-pending">Pending approvals</td></tr>
    <tr><td>Operations</td><td>Formal estate opening; hospitality programme live; owner occupancy and rental pool activation</td><td>Q3 2028 target</td><td class="status-pending">Subject to construction timeline</td></tr>
  </tbody>
</table>
<p style="font-size:8pt;color:var(--muted);font-style:italic">All timelines are indicative and subject to regulatory approval, construction programme, and market conditions. No timeline is guaranteed.</p>

<h2>6. Key Risk Factors</h2>
<ul>
  <li><strong>Planning and regulatory risk</strong> — DCA approval and other statutory consents have not yet been granted. Delays or conditions may affect construction timeline and costs.</li>
  <li><strong>Construction cost risk</strong> — Material and labour costs in Saint Lucia are subject to regional import pricing and seasonal availability. Cost overruns may reduce returns.</li>
  <li><strong>Sales absorption risk</strong> — Residential sales revenue depends on buyer uptake at the indicated price points. Slower sales reduce cashflow and extend the investment period.</li>
  <li><strong>Currency risk</strong> — All pricing is in USD. The XCD/USD peg reduces direct currency risk for local costs, but material imports may carry USD exposure.</li>
  <li><strong>Force majeure</strong> — Tropical storms, seismic events, and other force majeure events could delay or damage construction.</li>
  <li><strong>Title and acquisition</strong> — Land acquisition is partially complete. The full parcel acquisition programme is ongoing. Title completion risk exists for parcels not yet under contract.</li>
</ul>

<div class="callout">
  <p><strong>Full model access:</strong> The complete development financial model — including detailed cost schedule, sensitivity tables, phasing cashflow, SPV structure, and draft shareholders agreement — is available at Tier 3 following NDA execution. Contact bookings@shersanctuary.com to request Tier 3 access.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOC 2 — PLANNING APPROVAL & REGULATORY STATUS
// ══════════════════════════════════════════════════════════════════════════
const doc2 = shell('SHER-INV-002-R01', 'Planning Approval &amp; Regulatory Status', 'Tier 2 · Investor Confidential', `
<span class="eyebrow">Investor Tier 2 · Planning &amp; Regulatory</span>
<h1>Planning Approval &amp; Regulatory Status</h1>
<p class="lead">This document provides an honest, current account of SHER Sanctuary's planning and regulatory position as at ${TODAY}. Statutory planning approval has not yet been granted. Investors are advised to verify the current status with independent legal counsel before making any commitment.</p>

<div class="callout">
  <p><strong>Important:</strong> References in SHER marketing materials to "approved" designs, drawings, or plans refer to owner-approved design documents — not statutory planning approval from the Development Control Authority (DCA) or any other regulatory body. This document uses the term "approved" to refer to regulatory/statutory approval only.</p>
</div>

<h2>1. Development Control Authority (DCA) — Planning Status</h2>
<table>
  <thead><tr><th>Item</th><th>Status as at ${TODAY}</th></tr></thead>
  <tbody>
    <tr><td>DCA formal planning application submitted</td><td class="status-pending">Not yet submitted</td></tr>
    <tr><td>DCA planning approval granted</td><td class="status-pending">Not yet granted</td></tr>
    <tr><td>Pre-application engagement with DCA</td><td class="status-review">In progress — design basis established</td></tr>
    <tr><td>Design basis ready for planning submission</td><td class="status-approved">Yes — all four product types at Gate 4+</td></tr>
    <tr><td>Target DCA submission</td><td class="status-pending">Q3 2026 (subject to application preparation)</td></tr>
  </tbody>
</table>
<p>The SHER project is governed by the Physical Planning and Development Act Cap. 5.12 of Saint Lucia. A formal planning application to the DCA is a pre-condition for any construction on the estate. Until DCA approval is granted, no residential construction may lawfully commence.</p>

<h2>2. Regulatory Authorities — Approval Requirements</h2>
<p>In addition to DCA planning permission, the SHER development may require approvals, consultations, or notifications from the following authorities:</p>
<table>
  <thead><tr><th>Authority</th><th>Relevance</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Development Control Authority (DCA)</td><td>Primary planning approval for all construction</td><td class="status-pending">Application not yet submitted</td></tr>
    <tr><td>Saint Lucia National Trust (SLNT)</td><td>Consultation required for development adjacent to RAMSAR-designated Savannes Bay wetland; any use of Lot 7 (Crown/SLNT-managed peninsula)</td><td class="status-review">Engagement ongoing</td></tr>
    <tr><td>Fisheries Department</td><td>Coastal development impact assessment; marine reserve proximity (Scorpion Islet Marine Reserve)</td><td class="status-pending">Not yet formally engaged at DCA stage</td></tr>
    <tr><td>Forestry Department</td><td>Vegetation clearance and conservation zone management within SHER's conservation covenant</td><td class="status-pending">Not yet formally engaged at DCA stage</td></tr>
    <tr><td>Department of Sustainable Development</td><td>Environmental Impact Assessment (EIA) may be required depending on scale and DCA determination</td><td class="status-pending">EIA requirement to be confirmed at DCA pre-application stage</td></tr>
    <tr><td>Water and Sewerage Company (WASCO)</td><td>Water supply connection and wastewater approvals</td><td class="status-pending">Engagement to follow DCA submission</td></tr>
    <tr><td>LUCELEC / Utilities</td><td>Electrical grid connection or off-grid solar registration</td><td class="status-pending">To be confirmed in detailed design</td></tr>
    <tr><td>Inland Revenue Department</td><td>Stamp duty, vendor's tax, and associated property transaction requirements</td><td class="status-review">Standard requirements apply; no special dispensations sought</td></tr>
  </tbody>
</table>

<h2>3. Land Acquisition Status</h2>
<table>
  <thead><tr><th>Parcel</th><th>Role</th><th>Acquisition Status</th></tr></thead>
  <tbody>
    <tr><td>Lot 890 (Block 1621B)</td><td>Gateway, reception, hospitality, infrastructure</td><td class="status-approved">Purchased — title registration in progress</td></tr>
    <tr><td>Lot 897 (upper slope)</td><td>Primary accommodation zone — cottages and villas</td><td class="status-review">Subject to acquisition agreement</td></tr>
    <tr><td>Lot 905 (mid-slope)</td><td>Transition zone — eco-tourism and lower accommodation</td><td class="status-review">Subject to acquisition agreement</td></tr>
    <tr><td>Lots 12 &amp; 13 (lower coastal)</td><td>Mangrove buffer, kayak launch, conservation trail</td><td class="status-review">Subject to acquisition agreement</td></tr>
    <tr><td>Lot 7 (Lot F / Crown / SLNT)</td><td>Peninsula — eco-tourism by SLNT agreement; not owned by SHER</td><td class="status-review">Use-rights by SLNT agreement — not a SHER acquisition</td></tr>
    <tr><td>Lot E (condominium parcel)</td><td>Condo Type A — 8 boutique units</td><td class="status-review">Development parcel — subject to planning confirmation</td></tr>
  </tbody>
</table>

<h2>4. Conservation Context</h2>
<p>The SHER estate is adjacent to the Savannes Bay Wetlands, a RAMSAR-designated internationally important wetland. The estate encompasses approximately 2.19 acres (95,374 sq ft / 46.7% of total estate) designated as conservation land, subject to SHER's conservation covenant and RAMSAR obligations. The development design has been developed with the conservation boundary as a primary constraint. SHER's conservation commitment is a design and marketing differentiator — it is not, at this stage, a separately certified or independently audited status. See SHER-INV-003-R01 for the full Environmental &amp; Conservation Position Summary.</p>

<h2>5. Design Approvals — Owner-Approved vs. Statutory</h2>
<div class="callout">
  <p><strong>Clarity of terms:</strong> All four SHER product types (Cottage Type A, Villa Type A, Condo Type A, Flagship Villa) have been taken through Gate 1–4 design approval processes. "Gate" approvals refer to the owner's internal design approval process — they are not statutory or professional approvals. The purpose of completing internal gates before DCA submission is to ensure the planning application is based on a fully resolved, owner-approved design basis.</p>
</div>
<table>
  <thead><tr><th>Product Type</th><th>Design Gate Status</th><th>DCA Status</th></tr></thead>
  <tbody>
    <tr><td>Cottage Type A (6 units)</td><td class="status-approved">Gates 1–4 complete, visual record accepted</td><td class="status-pending">Pending DCA submission</td></tr>
    <tr><td>Villa Type A (5 units)</td><td class="status-approved">Gates 1–4 complete, visual record accepted</td><td class="status-pending">Pending DCA submission</td></tr>
    <tr><td>Condo Type A (8 units)</td><td class="status-approved">Gates 1–4 complete</td><td class="status-pending">Pending DCA submission; visual record pending</td></tr>
    <tr><td>Flagship Villa Type B (1 unit)</td><td class="status-review">Concept agreed — individual brief at Tier 3</td><td class="status-pending">Pending DCA submission</td></tr>
    <tr><td>Lot 890 / Gateway / Café Pavilion</td><td class="status-approved">Owner coordination package complete</td><td class="status-pending">Pending DCA submission</td></tr>
  </tbody>
</table>

<div class="green-band">
  <p><strong>Investor note:</strong> The completion of all four product design gates before DCA submission represents a significant project milestone. It means the planning application will be based on a fully resolved, owner-approved design basis across all residential product types. This reduces the risk of material design changes being required post-planning — a common source of delay and cost overrun in comparable projects.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOC 3 — ENVIRONMENTAL & CONSERVATION POSITION SUMMARY
// ══════════════════════════════════════════════════════════════════════════
const doc3 = shell('SHER-INV-003-R01', 'Environmental &amp; Conservation Position Summary', 'Tier 2 · Investor Confidential', `
<span class="eyebrow">Investor Tier 2 · Environmental &amp; Conservation</span>
<h1>Environmental &amp; Conservation Position Summary</h1>
<p class="lead">This document summarises SHER Sanctuary's environmental position, conservation commitments, and the ecological context of the Savannes Bay estate. It is a design-intent and project-position document — not an independently certified environmental assessment.</p>

<div class="callout">
  <p><strong>Not an environmental certification:</strong> This document is a position summary prepared by the SHER project team drawing on the SHER Design Charter (SHER-DNA-001-R02), planning documents, and site knowledge. It does not constitute a certified Environmental Impact Assessment (EIA), an SLNT opinion, or any regulatory authority approval. An EIA may be required as part of the DCA planning submission process.</p>
</div>

<h2>1. Site Context — Savannes Bay</h2>
<p>The SHER estate is located at Savannes Bay, Micoud, on the southern Atlantic coast of Saint Lucia, West Indies. The bay and its surrounding wetland are among the most ecologically significant coastal environments on the island:</p>
<ul>
  <li><strong>RAMSAR designation</strong> — Savannes Bay Wetlands are designated under the Ramsar Convention on Wetlands, recognising their international importance as a habitat for migratory birds, coastal fish nurseries, and mangrove ecosystem services;</li>
  <li><strong>Pointe Sable Environmental Protection Area (EPA)</strong> — The estate lies within the Pointe Sable EPA, a protected coastal zone managed under Saint Lucia environmental legislation;</li>
  <li><strong>Scorpion Islet Marine Reserve</strong> — The adjacent marine reserve protects the bay's reef and seagrass ecosystem. SHER's design and operational approach is required to avoid any impact on the marine environment;</li>
  <li><strong>Mangrove fringe</strong> — A continuous mangrove fringe lines the bay edge. Mangroves are protected under Saint Lucia law and form part of SHER's conservation covenant boundary.</li>
</ul>

<h2>2. Conservation Land Allocation</h2>
<div class="stat-row">
  <div class="stat-box"><span class="val">204,148</span><div class="lbl">Total estate (sq ft)<br>4.69 acres</div></div>
  <div class="stat-box"><span class="val">95,374</span><div class="lbl">Conservation zone (sq ft)<br>2.19 acres — 46.7% of estate</div></div>
  <div class="stat-box"><span class="val">108,774</span><div class="lbl">Developable area (sq ft)<br>2.50 acres</div></div>
</div>
<p>46.7% of the total estate area — approximately 2.19 acres — is designated as conservation land under SHER's conservation covenant. This zone encompasses the mangrove fringe, wetland buffer, bay edge, and conservation trail corridor. No residential or commercial construction is permitted within the conservation zone.</p>

<h2>3. SHER's Six Conservation Design Pillars</h2>
<p>The SHER Design Charter (SHER-DNA-001-R02) establishes six design pillars that govern every architectural and operational decision at SHER. Conservation performance is embedded at the foundational level — not added as an afterthought:</p>
<table>
  <thead><tr><th>Pillar</th><th>Conservation Relevance</th></tr></thead>
  <tbody>
    <tr><td><strong>1. Preservation</strong></td><td>Low-footprint foundations; raised construction to protect terrain and drainage; no clearing beyond the residential footprint; drainage contained and away from the conservation zone and bay</td></tr>
    <tr><td><strong>2. Wellness</strong></td><td>Natural materials; clean indoor air; screened-glazed nature connection that does not require habitat disturbance to create the experience</td></tr>
    <tr><td><strong>3. Tranquillity</strong></td><td>No vehicle dominance in guest areas; no audible mechanical noise at the conservation boundary; night-time calm maintained — controlled exterior lighting to prevent habitat spillover</td></tr>
    <tr><td><strong>4. Luxury</strong></td><td>Premium-quality materials that weather authentically and require no synthetic treatments; durable maintenance regimes that do not introduce harmful chemicals near the wetland</td></tr>
    <tr><td><strong>5. Safety &amp; Resilience</strong></td><td>Hurricane-rated construction to minimise post-storm debris and damage; sealed buildings to exclude bats and insects without harmful treatments; wastewater management to prevent contamination</td></tr>
    <tr><td><strong>6. Rebirth &amp; Identity</strong></td><td>SHER's conservation ethic as a differentiator — a sanctuary that communicates renewal and connection to Saint Lucian nature rather than displacing it</td></tr>
  </tbody>
</table>

<h2>4. Key Environmental Controls — Design Intent</h2>
<div class="two-col">
  <div class="col-block">
    <h4>Lighting</h4>
    <ul>
      <li>No floodlighting directed toward the conservation zone, mangrove fringe, or bay edge</li>
      <li>All exterior fittings warm-toned (no blue-white LED) within 30m of the conservation boundary</li>
      <li>Guest areas lit to comfort level only — no "resort floodlit" aesthetic</li>
      <li>Designed to comply with any turtle-nesting and seabird protection requirements that may be specified by regulatory authorities</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>Wildlife &amp; Habitat</h4>
    <ul>
      <li>Sealed soffits and screened vents — no bat roosting cavities in any structure</li>
      <li>No decorative features that create unintended roosting or nesting habitat in guest zones</li>
      <li>All construction disturbance limited to the residential footprint and immediate service area</li>
      <li>Native planting species preference in all landscape areas</li>
    </ul>
  </div>
</div>
<div class="two-col">
  <div class="col-block">
    <h4>Drainage &amp; Wastewater</h4>
    <ul>
      <li>No direct surface run-off to the conservation zone or bay edge</li>
      <li>Contained drainage per plot confirmed by civil/environmental engineer</li>
      <li>Wastewater treatment system designed to prevent any discharge to the wetland buffer or bay</li>
      <li>Estate-wide water management plan to be prepared as part of DCA submission</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>Service &amp; Maintenance</h4>
    <ul>
      <li>No chemical herbicide or pesticide use in conservation zone</li>
      <li>Manual clearance only within 10m of the conservation boundary</li>
      <li>All servicing, waste storage, and mechanical plant positioned on the service side of each building — away from guest and conservation sightlines</li>
    </ul>
  </div>
</div>

<h2>5. Conservation Covenant</h2>
<p>SHER's conservation covenant is a design-intent commitment to maintaining the 46.7% conservation land allocation in perpetuity as part of the estate's DNA. The legal form and enforceability of the covenant will be confirmed in the full land title and conveyancing documentation available at Tier 3. The covenant's purpose is to provide permanent protection against future development encroachment on the conservation zone, regardless of changes in ownership.</p>

<h2>6. EIA Requirements</h2>
<p>An Environmental Impact Assessment (EIA) may be required as part of the DCA planning submission process, depending on the development's scale and the DCA's determination. SHER's project team is preparing for an EIA as part of the planning package. The EIA will be conducted by an independent environmental professional and will assess:</p>
<ul>
  <li>Impact on the RAMSAR-designated wetland and its dependent species;</li>
  <li>Impact on the Pointe Sable EPA;</li>
  <li>Coastal and marine environment impacts;</li>
  <li>Construction-phase environmental management;</li>
  <li>Operational-phase waste, wastewater, and stormwater management;</li>
  <li>Mitigation measures and monitoring programme.</li>
</ul>
<p>The outcome of the EIA process will be a material factor in the planning approval decision and may result in conditions attached to any planning permission granted.</p>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOC 4 — STRUCTURAL MATERIALS & RESILIENCE SUMMARY
// ══════════════════════════════════════════════════════════════════════════
const doc4 = shell('SHER-INV-004-R01', 'Structural Materials &amp; Resilience Summary', 'Tier 2 · Investor Confidential', `
<span class="eyebrow">Investor Tier 2 · Structural &amp; Materials</span>
<h1>Structural Materials &amp; Resilience Summary</h1>
<p class="lead">A summary of the structural strategy, primary materials, and resilience philosophy adopted across all four SHER residential product types. This is a design-intent summary — not a structural engineer's report or independent certification.</p>

<div class="callout">
  <p><strong>Professional limitation:</strong> This document is a design-intent summary drawn from SHER's owner-approved Gate 4 technical documents (CTA-005, VTA-004, CNA-004). It does not constitute structural engineering certification, an engineer's opinion, or confirmation of regulatory compliance. Detailed structural design, geotechnical assessment, and professional certification will be completed as part of the DCA planning submission and construction documentation process.</p>
</div>

<h2>1. Structural Philosophy</h2>
<p>SHER's structural approach is governed by four principles embedded in the Design Charter (SHER-DNA-001-R02):</p>
<ol>
  <li><strong>Hurricane resilience</strong> — every structure must sustain a continuous, engineered load path from roof to foundation, designed to the Saint Lucia Building Code wind load requirements. No decorative element may compromise the structural load path.</li>
  <li><strong>Low site impact</strong> — foundation systems are selected to minimise site disturbance, soil compaction, and drainage impact. Raised-floor or pier-and-pad systems are preferred where ground conditions allow.</li>
  <li><strong>Authentic natural materials</strong> — structural and finish materials are selected for ecological compatibility, long-term durability in a tropical marine environment, and honest weathering. Synthetic cladding systems are excluded.</li>
  <li><strong>Maintainability</strong> — all structural and MEP assemblies must be inspectable, accessible for maintenance, and repairable without specialist plant. No embedded systems that cannot be replaced within normal operational maintenance.</li>
</ol>

<h2>2. Cottage Type A — Structural Strategy</h2>
<div class="product-band"><h3>Hillside Cottage (Type A) · 6 Units · C-01 to C-06</h3><span class="badge">Gate 4 Complete</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Primary Structure</h4>
    <p><strong>Frame:</strong> Marine-protected modular steel posts and beams — hot-dip galvanised or zinc-rich primer + marine epoxy + UV topcoat. Bolted connections, inspectable, isolated from incompatible materials to prevent galvanic corrosion.</p>
    <p><strong>Secondary frame:</strong> Treated timber or engineered timber — softens the steel, supports wall panels, decking, ceilings, and screens.</p>
    <p><strong>Foundation:</strong> Light-touch piers, pads, or micro-piles — type confirmed by geotechnical and structural engineer per plot. Raised construction to protect terrain and drainage.</p>
  </div>
  <div class="col-block">
    <h4>Roof &amp; Envelope</h4>
    <p><strong>Roof form:</strong> Butterfly or split-butterfly — the signature Cottage Type A roof language. Standing-seam or concealed-fix metal in dark bronze, charcoal, or green-black tone. Deep overhangs for shade and wall protection.</p>
    <p><strong>Hurricane connections:</strong> Engineer-designed uplift connections at every rafter/purlin-to-frame junction. No reliance on gravity or adhesive-only connections at roof level.</p>
    <p><strong>Wall system:</strong> Natural stone base, lime/mineral render panels, or stone/timber combination. No synthetic cladding.</p>
  </div>
</div>
<p><strong>Primary finish materials:</strong> Butterfly roof (metal) · Marine steel primary frame · Timber secondary frame and deck · Natural stone / locally sourced stone · Lime render or mineral plaster · Premium hardwood or thermally modified timber · Engineered timber floors</p>

<h2>3. Villa Type A — Structural Strategy</h2>
<div class="product-band"><h3>Villa Type A · 5 Units · V-01 to V-05</h3><span class="badge">Gate 4 Complete</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Primary Structure</h4>
    <p><strong>Frame:</strong> Marine-grade structural system — steel, reinforced masonry, or hybrid as determined by structural engineer for hurricane-rated performance. Primary structural strategy to be confirmed by engineer based on slope, soil, and drainage conditions at each villa plot.</p>
    <p><strong>Foundation:</strong> Confirmed by geotechnical survey per plot. Continuous load path from roof to foundation required.</p>
  </div>
  <div class="col-block">
    <h4>Roof &amp; Envelope</h4>
    <p><strong>Roof form:</strong> Butterfly or mono-pitch — confirmed in detailed design. Hurricane-tied structure with engineer-designed uplift connections. Metal standing-seam or concealed-fix finish in dark bronze or charcoal tone.</p>
    <p><strong>Wall system:</strong> Natural stone base, lime/mineral render, or stone/timber combination. All exterior materials to weather authentically.</p>
    <p><strong>Pool:</strong> Private plunge or lap pool at each villa position. Pool edge, overflow, and landscape integration confirmed in detailed design.</p>
  </div>
</div>
<p><strong>Primary finish materials:</strong> Metal roof · Timber frame and cladding · Natural stone · Lime/mineral render · Clay brick (where structurally appropriate) · Engineered timber floors · Stone or porcelain slab bathrooms</p>

<h2>4. Condo Type A — Structural Strategy</h2>
<div class="product-band"><h3>Condo Type A · 8 Units · Lot E</h3><span class="badge">Gate 4 Complete</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Primary Structure — Steel I-Beam Frame</h4>
    <p>The Condo Type A adopts a <strong>concealed steel I-beam primary frame</strong> — the structural strategy that distinguishes it from the cottage and villa products. The I-beam frame provides maximum clear-span flexibility for the open-plan living areas while achieving the hurricane load path required for a multi-storey residential building in Saint Lucia's wind zone.</p>
    <p>The steel frame is entirely concealed within the building envelope. All visible materials — stone, timber, render — are secondary finish systems applied over the primary steel structure.</p>
  </div>
  <div class="col-block">
    <h4>Envelope &amp; Finishes</h4>
    <p><strong>Roof:</strong> Butterfly or flat/mono-pitch form — appropriate to the stepped courtyard multi-storey configuration. Hurricane-engineered connections throughout.</p>
    <p><strong>Cladding:</strong> Natural stone, lime render, and timber — consistent with the cottage and villa language. The condo's greater scale is expressed through architectural articulation and landscape setting, not different materials.</p>
    <p><strong>Balconies:</strong> Covered private terraces at each unit level — screened for privacy and insect protection without closing the nature connection.</p>
  </div>
</div>
<p><strong>Primary structural materials:</strong> Concealed steel I-beam primary frame (defining structural strategy for Condo Type A) · Secondary timber framing and cladding · Natural stone and lime render · Metal roof · Engineered timber or premium stone floors</p>

<h2>5. Flagship Villa Type B — Structural Basis</h2>
<div class="product-band"><h3>Flagship Villa Type B · 1 Unit · V-06</h3><span class="badge">Individual Brief</span></div>
<p>The Flagship Villa (V-06) is individually designed with its own structural brief. The same hurricane-resilience and natural-materials principles apply. The full structural strategy for V-06 is part of the individual buyer/investor brief available at Tier 3. The structural system will be confirmed by the appointed structural engineer as part of the DCA submission.</p>

<h2>6. Hurricane Resilience — Cross-Product Requirements</h2>
<table>
  <thead><tr><th>Requirement</th><th>Application</th></tr></thead>
  <tbody>
    <tr><td>Continuous load path</td><td>Required for all product types — roof structure tied to wall frame tied to foundation. No break in the structural load path at any connection.</td></tr>
    <tr><td>Uplift connections</td><td>Engineer-designed mechanical uplift connections at all roof-to-frame and frame-to-foundation junctions</td></tr>
    <tr><td>Marine protection</td><td>All exposed steel — hot-dip galvanised or zinc-rich primer system + marine epoxy + UV topcoat; inspectable connections; isolated from dissimilar metals</td></tr>
    <tr><td>Opening protection</td><td>Hurricane-rated glazing systems (sliding, folding, or fixed) with rated frame systems and tested impact resistance. Removable screen systems for insect exclusion.</td></tr>
    <tr><td>Roof cladding</td><td>Standing-seam or concealed-fix metal roof systems — no exposed fasteners that can be lifted by negative pressure under hurricane conditions</td></tr>
    <tr><td>Debris management</td><td>Minimal loose external elements; no lightweight decorative features that become projectiles; landscape planting selected for wind resilience</td></tr>
  </tbody>
</table>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOC 5 — SITE PLAN & RESIDENTIAL PLOT LAYOUT
// ══════════════════════════════════════════════════════════════════════════
const doc5 = shell('SHER-INV-005-R01', 'Site Plan &amp; Residential Plot Layout', 'Tier 2 · Investor Confidential', `
<span class="eyebrow">Investor Tier 2 · Site &amp; Planning</span>
<h1>Site Plan &amp; Residential Plot Layout</h1>
<p class="lead">An investor-safe overview of the SHER estate layout, land parcels, residential plot positions, and conservation zones. Full surveyed drawings, title documents, and detailed plot geometry are available at Tier 3 following NDA execution.</p>

<div class="callout">
  <p><strong>Not a construction or survey document:</strong> This layout summary is based on SHER's owner-approved planning drawings (SHER Approved Current Drawing Set, 22 June 2026) and planning stage documents. It does not constitute a licensed surveyor's plan, a title document, or a construction drawing. Final areas, boundaries, and plot positions are subject to professional survey, planning approval, and title confirmation.</p>
</div>

<h2>1. Estate Overview</h2>
<div class="stat-row">
  <div class="stat-box"><span class="val">204,148</span><div class="lbl">Total estate (sq ft) · 4.69 acres</div></div>
  <div class="stat-box"><span class="val">108,774</span><div class="lbl">Developable area (sq ft) · 2.50 acres</div></div>
  <div class="stat-box"><span class="val">95,374</span><div class="lbl">Conservation zone (sq ft) · 2.19 acres · 46.7%</div></div>
</div>

<div class="stat-row">
  <div class="stat-box"><span class="val">20</span><div class="lbl">Total residences</div></div>
  <div class="stat-box"><span class="val">16</span><div class="lbl">For-sale units</div></div>
  <div class="stat-box"><span class="val">4</span><div class="lbl">SHER-retained units</div></div>
</div>

<h2>2. Estate Location</h2>
<table>
  <thead><tr><th>Item</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Address / locality</td><td>Savannes Bay, Micoud, Saint Lucia, West Indies</td></tr>
    <tr><td>District</td><td>Micoud — southern Saint Lucia</td></tr>
    <tr><td>Distance to Hewanorra International Airport (UVF)</td><td>Approximately 15 minutes by vehicle</td></tr>
    <tr><td>Distance to Micoud town centre</td><td>Approximately 5 minutes by vehicle</td></tr>
    <tr><td>Coastal aspect</td><td>Atlantic / Southern — protected bay with mangrove fringe</td></tr>
    <tr><td>Conservation context</td><td>RAMSAR-designated Savannes Bay Wetlands; Pointe Sable EPA; Scorpion Islet Marine Reserve</td></tr>
  </tbody>
</table>

<h2>3. Estate Parcel Map — Indicative Layout</h2>
<p>The estate is composed of several distinct parcels, each with a defined role in the development programme:</p>
<table>
  <thead><tr><th>Parcel</th><th>Block</th><th>Development Role</th><th>Residential Content</th><th>Acquisition Status</th></tr></thead>
  <tbody>
    <tr><td>Lot 890</td><td>Block 1621B</td><td>Gateway &amp; reception — hospitality pavilion, café, arrival zone, staff, solar, wastewater, estate services</td><td>None (hospitality/infrastructure)</td><td class="status-approved">Purchased — title registration in progress</td></tr>
    <tr><td>Lot F (within Lot 897/905)</td><td>Block 1421B/1621B</td><td>Northern residential zone — cottage cluster</td><td>C-01, C-02, C-03 (Cottage Type A)</td><td class="status-review">Subject to acquisition agreement</td></tr>
    <tr><td>Lot (3) (within Lot 897/905)</td><td>Block 1421B/1621B</td><td>Southern estate — premium residential and retained zone</td><td>C-04–C-10 (Cottages) · V-01–V-06 (Villas)</td><td class="status-review">Subject to acquisition agreement</td></tr>
    <tr><td>Lot E</td><td>Estate</td><td>Condominium parcel — boutique condo building, separate title</td><td>Condo 01–08 (Condo Type A)</td><td class="status-review">Development parcel — subject to planning</td></tr>
    <tr><td>Lot 12 &amp; 13 (lower coastal)</td><td>Block 1421B/1621B</td><td>Mangrove buffer, conservation trail, kayak launch, raised boardwalk — no permanent foundations</td><td>None</td><td class="status-review">Subject to acquisition agreement</td></tr>
    <tr><td>Lot 7 (Lot F / Crown / SLNT)</td><td>Crown / SLNT</td><td>Peninsula eco-tour area — by SLNT agreement. Not owned by SHER. Guided visits only.</td><td>None</td><td class="status-review">Use-rights by SLNT agreement</td></tr>
  </tbody>
</table>

<h2>4. Residential Plot Register</h2>
<p>All 20 residential positions — indicative placement as at ${TODAY}. Plot positions within each zone are based on the approved current drawing set and are subject to DCA planning confirmation.</p>
<table>
  <thead><tr><th>Plot</th><th>Type</th><th>Zone / Parcel</th><th>GFA (sq ft)</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>C-01 to C-03</td><td>Cottage Type A</td><td>Lot F — northern cluster</td><td>900–1,100 per unit</td><td class="status-approved">For sale</td></tr>
    <tr><td>C-04 to C-06</td><td>Cottage Type A</td><td>Lot (3) — southern transition</td><td>900–1,100 per unit</td><td class="status-approved">For sale</td></tr>
    <tr><td>C-07 to C-10</td><td>Cottage Type B</td><td>Lot (3) — retained premium zone</td><td>TBC</td><td class="status-review">SHER-retained — not for sale</td></tr>
    <tr><td>V-01 to V-05</td><td>Villa Type A</td><td>Lot (3) — southern estate, villa cluster</td><td>2,750–3,650 per unit</td><td class="status-approved">For sale</td></tr>
    <tr><td>V-06</td><td>Flagship Villa Type B</td><td>Lot (3) — southernmost, premium bay position</td><td>TBC — bespoke</td><td class="status-approved">For sale — individual brief</td></tr>
    <tr><td>Condo 01–08</td><td>Condo Type A</td><td>Lot E — coastal condominium parcel</td><td>1,020–1,300 per unit</td><td class="status-approved">For sale</td></tr>
  </tbody>
</table>

<h2>5. Estate Sequencing — Phase 1 to Operations</h2>
<table>
  <thead><tr><th>Phase</th><th>Parcels / Zones</th><th>Content</th></tr></thead>
  <tbody>
    <tr><td>Phase 1</td><td>Lot 890 (gateway) · Lot F (C-01–C-03) · Lot E (Condos)</td><td>Gateway infrastructure; 3 northern Cottages; 8 Condominiums; estate road and services Phase 1</td></tr>
    <tr><td>Phase 2</td><td>Lot (3) (C-04–C-10 and Villas)</td><td>Remaining 7 Cottages (C-04–C-10 incl. retained); 5 Villas; Flagship Villa; estate services Phase 2; hospitality soft launch from retained cottages</td></tr>
    <tr><td>Operations</td><td>Full estate</td><td>Formal estate opening; all residential units complete; full hospitality programme; conservation trail and kayak programme live</td></tr>
  </tbody>
</table>

<div class="green-band">
  <p><strong>Full drawing access:</strong> The complete SHER Approved Current Drawing Set (22 June 2026) — including all planning stage sheets, subdivision diagrams, survey control base plan, and detailed plot positions — is available at Tier 3 following NDA execution (SHER-LEGAL-006-R01). Tier 3 also includes the full land title and acquisition documentation.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOC 6 — APPROVED DESIGN BASIS SUMMARY
// ══════════════════════════════════════════════════════════════════════════
const doc6 = shell('SHER-INV-006-R01', 'Approved Design Basis Summary', 'Tier 2 · Investor Confidential', `
<span class="eyebrow">Investor Tier 2 · Design Basis &amp; Product Standard</span>
<h1>Approved Design Basis Summary</h1>
<p class="lead">A summary of the approved design basis for each SHER residential product type, drawn from the owner-approved Gate 1–4 documents. This document demonstrates that all four product types have completed a rigorous internal design approval process and are ready for professional consultant engagement and DCA planning submission.</p>

<div class="callout">
  <p><strong>Not for construction:</strong> All documents referenced and summarised here are design-intent documents approved by the owner. They are not construction drawings, structural calculations, MEP specifications, or regulatory approvals. Professional technical documentation will be produced by appointed consultants during the DCA submission and construction phase.</p>
</div>

<h2>1. Design Gate Process — Overview</h2>
<p>Every SHER residential product type has been taken through a five-gate owner design approval process before DCA planning submission. The gates ensure that the planning application is based on a fully resolved, owner-approved design basis — reducing the risk of material changes post-planning:</p>
<table>
  <thead><tr><th>Gate</th><th>Content</th><th>Output</th></tr></thead>
  <tbody>
    <tr><td>Gate 1 — Product Brief</td><td>Concept, spatial programme, experience intent, conservation controls, size range, materials philosophy</td><td>Architectural Product Brief PDF (owner-approved)</td></tr>
    <tr><td>Gate 2 — Schematic Planning</td><td>Floor plan layouts, spatial relationships, indoor-outdoor connections, orientation, privacy strategy</td><td>Schematic Plan PDF (owner-approved)</td></tr>
    <tr><td>Gate 3 — Elevations &amp; Sections</td><td>External appearance, roof form, wall heights, fenestration, veranda and deck expression, section through key spaces</td><td>Elevations &amp; Sections PDF (owner-approved)</td></tr>
    <tr><td>Gate 4 — Build-Up, MEP &amp; Materials</td><td>Wall, roof, and floor build-up; MEP concealment and routing strategy; material palette; rendering and visual controls; energy and services intent</td><td>Gate 4 Build-Up PDF (owner-approved)</td></tr>
    <tr><td>Gate 5 — Visual Acceptance</td><td>3D render review; visual acceptance record; website/gallery approval; caption and disclaimer controls</td><td>Visual Acceptance Record + Gallery Pack (owner-accepted)</td></tr>
  </tbody>
</table>

<h2>2. Cottage Type A — Gate Summary</h2>
<div class="product-band"><h3>Hillside Cottage (Type A) · C-01–C-06 · 6 For-Sale Units</h3><span class="badge">Gates 1–5 Complete</span></div>
<table>
  <thead><tr><th>Gate</th><th>Document</th><th>Status</th><th>Key Outcomes</th></tr></thead>
  <tbody>
    <tr><td>Gate 1</td><td>SHER-CTA-001 · Architectural Product Brief R01</td><td class="status-approved">Owner Approved — 6 Jul 2026</td><td>One-bedroom sanctuary; 900–1,100 sf total experience area; butterfly roof; marine steel + timber; stone + lime render; conservation controls defined</td></tr>
    <tr><td>Gate 2</td><td>SHER-CTA-002 · Schematic Plan Expanded A R02</td><td class="status-approved">Owner Approved — 6 Jul 2026</td><td>Expanded layout with service zone; indoor-outdoor connection confirmed; veranda, outdoor shower court, screened living zone; privacy strategy per plot</td></tr>
    <tr><td>Gate 3</td><td>SHER-CTA-003 · Elevations &amp; Sections Expanded A R02</td><td class="status-approved">Owner Approved — 6 Jul 2026</td><td>Butterfly roof expression confirmed; wall-to-veranda relationship; screen and glazing system; timber ceiling volume; section through bathing zone</td></tr>
    <tr><td>Gate 4</td><td>SHER-CTA-004 · Build-Up MEP Materials R02</td><td class="status-approved">Owner Approved — 6 Jul 2026</td><td>Marine steel structural strategy; MEP routing and concealment; material palette locked; rendering controls; lighting philosophy; no synthetic cladding</td></tr>
    <tr><td>Gate 5</td><td>SHER-CTA-005 · Visual Acceptance Record R02</td><td class="status-approved">Accepted for Website / Gallery — 6 Jul 2026</td><td>Full render set reviewed and accepted; captions and disclaimers approved; website gallery pack issued</td></tr>
  </tbody>
</table>

<h2>3. Villa Type A — Gate Summary</h2>
<div class="product-band"><h3>Villa Type A · V-01–V-05 · 5 For-Sale Units</h3><span class="badge">Gates 1–5 Complete</span></div>
<table>
  <thead><tr><th>Gate</th><th>Document</th><th>Status</th><th>Key Outcomes</th></tr></thead>
  <tbody>
    <tr><td>Gate 1</td><td>SHER-VTA-001 · Architectural Product Brief R01</td><td class="status-approved">Owner Approved — 7 Jul 2026</td><td>Two/three-bedroom luxury villa; 2,750–3,650 sf; private pool; deep pavilion veranda; full indoor-outdoor living; premium materials</td></tr>
    <tr><td>Gate 2</td><td>SHER-VTA-002 · Schematic Planning Corrected R01</td><td class="status-approved">Owner Approved / Corrected — 7 Jul 2026</td><td>Two plan expressions confirmed: Linear View (panoramic outlook) and Courtyard / Split-Wing (layered privacy); both on hurricane-resilient frame</td></tr>
    <tr><td>Gate 3</td><td>SHER-VTA-003 · Elevations &amp; Sections R01</td><td class="status-approved">Owner Approved — 8 Jul 2026</td><td>External expression for both villa configurations; roof form, wall heights, fenestration, pool terrace relationship confirmed</td></tr>
    <tr><td>Gate 4</td><td>SHER-VTA-004 · Build-Up MEP Materials R01</td><td class="status-approved">Owner Approved — 8 Jul 2026</td><td>Structural strategy per plot; MEP concealment; material palette; pool drainage and landscape integration controls; no synthetic cladding</td></tr>
    <tr><td>Gate 5</td><td>SHER-VTA-005 · Visual Acceptance Record R01</td><td class="status-approved">Accepted for Website / Gallery — 8 Jul 2026</td><td>Full villa render set accepted; captions and disclaimers approved; website gallery pack issued</td></tr>
  </tbody>
</table>

<h2>4. Condo Type A — Gate Summary</h2>
<div class="product-band"><h3>Condo Type A · 8 Units · Lot E</h3><span class="badge">Gates 1–4 Complete · Gate 5 Pending</span></div>
<table>
  <thead><tr><th>Gate</th><th>Document</th><th>Status</th><th>Key Outcomes</th></tr></thead>
  <tbody>
    <tr><td>Gate 1</td><td>SHER-CNA-001 · Architectural Product Brief R01</td><td class="status-approved">Owner Approved — 8 Jul 2026</td><td>Boutique 8-unit eco-luxury condo; 1,020–1,300 sf per unit; steel I-beam primary frame; open-plan living; private balconies; stepped courtyard preferred form</td></tr>
    <tr><td>Gate 2</td><td>SHER-CNA-002 · Schematic Planning R01</td><td class="status-approved">Owner Approved — 8 Jul 2026</td><td>Preferred configuration: Stepped Courtyard. Fallback: Split Pair. Both on I-beam frame strategy. Courtyard provides shared green heart without common corridor.</td></tr>
    <tr><td>Gate 3</td><td>SHER-CNA-003 · Elevations &amp; Sections R01</td><td class="status-approved">Owner Approved — 8 Jul 2026</td><td>External expression for both preferred and fallback; balcony and screen language; roof form; stepped massing for privacy and view separation</td></tr>
    <tr><td>Gate 4</td><td>SHER-CNA-004 · Build-Up MEP Materials R01</td><td class="status-approved">Owner Approved — 8 Jul 2026</td><td>Concealed I-beam structural strategy confirmed; MEP routing within structural bays; material palette consistent with cottage/villa; natural stone and timber cladding over steel frame</td></tr>
    <tr><td>Gate 5</td><td>Visual Acceptance Record</td><td class="status-pending">Pending — working studies under revision</td><td>3D renders in revision (pool proportion, mangrove setback corrections required). Visual acceptance record to be issued on completion of corrections.</td></tr>
  </tbody>
</table>
<p style="font-size:8.5pt;color:var(--muted);font-style:italic">The Condo Type A visual acceptance record will be issued once working render studies are corrected and accepted. The structural and design basis is fully resolved at Gate 4 level. The absence of Gate 5 acceptance does not affect the design or planning basis.</p>

<h2>5. Flagship Villa Type B — Design Status</h2>
<div class="product-band"><h3>Flagship Villa (Type B) · V-06 · 1 Unit · Southernmost Position</h3><span class="badge">Individual Brief · Tier 3</span></div>
<p>The Flagship Villa is a single bespoke residence at the estate's southernmost position, designed individually for the buyer/investor. The same six design pillars and charter controls apply. The full individual design brief for V-06 is part of the Tier 3 package (NDA required). Structural strategy will be confirmed by the appointed engineer following individual brief sign-off.</p>

<h2>6. Governing Design Document — SHER Charter R02</h2>
<p>All four product types are governed by the SHER Sanctuary Design &amp; Experience Charter R02 (SHER-DNA-001-R02, Owner Approved 6 July 2026). The Charter is the supreme design constitution — it controls design intent, visual truthfulness, conservation discipline, material authenticity, and approval gate standards. No design element may be implemented that conflicts with the Charter without a formal owner-approved variation.</p>
<p>The Charter is available in full at Tier 2 as a controlled PDF (GOV-001). A Tier 2 investor summary is included in the investor portal content. The full editable source is internal only.</p>

<div class="green-band">
  <p><strong>Investor confidence note:</strong> The completion of Gates 1–5 across Cottage Type A and Villa Type A, and Gates 1–4 across Condo Type A, before DCA planning submission represents a level of pre-application design resolution that is uncommon in comparable Caribbean development projects. It reduces planning risk, limits post-approval design changes, and gives professional consultants a clear, owner-approved design basis from day one of engagement.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// RENDER ALL DOCS
// ══════════════════════════════════════════════════════════════════════════
const DOCS = [
  { filename: 'SHER-INV-001-R01.pdf', html: doc1 },
  { filename: 'SHER-INV-002-R01.pdf', html: doc2 },
  { filename: 'SHER-INV-003-R01.pdf', html: doc3 },
  { filename: 'SHER-INV-004-R01.pdf', html: doc4 },
  { filename: 'SHER-INV-005-R01.pdf', html: doc5 },
  { filename: 'SHER-INV-006-R01.pdf', html: doc6 },
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
    console.log(`  ✓ ${doc.filename}`);
  }

  await browser.close();
  console.log('\nAll 6 investor Tier 2 PDFs generated.');
})();
