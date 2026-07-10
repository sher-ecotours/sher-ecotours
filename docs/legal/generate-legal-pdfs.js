/**
 * SHER Sanctuary — Legal Protection Suite PDF Generator
 * Generates 6 branded legal PDFs using Puppeteer.
 * Run: node generate-legal-pdfs.js  (with NODE_PATH set to global node_modules)
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR  = __dirname;
const LOGO_B64 = fs.readFileSync(path.join(__dirname, '../buyer-tier2/logo-b64.txt'), 'utf8').trim();
const TODAY    = '10 July 2026';
const ENTITY   = 'Safeport Security Services Limited';
const REG      = 'Reg. 2016-C251 · Saint Lucia';
const TRADING  = 'SHER Sanctuary Experiences';
const SITE     = 'shersanctuary.com';
const EMAIL    = 'privacy@shersanctuary.com';

const LEGAL_FOOTER_CO = `${ENTITY} · ${REG} · ${SITE}`;

// ─── SHARED BRAND SHELL (standard docs) ────────────────────────────────────
function shell(docRef, docTitle, content, twoCol = false) {
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
    font-size: 9.5pt;
    line-height: 1.7;
    color: var(--text);
    background: #fff;
  }
  .doc-header {
    background: var(--green);
    padding: 20px 36px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 3px solid var(--gold);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .doc-header img { height: 48px; width: auto; }
  .doc-header-right { text-align: right; }
  .doc-header-right .ref {
    font-size: 8pt; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: var(--gold);
  }
  .doc-header-right .title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 15pt; font-weight: 500; color: #F5F0E8;
    line-height: 1.2; margin-top: 3px;
  }
  .doc-body { padding: 28px 36px 16px; }
  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 20pt; font-weight: 500; color: var(--green);
    margin-bottom: 4px; line-height: 1.15;
  }
  h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 13.5pt; font-weight: 500; color: var(--green);
    margin: 18px 0 7px; padding-bottom: 4px;
    border-bottom: 1.5px solid var(--border);
  }
  h3 {
    font-size: 10pt; font-weight: 600; color: var(--green);
    margin: 14px 0 4px; text-transform: uppercase; letter-spacing: 0.05em;
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
  .clause {
    margin-bottom: 10px; padding-left: 0;
  }
  .clause-num {
    font-weight: 600; color: var(--green); min-width: 28px;
    display: inline-block;
  }
  .clause-table { width: 100%; border-collapse: collapse; margin: 8px 0 14px; font-size: 9pt; }
  .clause-table thead tr { background: var(--green); color: #F5F0E8; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .clause-table thead th { padding: 7px 10px; text-align: left; font-size: 8.5pt; font-weight: 600; }
  .clause-table tbody tr { border-bottom: 1px solid rgba(201,168,103,0.18); }
  .clause-table tbody tr:nth-child(even) { background: rgba(245,240,232,0.5); -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .clause-table tbody td { padding: 6px 10px; vertical-align: top; }
  .doc-footer {
    margin-top: 20px; padding: 12px 36px 14px;
    border-top: 2px solid var(--border);
    display: flex; justify-content: space-between; align-items: flex-start;
    font-size: 7.5pt; color: var(--muted);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .doc-footer .ref-block strong { color: var(--green); font-size: 8pt; display: block; margin-bottom: 2px; }
  .footer-note {
    max-width: 400px; font-size: 7pt; line-height: 1.5;
    font-style: italic; color: var(--muted); text-align: right;
  }
  .page-break { page-break-after: always; }
  @page { size: A4; margin: 0; }
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
    Issued ${TODAY} · ${LEGAL_FOOTER_CO}
  </div>
  <div class="footer-note">These documents are subject to amendment. The current version is always available at ${SITE}/legal</div>
</div>

</body>
</html>`;
}

// ─── NDA SHELL (formal legal — minimal branding) ───────────────────────────
function ndaShell(content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SHER-LEGAL-006-R01 — Non-Disclosure Agreement</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --green: #1B3B36; --gold: #C9A867; --cream: #F5F0E8;
    --muted: #6B7A72; --text: #1A2420; --border: rgba(201,168,103,0.28);
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
    font-size: 9.5pt; line-height: 1.75; color: var(--text);
    background: #fff;
  }
  .nda-header {
    padding: 28px 44px 18px;
    border-bottom: 2px solid var(--green);
    display: flex; align-items: center; justify-content: space-between;
  }
  .nda-header img { height: 44px; }
  .nda-header-right { text-align: right; font-size: 8pt; color: var(--muted); }
  .nda-header-right strong { display: block; color: var(--green); font-size: 9pt; }
  .nda-body { padding: 24px 44px 20px; }
  .nda-title {
    text-align: center;
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 19pt; font-weight: 600; color: var(--green);
    margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.04em;
  }
  .nda-subtitle {
    text-align: center; font-size: 9pt; color: var(--muted);
    margin-bottom: 22px; letter-spacing: 0.04em;
  }
  .parties-block {
    border: 1.5px solid var(--border); border-radius: 5px;
    padding: 14px 18px; margin-bottom: 18px;
    background: rgba(245,240,232,0.4);
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .parties-block h4 {
    font-size: 8pt; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--green); margin-bottom: 8px;
  }
  .party-row { margin-bottom: 8px; }
  .party-row:last-child { margin-bottom: 0; }
  .party-label { font-weight: 600; font-size: 9pt; color: var(--green); }
  .party-detail { margin-left: 14px; font-size: 9pt; }
  .clause-block { margin-bottom: 12px; }
  .clause-heading {
    font-weight: 600; font-size: 9.5pt; color: var(--green);
    margin-bottom: 4px; display: flex; gap: 8px;
  }
  .clause-heading .cn {
    min-width: 22px; color: var(--gold); font-weight: 700;
  }
  .clause-body { padding-left: 30px; }
  .clause-body p { margin-bottom: 5px; }
  .clause-body ol { padding-left: 20px; }
  .clause-body ol li { margin-bottom: 4px; }
  .sub-clause { margin-bottom: 5px; display: flex; gap: 8px; }
  .sub-clause .sn { min-width: 24px; font-weight: 600; color: var(--muted); font-size: 9pt; }
  .sig-block {
    display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
    margin-top: 20px;
  }
  .sig-party {
    border: 1px solid var(--border); border-radius: 4px;
    padding: 14px 16px;
  }
  .sig-party h4 {
    font-size: 8pt; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; color: var(--green); margin-bottom: 10px;
    padding-bottom: 6px; border-bottom: 1px solid var(--border);
  }
  .sig-line {
    border-bottom: 1px solid #888; height: 32px; margin: 6px 0 2px;
  }
  .sig-field-label { font-size: 7.5pt; color: var(--muted); }
  .sig-field-value { font-size: 8.5pt; color: var(--text); margin-bottom: 4px; }
  .nda-footer {
    margin-top: 18px; padding: 10px 44px 14px;
    border-top: 1px solid var(--border);
    display: flex; justify-content: space-between;
    font-size: 7pt; color: var(--muted);
  }
  .page-break { page-break-after: always; }
  @page { size: A4; margin: 0; }
</style>
</head>
<body>
<div class="nda-header">
  <img src="${LOGO_B64}" alt="SHER Sanctuary">
  <div class="nda-header-right">
    <strong>SHER-LEGAL-006-R01</strong>
    Revision R01 · ${TODAY}<br>
    Confidential — Tier 3 Access Document
  </div>
</div>
<div class="nda-body">
${content}
</div>
<div class="nda-footer">
  <span>SHER-LEGAL-006-R01 · Rev R01 · Issued ${TODAY} · ${ENTITY} · ${REG}</span>
  <span>Page 1 of 2</span>
</div>
</body>
</html>`;
}


// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT 1 — WEBSITE TERMS OF ACCESS & USE
// ══════════════════════════════════════════════════════════════════════════
const doc1 = shell('SHER-LEGAL-001-R01', 'Website Terms of Access &amp; Use', `
<span class="eyebrow">Legal Notice · All Visitors</span>
<h1>Website Terms of Access &amp; Use</h1>
<p class="lead">These terms govern your use of shersanctuary.com and all sub-portals operated by Safeport Security Services Limited. Please read them carefully. Continued access to this website constitutes acceptance of these terms in full.</p>

<h2>1. Acceptance of Terms</h2>
<p>By accessing or using any part of shersanctuary.com, the SHER Investor Portal, or the SHER Buyer Portal (together, "the Site"), you agree to be bound by these Terms of Access and Use. If you do not agree to these terms, you must exit the Site immediately and make no further use of any materials contained herein. These terms apply to all visitors, whether accessing the Site as a prospective investor, prospective buyer, professional advisor, member of the press, or general visitor.</p>

<h2>2. Nature of Information</h2>
<p>All content published on the Site, including but not limited to architectural renderings, site plans, floor plans, pricing indications, financial projections, returns estimates, development timelines, environmental and ecological statements, and supporting documents (together, "the Materials"), is provided for preliminary information and marketing purposes only. The Materials:</p>
<ul>
  <li>Do <strong>not</strong> constitute an offer to sell, a prospectus, a binding contract, an investment agreement, or any representation of current or future fact;</li>
  <li>Do <strong>not</strong> constitute a regulated financial promotion or investment advice under the laws of Saint Lucia or any other jurisdiction;</li>
  <li>Have <strong>not</strong> been independently audited, verified, or certified (except where specifically stated);</li>
  <li>Are subject to change without notice at any time prior to execution of a formal Sale and Purchase Agreement or Investment Agreement.</li>
</ul>
<p>No reliance should be placed upon the Materials for the purpose of entering into any transaction. Prospective investors and buyers are strongly advised to obtain independent financial, legal, structural, environmental, and tax advice before making any commitment.</p>

<h2>3. Intellectual Property</h2>
<p>All content on the Site, including but not limited to the SHER brand identity, logo, photography, architectural renders, site plans, copywriting, financial models, and document templates, is the intellectual property of ${ENTITY} or its licensed suppliers and is protected by the laws of Saint Lucia and applicable international intellectual property conventions. No part of the Site or its Materials may be reproduced, redistributed, modified, published, transmitted, displayed, or used for any commercial purpose without the prior written consent of ${ENTITY}. Requests for permission should be directed to bookings@shersanctuary.com.</p>

<h2>4. No Securities Offering</h2>
<p>Nothing on the Site constitutes a solicitation, invitation, offer, or advertisement of securities, a collective investment scheme, a fund, or any other regulated financial instrument in Saint Lucia or any other jurisdiction. ${ENTITY} is not a licensed securities dealer, investment adviser, or fund manager. Persons considering an investment in any SHER-related opportunity are responsible for obtaining their own independent legal, financial, and regulatory advice. Persons in jurisdictions where the making or receipt of the Materials would be unlawful are not authorised to access the investor portal and must exit immediately.</p>

<h2>5. Development Status &amp; Regulatory Approvals</h2>
<p>The SHER Sanctuary estate is a development project currently in the pre-construction planning phase. As at the date of issue of these terms:</p>
<ul>
  <li>A formal planning application has not yet been submitted to the Development Control Authority ("DCA") of Saint Lucia under the Physical Planning and Development Act Cap. 5.12;</li>
  <li>DCA planning permission has not been granted;</li>
  <li>Environmental Impact Assessment ("EIA") approval may be required from the Planning and Development Authority and/or the Department of Sustainable Development;</li>
  <li>Additional statutory approvals may be required from the Saint Lucia National Trust, the Fisheries Department, the Forestry Department, the Water and Sewerage Company, and other relevant regulatory authorities;</li>
  <li>All designs, specifications, unit counts, and pricing remain subject to the outcome of the planning and approval process.</li>
</ul>
<p>References to planning approval in the Materials relate to approvals in principle or conceptual design approvals and do not represent full statutory planning consent. ${ENTITY} will update the Materials as material approvals are received.</p>

<h2>6. Alien Landholding Licence</h2>
<p>Under the Alien Landholding (Licensing) Act No. 1 of 2020, non-Saint Lucian citizens (and companies in which non-nationals hold a majority interest) are required to obtain an Alien Landholding Licence ("ALHL") before acquiring land or property in Saint Lucia. The ALHL is property-specific and is issued by the Government of Saint Lucia subject to conditions. The obtaining of an ALHL is the buyer's responsibility and is not guaranteed. ${ENTITY} does not provide legal advice. Prospective foreign buyers must engage independent legal counsel qualified to practice in Saint Lucia for ALHL advice and application.</p>

<h2>7. Limitation of Liability</h2>
<p>To the fullest extent permitted by the laws of Saint Lucia and applicable law, ${ENTITY} and its officers, directors, employees, agents, and representatives:</p>
<ul>
  <li>Exclude all liability for any loss, damage, cost, or expense arising from your access to or use of the Site or reliance on any Materials;</li>
  <li>Exclude all liability for any inaccuracy, omission, or incompleteness in the Materials;</li>
  <li>Exclude all liability for loss of profit, loss of revenue, loss of opportunity, loss of goodwill, or consequential, indirect, or special loss of any kind.</li>
</ul>
<p>Nothing in these terms excludes liability for fraud, death or personal injury caused by negligence, or any other liability that cannot be excluded under the laws of Saint Lucia.</p>

<h2>8. Third-Party Links &amp; Services</h2>
<p>The Site may contain links to third-party websites or services (including mapping, payment, and communication services). ${ENTITY} is not responsible for the content, accuracy, or privacy practices of any third-party site. Links are provided for convenience only and do not constitute an endorsement.</p>

<h2>9. Governing Law &amp; Jurisdiction</h2>
<p>These terms are governed by the laws of Saint Lucia. Any dispute arising from or in connection with these terms or your use of the Site shall be subject to the exclusive jurisdiction of the courts of Saint Lucia. If any provision of these terms is held to be invalid or unenforceable, the remaining provisions shall continue in full force.</p>

<h2>10. Amendments</h2>
<p>${ENTITY} reserves the right to amend these terms at any time without prior notice. The current version of these terms will always be available at ${SITE}/legal. Your continued use of the Site following any amendment constitutes acceptance of the revised terms.</p>

<div class="callout">
  <p><strong>Effective date:</strong> These terms are effective as at ${TODAY} and supersede all prior versions. For any queries relating to these terms, contact: bookings@shersanctuary.com.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT 2 — PRIVACY POLICY
// ══════════════════════════════════════════════════════════════════════════
const doc2 = shell('SHER-LEGAL-002-R01', 'Privacy Policy', `
<span class="eyebrow">Data Protection · Saint Lucia Data Protection Act Cap. 8:18</span>
<h1>Privacy Policy</h1>
<p class="lead">This Privacy Policy describes how ${ENTITY} (trading as ${TRADING}) collects, uses, stores, and protects personal data. It applies to all personal data collected through shersanctuary.com and all SHER sub-portals.</p>

<h2>1. Data Controller</h2>
<p><strong>${ENTITY}</strong> (Registered in Saint Lucia, Reg. No. 2016-C251, trading as SHER Sanctuary Experiences, Savannes Bay, Micoud, Saint Lucia) is the data controller for the purposes of the Saint Lucia Data Protection Act Cap. 8:18 ("the Act"). Where personal data is collected in connection with investor enquiries or property buyer applications, ${ENTITY} determines the purposes and means of processing that data.</p>

<h2>2. Personal Data We Collect</h2>
<p>We may collect the following categories of personal data through discovery and enquiry forms, email correspondence, or portal interactions:</p>
<table class="clause-table">
  <thead><tr><th>Category</th><th>Examples</th><th>When Collected</th></tr></thead>
  <tbody>
    <tr><td>Identity data</td><td>Full name, title, nationality, country of citizenship</td><td>Discovery form, enquiry</td></tr>
    <tr><td>Contact data</td><td>Email address, telephone number, WhatsApp number</td><td>Discovery form, booking, enquiry</td></tr>
    <tr><td>Location data</td><td>Country of residence, city</td><td>Discovery form</td></tr>
    <tr><td>Financial capacity indicators</td><td>Investment range or budget band (self-declared)</td><td>Investor discovery form</td></tr>
    <tr><td>Investment preferences</td><td>Preferred investment structure, timeline, risk appetite</td><td>Investor portal forms</td></tr>
    <tr><td>Buyer preferences</td><td>Preferred residence type, budget, intended use</td><td>Buyer discovery form</td></tr>
    <tr><td>Communications data</td><td>Records of email and written correspondence with SHER</td><td>Ongoing</td></tr>
    <tr><td>Technical data</td><td>Browser type, device, IP address (logged by server)</td><td>Automatic — all site visits</td></tr>
  </tbody>
</table>
<p>We do not collect sensitive personal data (as defined in the Act) including health information, political opinions, or biometric data.</p>

<h2>3. Lawful Basis for Processing</h2>
<p>We process personal data on the following lawful bases under the Data Protection Act Cap. 8:18:</p>
<ul>
  <li><strong>Consent</strong> — given at the point of form submission. You may withdraw consent at any time by contacting ${EMAIL}.</li>
  <li><strong>Legitimate interests</strong> — assessing the suitability of prospective investors and buyers prior to sharing confidential tiered materials; protecting the confidentiality of commercially sensitive information; communicating with persons who have indicated a genuine interest in SHER.</li>
  <li><strong>Legal obligation</strong> — complying with anti-money laundering and financial intelligence reporting requirements under Saint Lucia law, including obligations under the Financial Intelligence Authority's supervised entity registration requirements (effective June 2023, under the Registration of Supervised Entities Act).</li>
</ul>

<h2>4. How We Use Your Data</h2>
<ul>
  <li>To respond to your enquiry and provide you with information about SHER residences or investment opportunities;</li>
  <li>To assess your eligibility for access to tiered portal materials (Tier 1, Tier 2, Tier 3);</li>
  <li>To issue access codes and maintain portal access records;</li>
  <li>To fulfil any booking or reservation you make with SHER Sanctuary Experiences;</li>
  <li>To comply with our legal and regulatory obligations, including AML/KYC record-keeping;</li>
  <li>To update you on material developments relevant to a property or investment you have expressed interest in (where consent has been given).</li>
</ul>
<p>We will not use your data for general marketing or third-party promotional purposes without your explicit consent.</p>

<h2>5. Data Sharing</h2>
<p>Your personal data will not be sold. We may share data with:</p>
<ul>
  <li>Professional advisors engaged by ${ENTITY} (legal counsel, accountants, surveyors), who are bound by confidentiality obligations;</li>
  <li>The Financial Intelligence Authority of Saint Lucia, the Inland Revenue Department, or any other regulatory authority, where required by law or court order;</li>
  <li>Development partners, lenders, or joint venture parties involved in the SHER project, only to the extent necessary and subject to confidentiality agreements;</li>
  <li>Technology service providers (website hosting, email delivery, form processing), who process data under data processing agreements with us.</li>
</ul>

<h2>6. Data Retention</h2>
<p>Personal data collected through enquiry and discovery forms will be retained for no longer than <strong>5 years</strong> from the date of last contact, unless a transaction (reservation or investment) has been entered into, in which case statutory and regulatory retention periods apply (typically 7 years or as required by the Financial Intelligence Authority). You may request deletion of your data at any time (subject to legal retention obligations) by contacting ${EMAIL}.</p>

<h2>7. Your Rights</h2>
<p>Under the Data Protection Act Cap. 8:18, you have the right to:</p>
<ul>
  <li><strong>Access</strong> — request a copy of the personal data we hold about you;</li>
  <li><strong>Rectification</strong> — request correction of inaccurate or incomplete data;</li>
  <li><strong>Erasure</strong> — request deletion of your data (subject to legal retention requirements);</li>
  <li><strong>Restrict processing</strong> — request that we limit how we use your data;</li>
  <li><strong>Withdraw consent</strong> — withdraw consent to processing at any time (this does not affect the lawfulness of processing prior to withdrawal).</li>
</ul>
<p>To exercise any of these rights, contact our Privacy Officer at: <strong>${EMAIL}</strong>. We will respond within 30 days. If you are not satisfied with our response, you may contact the relevant supervisory authority in Saint Lucia.</p>

<h2>8. Cookies</h2>
<p>The Site uses <strong>functional cookies only</strong>. These are strictly necessary for portal access gate functionality (maintaining your login state within a session) and session management. We do not use advertising cookies, analytics cookies, or third-party tracking technologies. For full details, see our Cookie Policy (SHER-LEGAL-007-R01). You may disable cookies in your browser settings; doing so may impair access to password-gated portal sections.</p>

<h2>9. International Transfers</h2>
<p>Personal data may be transferred to and processed on servers located outside Saint Lucia (including in the European Economic Area or the United States) by our technology service providers. Where such transfers occur, we ensure that appropriate safeguards are in place as required by the Act.</p>

<h2>10. Changes to This Policy</h2>
<p>We may update this Privacy Policy from time to time. The current version will always be available at <strong>${SITE}/legal</strong>. Where changes are material, we will notify you by email where we hold your contact details.</p>

<div class="callout">
  <p><strong>Privacy Officer contact:</strong> ${EMAIL}<br>
  <strong>Registered address:</strong> ${ENTITY}, Savannes Bay, Micoud, Saint Lucia, West Indies<br>
  <strong>Effective date:</strong> ${TODAY}</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT 3 — INVESTOR PORTAL DISCLAIMER & ACCESS TERMS
// ══════════════════════════════════════════════════════════════════════════
const doc3 = shell('SHER-LEGAL-003-R01', 'Investor Portal Disclaimer &amp; Access Terms', `
<span class="eyebrow">Investor Portal · Confidential &amp; Restricted Access</span>
<h1>Investor Portal Disclaimer &amp; Access Terms</h1>
<p class="lead">These terms govern access to the SHER Investor Portal and all materials contained therein. By entering your access code and proceeding past the entry gate, you confirm that you have read, understood, and accepted these terms in full.</p>

<div class="green-band">
  <p><strong>Confidential — Restricted Access:</strong> The materials in the SHER Investor Portal are confidential and are made available solely to persons who have been personally invited by ${ENTITY}. If you have accessed this portal without a personal invitation, you must exit immediately and destroy any materials you have accessed.</p>
</div>

<h2>1. Eligibility</h2>
<p>Access to this portal is restricted to persons who have self-identified as financially sophisticated, professional, or institutional investors through the SHER investor discovery process. By accessing the portal, you confirm that:</p>
<ul>
  <li>You are accessing the portal for the purpose of evaluating a potential investment and not for any other purpose;</li>
  <li>You have sufficient financial knowledge and experience to evaluate the merits and risks of an investment in a development-stage real estate project;</li>
  <li>You are not accessing the portal on behalf of a regulated financial intermediary without appropriate authorisation to do so;</li>
  <li>You are not located in a jurisdiction in which the making or receipt of these materials would be unlawful.</li>
</ul>

<h2>2. Nature of Materials — Not a Prospectus or Securities Offering</h2>
<p>The materials in this portal, including financial projections, capital structure summaries, returns estimates, development timelines, and site documentation, do not constitute and should not be construed as:</p>
<ul>
  <li>A prospectus, information memorandum, or offering document within the meaning of any applicable securities or company legislation;</li>
  <li>An offer of, or invitation to subscribe for or purchase, securities, shares, units, or interests in any fund, company, or investment scheme;</li>
  <li>An offer to enter into any financial arrangement;</li>
  <li>A regulated financial promotion or investment advice under the laws of Saint Lucia or any other jurisdiction.</li>
</ul>
<p>No regulatory authority in Saint Lucia or elsewhere has reviewed, approved, or authorised these materials. Persons in jurisdictions where the receipt of these materials would constitute a regulated activity are not authorised to access the portal.</p>

<h2>3. Forward-Looking Statements</h2>
<p>The portal contains forward-looking statements, including financial projections, revenue estimates, return targets, construction timelines, and market assumptions. These statements are based on assumptions and estimates made by ${ENTITY} and its advisors at the time of preparation. Forward-looking statements:</p>
<ul>
  <li>Are inherently uncertain and may not be achieved;</li>
  <li>Are subject to risks including (without limitation) construction cost overruns, adverse regulatory decisions, market conditions, foreign exchange movements, natural disasters, and force majeure events;</li>
  <li>Should not be relied upon as a prediction of actual future performance.</li>
</ul>
<p>Actual results may differ materially from any projections or estimates contained in the portal.</p>

<h2>4. No Guarantee of Returns</h2>
<p>Investment in a development-stage real estate project involves significant risk, including the risk of partial or total loss of capital. ${ENTITY} does not guarantee any financial return, income yield, capital preservation, project completion, or exit within any particular timeframe. Past performance of any benchmark or comparable project is not indicative of future results. Nothing in this portal constitutes an agreement to make any investment available on the terms described.</p>

<h2>5. Independent Professional Advice</h2>
<p>Prospective investors are strongly advised — and, where applicable, legally required — to obtain independent financial, legal, tax, and structural advice before making any investment decision. ${ENTITY} does not provide financial advice, tax advice, or legal advice. The portal materials are provided for evaluation purposes only and are not a substitute for independent professional due diligence.</p>

<h2>6. Confidentiality Obligations</h2>
<p>All materials in this portal are provided in strict confidence. By accessing the portal, you agree:</p>
<ul>
  <li>Not to disclose, reproduce, distribute, or transmit any portal materials to any third party without the prior written consent of ${ENTITY};</li>
  <li>To use the materials solely for the purpose of evaluating a potential investment in the SHER project;</li>
  <li>To destroy or return all materials on request, or if you decide not to proceed with an investment.</li>
</ul>
<p>Breach of these confidentiality obligations may result in injunctive relief and/or a claim for damages by ${ENTITY}.</p>

<h2>7. Tier 3 — Non-Disclosure Agreement</h2>
<p>Materials marked as Tier 3 (including full financial models, title documentation, draft investment agreements, and the SPV shareholders agreement) are subject to a formal Non-Disclosure Agreement ("NDA"). Access to Tier 3 materials constitutes acceptance of the NDA terms set out in document SHER-LEGAL-006-R01. Disclosure of Tier 3 materials to any third party without the prior written consent of ${ENTITY} is a breach of contract and may give rise to legal proceedings in the courts of Saint Lucia.</p>

<h2>8. Alien Landholding Licence</h2>
<p>Foreign nationals (and companies in which non-nationals hold a majority interest) who are considering a direct property acquisition at SHER are reminded that an Alien Landholding Licence is required under the Alien Landholding (Licensing) Act No. 1 of 2020. ${ENTITY} will provide reasonable introductory guidance but does not provide legal advice on ALHL applications. Independent Saint Lucia legal counsel must be engaged.</p>

<h2>9. Consumer Protection</h2>
<p>Nothing in the portal materials is intended to constitute a misleading, deceptive, or unconscionable representation within the meaning of the Consumer Protection Act No. 9 of 2016. In the event of any inconsistency between marketing or summary materials and these legal terms, these legal terms prevail.</p>

<h2>10. Governing Law &amp; Jurisdiction</h2>
<p>These terms and all matters relating to the portal are governed by the laws of Saint Lucia. Any dispute arising from or in connection with these terms or the portal materials shall be subject to the exclusive jurisdiction of the courts of Saint Lucia.</p>

<div class="callout">
  <p><strong>Contact:</strong> For legal enquiries relating to the investor portal, contact bookings@shersanctuary.com. These terms are effective as at ${TODAY}.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT 4 — BUYER PORTAL DISCLAIMER & ACCESS TERMS
// ══════════════════════════════════════════════════════════════════════════
const doc4 = shell('SHER-LEGAL-004-R01', 'Buyer Portal Disclaimer &amp; Access Terms', `
<span class="eyebrow">Buyer Portal · Pre-Sale Materials</span>
<h1>Buyer Portal Disclaimer &amp; Access Terms</h1>
<p class="lead">These terms govern access to the SHER Buyer Portal and all property marketing and pre-sale materials contained therein. By accessing the portal you confirm your acceptance of these terms.</p>

<h2>1. Pre-Sale Status</h2>
<p>All information in the SHER Buyer Portal relates to a residential development project that is currently in the pre-construction planning phase. As at the date of these terms, planning permission from the Development Control Authority ("DCA") of Saint Lucia under the Physical Planning and Development Act Cap. 5.12 has not been granted. Nothing in the portal materials constitutes:</p>
<ul>
  <li>A binding offer for sale of any property;</li>
  <li>A Sale and Purchase Agreement or any part thereof;</li>
  <li>A confirmed reservation of any specific residential unit;</li>
  <li>A representation that any particular unit will be available on the terms or at the price indicated.</li>
</ul>
<p>All pricing, unit availability, design specifications, and development timelines are subject to change without notice prior to execution of a formal Sale and Purchase Agreement.</p>

<h2>2. Design, Specification &amp; Materials</h2>
<p>All architectural renderings, images, floor plans, specifications, materials descriptions, and design intent documents are design intent documents only. They represent the current design vision of ${ENTITY} and its appointed architects and are not construction drawings or approved technical documents. Final designs, specifications, and materials:</p>
<ul>
  <li>Are subject to DCA approval, structural engineering sign-off, and applicable building regulations;</li>
  <li>May change as a result of planning conditions, structural requirements, or site conditions;</li>
  <li>Will be confirmed in the Sale and Purchase Agreement and accompanying specification schedule.</li>
</ul>
<p>No item of specification, finish, material, or equipment named in marketing materials is guaranteed to form part of the final delivered residence unless confirmed in writing in the Sale and Purchase Agreement.</p>

<h2>3. Pricing</h2>
<p>All pricing indications are preliminary and indicative only. Prices are denominated in United States Dollars (USD) unless otherwise stated. Final pricing will be confirmed in the formal Sale and Purchase Agreement. Exchange rate risk between USD and any other currency is the buyer's own. ${ENTITY} makes no representation as to the future exchange rate between USD and XCD or any other currency. Stamp duty, legal fees, ALHL fees, and other transaction costs are additional to the purchase price and are the buyer's responsibility.</p>

<h2>4. Alien Landholding Licence — Foreign Buyers</h2>
<p>Under the Alien Landholding (Licensing) Act No. 1 of 2020, non-Saint Lucian citizens (and companies in which non-nationals hold a majority interest) must obtain an Alien Landholding Licence ("ALHL") before completing any acquisition of land or property in Saint Lucia. Buyers should be aware that:</p>
<ul>
  <li>The ALHL is property-specific and is issued at the discretion of the Government of Saint Lucia;</li>
  <li>The ALHL application requires a Certificate of Eligibility; licence fees are charged by the Government;</li>
  <li>Processing timelines may vary and are outside the control of ${ENTITY};</li>
  <li>${ENTITY} will provide introductory guidance on the ALHL process but does not provide legal advice and is not responsible for ALHL applications or outcomes;</li>
  <li>All foreign buyers must engage independent legal counsel qualified to practice in Saint Lucia for the ALHL application.</li>
</ul>

<h2>5. Stamp Duty &amp; Transaction Costs</h2>
<p>Buyers are advised of the following indicative transaction costs under Saint Lucia law (current rates; buyers must confirm current rates with the Inland Revenue Department and their Saint Lucia solicitor):</p>
<ul>
  <li><strong>Stamp duty (buyer):</strong> 2% of transaction value (Saint Lucia nationals), or at applicable rate for non-nationals;</li>
  <li><strong>Vendors tax:</strong> payable by the vendor — 10% of transaction value for non-nationals; Saint Lucia nationals are generally exempt. The applicable rate depends on the vendor's status at time of sale;</li>
  <li><strong>Legal fees:</strong> buyer's and vendor's legal costs are each typically 1–3% of transaction value;</li>
  <li><strong>ALHL licence fee:</strong> applicable to non-national buyers — fees are set by the Government of Saint Lucia;</li>
  <li><strong>Registration fees:</strong> payable to the Land Registry of Saint Lucia on title transfer.</li>
</ul>
<p>All rates are subject to change by the Government of Saint Lucia without notice.</p>

<h2>6. Tourism Development Act — Rental Pool Participants</h2>
<p>Under the Tourism Development Act No. 1 of 2024, residential units that participate in a rental pool programme may be classified as tourism accommodation. Owners who participate in the SHER rental pool programme may accordingly be subject to registration and certification requirements under the Act. ${ENTITY} will inform rental pool participants of any applicable requirements. Buyers should obtain independent legal advice on the implications of the Tourism Development Act for their specific situation.</p>

<h2>7. Rental Income</h2>
<p>Any rental income projections, occupancy estimates, or yield indications provided in the portal or in conversations with SHER representatives are illustrative only and are based on assumptions that may not be realised. They do not constitute a guarantee, representation, or warranty of rental income. Actual rental income will depend on occupancy rates, seasonal demand, market conditions, management performance, and other factors outside the control of ${ENTITY}.</p>

<h2>8. Reservation Process</h2>
<p>No residential unit at SHER Sanctuary is reserved or held for any buyer until:</p>
<ol>
  <li>A formal Reservation Agreement has been signed by both the buyer and ${ENTITY}; and</li>
  <li>The reservation deposit (as specified in the Reservation Agreement) has been received by ${ENTITY} in cleared funds.</li>
</ol>
<p>Prior discussions, portal access, enquiry forms, and expressions of interest do not constitute a reservation or create any legal obligation on ${ENTITY} to sell, or on the buyer to purchase, any unit. The Reservation Agreement will set out the terms on which the deposit is refundable or non-refundable.</p>

<h2>9. No Legal or Financial Advice</h2>
<p>${ENTITY} does not provide legal advice, financial advice, mortgage advice, or tax advice. All buyers are strongly advised to obtain independent professional advice from appropriately qualified advisors before signing any agreement or making any payment.</p>

<h2>10. Governing Law &amp; Jurisdiction</h2>
<p>These terms and all matters relating to the portal and the sale of SHER residences are governed by the laws of Saint Lucia. Any dispute arising from or in connection with these terms or the portal materials shall be subject to the exclusive jurisdiction of the courts of Saint Lucia.</p>

<div class="callout">
  <p><strong>Contact:</strong> For enquiries relating to these terms or the buyer process, contact bookings@shersanctuary.com. These terms are effective as at ${TODAY}.</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT 6 — NDA TEMPLATE (TIER 3)
// ══════════════════════════════════════════════════════════════════════════
const doc6 = ndaShell(`
<div class="nda-title">Non-Disclosure Agreement</div>
<div class="nda-subtitle">SHER-LEGAL-006-R01 · Tier 3 Confidential Materials</div>

<div class="parties-block">
  <h4>Parties to this Agreement</h4>
  <div class="party-row">
    <div class="party-label">Disclosing Party ("SHER")</div>
    <div class="party-detail">
      ${ENTITY}, a company registered in Saint Lucia (Reg. No. 2016-C251), trading as SHER Sanctuary Experiences, Savannes Bay, Micoud, Saint Lucia, West Indies ("the Disclosing Party")
    </div>
  </div>
  <div class="party-row">
    <div class="party-label">Receiving Party</div>
    <div class="party-detail">
      <table style="width:100%;border-collapse:collapse;font-size:9pt">
        <tr><td style="padding:3px 0;width:160px">Full legal name:</td><td style="border-bottom:1px solid #aaa;padding:3px 0">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td></tr>
        <tr><td style="padding:3px 0">Organisation (if any):</td><td style="border-bottom:1px solid #aaa;padding:3px 0">&nbsp;</td></tr>
        <tr><td style="padding:3px 0">Address:</td><td style="border-bottom:1px solid #aaa;padding:3px 0">&nbsp;</td></tr>
        <tr><td style="padding:3px 0">Email address:</td><td style="border-bottom:1px solid #aaa;padding:3px 0">&nbsp;</td></tr>
      </table>
    </div>
  </div>
</div>

<p style="font-size:9pt;margin-bottom:14px">This Non-Disclosure Agreement ("Agreement") is entered into as of <strong>[DATE]</strong> between the Disclosing Party and the Receiving Party (together, "the Parties"). In consideration of the mutual obligations set out herein and for other good and valuable consideration (the receipt and sufficiency of which are acknowledged), the Parties agree as follows:</p>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">1.</span> Definitions &amp; Interpretation</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">1.1</span><span><strong>"Confidential Information"</strong> means all information disclosed by the Disclosing Party to the Receiving Party in connection with the SHER Sanctuary Experiences development project, whether disclosed orally, in writing, in digital form, or by any other means, and whether or not marked "confidential", including but not limited to: full financial models and projections; land title and conveyancing documentation; acquisition strategy and land negotiation records; development agreements and term sheets; draft Sale and Purchase Agreements; draft investment agreements; SPV shareholders agreements; legal opinions; structural and geotechnical reports; planning and regulatory submissions; and all Tier 3 materials made available through the SHER Investor Portal.</span></div>
    <div class="sub-clause"><span class="sn">1.2</span><span><strong>"Purpose"</strong> means the evaluation by the Receiving Party of a potential investment in or property purchase from SHER Sanctuary Experiences.</span></div>
    <div class="sub-clause"><span class="sn">1.3</span><span>References to a party include that party's directors, officers, employees, agents, and professional advisors.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">2.</span> Confidentiality Obligations</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">2.1</span><span>The Receiving Party shall: (a) keep the Confidential Information strictly confidential; (b) not disclose the Confidential Information to any third party without the prior written consent of the Disclosing Party; (c) use the Confidential Information solely for the Purpose; and (d) protect the Confidential Information with at least the same degree of care as it uses to protect its own confidential information, and in any event with no less than reasonable care.</span></div>
    <div class="sub-clause"><span class="sn">2.2</span><span>The Receiving Party may disclose Confidential Information to its directors, officers, employees, and professional advisors (including legal counsel, accountants, and financial advisors) who: (a) need to know such information for the Purpose; (b) are made aware of the confidential nature of the information; and (c) are bound by obligations of confidentiality at least as stringent as those contained in this Agreement. The Receiving Party shall remain liable for any breach of this Agreement by such persons.</span></div>
    <div class="sub-clause"><span class="sn">2.3</span><span>The Receiving Party shall not copy, reproduce, or reduce to writing any Confidential Information except to the extent strictly necessary for the Purpose.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">3.</span> Exclusions</div>
  <div class="clause-body">
    <p>The obligations in Clause 2 shall not apply to Confidential Information that the Receiving Party can demonstrate:</p>
    <div class="sub-clause"><span class="sn">3.1</span><span>was already in the public domain at the time of disclosure, or subsequently enters the public domain other than through a breach of this Agreement by the Receiving Party;</span></div>
    <div class="sub-clause"><span class="sn">3.2</span><span>was already known to the Receiving Party at the time of disclosure, free of any obligation of confidence;</span></div>
    <div class="sub-clause"><span class="sn">3.3</span><span>was independently developed by the Receiving Party without use of or reference to the Confidential Information; or</span></div>
    <div class="sub-clause"><span class="sn">3.4</span><span>is required to be disclosed by law, court order, or the order of any regulatory authority of competent jurisdiction — provided that, to the extent permitted by law, the Receiving Party gives the Disclosing Party prompt written notice of such requirement prior to disclosure and co-operates reasonably with the Disclosing Party in seeking a protective order or other appropriate relief.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">4.</span> Return or Destruction of Confidential Information</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">4.1</span><span>Upon written request by the Disclosing Party, or upon the Receiving Party's decision not to proceed with the Purpose, the Receiving Party shall promptly: (a) return to the Disclosing Party, or (b) permanently destroy (and certify in writing that it has done so), all Confidential Information in its possession or control, in all media and formats, including all copies and extracts.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">5.</span> Duration</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">5.1</span><span>The obligations of confidentiality under this Agreement shall survive the execution of this Agreement and continue in full force for a period of <strong>three (3) years</strong> from the date of execution, or until the relevant Confidential Information enters the public domain through no breach of this Agreement by the Receiving Party, whichever is earlier.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">6.</span> Remedies</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">6.1</span><span>The Receiving Party acknowledges that any breach or threatened breach of this Agreement may cause immediate and irreparable harm to the Disclosing Party for which monetary damages would be an inadequate remedy. Accordingly, the Disclosing Party shall be entitled to seek injunctive relief, specific performance, and any other equitable remedy in addition to any damages or other relief available at law, without the requirement to post bond or other security.</span></div>
    <div class="sub-clause"><span class="sn">6.2</span><span>No failure or delay by the Disclosing Party in exercising any right under this Agreement shall operate as a waiver of that right.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">7.</span> No Licence or Obligation to Transact</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">7.1</span><span>Nothing in this Agreement grants the Receiving Party any licence, right, or interest in the Confidential Information or the intellectual property of the Disclosing Party beyond the right to use it for the Purpose. This Agreement does not obligate either party to enter into any transaction, partnership, or investment arrangement.</span></div>
  </div>
</div>

<div class="clause-block">
  <div class="clause-heading"><span class="cn">8.</span> Governing Law &amp; Jurisdiction</div>
  <div class="clause-body">
    <div class="sub-clause"><span class="sn">8.1</span><span>This Agreement is governed by and construed in accordance with the laws of Saint Lucia. Each party irrevocably submits to the exclusive jurisdiction of the courts of Saint Lucia for the resolution of any dispute arising from or in connection with this Agreement.</span></div>
    <div class="sub-clause"><span class="sn">8.2</span><span>If any provision of this Agreement is held to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.</span></div>
  </div>
</div>

<div class="sig-block">
  <div class="sig-party">
    <h4>Disclosing Party — SHER</h4>
    <div class="sig-field-label">Signed for and on behalf of</div>
    <div class="sig-field-value">${ENTITY}</div>
    <div class="sig-line"></div>
    <div class="sig-field-label">Signature</div>
    <div class="sig-field-value" style="margin-top:6px"><strong>Kemble Emanuel</strong></div>
    <div class="sig-field-label">Name (print)</div>
    <div class="sig-field-value">Managing Director</div>
    <div class="sig-field-label">Title</div>
    <div class="sig-field-value">[DATE]</div>
    <div class="sig-field-label">Date</div>
  </div>
  <div class="sig-party">
    <h4>Receiving Party</h4>
    <div class="sig-line"></div>
    <div class="sig-field-label">Signature</div>
    <div class="sig-line" style="margin-top:14px"></div>
    <div class="sig-field-label">Full name (print)</div>
    <div class="sig-line" style="margin-top:14px"></div>
    <div class="sig-field-label">Title / Position</div>
    <div class="sig-line" style="margin-top:14px"></div>
    <div class="sig-field-label">Organisation (if applicable)</div>
    <div class="sig-line" style="margin-top:14px"></div>
    <div class="sig-field-label">Date</div>
  </div>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// DOCUMENT 7 — COOKIE POLICY
// ══════════════════════════════════════════════════════════════════════════
const doc7 = shell('SHER-LEGAL-007-R01', 'Cookie Policy', `
<span class="eyebrow">Data Protection · Cookies &amp; Local Storage</span>
<h1>Cookie Policy</h1>
<p class="lead">This policy explains how shersanctuary.com and the SHER Investor and Buyer Portals use cookies and similar technologies. We keep it simple: we use functional cookies only.</p>

<h2>1. What Are Cookies?</h2>
<p>Cookies are small text files placed on your device by a website when you visit it. They are widely used to make websites work or to work more efficiently. Cookies can be "session cookies" (deleted when you close your browser) or "persistent cookies" (which remain on your device for a set period or until you delete them).</p>
<p>In addition to cookies, web browsers provide "local storage" — a mechanism that allows a website to store small amounts of data on your device without an expiry date. The SHER portals use local storage for the same functional purposes described below.</p>

<h2>2. Cookies We Use</h2>
<p>We use <strong>functional cookies and local storage only</strong>. These are strictly necessary for the portal to operate correctly. We do not use advertising cookies, analytics cookies, or any third-party tracking technologies.</p>

<table class="clause-table">
  <thead><tr><th>Cookie / Storage Key</th><th>Type</th><th>Purpose</th><th>Duration</th></tr></thead>
  <tbody>
    <tr><td>Portal session state</td><td>Session (local storage)</td><td>Remembers that you have entered the correct access code for the investor or buyer portal gate during your browser session — prevents you from having to re-enter your code on every page load within the same session</td><td>Session only — cleared when you close your browser tab or window</td></tr>
    <tr><td>Form session state</td><td>Session cookie</td><td>Maintains the state of multi-step forms (discovery profile, booking enquiry) within a single session — prevents loss of partially completed form data</td><td>Session only</td></tr>
    <tr><td>Netlify forms</td><td>Functional — set by Netlify</td><td>Required for form submission processing via Netlify's form handling service. Netlify may set a session cookie for bot-protection and form identification purposes</td><td>Session only</td></tr>
  </tbody>
</table>

<h2>3. What We Do Not Use</h2>
<ul>
  <li><strong>Analytics cookies</strong> — we do not currently use Google Analytics, Matomo, or any other analytics platform that tracks visitor behaviour across sessions;</li>
  <li><strong>Advertising cookies</strong> — we do not run advertising campaigns that use behavioural tracking;</li>
  <li><strong>Social media tracking pixels</strong> — we do not use Facebook Pixel, LinkedIn Insight Tag, or similar third-party tracking pixels;</li>
  <li><strong>Persistent cross-site tracking</strong> — no data about your browsing activity on other websites is collected by us.</li>
</ul>

<h2>4. Third-Party Cookies</h2>
<p>Certain third-party services integrated into the site may set their own cookies:</p>
<ul>
  <li><strong>Google Fonts</strong> — the site loads fonts from fonts.googleapis.com. Google may log the request and its associated IP address. We are in the process of evaluating whether to self-host all fonts to eliminate this request entirely.</li>
  <li><strong>Vimeo</strong> — where video content is embedded in the investor or buyer portals via Vimeo, Vimeo may set its own cookies when you play a video. These are subject to Vimeo's own privacy policy. You can prevent Vimeo cookies by not playing embedded videos.</li>
</ul>
<p>We have no control over third-party cookies and are not responsible for the data practices of third-party services. We select third-party services on the basis of their privacy posture and will update this policy if our use of third-party services changes materially.</p>

<h2>5. How to Control Cookies</h2>
<p>You can control and delete cookies through your browser settings. Most browsers allow you to:</p>
<ul>
  <li>View and delete individual cookies;</li>
  <li>Block all cookies from all sites;</li>
  <li>Block third-party cookies only;</li>
  <li>Accept cookies from specific sites.</li>
</ul>
<p>Browser-specific instructions are available at:</p>
<ul>
  <li>Chrome: Settings → Privacy and Security → Cookies and other site data</li>
  <li>Safari: Preferences → Privacy → Manage Website Data</li>
  <li>Firefox: Options → Privacy &amp; Security → Cookies and Site Data</li>
  <li>Edge: Settings → Cookies and site permissions</li>
</ul>
<p><strong>Please note:</strong> if you disable functional cookies and local storage in your browser, the portal access gates (investor and buyer portals) may not retain your unlocked state between pages. You may need to re-enter your access code each time you navigate between sections.</p>

<h2>6. Compliance</h2>
<p>This Cookie Policy is issued in compliance with the Data Protection Act Cap. 8:18 of Saint Lucia (fully in force 1 January 2025) and applies the principle of data minimisation — we collect and process only the data strictly necessary for the functional operation of the site. As we do not use non-essential cookies, we do not operate a cookie consent banner; all cookies set are functional and necessary. Should we introduce any non-essential cookies in the future, we will update this policy and implement appropriate consent mechanisms before doing so.</p>

<h2>7. Changes to This Policy</h2>
<p>We may update this Cookie Policy from time to time. The current version will always be published at ${SITE}/legal. Significant changes will be communicated through a notice on the site.</p>

<div class="callout">
  <p><strong>Questions?</strong> Contact our Privacy Officer at ${EMAIL}<br>
  <strong>Effective date:</strong> ${TODAY}</p>
</div>
`);


// ══════════════════════════════════════════════════════════════════════════
// RENDER ALL DOCS
// ══════════════════════════════════════════════════════════════════════════
const DOCS = [
  { ref: 'SHER-LEGAL-001-R01', filename: 'SHER-LEGAL-001-R01.pdf', html: doc1 },
  { ref: 'SHER-LEGAL-002-R01', filename: 'SHER-LEGAL-002-R01.pdf', html: doc2 },
  { ref: 'SHER-LEGAL-003-R01', filename: 'SHER-LEGAL-003-R01.pdf', html: doc3 },
  { ref: 'SHER-LEGAL-004-R01', filename: 'SHER-LEGAL-004-R01.pdf', html: doc4 },
  { ref: 'SHER-LEGAL-006-R01', filename: 'SHER-LEGAL-006-R01.pdf', html: doc6 },
  { ref: 'SHER-LEGAL-007-R01', filename: 'SHER-LEGAL-007-R01.pdf', html: doc7 },
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
  console.log('\nAll 6 legal PDFs generated.');
})();
