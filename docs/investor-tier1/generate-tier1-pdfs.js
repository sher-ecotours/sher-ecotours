/**
 * SHER Sanctuary — Investor Tier 1 PDF Generator
 * Generates 4 branded investor-facing Tier 1 PDFs using Puppeteer.
 * Run: $env:NODE_PATH = "C:\Users\safep\AppData\Roaming\npm\node_modules"; node generate-tier1-pdfs.js
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

const DISCLAIMER = `This document is provided for preliminary information purposes only and does not constitute a prospectus, securities offering, regulated financial promotion, investment advice, or representation of fact. All figures are preliminary and subject to independent verification. Prospective investors must obtain independent financial, legal and tax advice before making any investment decision. Governed by the laws of Saint Lucia.`;

// ─── SHARED BRAND SHELL ────────────────────────────────────────────────────
function shell(docRef, docTitle, content, opts = {}) {
  const tier = opts.tier || 'Tier 1 · Investor';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${docRef} — ${docTitle}</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --green:   #1B3B36;
    --gold:    #C9A867;
    --gold-dk: #A88540;
    --cream:   #F5F0E8;
    --muted:   #6B7A72;
    --text:    #1A2420;
    --border:  rgba(201,168,103,0.28);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.72; color: var(--text); background: #fff;
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
    font-size: 15pt; font-weight: 500; color: #F5F0E8; line-height: 1.2;
  }
  .doc-body { padding: 26px 36px 14px; }
  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 22pt; font-weight: 500; color: var(--green);
    margin-bottom: 4px; line-height: 1.12;
  }
  h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 14pt; font-weight: 500; color: var(--green);
    margin: 18px 0 7px; padding-bottom: 4px;
    border-bottom: 1.5px solid var(--border);
  }
  h3 { font-size: 9.5pt; font-weight: 600; color: var(--green); margin: 12px 0 4px; text-transform: uppercase; letter-spacing: 0.05em; }
  p { margin-bottom: 7px; }
  ul { padding-left: 18px; margin-bottom: 7px; }
  ul li { margin-bottom: 3px; }
  ol { padding-left: 18px; margin-bottom: 7px; }
  ol li { margin-bottom: 3px; }
  .lead {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 12pt; font-style: italic; color: var(--muted);
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
  .green-band h3 { color: var(--gold); text-transform: none; letter-spacing: 0; font-size: 11pt; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9pt; }
  thead tr { background: var(--green); color: #F5F0E8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  thead th { padding: 7px 10px; text-align: left; font-size: 8.5pt; font-weight: 600; }
  tbody tr { border-bottom: 1px solid rgba(201,168,103,0.18); }
  tbody tr:nth-child(even) { background: rgba(245,240,232,0.5); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  tbody td { padding: 6px 10px; vertical-align: top; }
  .stat-row {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 14px 0;
  }
  .stat-row-2 {
    display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin: 14px 0;
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
  .pillar-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 10px 0; }
  .pillar-box {
    border-left: 3px solid var(--gold); background: var(--cream);
    padding: 8px 12px; border-radius: 0 4px 4px 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .pillar-box .num { font-size: 7pt; font-weight: 700; color: var(--gold-dk); letter-spacing: 0.1em; text-transform: uppercase; }
  .pillar-box .name { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 12pt; font-weight: 600; color: var(--green); line-height: 1.1; }
  .pillar-box .desc { font-size: 8pt; color: var(--muted); margin-top: 2px; line-height: 1.5; }
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
  .experience-card {
    border: 1.5px solid var(--border); border-radius: 6px;
    padding: 14px 16px; margin: 8px 0;
    background: var(--cream);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .experience-card h4 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13pt; font-weight: 600; color: var(--green); margin-bottom: 4px;
  }
  .experience-card p { font-size: 9pt; color: var(--muted); margin-bottom: 0; line-height: 1.6; }
  .timeline-row {
    display: flex; gap: 0; margin: 10px 0;
  }
  .timeline-item {
    flex: 1; text-align: center; position: relative;
  }
  .timeline-item::after {
    content: '→'; position: absolute; right: -8px; top: 50%; transform: translateY(-50%);
    color: var(--gold-dk); font-size: 11pt;
  }
  .timeline-item:last-child::after { display: none; }
  .timeline-dot {
    width: 12px; height: 12px; border-radius: 50%;
    background: var(--gold); margin: 0 auto 5px;
    border: 2px solid var(--green);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .timeline-dot--pending { background: rgba(201,168,103,0.3); }
  .timeline-label { font-size: 8pt; font-weight: 600; color: var(--green); }
  .timeline-sub { font-size: 7.5pt; color: var(--muted); margin-top: 1px; }
  .tier-path {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin: 14px 0;
  }
  .tier-card {
    text-align: center; padding: 14px 10px;
    border: 1.5px solid var(--border); border-radius: 6px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .tier-card.active { background: var(--green); border-color: var(--gold); }
  .tier-card.active .tier-num { color: var(--gold); }
  .tier-card.active .tier-name { color: #F5F0E8; }
  .tier-card.active .tier-desc { color: rgba(245,240,232,0.7); }
  .tier-num { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 22pt; font-weight: 600; color: var(--green); line-height: 1; }
  .tier-name { font-size: 8.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--green); margin: 4px 0 6px; }
  .tier-desc { font-size: 8pt; color: var(--muted); line-height: 1.5; }
  .doc-footer {
    margin-top: 20px; padding: 12px 36px 14px;
    border-top: 2px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 7pt; color: var(--muted);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc-footer .ref-block strong { color: var(--green); font-size: 7.5pt; display: block; margin-bottom: 2px; }
  .footer-disclaimer { max-width: 430px; font-size: 6.5pt; line-height: 1.5; font-style: italic; color: var(--muted); text-align: right; }
  .cover-page {
    min-height: 100vh; display: flex; flex-direction: column; justify-content: center;
    background: var(--green); padding: 60px 50px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cover-page img.logo { height: 64px; width: auto; margin-bottom: 60px; }
  .cover-eyebrow { font-size: 10pt; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 24px; }
  .cover-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 38pt; font-weight: 300; color: #F5F0E8; line-height: 1.1; margin-bottom: 24px;
  }
  .cover-subtitle {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 16pt; font-style: italic; color: rgba(245,240,232,0.65); margin-bottom: 40px; line-height: 1.4;
  }
  .cover-divider { border: none; border-top: 1px solid rgba(201,168,103,0.4); margin: 32px 0; }
  .cover-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .cover-meta-item .label { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(201,168,103,0.7); margin-bottom: 5px; }
  .cover-meta-item .value { font-size: 11pt; color: #F5F0E8; font-family: 'Cormorant Garamond', Georgia, serif; }
  .cover-footer { margin-top: auto; padding-top: 40px; }
  .cover-footer p { font-size: 8pt; color: rgba(245,240,232,0.45); line-height: 1.6; font-style: italic; }
  .cover-badge {
    display: inline-block; background: var(--gold); color: var(--green);
    font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 3px; margin-bottom: 16px;
  }
  .page-break { page-break-after: always; }
  .image-frame {
    border: 1.5px solid var(--border); border-radius: 6px;
    background: rgba(245,240,232,0.4); aspect-ratio: 16/10;
    display: flex; align-items: center; justify-content: center;
    flex-direction: column; gap: 8px; margin: 10px 0; padding: 20px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .image-frame .frame-label { font-size: 10pt; font-weight: 600; color: var(--green); text-align: center; }
  .image-frame .frame-ref { font-size: 8pt; color: var(--muted); text-align: center; font-style: italic; }
  .image-frame .frame-icon { font-size: 28pt; color: rgba(201,168,103,0.4); }
  .image-caption {
    font-size: 8pt; color: var(--muted); font-style: italic; text-align: center;
    margin-top: 4px; line-height: 1.5;
  }
  .image-disclaimer {
    background: rgba(245,240,232,0.6); border-left: 2px solid var(--gold);
    padding: 6px 10px; font-size: 7.5pt; color: var(--muted); font-style: italic;
    margin: 8px 0 12px; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .map-frame {
    border: 1.5px solid var(--border); border-radius: 6px;
    margin: 10px 0; overflow: hidden;
  }
  .map-inner { padding: 20px; background: rgba(245,240,232,0.3); }
  .svgmap { width: 100%; }
  .status-confirmed  { color: #1B3B36; font-weight: 600; }
  .status-mou        { color: #7A6020; font-style: italic; }
  .status-negotiation { color: #8B6914; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
${content}
</body>
</html>`;
}

function footer(docRef) {
  return `
<div class="doc-footer">
  <div class="ref-block">
    <strong>${docRef} · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor Tier 1<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>`;
}

// ══════════════════════════════════════════════════════════════════════════
// DOC 1 — PROJECT OVERVIEW & VISION
// ══════════════════════════════════════════════════════════════════════════
const doc1Content = `

<!-- ── COVER PAGE ── -->
<div class="cover-page">
  <img src="${LOGO_B64}" alt="SHER Sanctuary Experiences" class="logo">

  <div class="cover-badge">Tier 1 · Investor Confidential</div>
  <p class="cover-eyebrow">Project Overview &amp; Vision</p>
  <h1 class="cover-title">SHER Sanctuary<br>Experiences</h1>
  <p class="cover-subtitle">
    "Where nature is the asset.<br>Conservation is the discipline."
  </p>

  <hr class="cover-divider">

  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="label">Location</div>
      <div class="value">Savannes Bay, Micoud<br>Saint Lucia, West Indies</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Document Reference</div>
      <div class="value">SHER-INV-T1-001-R01</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Issued</div>
      <div class="value">${TODAY}<br>Rev R01</div>
    </div>
  </div>

  <div class="cover-footer">
    <p>This document is issued to Tier 1 investors by ${ENTITY} (${REG}) trading as SHER Sanctuary Experiences. It is private, non-circulating, and does not constitute a securities offering or investment advice. All financial figures are preliminary and require independent verification.</p>
  </div>
</div>

<div class="page-break"></div>

<!-- ── PAGE 2 — THE OPPORTUNITY ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 01 · The Opportunity</span>
<h1>A Rare Convergence of Nature and Capital</h1>
<p class="lead">Savannes Bay is one of Saint Lucia's most ecologically significant coastal environments. SHER Sanctuary Experiences is building a conservation-led eco-luxury residential estate at its edge — not in spite of that significance, but because of it.</p>

<p>The bay and its surrounding wetland meet a convergence of designations that make the site irreplaceable: RAMSAR Convention protection, the Pointe Sable Environmental Protection Area, and the Scorpion Islet Marine Reserve. No comparable site with this combination of ecological designation, access, and development potential exists elsewhere on the southern Saint Lucia coastline.</p>

<p>The SHER estate sits at the interface between this protected ecosystem and the Micoud hillside — a 4.69-acre position that allows a disciplined residential programme while permanently protecting 46.7% of the estate as conservation land. The residential programme is not the reason the land is valuable. The land is valuable because of what surrounds and penetrates it: living mangrove, protected bay, a RAMSAR wetland in daily ecological function.</p>

<div class="stat-row">
  <div class="stat-box">
    <span class="val">RAMSAR</span>
    <div class="lbl">Wetland of International<br>Importance · Designated 2002</div>
  </div>
  <div class="stat-box">
    <span class="val">1,038 ha</span>
    <div class="lbl">Pointe Sable Environmental<br>Protection Area</div>
  </div>
  <div class="stat-box">
    <span class="val">~15 min</span>
    <div class="lbl">Hewanorra International<br>Airport (UVF)</div>
  </div>
</div>

<h2>Why Savannes Bay</h2>
<p>Savannes Bay is located on the southern Atlantic coast of Saint Lucia, in the Micoud district — approximately 15 minutes from Hewanorra International Airport. It is one of the few remaining Caribbean locations where a conservation-quality coastal wetland, a protected marine reserve, and a highland residential position coexist within a single site boundary.</p>

<p>The bay's ecological health is exceptional by Caribbean standards. The mangrove fringe is intact. The Scorpion Islet Marine Reserve protects the bay's reef and seagrass system. Migratory bird species use the RAMSAR wetland seasonally. This ecological richness is not a constraint — it is the differentiator that gives SHER residences their long-term scarcity value.</p>

<div class="callout">
  <p><strong>Investment context:</strong> The Caribbean luxury real estate market has consistently demonstrated that proximity to protected natural environments — genuine ecological protection, not greenwash — commands sustained price premiums. Scarcity that cannot be replicated by a competitor is structural. At Savannes Bay, that scarcity is written into international treaty law.</p>
</div>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 3 — THE ESTATE ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 02 · The Estate</span>
<h1>4.69 Acres at Savannes Bay</h1>

<div class="stat-row">
  <div class="stat-box">
    <span class="val">204,148</span>
    <div class="lbl">Total estate area (sq ft)<br>4.69 acres</div>
  </div>
  <div class="stat-box">
    <span class="val">108,774</span>
    <div class="lbl">Developable area (sq ft)<br>2.50 acres</div>
  </div>
  <div class="stat-box">
    <span class="val">95,374</span>
    <div class="lbl">Conservation zone (sq ft)<br>2.19 acres · 46.7%</div>
  </div>
</div>

<p>The SHER estate is composed of five parcels, each with a defined role in the development and conservation programme. The estate is designed as an integrated whole — not a collection of plots. Every parcel boundary reflects an ecological or programming decision, not an administrative legacy.</p>

<h2>The Five Parcels</h2>
<table>
  <thead><tr><th>Parcel</th><th>Role</th><th>Area</th><th>Acquisition Status</th></tr></thead>
  <tbody>
    <tr><td><strong>Lot 890</strong></td><td>Anchor gateway — reception pavilion, café, estate services, solar infrastructure, wastewater management, staff facilities</td><td>Estate services zone</td><td class="status-confirmed">Purchased · title registration in progress</td></tr>
    <tr><td><strong>Lot 897</strong></td><td>Upper residential zone — Cottage Type A cluster (northern), primary estate road and landscaping</td><td>Residential / infrastructure</td><td class="status-mou">Under acquisition agreement</td></tr>
    <tr><td><strong>Lot 905</strong></td><td>Mid-slope — secondary residential zone (Cottages and Villas, southern cluster); <strong>voluntary no-build conservation covenant applies to conservation portion</strong></td><td>Residential + conservation</td><td class="status-mou">Under acquisition agreement</td></tr>
    <tr><td><strong>Parcel 12</strong></td><td>Lower coastal access corridor — mangrove buffer, conservation trail, kayak launch, raised boardwalk. No permanent foundations.</td><td>Conservation / access</td><td class="status-negotiation">Under negotiation</td></tr>
    <tr><td><strong>Parcel 13</strong></td><td>Waterfront — bay edge, mangrove fringe, tidal zone. Conservation only.</td><td>Conservation · no build</td><td class="status-negotiation">Under negotiation</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>Conservation covenant — Lot 905:</strong> The no-build conservation commitment on the conservation portion of Lot 905 is a voluntary corporate decision by Safeport Security Services Limited. It is not a condition imposed by any regulatory authority, nor is it the result of planning restrictions. It is a statement of conservation discipline: this land will not be offered for development regardless of any future planning permission that might theoretically allow it. This permanence is the source of the conservation covenant's value — it is irreversible by design.</p>
</div>

<p>The 20-residence programme is contained entirely within the 108,774 sq ft developable area. The conservation zone — 95,374 sq ft / 46.7% of the total estate — will never carry a building.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 4 — THE VISION ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 03 · The Vision</span>
<h1>Conservation-Led Eco-Luxury</h1>
<p class="lead">SHER is not a luxury resort that uses conservation as a marketing device. It is a conservation project that has found a financially viable structure. That distinction governs every design decision on the estate.</p>

<p>The SHER Sanctuary Design &amp; Experience Charter (R02, Owner Approved 6 July 2026) is the constitutional document of the estate. Every architectural, operational, and materials decision is subordinate to the Charter. No element of the estate may be implemented that conflicts with its six design pillars.</p>

<h2>The Six Design Pillars</h2>
<div class="pillar-grid">
  <div class="pillar-box">
    <div class="num">Pillar 01</div>
    <div class="name">Preservation</div>
    <div class="desc">Low-footprint construction; no clearing beyond the residential zone; drainage contained away from the conservation boundary; raised foundations on the hillside plots to protect terrain and natural drainage flows.</div>
  </div>
  <div class="pillar-box">
    <div class="num">Pillar 02</div>
    <div class="name">Wellness</div>
    <div class="desc">Natural materials for indoor air quality; screened-glazed nature connection that does not require habitat disturbance; thermal comfort through passive design and natural ventilation rather than mechanical cooling dependency.</div>
  </div>
  <div class="pillar-box">
    <div class="num">Pillar 03</div>
    <div class="name">Tranquillity</div>
    <div class="desc">No vehicle dominance in guest areas; no audible mechanical noise at the conservation boundary; night-time calm enforced by controlled exterior lighting protocol — no spillover into the wetland or marine edge.</div>
  </div>
  <div class="pillar-box">
    <div class="num">Pillar 04</div>
    <div class="name">Luxury</div>
    <div class="desc">Premium materials that weather authentically and require no synthetic treatments; durable maintenance regimes that introduce no harmful chemicals near the wetland; the quality of simplicity — not the complexity of ornamentation.</div>
  </div>
  <div class="pillar-box">
    <div class="num">Pillar 05</div>
    <div class="name">Safety &amp; Resilience</div>
    <div class="desc">Hurricane-rated construction with continuous load path from roof to foundation; sealed buildings to exclude bats and insects without harmful treatments; wastewater management that prevents any contamination of the wetland buffer or bay.</div>
  </div>
  <div class="pillar-box">
    <div class="num">Pillar 06</div>
    <div class="name">Rebirth &amp; Identity</div>
    <div class="desc">SHER's conservation ethic as a commercial differentiator — a sanctuary that communicates renewal and authentic connection to Saint Lucian nature, not the displacement of it. The brand proposition is the ecology itself.</div>
  </div>
</div>

<h2>What SHER Is Not</h2>
<p>SHER is not a conventional Caribbean resort development. It is not designed around pools, beach clubs, nightlife, or high-density occupancy. It does not seek planning permissions to maximise buildable area. It does not adopt natural materials as an aesthetic choice — they are a structural and ecological commitment. The conservation boundary is not a selling feature that can be quietly renegotiated if a buyer prefers otherwise. These are not restrictions. They are the source of the project's long-term value.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 5 — RESIDENTIAL COLLECTION ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 04 · The Residential Collection</span>
<h1>20 Residences · Three Typologies</h1>
<p class="lead">SHER's residential collection is intentionally small. Twenty residences across three distinct types — each designed to express the same conservation DNA through a different spatial experience. No two positions are identical.</p>

<div class="product-band"><h3>Hillside Cottage Type A · 6 For-Sale Units · C-01 to C-06</h3><span class="badge">Phase 1</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Spatial Experience</h4>
    <p>One-bedroom sanctuary, 900–1,100 sq ft total experience area. Butterfly or split-butterfly roof — the defining form of the Cottage Type A. Veranda, outdoor shower court, screened living zone. The cottage reads as a crafted shelter within the hillside — not placed on it.</p>
  </div>
  <div class="col-block">
    <h4>Position &amp; Context</h4>
    <p>Positioned on the northern and southern slopes of the SHER estate with hillside views across the bay and conservation zone. Each plot elevated above the conservation boundary — privacy and aspect guaranteed by topography, not fencing.</p>
    <p style="font-size:8pt;color:var(--muted);margin-top:4px">C-07 to C-10 (4 units Cottage Type B) are SHER-retained — not for sale. Retained units form SHER's hospitality programme.</p>
  </div>
</div>

<div class="product-band"><h3>Boutique Condo Type A · 8 For-Sale Units · Condo 01–08</h3><span class="badge">Phase 1 / 2</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Spatial Experience</h4>
    <p>Open-plan eco-luxury condominium, 1,020–1,300 sq ft per unit. Concealed steel I-beam primary structural frame — the structural strategy that allows maximum clear-span living areas. Private covered terrace at each level. Stepped courtyard preferred configuration.</p>
  </div>
  <div class="col-block">
    <h4>Position &amp; Context</h4>
    <p>Located on Lot E — the coastal condominium parcel at the base of the estate, closest to the conservation trail and kayak launch. Bay aspect from upper-floor units. Stone, timber, and lime render over the concealed steel frame — materials consistent across all SHER typologies.</p>
  </div>
</div>

<div class="product-band"><h3>Villa Type A · 5 Units + 1 Flagship · V-01 to V-06</h3><span class="badge">Phase 2</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Spatial Experience</h4>
    <p>Two- to three-bedroom estate villa, 2,750–3,650 sq ft. Private plunge or lap pool. Deep pavilion veranda. Two configuration expressions: Linear View (panoramic bay outlook) and Courtyard/Split-Wing (layered privacy for hillside plots). V-06 is the Flagship Villa — individually designed, price on application.</p>
  </div>
  <div class="col-block">
    <h4>Position &amp; Context</h4>
    <p>Southern estate positions — premium southernmost bay views. Each villa on its own plot with sufficient separation to guarantee visual and acoustic privacy. V-06 occupies the estate's most southerly and most coveted position.</p>
  </div>
</div>

<div class="stat-row">
  <div class="stat-box"><span class="val">20</span><div class="lbl">Total residences on estate</div></div>
  <div class="stat-box"><span class="val">16</span><div class="lbl">For-sale residences<br>(4 SHER-retained)</div></div>
  <div class="stat-box"><span class="val">3</span><div class="lbl">Distinct typologies<br>Cottage · Condo · Villa</div></div>
</div>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 6 — EXPERIENCE PROGRAMME ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 05 · The Experience Programme</span>
<h1>Living the Sanctuary</h1>
<p class="lead">The SHER experience programme is not an amenity list. It is the operational expression of the conservation covenant — every experience is designed around the bay's ecology, not in spite of it.</p>

<div class="experience-card">
  <h4>Scorpio's Secret — Kayak &amp; Snorkel</h4>
  <p>Guided kayak journey across Savannes Bay to Scorpion Islet. Zero-emission vessels; maximum six guests per departure; one landing per day on the islet to protect the nesting environment. The experience is choreographed around tidal and light conditions — no two departures are identical. Guests are told what they can do, and what they must not. The restrictions are part of what makes it rare.</p>
</div>

<div class="experience-card">
  <h4>Table d'Eau — Bay Dining</h4>
  <p>Intimate dining at or beside the water's edge — a curated table that responds to the bay's rhythms. Seasonal menu, locally sourced. Not a restaurant: a single table experience with timing driven by tide, light, and the day's conditions. Operated from SHER's retained Lot 890 gateway infrastructure, available to both residents and vetted outside guests.</p>
</div>

<div class="experience-card">
  <h4>Mangrove Immersion Trail</h4>
  <p>A guided walk through SHER's conservation corridor — raised boardwalk sections, mangrove interpretation, RAMSAR wetland ecology. Designed in consultation with the Saint Lucia National Trust. The trail exists to make the conservation zone legible to guests and residents: not a walk past nature, but a walk within it. Available to residents and to approved educational and conservation partners.</p>
</div>

<div class="callout">
  <p><strong>Zero-emission experience design:</strong> All watercraft are non-motorised — kayaks and canoes only. No motorised vessels are permitted within SHER's operational programme on Savannes Bay. One landing per day on Scorpion Islet is a self-imposed operational limit, regardless of booking demand. These constraints are not regulatory — they are operational ethics, enforced at the booking level.</p>
</div>

<p>The experience programme operates from the Lot 890 gateway infrastructure and from SHER's four retained Cottage Type B units. Hospitality revenue is independent of residential for-sale revenue and is capitalised and operated separately from the residential development programme.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 7 — CONSERVATION COMMITMENT ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 06 · Conservation Commitment</span>
<h1>46.7% Permanently Protected</h1>
<p class="lead">Conservation at SHER is not a planning condition to be managed or a marketing claim to be qualified in the small print. It is a foundational corporate commitment that predates and will outlast the current development phase.</p>

<div class="stat-row">
  <div class="stat-box"><span class="val">95,374</span><div class="lbl">Conservation zone (sq ft)<br>2.19 acres</div></div>
  <div class="stat-box"><span class="val">46.7%</span><div class="lbl">Proportion of total estate<br>permanently protected</div></div>
  <div class="stat-box"><span class="val">0</span><div class="lbl">Buildings permitted<br>in conservation zone · ever</div></div>
</div>

<h2>The Covenant</h2>
<p>The conservation portion of Lot 905 — 95,374 sq ft / 2.19 acres — is subject to a voluntary no-build covenant held by Safeport Security Services Limited. This is not a condition imposed by the Development Control Authority, the Saint Lucia National Trust, or any other regulatory body. It is a unilateral corporate commitment made as a statement of conservation discipline.</p>

<p>The covenant means this land will never be offered for residential, commercial, or hospitality development — regardless of what future planning permissions might theoretically allow. It is designed to be permanent, not conditional on market conditions, project ownership, or investor preference. The legal form of the covenant and its enforceability in perpetuity are documented at Tier 3.</p>

<h2>RAMSAR Context</h2>
<p>Savannes Bay Wetlands were designated under the Ramsar Convention on Wetlands in 2002, recognising their international importance as habitat for migratory birds, coastal fish nurseries, and mangrove ecosystem services. The Convention designation is binding on Saint Lucia as a signatory state — it is not a local planning classification that can be varied.</p>
<p>The Pointe Sable Environmental Protection Area (1,038 hectares) provides additional statutory protection at the national level. SHER's conservation covenant exceeds the minimum protection required by these statutory frameworks.</p>

<h2>What This Means for Scarcity Value</h2>
<p>Scarcity that derives from statutory ecological protection — RAMSAR, EPA, marine reserve — cannot be manufactured by a developer and cannot be removed by a future owner. It is the most durable form of residential scarcity in the Caribbean market. Every residence at SHER derives part of its value from what can never be built beside it. The conservation zone is not a sacrifice of development potential — it is the source of the development's long-term value.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 8 — CONSTRUCTION PHILOSOPHY ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 07 · Construction Philosophy</span>
<h1>Materials That Earn Their Place</h1>
<p class="lead">SHER's construction approach is governed by the same discipline as its conservation commitment. Every material must earn its place: structurally, ecologically, and aesthetically. There are no shortcuts and no synthetic substitutes.</p>

<h2>The Approved Material Palette</h2>
<table>
  <thead><tr><th>Material</th><th>Role</th><th>Why SHER Uses It</th></tr></thead>
  <tbody>
    <tr><td><strong>Marine-grade steel</strong></td><td>Primary structural frame (all typologies); concealed I-beam in Condo Type A</td><td>Hurricane load path — the only material that reliably delivers a continuous structural load path from roof to foundation in a Saint Lucia wind zone. Hot-dip galvanised + marine epoxy coating for tropical marine durability.</td></tr>
    <tr><td><strong>Treated timber</strong></td><td>Secondary frame, decking, ceilings, screens, joinery</td><td>Warmth, workability, thermal comfort in tropical climates. Treated for durability without synthetic treatments in guest-occupied spaces. Premium or engineered timber grades throughout.</td></tr>
    <tr><td><strong>Natural stone</strong></td><td>Base courses, wall panels, feature elements</td><td>Locally sourced volcanic stone — authentic Saint Lucian materiality, thermal mass, durability. Does not require painting or surface treatment.</td></tr>
    <tr><td><strong>Lime render</strong></td><td>Internal and external wall finish</td><td>Breathable, anti-microbial, and compatible with the humid tropical climate. Does not trap moisture behind the wall surface. Historical track record in the Caribbean. Low embodied carbon.</td></tr>
    <tr><td><strong>Reclaimed timber</strong></td><td>Joinery, feature elements, furniture-quality detailing</td><td>Authenticity of material history. Zero additional embodied carbon for the reclaimed element. Selected pieces only — not a wholesale structural material.</td></tr>
    <tr><td><strong>Metal roofing</strong></td><td>Standing-seam or concealed-fix metal roof system</td><td>Hurricane resilience — no exposed fasteners that can be lifted by negative pressure under storm conditions. Dark bronze, charcoal, or green-black tone consistent with conservation sightline controls.</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>What SHER does not use:</strong> Hemp block, compressed earth, synthetic cladding systems, floodlighting directed toward the conservation boundary, or any material that requires chemical treatment in proximity to the wetland. The material specification is a conservation control, not an aesthetic choice.</p>
</div>

<p>Independent structural certifications and detailed build-up specifications for all four product types are available at Tier 2. Detailed structural engineering — geotechnical assessment, professional certifications, load calculations — will be completed by appointed consultants as part of the DCA planning submission.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 9 — MARKET POSITION ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 08 · Market Position</span>
<h1>Why Savannes Bay. Why Now.</h1>
<p class="lead">SHER is not a response to a market trend. It is a position taken on what sustainable value means in the Caribbean residential market over the next decade.</p>

<h2>The Differentiation Argument</h2>
<p>The Caribbean luxury residential market is mature and competitive. It has produced exceptional projects in Barbados, St Barts, Turks and Caicos, and northern Saint Lucia. The segment that remains under-served is conservation-authentic eco-luxury: residences where the ecological context is not manufactured by a designer but is the result of statutory, permanent protection — and where the development discipline is enforced by constitutional design controls, not just marketing claims.</p>

<p>SHER occupies this position. Its differentiation is not claims — it is structure. The RAMSAR designation cannot be bought or replicated. The conservation covenant cannot be watered down by a future planning application. The Scorpion Islet Marine Reserve is not a marketing name — it is a statutory designation that ensures the marine environment adjacent to SHER will remain protected regardless of development pressure elsewhere on the island.</p>

<div class="two-col">
  <div class="col-block">
    <h4>What the Market Rewards</h4>
    <ul>
      <li>Irreplaceable ecological position</li>
      <li>Conservative scale — 20 residences, not 200</li>
      <li>Conservation covenant with legal permanence</li>
      <li>Authentic local materials and construction philosophy</li>
      <li>Access to a RAMSAR wetland experience that cannot be accessed anywhere else in Saint Lucia on equivalent terms</li>
      <li>15-minute proximity to international air access</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>What Savannes Bay Is Not</h4>
    <ul>
      <li>Not a resort — no hotel component, no transient occupancy model</li>
      <li>Not high-density — 20 units on 4.69 acres is deliberately low</li>
      <li>Not a branded residence programme tied to an international hotel flag</li>
      <li>Not speculative land subdivision without a conservation basis</li>
      <li>Not dependent on regional tourism growth to sustain value</li>
      <li>Not exposed to the same competitive dynamics as northern Saint Lucia resort properties</li>
    </ul>
  </div>
</div>

<div class="green-band">
  <h3>The Long-Term Thesis</h3>
  <p>Ecological scarcity compounds. The Savannes Bay wetland will be more protected, not less, as climate and biodiversity policy tightens internationally. The residences at its edge will be rarer — not more common — as the decade progresses. SHER is positioned at the intersection of conservation scarcity and Caribbean residential demand at the precise moment when the market is beginning to price that scarcity premium correctly.</p>
</div>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 10 — PROJECT STATUS & TIMELINE ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 09 · Project Status &amp; Timeline</span>
<h1>Where We Are Now</h1>

<div class="callout">
  <p><strong>Planning status:</strong> DCA planning permission has not yet been granted. SHER is in the pre-application and design resolution phase. All four residential product types have completed owner-approved design gates (Gates 1–5 for Cottage and Villa; Gates 1–4 for Condo). The planning application will be submitted to the DCA on the basis of this fully resolved design programme. No construction may commence until DCA approval is granted.</p>
</div>

<h2>Land Acquisition</h2>
<table>
  <thead><tr><th>Parcel</th><th>Status</th><th>Note</th></tr></thead>
  <tbody>
    <tr><td><strong>Lot 890</strong> — Gateway anchor parcel</td><td class="status-confirmed">Purchased</td><td>Title registration in progress. This is the estate's operational core — reception, services, infrastructure.</td></tr>
    <tr><td><strong>Lot 897</strong> — Upper residential</td><td class="status-mou">Under acquisition agreement</td><td>MOU / heads of terms agreed. Full acquisition subject to legal completion.</td></tr>
    <tr><td><strong>Lot 905</strong> — Mid-slope residential + conservation</td><td class="status-mou">Under acquisition agreement</td><td>Conservation covenant applies to conservation portion. Full acquisition subject to legal completion.</td></tr>
    <tr><td><strong>Parcels 12 &amp; 13</strong> — Conservation corridor + waterfront</td><td class="status-negotiation">Under negotiation</td><td>Conservation-only use. No permanent structures.</td></tr>
  </tbody>
</table>

<h2>Development Timeline — Indicative</h2>
<table>
  <thead><tr><th>Phase</th><th>Activities</th><th>Indicative Period</th></tr></thead>
  <tbody>
    <tr><td><strong>Pre-construction</strong></td><td>DCA planning application; regulatory consultations (SLNT, Fisheries, DSD); land acquisition completion; contractor procurement; infrastructure design</td><td>Q3–Q4 2026</td></tr>
    <tr><td><strong>Phase 1</strong></td><td>Lot 890 gateway infrastructure; Cottage Type A C-01–C-06; Condo Type A (8 units); estate road and services Phase 1</td><td>Q1–Q3 2027 (12–18 months)</td></tr>
    <tr><td><strong>Phase 2</strong></td><td>Villa Type A V-01–V-05 + Flagship V-06; Cottages C-07–C-10 (retained); estate infrastructure Phase 2; hospitality soft launch</td><td>Q4 2027–Q2 2028 (12–18 months)</td></tr>
    <tr><td><strong>Operations</strong></td><td>Formal estate opening; all residences complete; experience programme live; conservation trail and kayak programme operational</td><td>Q3 2028 target</td></tr>
  </tbody>
</table>

<p style="font-size:8pt;color:var(--muted);font-style:italic">All timelines are indicative. They are conditional on DCA approval, land acquisition completion, construction programme, and market conditions. No timeline is guaranteed and none should be relied upon as a commitment by Safeport Security Services Limited.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 11 — THE TEAM & ENTITY ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 10 · The Team &amp; Legal Entity</span>
<h1>Safeport Security Services Limited</h1>

<h2>The Legal Entity</h2>
<table>
  <thead><tr><th>Item</th><th>Detail</th></tr></thead>
  <tbody>
    <tr><td>Registered name</td><td>Safeport Security Services Limited</td></tr>
    <tr><td>Registration number</td><td>2016-C251</td></tr>
    <tr><td>Jurisdiction</td><td>Saint Lucia, West Indies</td></tr>
    <tr><td>Trading name</td><td>SHER Sanctuary Experiences</td></tr>
    <tr><td>Website</td><td>shersanctuary.com</td></tr>
    <tr><td>Contact</td><td>bookings@shersanctuary.com</td></tr>
  </tbody>
</table>

<h2>The Management Team</h2>
<div class="two-col">
  <div class="col-block">
    <h4>Kemble Emanuel — Managing Director</h4>
    <p>Founder and Managing Director of Safeport Security Services Limited. Responsible for project vision, investor relations, development strategy, and conservation commitment. The SHER Sanctuary Design &amp; Experience Charter and the voluntary conservation covenant are commitments held at the Managing Director level — they are not delegated to subcontractors or external advisors.</p>
  </div>
  <div class="col-block">
    <h4>Operational Team</h4>
    <p><strong>Lead Guide (Sabina)</strong> — Guides the Scorpio's Secret, Mangrove Immersion, and bay experiences. Deep local ecological knowledge; trained and certified in marine safety and guided nature experiences.</p>
    <p style="margin-top:8px"><strong>Marine Safety Officer</strong> — On-water safety, vessel maintenance, and maritime compliance for all kayak and canoe operations on Savannes Bay.</p>
    <p style="margin-top:8px"><strong>Shore Safety Officer</strong> — Guest safety on land, trail management, conservation zone monitoring, and estate security.</p>
  </div>
</div>

<div class="callout">
  <p><strong>Professional appointments:</strong> Architect of record, structural engineer, civil engineer, and environmental consultant appointments for the DCA planning submission are to be confirmed. SHER is at the stage of engaging these professionals on the basis of the owner-approved design programme. The gate approval process (Gates 1–5) was completed before professional appointments to ensure the planning application is built on a fully resolved owner-approved design basis — not re-iterated during the professional engagement.</p>
</div>

<p>Full governance documentation, directorship confirmations, and constitutional documents for the project SPV are available at Tier 3 following NDA execution.</p>

</div>
${footer('SHER-INV-T1-001-R01')}

<div class="page-break"></div>

<!-- ── PAGE 12 — NEXT STEPS + DISCLAIMER ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-001-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Overview &amp; Vision</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 11 · Next Steps</span>
<h1>The Investor Access Path</h1>

<div class="tier-path">
  <div class="tier-card active">
    <div class="tier-num">1</div>
    <div class="tier-name">You Are Here</div>
    <div class="tier-desc">Project Overview &amp; Vision, Concept Renders, Estate Map, Materials Brief. You are reading Tier 1 now.</div>
  </div>
  <div class="tier-card">
    <div class="tier-num">2</div>
    <div class="tier-name">Tier 2</div>
    <div class="tier-desc">Development Financial Model Summary, Planning Status, Environmental Position, Structural Summary, Site Plan, Design Basis. Issued following Tier 1 review and progression response.</div>
  </div>
  <div class="tier-card">
    <div class="tier-num">3</div>
    <div class="tier-name">Tier 3</div>
    <div class="tier-desc">Full financial model, draft investment agreements, title documentation, SPV structure, NDA required. Issued to qualified investors following Tier 2 review and NDA execution.</div>
  </div>
</div>

<h2>What Happens Next</h2>
<ol>
  <li style="margin-bottom:8px"><strong>Review the Tier 1 documents:</strong> This overview, the Concept Renders (SHER-INV-T1-002-R01), the Estate Location Map (SHER-INV-T1-003-R01), and the Materials &amp; Conservation Brief (SHER-INV-T1-004-R01).</li>
  <li style="margin-bottom:8px"><strong>Complete the Tier 1 progression response</strong> in the investor portal at shersanctuary.com/investors. This is not a commitment — it is a structured dialogue about how you are thinking, what questions you have, and whether you would like to proceed to Tier 2.</li>
  <li style="margin-bottom:8px"><strong>Await your Tier 2 access code.</strong> We review every Tier 1 response personally. If your thinking is aligned with the project, your Tier 2 code will be issued within 24–48 hours.</li>
  <li style="margin-bottom:8px"><strong>Tier 2</strong> contains the development economics, planning status, and detailed technical summaries. An NDA will be required before or immediately upon receiving your Tier 3 access code.</li>
  <li><strong>Tier 3</strong> is the final access level — full financial model, legal documentation, and draft investment terms. Tier 3 is available only to investors who have completed the Tier 1 and Tier 2 review processes and executed the SHER NDA.</li>
</ol>

<div class="green-band">
  <p><strong>Contact:</strong> All Tier 1 questions should be directed to <strong>bookings@shersanctuary.com</strong> with the subject line "Tier 1 — [Your Name]." We do not respond to speculative or unqualified enquiries. If you received a Tier 1 access code, your enquiry will receive a personal response.</p>
  <p style="margin-top:6px">Legal notices, Privacy Policy, Terms of Access, and Cookie Policy are published at <strong>shersanctuary.com/legal/</strong></p>
</div>

<h2>Formal Disclaimer</h2>
<p style="font-size:8.5pt;color:var(--muted);line-height:1.7">${DISCLAIMER}</p>
<p style="font-size:8.5pt;color:var(--muted);line-height:1.7;margin-top:6px">This document is the intellectual property of ${ENTITY}. It may not be reproduced, forwarded, or distributed without the prior written consent of the Managing Director. Receipt of this document constitutes acceptance of these terms.</p>
<p style="font-size:8.5pt;color:var(--muted);line-height:1.7;margin-top:6px">Governed by the laws of Saint Lucia. Any dispute arising from the use of this document shall be subject to the exclusive jurisdiction of the courts of Saint Lucia.</p>

</div>
${footer('SHER-INV-T1-001-R01')}
`;

// ══════════════════════════════════════════════════════════════════════════
// DOC 2 — CONCEPT RENDERS & SITE IMPRESSIONS
// ══════════════════════════════════════════════════════════════════════════
const doc2Content = `
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">SHER-INV-T1-002-R01 · Tier 1 Investor</span>
<h1>Concept Renders &amp; Site Impressions</h1>
<p class="lead">Visual representation of the SHER Sanctuary residential collection. All images are design concept renders and accepted site impressions from the SHER gallery programme. No image constitutes a confirmed construction drawing or regulatory approval.</p>

<div class="image-disclaimer">
  ⚠ Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation. Render images are accepted for website and investor gallery use per the SHER Visual Acceptance Records (CTA-005-R02 and VTA-005-R01). Condo Type A working render studies are under revision and are not included in this release.
</div>

<h2>Hillside Cottage Type A — Exterior</h2>
<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Cottage Type A — Exterior / Approach View</div>
  <div class="frame-ref">Source: SHER_Cottage_Type_A_Website_Gallery_Pack_R02 · CTA-006/007<br>Insert accepted gallery render — Exterior approach showing butterfly roof, marine steel frame, stone base, and timber screen.</div>
</div>
<div class="image-caption">Hillside Cottage Type A · Butterfly roof · Marine steel and timber frame · Stone base · Lime render · Screened veranda<br><em>Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation.</em></div>

<h2>Hillside Cottage Type A — Veranda &amp; Living</h2>
<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Cottage Type A — Veranda / Outdoor Living Zone</div>
  <div class="frame-ref">Source: SHER_Cottage_Type_A_Website_Gallery_Pack_R02 · CTA-006/007<br>Insert accepted gallery render — Veranda / outdoor living zone showing timber deck, screened glazing, and bay view.</div>
</div>
<div class="image-caption">Veranda and outdoor living zone · Timber deck · Screened glazed wall · Conservation and bay view<br><em>Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation.</em></div>

</div>
${footer('SHER-INV-T1-002-R01')}

<div class="page-break"></div>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="doc-body">

<h2>Hillside Cottage Type A — Interior Bathing</h2>
<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Cottage Type A — Bathing / Outdoor Shower Court</div>
  <div class="frame-ref">Source: SHER_Cottage_Type_A_Website_Gallery_Pack_R02 · CTA-006/007<br>Insert accepted gallery render — Outdoor shower court and bathing zone showing stone and timber, garden privacy.</div>
</div>
<div class="image-caption">Outdoor shower court · Natural stone · Timber screen · Privacy garden<br><em>Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation.</em></div>

<h2>Villa Type A — Exterior and Pool</h2>
<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Villa Type A — Exterior / Pool Terrace</div>
  <div class="frame-ref">Source: SHER_Villa_Type_A_Website_Gallery_Pack_R01 · VTA-005/006<br>Insert accepted gallery render — Villa exterior showing pool terrace, pavilion veranda, and hillside setting.</div>
</div>
<div class="image-caption">Villa Type A · Private pool terrace · Deep pavilion veranda · Stone and timber frame · Bay aspect<br><em>Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation.</em></div>

<h2>Villa Type A — Living and Bay View</h2>
<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Villa Type A — Interior Living / Bay View</div>
  <div class="frame-ref">Source: SHER_Villa_Type_A_Website_Gallery_Pack_R01 · VTA-005/006<br>Insert accepted gallery render — Interior living volume showing open-plan layout, glazed bay wall, and conservation outlook.</div>
</div>
<div class="image-caption">Villa Type A · Open-plan living · Full-height glazed bay wall · Conservation and bay outlook<br><em>Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation.</em></div>

</div>
${footer('SHER-INV-T1-002-R01')}

<div class="page-break"></div>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="doc-body">

<h2>Savannes Bay — Site Context Photography</h2>
<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Savannes Bay — Eastern Shoreline</div>
  <div class="frame-ref">Insert accepted site photography — bay eastern shoreline showing mangrove fringe, calm water, and Scorpion Islet in background.</div>
</div>
<div class="image-caption">Savannes Bay · Eastern shoreline · Mangrove fringe · Scorpion Islet (background) · RAMSAR-designated wetland</div>

<div class="image-frame">
  <div class="frame-icon">⬜</div>
  <div class="frame-label">Conservation Zone — Mangrove Trail</div>
  <div class="frame-ref">Insert accepted site photography — mangrove trail showing ecological richness, trail boardwalk (indicative), bay light through the canopy.</div>
</div>
<div class="image-caption">SHER Conservation Zone · Mangrove Immersion Trail (indicative) · RAMSAR wetland edge</div>

<div class="callout">
  <p><strong>Image insertion note (for print release):</strong> This document is prepared for investor distribution. Accepted gallery images should be inserted at the positions marked above before final distribution. Source files: SHER_Cottage_Type_A_Website_Gallery_Pack_R02 (CTA-006 and CTA-007), SHER_Villa_Type_A_Website_Gallery_Pack_R01 (VTA-005 and VTA-006), and accepted site photography from the SHER visual archive. Condo Type A render studies (CNA-VIS-001/002/003) are under revision and must NOT be included until Visual Acceptance Record is issued.</p>
</div>

<div class="image-disclaimer">
  All render images carry the following mandatory disclaimer: "Design concept — artist's impression. Not for construction. Final design subject to DCA approval and owner confirmation." Site photography is authentic — no disclaimer required on unedited site photos.
</div>

</div>
${footer('SHER-INV-T1-002-R01')}
`;

// ══════════════════════════════════════════════════════════════════════════
// DOC 3 — ESTATE LOCATION MAP
// ══════════════════════════════════════════════════════════════════════════
const doc3Content = `
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-003-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Estate Location Map</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">SHER-INV-T1-003-R01 · Tier 1 Investor</span>
<h1>Estate Location Map</h1>
<p class="lead">Savannes Bay, Micoud, Saint Lucia. The SHER estate occupies a protected bay setting on the southern Atlantic coast — 15 minutes from Hewanorra International Airport and adjacent to the RAMSAR-designated Savannes Bay Wetlands.</p>

<h2>Section 1 — Saint Lucia Context Map</h2>
<div class="map-frame">
  <div class="map-inner">
    <svg viewBox="0 0 560 380" class="svgmap" xmlns="http://www.w3.org/2000/svg">
      <!-- Ocean background -->
      <rect width="560" height="380" fill="#e8f4f8" rx="6"/>

      <!-- Saint Lucia island (stylised outline) -->
      <path d="M 210,60 C 220,48 235,42 250,40 C 268,38 285,44 295,54
               C 308,66 316,78 322,92 C 330,110 334,128 332,148
               C 330,168 324,186 316,202 C 306,220 292,234 278,248
               C 262,264 244,276 228,286 C 212,296 196,302 182,306
               C 168,310 154,310 142,304 C 130,298 122,288 118,276
               C 114,264 116,250 122,238 C 128,226 138,216 148,206
               C 160,194 172,184 180,172 C 190,158 196,142 198,126
               C 200,110 198,92 202,78 Z"
            fill="#c8d8a0" stroke="#1B3B36" stroke-width="1.5"/>

      <!-- Island label -->
      <text x="218" y="175" font-family="Georgia, serif" font-size="11" fill="#1B3B36" font-style="italic">Saint Lucia</text>

      <!-- Castries (capital) marker -->
      <circle cx="200" cy="112" r="5" fill="#C9A867" stroke="#1B3B36" stroke-width="1.2"/>
      <text x="210" y="108" font-family="Arial, sans-serif" font-size="9" fill="#1B3B36" font-weight="600">Castries</text>
      <text x="210" y="118" font-family="Arial, sans-serif" font-size="7.5" fill="#6B7A72">(Capital)</text>

      <!-- Vieux Fort marker -->
      <circle cx="225" cy="278" r="4.5" fill="#C9A867" stroke="#1B3B36" stroke-width="1.2"/>
      <text x="235" y="274" font-family="Arial, sans-serif" font-size="9" fill="#1B3B36" font-weight="600">Vieux Fort</text>

      <!-- Hewanorra Airport -->
      <rect x="202" y="288" width="14" height="9" rx="2" fill="#1B3B36"/>
      <text x="222" y="297" font-family="Arial, sans-serif" font-size="8.5" fill="#1B3B36" font-weight="600">Hewanorra Int'l Airport</text>
      <text x="222" y="307" font-family="Arial, sans-serif" font-size="7.5" fill="#6B7A72">UVF · 15 min from Savannes Bay</text>

      <!-- Micoud -->
      <circle cx="258" cy="248" r="4" fill="#C9A867" stroke="#1B3B36" stroke-width="1.2"/>
      <text x="266" y="244" font-family="Arial, sans-serif" font-size="9" fill="#1B3B36" font-weight="600">Micoud</text>
      <text x="266" y="254" font-family="Arial, sans-serif" font-size="7.5" fill="#6B7A72">District capital</text>

      <!-- Savannes Bay (SHER) — featured location -->
      <ellipse cx="272" cy="272" rx="14" ry="8" fill="rgba(27,59,54,0.18)" stroke="#1B3B36" stroke-width="1"/>
      <circle cx="272" cy="268" r="6.5" fill="#1B3B36" stroke="#C9A867" stroke-width="2"/>
      <text x="286" y="264" font-family="Georgia, serif" font-size="10.5" fill="#1B3B36" font-weight="600" font-style="italic">Savannes Bay</text>
      <text x="286" y="275" font-family="Arial, sans-serif" font-size="8.5" fill="#1B3B36" font-weight="700">SHER Sanctuary Experiences</text>
      <text x="286" y="285" font-family="Arial, sans-serif" font-size="7.5" fill="#6B7A72">RAMSAR Designated Wetland · 2002</text>

      <!-- Distance line: Airport to Savannes Bay -->
      <line x1="215" y1="291" x2="270" y2="270" stroke="#C9A867" stroke-width="1" stroke-dasharray="4,3" opacity="0.7"/>
      <text x="225" y="283" font-family="Arial, sans-serif" font-size="8" fill="#A88540" transform="rotate(-20,225,283)">~15 min by road</text>

      <!-- Scorpion Islet -->
      <circle cx="295" cy="290" r="3.5" fill="#e8f4f8" stroke="#1B3B36" stroke-width="1.2"/>
      <text x="302" y="288" font-family="Arial, sans-serif" font-size="8" fill="#1B3B36">Scorpion Islet</text>
      <text x="302" y="297" font-family="Arial, sans-serif" font-size="7" fill="#6B7A72">Marine Reserve</text>

      <!-- RAMSAR boundary (indicative) -->
      <ellipse cx="280" cy="278" rx="22" ry="14" fill="none" stroke="#1B3B36" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
      <text x="308" y="282" font-family="Arial, sans-serif" font-size="7" fill="#6B7A72" font-style="italic">RAMSAR boundary</text>
      <text x="308" y="290" font-family="Arial, sans-serif" font-size="7" fill="#6B7A72" font-style="italic">(indicative)</text>

      <!-- Caribbean Sea label -->
      <text x="50" y="240" font-family="Georgia, serif" font-size="11" fill="#5a9ab0" font-style="italic" opacity="0.7" transform="rotate(-8,50,240)">Caribbean Sea</text>

      <!-- Atlantic Ocean label -->
      <text x="360" y="210" font-family="Georgia, serif" font-size="11" fill="#5a9ab0" font-style="italic" opacity="0.7" transform="rotate(8,360,210)">Atlantic Ocean</text>

      <!-- North indicator -->
      <g transform="translate(500,50)">
        <circle cx="0" cy="0" r="18" fill="white" stroke="#d4cfc8" stroke-width="1"/>
        <polygon points="0,-12 -4,4 0,1 4,4" fill="#1B3B36"/>
        <polygon points="0,12 -4,-4 0,-1 4,-4" fill="#C9A867" opacity="0.5"/>
        <text x="0" y="-16" text-anchor="middle" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#1B3B36">N</text>
      </g>

      <!-- Legend -->
      <rect x="18" y="290" width="150" height="76" rx="4" fill="rgba(255,255,255,0.85)" stroke="#d4cfc8" stroke-width="1"/>
      <text x="28" y="304" font-family="Arial, sans-serif" font-size="8.5" font-weight="600" fill="#1B3B36">Legend</text>
      <circle cx="28" cy="318" r="4" fill="#1B3B36" stroke="#C9A867" stroke-width="1.5"/>
      <text x="38" y="322" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">SHER Sanctuary (Savannes Bay)</text>
      <circle cx="28" cy="332" r="3.5" fill="#C9A867" stroke="#1B3B36" stroke-width="1"/>
      <text x="38" y="336" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Town / reference point</text>
      <rect x="24" y="344" width="10" height="6" rx="1" fill="#1B3B36"/>
      <text x="38" y="350" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Airport</text>
      <line x1="24" y1="360" x2="34" y2="360" stroke="#1B3B36" stroke-width="1" stroke-dasharray="2,2" opacity="0.6"/>
      <text x="38" y="364" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">RAMSAR boundary (indicative)</text>
    </svg>
  </div>
</div>

<p style="font-size:8pt;color:var(--muted);font-style:italic;margin-top:4px">Diagrammatic map — not to scale. Reference points are approximate. Boundaries are indicative. This map does not constitute a survey.</p>

</div>
${footer('SHER-INV-T1-003-R01')}

<div class="page-break"></div>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-003-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Estate Location Map</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">Section 2 · Estate Parcel Boundary</span>
<h2>The Five Parcels — Estate Boundary Register</h2>
<p>The SHER estate is composed of five parcels totalling 204,148 sq ft (4.69 acres). The estate boundary diagram below is schematic — it represents parcel roles and relative positions, not surveyed dimensions.</p>

<div class="map-frame">
  <div class="map-inner">
    <svg viewBox="0 0 560 280" class="svgmap" xmlns="http://www.w3.org/2000/svg">
      <!-- Background -->
      <rect width="560" height="280" fill="#f5f0e8" rx="6"/>

      <!-- Bay / water (bottom) -->
      <path d="M 0,240 Q 140,220 280,230 Q 420,240 560,220 L 560,280 L 0,280 Z" fill="#d6eaf2"/>
      <text x="240" y="265" font-family="Georgia, serif" font-size="11" fill="#5a9ab0" font-style="italic" opacity="0.8">Savannes Bay</text>

      <!-- Mangrove fringe -->
      <path d="M 100,225 Q 200,212 320,218 Q 420,222 490,215" stroke="#1B3B36" stroke-width="2" fill="none" opacity="0.4" stroke-dasharray="5,3"/>
      <text x="180" y="210" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36" opacity="0.6">Mangrove fringe (indicative)</text>

      <!-- Lot 890 (Gateway — bottom left) -->
      <rect x="55" y="165" width="100" height="60" rx="4" fill="rgba(27,59,54,0.12)" stroke="#1B3B36" stroke-width="1.5"/>
      <text x="65" y="183" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1B3B36">Lot 890</text>
      <text x="65" y="194" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Gateway &amp; Infrastructure</text>
      <text x="65" y="205" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Reception · Services · Solar</text>
      <text x="65" y="216" font-family="Arial, sans-serif" font-size="7" fill="#C9A867" font-weight="600">PURCHASED ✓</text>

      <!-- Lot 897 (upper residential) -->
      <rect x="160" y="75" width="130" height="85" rx="4" fill="rgba(201,168,103,0.1)" stroke="#C9A867" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="172" y="95" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1B3B36">Lot 897</text>
      <text x="172" y="106" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Upper Residential</text>
      <text x="172" y="117" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">C-01 · C-02 · C-03</text>
      <text x="172" y="128" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Cottage Type A cluster</text>
      <text x="172" y="142" font-family="Arial, sans-serif" font-size="7" fill="#A88540" font-weight="600">Under agreement</text>

      <!-- Lot 905 (mid-slope — conservation portion shown separately) -->
      <rect x="295" y="90" width="130" height="95" rx="4" fill="rgba(27,59,54,0.07)" stroke="#1B3B36" stroke-width="1.5" stroke-dasharray="5,3"/>
      <text x="305" y="110" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1B3B36">Lot 905</text>
      <text x="305" y="121" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Mid-slope · Residential</text>
      <text x="305" y="132" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">C-04–C-10 · V-01–V-06</text>
      <text x="305" y="143" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">+ Conservation Covenant</text>
      <text x="305" y="154" font-family="Arial, sans-serif" font-size="7" fill="#1B3B36" font-style="italic">95,374 sf conservation zone</text>
      <text x="305" y="168" font-family="Arial, sans-serif" font-size="7" fill="#A88540" font-weight="600">Under agreement</text>

      <!-- Conservation hatch on Lot 905 (right portion) -->
      <rect x="390" y="95" width="30" height="85" rx="2" fill="none" stroke="#1B3B36" stroke-width="1" stroke-dasharray="3,3" opacity="0.5"/>
      <text x="394" y="135" font-family="Arial, sans-serif" font-size="7" fill="#1B3B36" font-style="italic" transform="rotate(90,394,135)">NO BUILD</text>

      <!-- Parcel 12 (conservation corridor) -->
      <rect x="160" y="185" width="105" height="38" rx="4" fill="rgba(27,59,54,0.08)" stroke="#1B3B36" stroke-width="1.2" stroke-dasharray="4,3"/>
      <text x="170" y="200" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#1B3B36">Parcel 12</text>
      <text x="170" y="211" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Conservation Trail · Kayak Launch</text>
      <text x="170" y="219" font-family="Arial, sans-serif" font-size="7" fill="#8B6914">Negotiation stage</text>

      <!-- Parcel 13 (waterfront) -->
      <rect x="270" y="195" width="120" height="32" rx="4" fill="rgba(27,59,54,0.1)" stroke="#1B3B36" stroke-width="1.2" stroke-dasharray="4,3"/>
      <text x="280" y="210" font-family="Arial, sans-serif" font-size="8" font-weight="700" fill="#1B3B36">Parcel 13</text>
      <text x="280" y="221" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Waterfront · Mangrove Edge · No build</text>

      <!-- Condo Lot E -->
      <rect x="55" y="100" width="100" height="60" rx="4" fill="rgba(201,168,103,0.09)" stroke="#C9A867" stroke-width="1.5" stroke-dasharray="4,3"/>
      <text x="65" y="118" font-family="Arial, sans-serif" font-size="8.5" font-weight="700" fill="#1B3B36">Lot E</text>
      <text x="65" y="129" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">Condo Type A</text>
      <text x="65" y="140" font-family="Arial, sans-serif" font-size="7.5" fill="#1B3B36">8 units · Coastal position</text>
      <text x="65" y="153" font-family="Arial, sans-serif" font-size="7" fill="#A88540" font-weight="600">Subject to planning</text>

      <!-- North -->
      <g transform="translate(520,30)">
        <circle cx="0" cy="0" r="16" fill="white" stroke="#d4cfc8" stroke-width="1"/>
        <polygon points="0,-10 -3.5,3.5 0,0.5 3.5,3.5" fill="#1B3B36"/>
        <polygon points="0,10 -3.5,-3.5 0,-0.5 3.5,-3.5" fill="#C9A867" opacity="0.5"/>
        <text x="0" y="-13" text-anchor="middle" font-family="Arial" font-size="8" font-weight="700" fill="#1B3B36">N</text>
      </g>

      <!-- Hillside indicator -->
      <text x="248" y="55" font-family="Georgia, serif" font-size="9" fill="#6B7A72" font-style="italic" opacity="0.8">⬆ Hillside / upslope</text>
    </svg>
  </div>
</div>

<h2>Parcel Register</h2>
<table>
  <thead><tr><th>Parcel</th><th>Area</th><th>Role</th><th>Acquisition Status</th></tr></thead>
  <tbody>
    <tr><td><strong>Lot 890</strong></td><td>Gateway services zone</td><td>Anchor parcel — reception, café, solar, wastewater, estate services. No residential units.</td><td class="status-confirmed">Purchased · title registration in progress</td></tr>
    <tr><td><strong>Lot E</strong></td><td>Coastal condo parcel</td><td>Condo Type A · 8 boutique units · Closest to conservation trail and kayak launch</td><td class="status-mou">Subject to planning</td></tr>
    <tr><td><strong>Lot 897</strong></td><td>Upper residential zone</td><td>Cottage Type A northern cluster (C-01–C-03). Estate road Phase 1.</td><td class="status-mou">Under acquisition agreement</td></tr>
    <tr><td><strong>Lot 905</strong></td><td>2.50 ac (residential) + 2.19 ac (conservation)</td><td>Southern residential — C-04–C-10, V-01–V-06. Conservation covenant applies to conservation portion (95,374 sf). No build covenant is corporate, not regulatory.</td><td class="status-mou">Under acquisition agreement</td></tr>
    <tr><td><strong>Parcels 12 &amp; 13</strong></td><td>Lower coastal corridor</td><td>Mangrove buffer, kayak launch, conservation trail, raised boardwalk, wetland edge. No permanent foundations on any part of this parcel.</td><td class="status-negotiation">Under negotiation</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>Survey note:</strong> Full survey plans and title documentation — including registered parcel boundaries, area calculations confirmed by a licensed surveyor, and title search results — are available at Tier 3 subject to NDA execution (SHER-LEGAL-006-R01). Boundaries shown here are indicative and schematic. They do not constitute a survey, a title document, or a planning drawing.</p>
</div>

</div>
${footer('SHER-INV-T1-003-R01')}
`;

// ══════════════════════════════════════════════════════════════════════════
// DOC 4 — MATERIALS & CONSERVATION COVENANT
// ══════════════════════════════════════════════════════════════════════════
const doc4Content = `
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-004-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Brief — Materials &amp; Conservation Covenant</div>
  </div>
</div>
<div class="doc-body">

<span class="eyebrow">SHER-INV-T1-004-R01 · Tier 1 Investor</span>
<h1>Project Brief: Materials &amp; Conservation Covenant</h1>
<p class="lead">This brief describes the structural and finish material strategy adopted across all SHER residences, and the legal and operational form of the conservation covenant that permanently protects 46.7% of the estate.</p>

<h2>Section 1 — Approved Material Palette</h2>
<p>SHER's material palette is governed by the SHER Sanctuary Design &amp; Experience Charter (R02, Owner Approved 6 July 2026). The Charter's authority is absolute — no material may be introduced that conflicts with its design pillars or conservation controls. The palette below applies across all four residential typologies: Cottage Type A, Villa Type A, Condo Type A, and Flagship Villa Type B.</p>

<div class="product-band"><h3>Primary Structural System</h3><span class="badge">Marine Steel + Timber</span></div>
<div class="two-col">
  <div class="col-block">
    <h4>Marine-Grade Steel Frame</h4>
    <p>The primary structural frame for all SHER residences. Hot-dip galvanised and coated with zinc-rich primer, marine epoxy, and UV-stable topcoat. Steel delivers the hurricane load path — continuous from roof to foundation — that the Saint Lucia wind zone requires. Bolted connections throughout; entirely inspectable and repairable without specialist plant.</p>
    <p style="font-size:8pt;color:var(--muted);margin-top:6px">Condo Type A uses a concealed I-beam steel primary frame, allowing maximum clear-span open-plan areas without visible structure in guest space.</p>
  </div>
  <div class="col-block">
    <h4>Timber Secondary Frame</h4>
    <p>Treated softwood or engineered timber secondary framing, decking, ceilings, and screens. Timber brings warmth, workability, and thermal comfort to the tropical climate. All timber is treated for durability; no synthetic treatments in occupied spaces or within the conservation zone.</p>
    <p style="font-size:8pt;color:var(--muted);margin-top:6px">Reclaimed timber joinery and selected feature elements are used for authenticity and to minimise embodied carbon at the detailing level.</p>
  </div>
</div>

<div class="product-band"><h3>Wall, Finish, and Roof Systems</h3><span class="badge">Stone · Lime · Metal</span></div>
<table>
  <thead><tr><th>Material</th><th>Application</th><th>Performance in Tropical Climate</th></tr></thead>
  <tbody>
    <tr><td><strong>Locally sourced volcanic stone</strong></td><td>Base courses, wall panels, feature elements, steps, landscape edging</td><td>Authentic Saint Lucian materiality. Thermal mass — moderates indoor temperature naturally. No painting or surface treatment required. Indefinite durability.</td></tr>
    <tr><td><strong>Lime render (internal &amp; external)</strong></td><td>Wall finish coat, internal plaster, feature renders</td><td>Breathable — does not trap moisture behind the surface, preventing mould and rot in the humid tropical climate. Anti-microbial. Low embodied carbon. 1,000+ year structural track record. Compatible with stone and brick substrate.</td></tr>
    <tr><td><strong>Clay brick</strong></td><td>Structural masonry where ground conditions favour masonry over steel, ornamental and garden masonry</td><td>Thermal mass, authentic regional character, excellent durability in tropical environments. Selected where steel frame is not the preferred structural approach at site level.</td></tr>
    <tr><td><strong>Standing-seam / concealed-fix metal roofing</strong></td><td>Primary roof cladding on all typologies</td><td>Hurricane resilience — no exposed fasteners. Negative pressure under storm conditions cannot lift concealed-fix systems. Dark bronze, charcoal, or green-black tone; low heat-island contribution; long service life.</td></tr>
    <tr><td><strong>Reclaimed timber joinery</strong></td><td>Feature doors, window frames, furniture-quality cabinetry, selected decking elements</td><td>Authenticity of material history. Zero additional embodied carbon. Selected pieces with verified provenance — not a wholesale structural material.</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>What SHER does not use:</strong> Hemp block, compressed earth, synthetic cladding or UPVC systems, exposed chemical preservatives in guest-occupied spaces, synthetic decking, floodlighting directed toward the conservation boundary, or any material requiring periodic chemical treatment in the conservation zone or within 10 metres of the conservation boundary.</p>
</div>

<p style="font-size:8.5pt;color:var(--muted);font-style:italic">Independent structural engineering certifications, detailed wall/roof/floor build-up specifications, and MEP documentation for all four product types are available at Tier 2 (SHER-INV-004-R01) and Tier 3. Professional structural engineer appointment and geotechnical survey will be completed as part of the DCA planning submission package.</p>

</div>
${footer('SHER-INV-T1-004-R01')}

<div class="page-break"></div>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-004-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Brief — Materials &amp; Conservation Covenant</div>
  </div>
</div>
<div class="doc-body">

<h2>Section 2 — The Conservation Covenant</h2>
<p>The conservation covenant is the most important single commitment Safeport Security Services Limited makes in relation to the SHER estate. It is distinct from, and more protective than, the statutory requirements that apply to the Savannes Bay area.</p>

<div class="green-band">
  <h3>The Covenant in Plain Terms</h3>
  <p>95,374 sq ft (2.19 acres) — the conservation portion of Lot 905 — will never be offered for residential, commercial, hospitality, or any other form of built development. This is not a planning condition. It is not a requirement of the Development Control Authority, the Saint Lucia National Trust, or any other regulatory body. It is a unilateral corporate commitment made by Safeport Security Services Limited as a statement of conservation discipline.</p>
  <p style="margin-top:6px">The covenant is designed to be permanent. It is not conditional on market conditions, project ownership changes, future planning permissions, or investor preferences. It is not subject to variation by a future purchaser of a SHER residence.</p>
</div>

<div class="two-col">
  <div class="col-block">
    <h4>What the Covenant Covers</h4>
    <ul>
      <li>No residential buildings of any kind</li>
      <li>No commercial or hospitality buildings</li>
      <li>No access roads, carparks, or hard-standing</li>
      <li>No permanent utility infrastructure on or above the surface</li>
      <li>No clearing of vegetation beyond light maintenance</li>
      <li>No chemical treatment within the conservation zone</li>
      <li>No lighting directed toward the wetland edge</li>
      <li>No permanent boat infrastructure</li>
    </ul>
  </div>
  <div class="col-block">
    <h4>What the Covenant Permits</h4>
    <ul>
      <li>Raised timber boardwalk (conservation trail) — no concrete footings</li>
      <li>Manual vegetation maintenance by estate staff</li>
      <li>Ecological survey and monitoring access</li>
      <li>SLNT-authorised conservation activities</li>
      <li>Kayak launch from the approved launch point at Parcel 12/13</li>
      <li>Educational access (groups by appointment, conservation-audited)</li>
    </ul>
  </div>
</div>

<p>The legal form of the covenant — including its enforceability mechanism, binding nature on future owners, and the legal opinion on its permanence under Saint Lucia law — is documented in full at Tier 3 following NDA execution.</p>

<h2>Section 3 — RAMSAR Context</h2>
<p>Savannes Bay Wetlands were designated under the Ramsar Convention on Wetlands in 2002. The Convention designation is internationally binding — it is not a local planning classification and cannot be removed by Saint Lucia's own authorities without international process. The Ramsar designation recognises the bay as:</p>
<ul>
  <li><strong>Internationally important migratory bird habitat</strong> — seasonal use by species that use the Caribbean flyway;</li>
  <li><strong>Coastal fish nursery</strong> — the mangrove system supports the juvenile stage of commercially and ecologically significant marine species;</li>
  <li><strong>Mangrove ecosystem services</strong> — coastal protection, carbon sequestration, water filtration, shoreline stabilisation.</li>
</ul>

<p>The Pointe Sable Environmental Protection Area (1,038 hectares) provides complementary statutory protection at the national level under Saint Lucia legislation. The Scorpion Islet Marine Reserve protects the bay's reef and seagrass ecosystem. Together, these three statutory frameworks create a protective context that no competitor could replicate on the southern Saint Lucia coastline.</p>

<div class="stat-row">
  <div class="stat-box"><span class="val">RAMSAR</span><div class="lbl">Convention designated · 2002<br>International treaty protection</div></div>
  <div class="stat-box"><span class="val">1,038 ha</span><div class="lbl">Pointe Sable EPA<br>National statutory protection</div></div>
  <div class="stat-box"><span class="val">Scorpion Islet</span><div class="lbl">Marine Reserve<br>Reef and seagrass protection</div></div>
</div>

<p><strong>SHER's covenant exceeds the minimum:</strong> The statutory frameworks require specific behaviour within their defined zones. SHER's voluntary conservation covenant applies to land that is not necessarily within the statutory boundary — it is a self-imposed extension of the protection regime, applied to the estate's own land, permanently.</p>

</div>
${footer('SHER-INV-T1-004-R01')}

<div class="page-break"></div>

<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-004-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Project Brief — Materials &amp; Conservation Covenant</div>
  </div>
</div>
<div class="doc-body">

<h2>Section 4 — Design Controls</h2>
<p>The SHER Sanctuary Design &amp; Experience Charter (R02) is the governing document for all design and operational decisions on the estate. The following controls derive from the Charter and apply permanently — they are not project-phase guidelines. They are estate laws.</p>

<table>
  <thead><tr><th>Control</th><th>Scope</th><th>Standard</th></tr></thead>
  <tbody>
    <tr><td><strong>Lighting</strong></td><td>All exterior fittings within 30m of the conservation boundary</td><td>Warm tone only (no blue-white LED). No floodlighting directed toward the conservation zone, mangrove fringe, or bay edge. Illuminance at conservation boundary: zero or ambient only. Design to comply with any turtle-nesting or seabird protection requirements.</td></tr>
    <tr><td><strong>Noise</strong></td><td>All operational sound at or above the conservation boundary</td><td>No audible mechanical plant noise at the conservation boundary at any time. Generator and HVAC plant positioned on the service side of each building — away from conservation sightlines and the bay edge.</td></tr>
    <tr><td><strong>Utility infrastructure</strong></td><td>All visible external infrastructure on the estate</td><td>No exposed utility infrastructure in guest or resident sightlines. All solar, wastewater, and storage infrastructure positioned at Lot 890 or on the service side of each residence. No above-ground cables or pipes in the guest experience zone.</td></tr>
    <tr><td><strong>Single-use plastic</strong></td><td>Estate-wide — all operations and residences</td><td>Zero single-use plastic policy across the estate. Applies to SHER operations, hospitality service, and any third-party service providers operating on the estate. Not negotiable.</td></tr>
    <tr><td><strong>Scorpion Islet access</strong></td><td>All kayak operations originating from SHER</td><td>One landing per day on Scorpion Islet — regardless of booking demand. Non-negotiable operational limit. This limit is a conservation decision by SHER, not a regulatory requirement. It may be tightened if ecological monitoring indicates stress on nesting habitat.</td></tr>
    <tr><td><strong>Chemical use</strong></td><td>All maintenance within 10m of the conservation boundary</td><td>No chemical herbicide, pesticide, or synthetic fertiliser within 10 metres of the conservation boundary. Manual clearance only. No chemical run-off toward the wetland buffer.</td></tr>
    <tr><td><strong>Bat exclusion</strong></td><td>All residential and hospitality structures</td><td>Sealed soffits and screened vents at all structures — no bat roosting cavities. No decorative architectural features that create unintended roosting or nesting habitat in guest-occupied zones.</td></tr>
  </tbody>
</table>

<div class="callout">
  <p><strong>Enforcement:</strong> The design controls are embedded in the SHER Design Charter, which is incorporated by reference into all resident purchase agreements and the estate's operational management framework. They are not aspirational — they are contractual. Any operator, contractor, or guest who violates a design control is in breach of estate rules, which carry defined consequences up to and including loss of access rights.</p>
</div>

<h2>Formal Disclaimer</h2>
<p style="font-size:8.5pt;color:var(--muted);line-height:1.7">${DISCLAIMER}</p>
<p style="font-size:8.5pt;color:var(--muted);line-height:1.7;margin-top:6px">This document is the intellectual property of ${ENTITY}. It may not be reproduced, forwarded, or distributed without the prior written consent of the Managing Director. Governed by the laws of Saint Lucia.</p>
<p style="font-size:8.5pt;color:var(--muted);line-height:1.7;margin-top:6px">Legal notices: <strong>shersanctuary.com/legal/</strong> · Privacy Policy (SHER-LEGAL-002-R01) · Investor Disclaimer (SHER-LEGAL-003-R01) · NDA Template (SHER-LEGAL-006-R01)</p>

</div>
${footer('SHER-INV-T1-004-R01')}
`;

// ══════════════════════════════════════════════════════════════════════════
// RENDER ALL DOCS
// ══════════════════════════════════════════════════════════════════════════
const DOCS = [
  { filename: 'SHER-INV-T1-001-R01.pdf', html: shell('SHER-INV-T1-001-R01', 'Project Overview & Vision', doc1Content) },
  { filename: 'SHER-INV-T1-002-R01.pdf', html: shell('SHER-INV-T1-002-R01', 'Concept Renders & Site Impressions', doc2Content) },
  { filename: 'SHER-INV-T1-003-R01.pdf', html: shell('SHER-INV-T1-003-R01', 'Estate Location Map', doc3Content) },
  { filename: 'SHER-INV-T1-004-R01.pdf', html: shell('SHER-INV-T1-004-R01', 'Project Brief — Materials & Conservation Covenant', doc4Content) },
];

(async () => {
  console.log('Launching Puppeteer…');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const doc of DOCS) {
    const htmlPath = path.join(OUT_DIR, doc.filename.replace('.pdf', '.html'));
    fs.writeFileSync(htmlPath, doc.html, 'utf8');
    console.log(`  Generating ${doc.filename}…`);
    const page = await browser.newPage();
    await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 60000 });
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
  console.log('\nAll 4 Tier 1 investor PDFs generated.');
})();
