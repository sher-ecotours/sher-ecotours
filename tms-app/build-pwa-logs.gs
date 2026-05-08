/**
 * SHER TMS — PWA Log Sheets Setup Script
 *
 * HOW TO RUN (one time only):
 * 1. Go to script.google.com → New project
 * 2. Name it "SHER PWA Logs Builder"
 * 3. Delete the default function and paste this entire file
 * 4. Click Run → buildPWALogs
 * 5. Approve permissions when prompted
 * 6. Click View → Execution log
 * 7. Copy the Spreadsheet ID printed in the log
 * 8. Hand that ID back — it gets added to tms-extension.gs as _WA_PWA_LOG_SS_ID
 *
 * What this creates:
 *   · SHER TMS / PWA LOGS  folder in Drive (inside existing SHER TMS folder)
 *   · SHER PWA RESPONSE LOGS  spreadsheet inside that folder
 *   · FORM 6 — MORNING LOG          sheet  (12 columns)
 *   · FORM 7 — EQUIPMENT INSPECTION sheet  (18 columns)
 *   · FORM 8 — INCIDENT REPORTS     sheet  (12 columns)
 *   · FORM 9 — POST-TOUR RESET      sheet  (12 columns)
 *
 * Column headers match the exact field names sent by the PWA (app.js).
 * Never re-run this script — it creates a fresh spreadsheet each time.
 */

function buildPWALogs() {
  // ── 1. Locate parent folder ─────────────────────────────────────────────────
  var parentFolder = _findOrCreateFolder('SHER TMS', null);
  var logsFolder   = _findOrCreateFolder('PWA LOGS', parentFolder);

  Logger.log('Drive folder: ' + logsFolder.getUrl());

  // ── 2. Create spreadsheet ───────────────────────────────────────────────────
  var ss = SpreadsheetApp.create('SHER PWA RESPONSE LOGS');
  DriveApp.getFileById(ss.getId()).moveTo(logsFolder);

  Logger.log('Spreadsheet created: ' + ss.getUrl());
  Logger.log('');

  // ── 3. Build each log sheet ─────────────────────────────────────────────────
  _buildForm6Sheet(ss);
  _buildForm7Sheet(ss);
  _buildForm8Sheet(ss);
  _buildForm9Sheet(ss);

  // ── 4. Remove default blank sheet ──────────────────────────────────────────
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  // ── 5. Print the ID the developer needs ────────────────────────────────────
  Logger.log('');
  Logger.log('=== BUILD COMPLETE ===');
  Logger.log('');
  Logger.log('SPREADSHEET ID (copy this):');
  Logger.log(ss.getId());
  Logger.log('');
  Logger.log('SPREADSHEET URL:');
  Logger.log(ss.getUrl());
  Logger.log('');
  Logger.log('Sheets created:');
  ss.getSheets().forEach(function(s) {
    Logger.log('  · ' + s.getName() + ' (' + (s.getLastColumn()) + ' columns)');
  });
  Logger.log('');
  Logger.log('Next step: paste the Spreadsheet ID above into tms-extension.gs');
  Logger.log('as the value of _WA_PWA_LOG_SS_ID, then redeploy the web app.');
}


// ── FORM 6 — MORNING LOG ──────────────────────────────────────────────────────

function _buildForm6Sheet(ss) {
  var headers = [
    'Timestamp',
    'Experience(s) Delivered Today',
    'Sky Condition at Departure',
    'Experience Mode',
    'Number of Guests',
    'Was a Mystic Morning Bundle issued?',
    'Water Condition',
    'Wildlife or Bay Observation (optional)',
    'Equipment Condition Check',
    'Equipment Notes (if any)',
    'Guest Mood at End of Experience',
    'Guide Notes (free text)'
  ];
  _makeLogSheet(ss, 'FORM 6 — MORNING LOG', headers, '#2a5a48');
}


// ── FORM 7 — EQUIPMENT INSPECTION ────────────────────────────────────────────

function _buildForm7Sheet(ss) {
  var headers = [
    'Timestamp',
    'Guide Name',
    'Inspection Date',
    'Kayak-01 cleared',
    'Kayak-02 cleared',
    'Kayak-03 cleared',
    'Guide kayak cleared',
    'Electric canoe cleared',
    'PFDs checked',
    'First aid kit checked',
    'Safety equipment checked',
    'Communication device checked',
    'Paddles checked',
    'Refreshment kit prepared',
    'Bay conditions assessed',
    'Launch area clear',
    'Any item flagged',
    'Inspection Notes'
  ];
  _makeLogSheet(ss, 'FORM 7 — EQUIPMENT INSPECTION', headers, '#2a4a6a');
}


// ── FORM 8 — INCIDENT REPORTS ─────────────────────────────────────────────────

function _buildForm8Sheet(ss) {
  var headers = [
    'Timestamp',
    'Incident Level',
    'Incident Type',
    'Date and Time',
    'Guide Name',
    'Location',
    'Description',
    'Guests Involved',
    'Guest Names',
    'Immediate Action Taken',
    'Medical Attention Required',
    'External Services Contacted'
  ];
  _makeLogSheet(ss, 'FORM 8 — INCIDENT REPORTS', headers, '#6a2a2a');
}


// ── FORM 9 — POST-TOUR RESET ──────────────────────────────────────────────────

function _buildForm9Sheet(ss) {
  var headers = [
    'Timestamp',
    'Guide Name',
    'Experience Delivered',
    'All guests safely returned',
    'Equipment returned and stowed',
    'Kayaks rinsed and secured',
    'PFDs dried and stored',
    'Launch area cleared',
    'Access secured',
    'Lost Property Found',
    'Lost Property Description',
    'Guide Notes'
  ];
  _makeLogSheet(ss, 'FORM 9 — POST-TOUR RESET', headers, '#3a4a2a');
}


// ── SHEET BUILDER HELPER ──────────────────────────────────────────────────────

function _makeLogSheet(ss, name, headers, tabColor) {
  var sheet = ss.insertSheet(name);
  if (tabColor) sheet.setTabColor(tabColor);

  // Header row styling — matches TMS master database style
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold');
  range.setBackground('#1a3a26');
  range.setFontColor('#d4a843');
  range.setFontSize(10);
  range.setWrap(true);

  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 40);

  // Column widths
  sheet.setColumnWidth(1, 160);  // Timestamp
  for (var i = 2; i <= headers.length; i++) {
    sheet.setColumnWidth(i, 180);
  }

  // Alternate row banding for readability
  var banding = sheet.getRange(2, 1, 1000, headers.length).applyRowBanding();
  banding.setHeaderRowColor('#1a3a26');
  banding.setFirstRowColor('#ffffff');
  banding.setSecondRowColor('#f4f8f6');
  banding.setFooterRowColor(null);

  Logger.log('Sheet created: ' + name + ' (' + headers.length + ' columns)');
  return sheet;
}


// ── FOLDER HELPER ─────────────────────────────────────────────────────────────

function _findOrCreateFolder(name, parent) {
  var iter = parent
    ? parent.getFoldersByName(name)
    : DriveApp.getFoldersByName(name);

  if (iter.hasNext()) {
    var existing = iter.next();
    Logger.log('Found existing folder: ' + existing.getName());
    return existing;
  }

  var newFolder = parent
    ? parent.createFolder(name)
    : DriveApp.createFolder(name);

  Logger.log('Created folder: ' + newFolder.getName());
  return newFolder;
}
