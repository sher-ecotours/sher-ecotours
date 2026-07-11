/**
 * Rebuilds SHER-INV-T1-002-R01.pdf with real accepted gallery renders.
 * Run: $env:NODE_PATH = "C:\Users\safep\AppData\Roaming\npm\node_modules"; node generate-tier1-002-renders.js
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR    = __dirname;
const ASSETS_DIR = path.join(__dirname, 'gallery-assets');
const LOGO_B64   = fs.readFileSync(path.join(__dirname, '../buyer-tier2/logo-b64.txt'), 'utf8').trim();
const TODAY      = '11 July 2026';
const ENTITY     = 'Safeport Security Services Limited';
const REG        = 'Reg. 2016-C251 · Saint Lucia';
const SITE       = 'shersanctuary.com';
const DISCLAIMER = `This document is provided for preliminary information purposes only and does not constitute a prospectus, securities offering, regulated financial promotion, investment advice, or representation of fact. All figures are preliminary and subject to independent verification. Governed by the laws of Saint Lucia.`;
const IMG_DISCLAIMER = 'Design concept — artist\'s impression. Not for construction. Final design subject to DCA approval, professional drawings, site conditions, and owner confirmation.';

function imgB64(filename) {
  const buf = fs.readFileSync(path.join(ASSETS_DIR, filename));
  return 'data:image/jpeg;base64,' + buf.toString('base64');
}

// Pre-load all images
const CTA01 = imgB64('CTA_01_Exterior_Nature_Veranda_web.jpg');
const CTA02 = imgB64('CTA_02_Interior_Sleeping_Lounge_Veranda_web.jpg');
const CTA03 = imgB64('CTA_03_Dusk_Exterior_Low_Lighting_web.jpg');
const CTA04 = imgB64('CTA_04_Bathroom_Outdoor_Shower_Court_web.jpg');
const VTA01 = imgB64('VTA-R01-01_Linear_View_Villa_Exterior_Base.jpg');
const VTA02 = imgB64('VTA-R01-02_Courtyard_SplitWing_Villa_Premium_Exterior.jpg');
const VTA03 = imgB64('VTA-R01-03_Main_Living_Veranda_Interior.jpg');
const VTA04 = imgB64('VTA-R01-04_Twilight_Exterior_Atmosphere.jpg');
const VTA05 = imgB64('VTA-R01-05_Bedroom_Garden_View_Sanctuary.jpg');

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SHER-INV-T1-002-R01 — Concept Renders &amp; Site Impressions</title>
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
    background: var(--green); padding: 18px 36px 14px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 3px solid var(--gold);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc-header img { height: 46px; width: auto; }
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
    font-size: 14pt; font-weight: 500; color: #F5F0E8; line-height: 1.2;
  }
  .page-body { padding: 20px 36px 10px; }
  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20pt; font-weight: 500; color: var(--green);
    margin-bottom: 4px; line-height: 1.12;
  }
  h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13pt; font-weight: 500; color: var(--green);
    margin: 16px 0 6px; padding-bottom: 4px;
    border-bottom: 1.5px solid var(--border);
  }
  .eyebrow {
    display: block; font-size: 7.5pt; font-weight: 600;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--gold-dk); margin-bottom: 3px;
  }
  .lead {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 11pt; font-style: italic; color: var(--muted);
    margin-bottom: 14px; line-height: 1.65;
  }
  p { margin-bottom: 6px; }
  .img-disclaimer {
    background: rgba(245,240,232,0.65); border-left: 3px solid var(--gold);
    padding: 7px 11px; font-size: 7.5pt; color: var(--muted); font-style: italic;
    margin: 8px 0 12px; line-height: 1.55;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .render-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 10px 0; }
  .render-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin: 10px 0; }
  .render-block { display: flex; flex-direction: column; }
  .render-block img {
    width: 100%; border-radius: 5px; display: block;
    border: 1px solid var(--border);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .render-caption {
    font-size: 7.5pt; color: var(--muted); margin-top: 5px;
    line-height: 1.5; padding: 0 2px;
  }
  .render-caption strong { color: var(--green); display: block; font-size: 8pt; margin-bottom: 1px; }
  .render-caption em { font-style: italic; font-size: 7pt; color: #9aaba3; display: block; margin-top: 2px; }
  .section-band {
    background: var(--green); color: #F5F0E8;
    padding: 9px 14px; border-radius: 4px; margin: 14px 0 10px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .section-band h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13pt; font-weight: 500; color: #F5F0E8; margin: 0;
  }
  .section-band .meta {
    font-size: 7.5pt; color: rgba(201,168,103,0.85); margin-top: 2px;
    letter-spacing: 0.05em;
  }
  .callout {
    background: rgba(245,240,232,0.75); border-left: 3px solid var(--gold);
    padding: 9px 13px; margin: 10px 0; border-radius: 0 4px 4px 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .callout p { margin-bottom: 0; }
  .doc-footer {
    margin-top: 16px; padding: 10px 36px 12px;
    border-top: 2px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 7pt; color: var(--muted);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc-footer .ref-block strong { color: var(--green); font-size: 7.5pt; display: block; margin-bottom: 2px; }
  .footer-disclaimer { max-width: 400px; font-size: 6.5pt; line-height: 1.5; font-style: italic; color: var(--muted); text-align: right; }

  /* COVER */
  .cover {
    min-height: 100vh; display: flex; flex-direction: column;
    background: var(--green); padding: 56px 50px;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cover img.logo { height: 58px; width: auto; margin-bottom: 56px; }
  .cover-badge {
    display: inline-block; background: var(--gold); color: var(--green);
    font-size: 8pt; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase;
    padding: 4px 12px; border-radius: 3px; margin-bottom: 14px;
  }
  .cover-eyebrow { font-size: 10pt; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 20px; }
  .cover-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 34pt; font-weight: 300; color: #F5F0E8; line-height: 1.1; margin-bottom: 20px;
  }
  .cover-subtitle {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 14pt; font-style: italic; color: rgba(245,240,232,0.6); margin-bottom: 36px; line-height: 1.5;
  }
  .cover-divider { border: none; border-top: 1px solid rgba(201,168,103,0.35); margin: 28px 0; }
  .cover-meta { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
  .cover-meta-item .label { font-size: 7.5pt; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: rgba(201,168,103,0.65); margin-bottom: 5px; }
  .cover-meta-item .value { font-size: 11pt; color: #F5F0E8; font-family: 'Cormorant Garamond', Georgia, serif; }
  .cover-footer { margin-top: auto; padding-top: 36px; }
  .cover-footer p { font-size: 7.5pt; color: rgba(245,240,232,0.38); line-height: 1.6; font-style: italic; }

  /* Contact sheet style full-bleed image for cover back */
  .full-bleed-img {
    width: 100%; border-radius: 5px; display: block;
    border: 1px solid var(--border); margin: 10px 0;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  .page-break { page-break-after: always; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>

<!-- ── COVER ── -->
<div class="cover">
  <img src="${LOGO_B64}" alt="SHER Sanctuary" class="logo">
  <div class="cover-badge">Tier 1 · Investor Confidential</div>
  <p class="cover-eyebrow">Design Concept Gallery</p>
  <h1 class="cover-title">Concept Renders &amp;<br>Site Impressions</h1>
  <p class="cover-subtitle">
    All images are owner-accepted design-intent renders<br>
    for website and investor gallery use — Visual Acceptance<br>
    Records CTA-005-R02 and VTA-005-R01.
  </p>
  <hr class="cover-divider">
  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="label">Document Ref</div>
      <div class="value">SHER-INV-T1-002-R01</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Issued</div>
      <div class="value">${TODAY} · Rev R01</div>
    </div>
    <div class="cover-meta-item">
      <div class="label">Access</div>
      <div class="value">Tier 1 · Investor</div>
    </div>
  </div>
  <div class="cover-footer">
    <p>All images are design-intent renders: artist's impression only. Not for construction. Final design subject to DCA approval, professional drawings, site conditions, and owner confirmation. Condo Type A render studies (CNA-VIS-001/002/003) are under revision and are not included in this release. Issued by ${ENTITY} (${REG}) trading as SHER Sanctuary Experiences.</p>
  </div>
</div>

<div class="page-break"></div>

<!-- ── PAGE 2 — COTTAGE EXTERIOR + INTERIOR ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="page-body">

  <div class="section-band">
    <h3>Hillside Cottage Type A</h3>
    <div class="meta">Visual Acceptance Record CTA-005-R02 · Owner Accepted for Website &amp; Investor Gallery Use</div>
  </div>

  <div class="img-disclaimer">
    ⚠ ${IMG_DISCLAIMER}
  </div>

  <div class="render-grid-2">
    <div class="render-block">
      <img src="${CTA01}" alt="Cottage Type A — Exterior Nature / Veranda View">
      <div class="render-caption">
        <strong>Exterior — Nature &amp; Veranda View</strong>
        A private one-bedroom sanctuary set within lush tropical planting, with refined butterfly roof, deep veranda, timber, stone, and lime/mineral wall expression.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
    <div class="render-block">
      <img src="${CTA02}" alt="Cottage Type A — Interior Sleeping Lounge / Veranda View">
      <div class="render-caption">
        <strong>Interior — Sleeping Lounge &amp; Veranda</strong>
        The Expanded A interior shows the sleeping/lounge sanctuary opening to a deep screened veranda — warm timber ceilings, quiet neutral finishes, screened glazing, and a calm nature-facing view.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
  </div>

</div>
<div class="doc-footer">
  <div class="ref-block">
    <strong>SHER-INV-T1-002-R01 · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor Tier 1<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

<div class="page-break"></div>

<!-- ── PAGE 3 — COTTAGE DUSK + BATHROOM ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="page-body">

  <div class="section-band">
    <h3>Hillside Cottage Type A — continued</h3>
    <div class="meta">Visual Acceptance Record CTA-005-R02 · Owner Accepted for Website &amp; Investor Gallery Use</div>
  </div>

  <div class="img-disclaimer">
    ⚠ ${IMG_DISCLAIMER}
  </div>

  <div class="render-grid-2">
    <div class="render-block">
      <img src="${CTA03}" alt="Cottage Type A — Dusk Exterior / Low-Level Lighting">
      <div class="render-caption">
        <strong>Dusk Exterior — Low-Level Lighting</strong>
        Warm low-level lighting demonstrates the cottage as a quiet evening sanctuary — no floodlighting, no visible utilities, no resort clutter, no glare toward habitat. SHER's lighting discipline in practice.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
    <div class="render-block">
      <img src="${CTA04}" alt="Cottage Type A — Bathroom / Outdoor Shower Court">
      <div class="render-caption">
        <strong>Bathroom &amp; Outdoor Shower Court</strong>
        Stone, timber, and warm mineral finishes — fast-draining surfaces, privacy screening, and a closable insect-controlled interior threshold. SHER quiet luxury expressed through material quality, not ornamentation.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
  </div>

  <div class="callout" style="margin-top:12px">
    <p><strong>Cottage Type A — key design notes:</strong> Marine-grade steel structural frame (concealed); butterfly or split-butterfly roof; one-bedroom programme, 900–1,100 sq ft; veranda, outdoor shower court, screened living zone. Four retained Cottage Type B units (C-07–C-10) form SHER's hospitality programme and are not for sale. Six Cottage Type A units (C-01–C-06) are available to for-sale purchasers.</p>
  </div>

</div>
<div class="doc-footer">
  <div class="ref-block">
    <strong>SHER-INV-T1-002-R01 · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor Tier 1<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

<div class="page-break"></div>

<!-- ── PAGE 4 — VILLA EXTERIOR (2 renders) ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="page-body">

  <div class="section-band">
    <h3>Villa Type A — Exterior Expressions</h3>
    <div class="meta">Visual Acceptance Record VTA-005-R01 · Owner Accepted for Website &amp; Investor Gallery Use</div>
  </div>

  <div class="img-disclaimer">
    ⚠ ${IMG_DISCLAIMER}
  </div>

  <div class="render-grid-2">
    <div class="render-block">
      <img src="${VTA01}" alt="Villa Type A — Linear View Exterior">
      <div class="render-caption">
        <strong>Linear View — Exterior Base Expression</strong>
        The repeatable Villa Type A expression: butterfly roof language, deep shaded veranda, timber and stone materiality, screened indoor-outdoor living, concealed utility discipline.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
    <div class="render-block">
      <img src="${VTA02}" alt="Villa Type A — Courtyard / Split-Wing Premium Exterior">
      <div class="render-caption">
        <strong>Courtyard / Split-Wing — Premium Exterior</strong>
        The premium Villa Type A expression with a broader split-wing sanctuary form, layered privacy, stone plinth, timber screens, refined dark roof, and optional quiet plunge feature.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
  </div>

</div>
<div class="doc-footer">
  <div class="ref-block">
    <strong>SHER-INV-T1-002-R01 · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor Tier 1<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

<div class="page-break"></div>

<!-- ── PAGE 5 — VILLA INTERIOR + TWILIGHT + BEDROOM ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="page-body">

  <div class="section-band">
    <h3>Villa Type A — Interior &amp; Atmosphere</h3>
    <div class="meta">Visual Acceptance Record VTA-005-R01 · Owner Accepted for Website &amp; Investor Gallery Use</div>
  </div>

  <div class="img-disclaimer">
    ⚠ ${IMG_DISCLAIMER}
  </div>

  <!-- Top: two side by side -->
  <div class="render-grid-2" style="margin-bottom:10px">
    <div class="render-block">
      <img src="${VTA03}" alt="Villa Type A — Main Living / Veranda Interior">
      <div class="render-caption">
        <strong>Main Living &amp; Veranda Interior</strong>
        Open but controlled luxury — screened/glazed indoor-outdoor comfort, warm timber ceiling, lime/mineral wall tones, natural furnishings, and a framed tropical view.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
    <div class="render-block">
      <img src="${VTA04}" alt="Villa Type A — Twilight Exterior Atmosphere">
      <div class="render-caption">
        <strong>Twilight Exterior Atmosphere</strong>
        Warm restrained lighting, lush landscape, quiet pathway — no resort floodlighting or visible utility clutter. SHER's lighting covenant demonstrated at the villa scale.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
  </div>

  <!-- Bottom: bedroom centered -->
  <div style="max-width:50%;margin:0 auto">
    <div class="render-block">
      <img src="${VTA05}" alt="Villa Type A — Bedroom / Garden-View Sanctuary">
      <div class="render-caption">
        <strong>Primary Suite — Garden-View Sanctuary</strong>
        A calm primary suite: timber, lime/mineral finishes, soft natural textiles, screened garden threshold, quiet premium guest comfort.
        <em>${IMG_DISCLAIMER}</em>
      </div>
    </div>
  </div>

  <div class="callout" style="margin-top:12px">
    <p><strong>Villa Type A — key design notes:</strong> Two to three bedrooms, 2,750–3,650 sq ft. Private plunge or lap pool. Two configuration expressions — Linear View and Courtyard/Split-Wing. V-01 to V-05 for sale; V-06 (Flagship Villa) is individually designed, price on application. Southern estate positions with premium bay aspect guaranteed by topography.</p>
  </div>

</div>
<div class="doc-footer">
  <div class="ref-block">
    <strong>SHER-INV-T1-002-R01 · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor Tier 1<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

<div class="page-break"></div>

<!-- ── PAGE 6 — USAGE NOTES + CONDO NOTE ── -->
<div class="doc-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="doc-header-right">
    <span class="tier-badge">Tier 1 · Investor</span>
    <span class="ref">SHER-INV-T1-002-R01 · Rev R01 · ${TODAY}</span>
    <div class="title">Concept Renders &amp; Site Impressions</div>
  </div>
</div>
<div class="page-body">

  <span class="eyebrow">Image Usage Notes</span>
  <h1 style="font-size:18pt;margin-bottom:10px">Visual Acceptance &amp; Usage Controls</h1>

  <p style="margin-bottom:12px">All renders in this document are accepted under the SHER Visual Acceptance Record programme. Each image has been reviewed and explicitly accepted by the SHER project owner for website and investor gallery distribution. They are not construction drawings and do not imply any planning approval.</p>

  <h2>Cottage Type A Gallery Pack — CTA-005-R02</h2>
  <table style="width:100%;border-collapse:collapse;font-size:9pt;margin:8px 0 14px">
    <thead><tr style="background:var(--green);color:#F5F0E8;-webkit-print-color-adjust:exact">
      <th style="padding:7px 10px;text-align:left">Image</th>
      <th style="padding:7px 10px;text-align:left">Status</th>
      <th style="padding:7px 10px;text-align:left">File</th>
    </tr></thead>
    <tbody>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18)"><td style="padding:6px 10px">01 — Exterior Nature / Veranda</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">CTA-005-R02 · 01_Exterior_Nature_Veranda_web.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18);background:rgba(245,240,232,0.5)"><td style="padding:6px 10px">02 — Interior Sleeping Lounge / Veranda</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">CTA-005-R02 · 02_Interior_Sleeping_Lounge_Veranda_web.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18)"><td style="padding:6px 10px">03 — Dusk Exterior / Low-Level Lighting</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">CTA-005-R02 · 03_Dusk_Exterior_Low_Lighting_web.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18);background:rgba(245,240,232,0.5)"><td style="padding:6px 10px">04 — Bathroom / Outdoor Shower Court</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">CTA-005-R02 · 04_Bathroom_Outdoor_Shower_Court_web.jpg</td></tr>
    </tbody>
  </table>

  <h2>Villa Type A Gallery Pack — VTA-005-R01</h2>
  <table style="width:100%;border-collapse:collapse;font-size:9pt;margin:8px 0 14px">
    <thead><tr style="background:var(--green);color:#F5F0E8;-webkit-print-color-adjust:exact">
      <th style="padding:7px 10px;text-align:left">Image</th>
      <th style="padding:7px 10px;text-align:left">Status</th>
      <th style="padding:7px 10px;text-align:left">File</th>
    </tr></thead>
    <tbody>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18)"><td style="padding:6px 10px">01 — Linear View Exterior</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">VTA-005-R01 · VTA-R01-01_Linear_View_Villa_Exterior_Base.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18);background:rgba(245,240,232,0.5)"><td style="padding:6px 10px">02 — Courtyard / Split-Wing Exterior</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">VTA-005-R01 · VTA-R01-02_Courtyard_SplitWing_Villa_Premium_Exterior.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18)"><td style="padding:6px 10px">03 — Main Living / Veranda Interior</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">VTA-005-R01 · VTA-R01-03_Main_Living_Veranda_Interior.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18);background:rgba(245,240,232,0.5)"><td style="padding:6px 10px">04 — Twilight Exterior Atmosphere</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">VTA-005-R01 · VTA-R01-04_Twilight_Exterior_Atmosphere.jpg</td></tr>
      <tr style="border-bottom:1px solid rgba(201,168,103,0.18)"><td style="padding:6px 10px">05 — Bedroom / Garden-View Sanctuary</td><td style="padding:6px 10px;color:#1B3B36;font-weight:600">✓ Accepted</td><td style="padding:6px 10px;font-size:8pt;color:var(--muted)">VTA-005-R01 · VTA-R01-05_Bedroom_Garden_View_Sanctuary.jpg</td></tr>
    </tbody>
  </table>

  <div class="callout">
    <p><strong>Condo Type A — excluded from this release:</strong> Condo Type A render studies (CNA-VIS-001, CNA-VIS-002, CNA-VIS-003) are currently under revision. They have not been accepted for website or investor distribution. They will be released under a separate Visual Acceptance Record when owner-accepted. Do not distribute CNA render studies in any investor or marketing context until a Visual Acceptance Record is issued.</p>
  </div>

  <p style="font-size:8pt;color:var(--muted);font-style:italic;margin-top:10px;line-height:1.65">${DISCLAIMER} All render images shown are design concept — artist's impression only. They do not constitute a prospectus, a construction drawing, or confirmation of planning approval. Final design is subject to DCA approval, professional engineering and architectural drawings, site conditions, and owner confirmation.</p>

</div>
<div class="doc-footer">
  <div class="ref-block">
    <strong>SHER-INV-T1-002-R01 · Revision R01</strong>
    Issued ${TODAY} · Confidential — Investor Tier 1<br>
    ${ENTITY} · ${REG} · ${SITE}
  </div>
  <div class="footer-disclaimer">${DISCLAIMER}</div>
</div>

</body>
</html>`;

(async () => {
  const htmlPath = path.join(OUT_DIR, 'SHER-INV-T1-002-R01.html');
  fs.writeFileSync(htmlPath, HTML, 'utf8');
  console.log('HTML written. Launching Puppeteer…');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0', timeout: 90000 });
  const pdfPath = path.join(OUT_DIR, 'SHER-INV-T1-002-R01.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '0', right: '0', bottom: '0', left: '0' },
  });
  await browser.close();

  const size = Math.round(fs.statSync(pdfPath).size / 1024);
  console.log(`✓ SHER-INV-T1-002-R01.pdf — ${size} KB`);
})();
