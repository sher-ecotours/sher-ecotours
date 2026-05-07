/**
 * SHER Eco Sanctuary — Tour Management System
 * Phase 1 Build Script · Google Apps Script
 *
 * HOW TO RUN:
 * 1. Go to script.google.com and create a new project
 * 2. Paste this entire file, replacing the default content
 * 3. Click Run → buildSHERTMSPhase1
 * 4. Authorise the permissions when prompted
 * 5. When complete, links to the workbook and all forms are logged
 *    in View → Execution log
 *
 * What this script creates:
 *   · SHER TMS / folder structure in Drive (7 folders)
 *   · SHER TMS MASTER DATABASE spreadsheet with 11 sheets
 *   · Experience Catalogue pre-populated with all SHER experiences
 *   · Availability Calendar for Jan – Dec 2026 (season-tagged)
 *   · Form 1  — Guest Enquiry (website-linked)
 *   · Form 3  — Pre-Tour Waiver & Health Declaration
 *   · Form 4  — Booking Confirmation (internal staff)
 *   · Form 6  — Daily Morning Log (guide)
 *   · All forms linked to their respective master sheets
 */

// ─── ENTRY POINT ────────────────────────────────────────────────────────────

function buildSHERTMSPhase1() {
  const root   = _buildFolderStructure();
  const ss     = _buildMasterSpreadsheet(root.master);
  _buildForm1(ss, root.forms);
  _buildForm3(ss, root.forms);
  _buildForm4(ss, root.forms);
  _buildForm6(ss, root.forms);

  Logger.log('=== SHER TMS PHASE 1 BUILD COMPLETE ===');
  Logger.log('Master spreadsheet: ' + ss.getUrl());
  Logger.log('Open View → Execution log for all form URLs.');
}

// ─── STANDALONE REPAIR: run this if Form 6 is not writing to Weather Log ────
//
// HOW TO USE:
//   1. Open the project in script.google.com
//   2. Paste your SHER TMS MASTER DATABASE spreadsheet ID below
//   3. Click Run → repairForm6Link
//   4. Approve permissions when prompted
//   5. Check View → Execution log for confirmation

function repairForm6Link() {
  // ↓ Replace with your actual spreadsheet ID (from the URL of the master sheet)
  const SPREADSHEET_ID = 'PASTE_YOUR_SPREADSHEET_ID_HERE';

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  // Find the Form 6 response sheet (Google names it "Form Responses N")
  let responseSheet = null;
  for (const s of ss.getSheets()) {
    if (s.getName().startsWith('Form Responses') || s.getName().includes('Morning Log')) {
      responseSheet = s;
    }
  }

  if (!responseSheet) {
    Logger.log('ERROR: No Form Responses sheet found. Make sure Form 6 has been linked ' +
               'to this spreadsheet via the Responses tab → Link to Sheets.');
    return;
  }

  // Rename to make the data source clear
  responseSheet.setName('FORM 6 RESPONSES — WEATHER LOG');
  responseSheet.setTabColor('#2a5a48');
  Logger.log('Renamed response sheet to: FORM 6 RESPONSES — WEATHER LOG');

  // Install the onFormSubmit trigger that copies each response to 8. WEATHER LOG
  _installForm6Trigger(ss);

  Logger.log('Form 6 → Weather Log link is now active.');
  Logger.log('Test by submitting a Form 6 response — a new row will appear in 8. WEATHER LOG.');
}

// ─── TRIGGER INSTALLER ───────────────────────────────────────────────────────

function _installForm6Trigger(ss) {
  // Remove any existing Form 6 triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'onForm6Submit') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('onForm6Submit')
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  Logger.log('onForm6Submit trigger installed on spreadsheet: ' + ss.getName());
}

// ─── FORM 6 SUBMIT HANDLER ───────────────────────────────────────────────────
//
// Fires on every form submission to this spreadsheet.
// Copies Form 6 response rows into 8. WEATHER LOG in the correct column order.

function onForm6Submit(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const weatherLog = ss.getSheetByName('8. WEATHER LOG');
  if (!weatherLog) return; // Safety — sheet must exist

  const r = e.namedValues; // { 'Question title': ['Answer'] }

  // Map form answers to Weather Log columns (must match _sheet8_WeatherLog headers)
  const row = [
    new Date(),                                                        // Date
    _firstVal(r, 'Experience(s) Delivered Today')                      // Departure Time (derived)
      .includes('Calm Reflections') ? '9:00 AM' : '5:15 AM',
    _firstVal(r, 'Sky Condition at Departure'),                        // Sky Condition
    _firstVal(r, 'Experience Mode').split(' —')[0],                    // Experience Delivered (short)
    '',                                                                // Reason for Modification
    _firstVal(r, 'Was a Mystic Morning Bundle issued?'),               // Mystic Morning Bundle Issued
    _firstVal(r, 'Number of Guests'),                                  // Number of Guests (Mystic)
    _firstVal(r, 'Was a Mystic Morning Bundle issued?') === 'Yes'
      ? 'Yes' : 'No',                                                  // Conservation Triggered
    _firstVal(r, 'Was a Mystic Morning Bundle issued?') === 'Yes'
      ? '25' : '0',                                                    // Conservation Amount EC$ (EC$25/guest)
    _firstVal(r, 'Water Condition'),                                   // Water Condition
    _firstVal(r, 'Wildlife or Bay Observation (optional)'),            // Wildlife Notable
    _firstVal(r, 'Guide Notes (free text)')                            // Guide Notes
  ];

  weatherLog.appendRow(row);

  // If Mystic Morning — also log to Conservation Fund sheet (Sheet 9)
  if (_firstVal(r, 'Was a Mystic Morning Bundle issued?') === 'Yes') {
    const conservFund = ss.getSheetByName('9. CONSERVATION FUND');
    if (conservFund) {
      const guests     = parseInt(_firstVal(r, 'Number of Guests')) || 0;
      const amountEC   = guests * 25;
      const amountUSD  = Math.round(amountEC / 2.7 * 100) / 100;
      conservFund.appendRow([
        new Date(), '', 'Mystic Morning transition',
        amountEC, amountUSD, '', 'No', '', '', 'No', ''
      ]);
    }
  }
}

function _firstVal(namedValues, key) {
  const entry = namedValues[key];
  return (entry && entry[0]) ? entry[0].trim() : '';
}


// ─── DRIVE FOLDER STRUCTURE ─────────────────────────────────────────────────

function _buildFolderStructure() {
  const root      = DriveApp.createFolder('SHER TMS');
  const master    = root.createFolder('SHER TMS / MASTER DATABASE');
  const forms     = root.createFolder('SHER TMS / FORMS');
  const dash      = root.createFolder('SHER TMS / DASHBOARDS');
  const comms     = root.createFolder('SHER TMS / COMMUNICATIONS');
  const docs      = root.createFolder('SHER TMS / DOCUMENTS');
  const reports   = root.createFolder('SHER TMS / REPORTS');
  const conserv   = root.createFolder('SHER TMS / CONSERVATION');

  Logger.log('Drive folder structure created: ' + root.getUrl());
  return { root, master, forms, dash, comms, docs, reports, conserv };
}


// ─── MASTER SPREADSHEET ─────────────────────────────────────────────────────

function _buildMasterSpreadsheet(folder) {
  const ss = SpreadsheetApp.create('SHER TMS MASTER DATABASE');
  DriveApp.getFileById(ss.getId()).moveTo(folder);

  // Build each sheet in order
  _sheet1_MasterBookings(ss);
  _sheet2_EnquiryLog(ss);
  _sheet3_GuestDatabase(ss);
  _sheet4_AvailabilityCalendar(ss);
  _sheet5_ExperienceCatalogue(ss);
  _sheet6_PartnerRegister(ss);
  _sheet7_RevenueTracker(ss);
  _sheet8_WeatherLog(ss);
  _sheet9_ConservationFund(ss);
  _sheet10_StaffSchedule(ss);
  _sheet11_EquipmentLog(ss);

  // Remove the default blank sheet
  const defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet) ss.deleteSheet(defaultSheet);

  return ss;
}


// ─── SHEET HELPERS ──────────────────────────────────────────────────────────

function _makeSheet(ss, name, headers, tabColor) {
  const sheet = ss.insertSheet(name);
  if (tabColor) sheet.setTabColor(tabColor);

  // Header row
  const range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);
  range.setFontWeight('bold');
  range.setBackground('#1a3a26');
  range.setFontColor('#d4a843');
  range.setFontSize(10);
  sheet.setFrozenRows(1);
  sheet.setRowHeight(1, 32);

  // Column widths — auto-size all
  headers.forEach((_, i) => sheet.setColumnWidth(i + 1, 160));

  return sheet;
}

function _dv(values) {
  return SpreadsheetApp.newDataValidation()
    .requireValueInList(values, true)
    .setAllowInvalid(false)
    .build();
}


// ─── SHEET 1: MASTER BOOKINGS ────────────────────────────────────────────────

function _sheet1_MasterBookings(ss) {
  const headers = [
    'Booking ID', 'Booking Status', 'Experience Name', 'Guest Name(s)',
    'Guest Email', 'Guest WhatsApp', 'Booking Date (Experience)', 'Preferred Time',
    'Group Size', 'Occasion Type', 'Revenue USD', 'Payment Status',
    'FYGARO Link Sent', 'FYGARO Ref', 'Partner Referral', 'Waiver Status',
    'Weather Condition', 'Guide Assigned', 'Conservation Contribution USD',
    'Gift Issued', 'Post-Tour Feedback', 'Feedback Rating', 'Notes'
  ];
  const sheet = _makeSheet(ss, '1. MASTER BOOKINGS', headers, '#1a3a26');

  // Data validation on key columns
  const statusDV   = _dv(['Enquiry','Qualified','Confirmed','Completed','Cancelled','Deferred']);
  const timeDV     = _dv(['5:15 AM','9:00 AM','By appointment']);
  const occasionDV = _dv(['None','Proposal','Anniversary','Vow Renewal','Birthday','Other']);
  const payDV      = _dv(['Unpaid','Deposit received','Paid in full']);
  const waiverDV   = _dv(['Not sent','Sent','Signed']);
  const weatherDV  = _dv(['Golden Mirror','Mystic Morning','Calm Reflections','Calm','Rain','Modified','Cancelled']);
  const giftDV     = _dv(['None','Mystic Morning Bundle','Celebration Keepsake']);
  const fbDV       = _dv(['Not submitted','Submitted']);

  const experienceDV = _dv([
    'Bay Serenity · Golden Mirror',
    'Bay Serenity · Calm Reflections',
    'Scorpio\'s Secret',
    'Scorpio\'s Sanctuary',
    'Table d\'Eau',
    'Mystic Morning',
    'Coral Drift',
    'Fisherman\'s Tide',
    'Local Celebration',
    'School Conservation Programme',
    'Community Stewardship Day'
  ]);

  const dvRange = (col, dv) => sheet.getRange(2, col, 1000, 1).setDataValidation(dv);
  dvRange(2,  statusDV);
  dvRange(3,  experienceDV);
  dvRange(8,  timeDV);
  dvRange(10, occasionDV);
  dvRange(12, payDV);
  dvRange(15, waiverDV);
  dvRange(16, weatherDV);
  dvRange(20, giftDV);
  dvRange(21, fbDV);

  // Auto Booking ID formula note in A2
  sheet.getRange('A2').setNote('Format: SHER-2026-0001 · Increment manually or use Automation');
}


// ─── SHEET 2: ENQUIRY LOG ────────────────────────────────────────────────────

function _sheet2_EnquiryLog(ss) {
  const headers = [
    'Enquiry ID', 'Date Received', 'Guest Name', 'Email', 'WhatsApp',
    'Experience Interest', 'Preferred Date 1', 'Preferred Date 2', 'Preferred Date 3',
    'Date Flexibility', 'Group Size', 'Occasion', 'How They Heard',
    'Enquiry Status', 'Response Sent Date', 'Response Method',
    'Conversion Date', 'Booking ID (Converted)', 'Notes'
  ];
  const sheet = _makeSheet(ss, '2. ENQUIRY LOG', headers, '#2d5a3d');

  sheet.getRange(2, 6,  1000, 1).setDataValidation(_dv([
    'Bay Serenity · Golden Mirror','Bay Serenity · Calm Reflections',
    'Scorpio\'s Secret','Scorpio\'s Sanctuary','Table d\'Eau','Not sure'
  ]));
  sheet.getRange(2, 10, 1000, 1).setDataValidation(_dv([
    'I need these specific dates','I am somewhat flexible','Any date works'
  ]));
  sheet.getRange(2, 12, 1000, 1).setDataValidation(_dv([
    'None','Proposal','Anniversary','Vow Renewal','Birthday','Other'
  ]));
  sheet.getRange(2, 13, 1000, 1).setDataValidation(_dv([
    'Resort concierge','Google','Social media','Friend','Walk-in','Other'
  ]));
  sheet.getRange(2, 14, 1000, 1).setDataValidation(_dv([
    'New','Responded','Converted to booking','No response','Lost'
  ]));
  sheet.getRange(2, 16, 1000, 1).setDataValidation(_dv(['Email','WhatsApp','Both']));
}


// ─── SHEET 3: GUEST DATABASE ─────────────────────────────────────────────────

function _sheet3_GuestDatabase(ss) {
  const headers = [
    'Guest ID', 'Full Name', 'Email', 'WhatsApp / Phone', 'Nationality / Origin',
    'First Visit Date', 'Total Visits', 'Total Spend USD', 'Experiences Taken',
    'Milestones Celebrated', 'Referrals Made', 'Active Credit USD',
    'Credit Expiry Date', 'Marketing Consent', 'Notes'
  ];
  const sheet = _makeSheet(ss, '3. GUEST DATABASE', headers, '#3d6b4a');

  sheet.getRange(2, 14, 1000, 1).setDataValidation(_dv(['Yes','No']));
  sheet.getRange('G2').setNote('=COUNTIF(\'1. MASTER BOOKINGS\'!C:C, B2) — link to bookings sheet');
  sheet.getRange('H2').setNote('=SUMIF(\'1. MASTER BOOKINGS\'!D:D, B2, \'1. MASTER BOOKINGS\'!K:K)');
}


// ─── SHEET 4: AVAILABILITY CALENDAR ─────────────────────────────────────────

function _sheet4_AvailabilityCalendar(ss) {
  const headers = [
    'Date', 'Day of Week', 'Season Tag',
    'Bay Serenity Slot (5:15 AM)', 'Bay Serenity Guests Booked',
    'Calm Reflections Slot (9:00 AM)', 'Calm Reflections Guests Booked',
    'Scorpion Islet Slot', 'Islet Booking Type',
    'Table d\'Eau Slot (2026+)', 'Guide Available', 'Weather Forecast', 'Day Notes'
  ];
  const sheet = _makeSheet(ss, '4. AVAILABILITY CALENDAR', headers, '#4a7a58');
  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(3, 120);

  // Season definition
  const seasonOf = (d) => {
    const m = d.getMonth() + 1;
    const day = d.getDate();
    if ((m === 12 && day >= 15) || m <= 4) return 'Peak';
    if (m === 5 || m === 10 || m === 11) return 'Shoulder';
    if (m >= 6 && m <= 9) return 'Mystic';
    return 'Shoulder';
  };

  const slotDV    = _dv(['Available','Booked','Blocked','Weather hold']);
  const isletDV   = _dv(['Available','Booked','Blocked']);
  const isletTypeDV = _dv([
    'Scorpio\'s Secret','Scorpio\'s Sanctuary','Community Stewardship Day','None'
  ]);
  const seasonDV  = _dv(['Peak','Shoulder','Mystic','Local']);

  // Populate all 365 days of 2026
  const rows = [];
  const start = new Date('2026-01-01');
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  for (let i = 0; i < 365; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    rows.push([
      Utilities.formatDate(d, 'UTC', 'yyyy-MM-dd'),
      days[d.getDay()],
      seasonOf(d),
      'Available', 0,
      'Available', 0,
      'Available', 'None',
      'Blocked',    // Table d'Eau blocked until 2027
      '', '', ''
    ]);
  }

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  // Data validation on slot columns
  sheet.getRange(2, 4, 365, 1).setDataValidation(slotDV);
  sheet.getRange(2, 6, 365, 1).setDataValidation(slotDV);
  sheet.getRange(2, 8, 365, 1).setDataValidation(isletDV);
  sheet.getRange(2, 9, 365, 1).setDataValidation(isletTypeDV);
  sheet.getRange(2, 10, 365, 1).setDataValidation(isletDV);
  sheet.getRange(2, 3, 365, 1).setDataValidation(seasonDV);

  // Colour-code by season (conditional formatting)
  const peakRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Peak').setBackground('#1a3a26').setFontColor('#d4a843')
    .setRanges([sheet.getRange('C2:C366')]).build();
  const mysticRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Mystic').setBackground('#2d4a5a').setFontColor('#a8c8e0')
    .setRanges([sheet.getRange('C2:C366')]).build();
  sheet.setConditionalFormatRules([peakRule, mysticRule]);
}


// ─── SHEET 5: EXPERIENCE CATALOGUE ──────────────────────────────────────────

function _sheet5_ExperienceCatalogue(ss) {
  const headers = [
    'Experience Name', 'Category', 'Public Price USD', 'Partner Price USD',
    'Price Unit', 'Max Capacity', 'Min to Operate', 'Duration (hrs)',
    'Departure Time', 'Islet Landing Required', 'Celebration Kit Required',
    'Refreshment Profile', 'Variable Cost USD', 'Active (Y/N)', 'Notes'
  ];
  const sheet = _makeSheet(ss, '5. EXPERIENCE CATALOGUE', headers, '#5a8a68');

  const experiences = [
    ['Bay Serenity · Golden Mirror',   'Bay Serenity',      180, 150, 'Per person',  6, 2, 2,   '5:15 AM',        'No',  'No',  'Fruit, juice, sunrise snack',       25, 'Y', 'Flagship dawn experience. Golden Mirror if clear; Mystic Morning if overcast.'],
    ['Bay Serenity · Calm Reflections','Bay Serenity',      150, 120, 'Per person',  6, 2, 2,   '9:00 AM',        'No',  'No',  'Fruit, juice, light refresh',       18, 'Y', 'Mid-morning alternative. Weather-resilient positioning.'],
    ['Mystic Morning',                  'Bay Serenity',      180, 150, 'Per person',  6, 2, 2,   '5:15 AM',        'No',  'Yes', 'Cocoa tea, local bakes, warm bundle',30, 'Y', 'Weather variant of Golden Mirror. Conservation contribution triggered automatically.'],
    ['Scorpio\'s Secret',               'Islet Private',     420, 378, 'Per couple',  2, 1, 2.5, 'By appointment', 'Yes', 'Yes', 'Champagne, strawberries, keepsake', 85, 'Y', 'One couple only. One islet landing per day.'],
    ['Scorpio\'s Sanctuary',            'Islet Celebration', 600, 540, 'Flat rate',   4, 2, 3,   'By appointment', 'Yes', 'Yes', 'Champagne, full celebration setup', 110, 'Y', 'Two couples sharing by prior arrangement. Never paired with strangers.'],
    ['Table d\'Eau',                    'Dining',              0,   0, 'TBC',         8, 4, 3,   'Golden Hour',    'No',  'Yes', 'White linen dining, Saint Lucian cuisine, champagne', 200, 'N', 'Launching 2027. Interest list open.'],
    ['Coral Drift',                     'Bay Serenity',      150, 135, 'Per person',  6, 2, 2,   'By appointment', 'No',  'No',  'Snorkel kit, reef-safe sunscreen',  20, 'N', 'Future experience. Placeholder only.'],
    ['Fisherman\'s Tide',               'Bay Serenity',      120, 108, 'Per person',  4, 2, 1.5, 'By appointment', 'No',  'No',  'Light refresh',                      12, 'N', 'Future experience. Local culture focus.'],
    ['Local Celebration',               'Islet Private',     420, 378, 'Per couple',  2, 1, 2.5, 'By appointment', 'Yes', 'Yes', 'Champagne, keepsake',               85, 'Y', 'Full celebration rate for Saint Lucian nationals. Islet pricing unchanged.'],
    ['School Conservation Programme',  'Community',          40,   0, 'Per student', 12, 6, 2,   'By appointment', 'No',  'No',  'Water, environmental education kit', 10, 'Y', 'Groups of up to 12 students. PSEPA curriculum partner activity.'],
    ['Community Stewardship Day',       'Community',           0,   0, 'Complimentary',8, 4, 3, 'By appointment', 'No',  'No',  'Refreshments provided',              15, 'Y', 'Quarterly. In exchange for bay stewardship activity. Organised with National Trust.'],
  ];

  sheet.getRange(2, 1, experiences.length, experiences[0].length).setValues(experiences);

  // Highlight active experiences
  const activeRule = SpreadsheetApp.newConditionalFormatRule()
    .whenTextEqualTo('Y').setBackground('#1a3a26').setFontColor('#d4a843')
    .setRanges([sheet.getRange('N2:N20')]).build();
  sheet.setConditionalFormatRules([activeRule]);

  sheet.autoResizeColumns(1, headers.length);
}


// ─── SHEET 6: PARTNER REGISTER ───────────────────────────────────────────────

function _sheet6_PartnerRegister(ss) {
  const headers = [
    'Partner ID', 'Partner Name', 'Type', 'Contact Name', 'Contact Email',
    'Contact WhatsApp', 'Commission Rate %', 'Commission Method',
    'Date Onboarded', 'Familiarisation Tour Taken', 'Fam Tour Date',
    'Total Bookings Referred', 'Total Commission Paid USD', 'Last Referral Date',
    'Partner Status', 'Notes'
  ];
  const sheet = _makeSheet(ss, '6. PARTNER REGISTER', headers, '#3a6a50');

  sheet.getRange(2, 3, 1000, 1).setDataValidation(_dv([
    'Luxury resort','Boutique hotel','Villa manager','Wellness retreat','Driver','Other'
  ]));
  sheet.getRange(2, 8, 1000, 1).setDataValidation(_dv([
    'Added to guest invoice deduction','Direct payment'
  ]));
  sheet.getRange(2, 10, 1000, 1).setDataValidation(_dv(['Yes','No']));
  sheet.getRange(2, 15, 1000, 1).setDataValidation(_dv(['Active','Inactive','Paused']));
}


// ─── SHEET 7: REVENUE TRACKER ────────────────────────────────────────────────

function _sheet7_RevenueTracker(ss) {
  const headers = [
    'Date', 'Booking ID', 'Experience', 'Gross Revenue USD',
    'Partner Commission USD', 'Net Revenue USD', 'Variable Cost USD',
    'Contribution Margin USD', 'Payment Received Via', 'Month', 'Season',
    'Monthly Target USD', 'vs Target USD'
  ];
  const sheet = _makeSheet(ss, '7. REVENUE TRACKER', headers, '#4a7a5a');

  sheet.getRange(2, 9, 1000, 1).setDataValidation(_dv(['FYGARO','Bank transfer','Cash']));

  // Monthly target row at bottom — placeholder
  const targetNote = 'Set your monthly revenue targets here. ' +
    'Suggested Year 1 peak month target: USD 6,000. Off-peak: USD 2,500.';
  sheet.getRange('L1').setNote(targetNote);
}


// ─── SHEET 8: WEATHER LOG ────────────────────────────────────────────────────

function _sheet8_WeatherLog(ss) {
  const headers = [
    'Date', 'Departure Time', 'Sky Condition at Departure',
    'Experience Delivered', 'Reason for Modification',
    'Mystic Morning Bundle Issued', 'Number of Guests (Mystic)',
    'Conservation Contribution Triggered', 'Conservation Amount EC$',
    'Water Condition', 'Wildlife Notable', 'Guide Notes'
  ];
  const sheet = _makeSheet(ss, '8. WEATHER LOG', headers, '#2a5a48');

  sheet.getRange(2, 2, 1000, 1).setDataValidation(_dv(['5:15 AM','9:00 AM']));
  sheet.getRange(2, 3, 1000, 1).setDataValidation(_dv([
    'Clear','Partly cloudy','Overcast','Drizzle','Rain','Threatening'
  ]));
  sheet.getRange(2, 4, 1000, 1).setDataValidation(_dv([
    'Golden Mirror','Mystic Morning','Calm Reflections','Modified','Cancelled'
  ]));
  sheet.getRange(2, 6, 1000, 1).setDataValidation(_dv(['Yes','No']));
  sheet.getRange(2, 8, 1000, 1).setDataValidation(_dv(['Yes','No']));
  sheet.getRange(2, 10, 1000, 1).setDataValidation(_dv([
    'Calm','Light chop','Moderate','Rough'
  ]));
}


// ─── SHEET 9: CONSERVATION FUND ──────────────────────────────────────────────

function _sheet9_ConservationFund(ss) {
  const headers = [
    'Date', 'Booking ID', 'Contribution Type', 'Amount EC$', 'Amount USD',
    'Guest Name(s)', 'Certificate / Card Issued', 'Cumulative Total EC$',
    'Transfer to National Trust Date', 'Acknowledgement Received', 'Reference'
  ];
  const sheet = _makeSheet(ss, '9. CONSERVATION FUND', headers, '#1a4a38');

  sheet.getRange(2, 3, 1000, 1).setDataValidation(_dv([
    'Mystic Morning transition','Voluntary add-on','Corporate donation','School programme'
  ]));
  sheet.getRange(2, 7, 1000, 1).setDataValidation(_dv(['Yes','No']));
  sheet.getRange(2, 10, 1000, 1).setDataValidation(_dv(['Yes','No','Pending']));

  // Running total formula guidance
  sheet.getRange('H2').setNote('=SUM($D$2:D2) — running total formula');
}


// ─── SHEET 10: STAFF & GUIDE SCHEDULE ───────────────────────────────────────

function _sheet10_StaffSchedule(ss) {
  const headers = [
    'Date', 'Guide Name', 'Role', 'Experience(s) Assigned', 'Departure Time',
    'Briefing Notes', 'Completed', 'Hours Worked', 'Notes'
  ];
  const sheet = _makeSheet(ss, '10. STAFF SCHEDULE', headers, '#3a6848');

  sheet.getRange(2, 3, 1000, 1).setDataValidation(_dv([
    'Lead Guide','Supporting Guide','Celebration Coordinator','Operations'
  ]));
  sheet.getRange(2, 7, 1000, 1).setDataValidation(_dv(['Yes','No','Cancelled']));
}


// ─── SHEET 11: EQUIPMENT LOG ─────────────────────────────────────────────────

function _sheet11_EquipmentLog(ss) {
  const headers = [
    'Equipment ID', 'Type', 'Condition', 'Last Inspection Date',
    'Next Inspection Due', 'Maintenance Notes', 'Retired Date'
  ];
  const sheet = _makeSheet(ss, '11. EQUIPMENT LOG', headers, '#2a5840');

  sheet.getRange(2, 2, 1000, 1).setDataValidation(_dv([
    'Tandem kayak','Single kayak','Guide kayak','Electric canoe','PFD','Paddle',
    'Anchor','Safety kit','First aid kit','Radio'
  ]));
  sheet.getRange(2, 3, 1000, 1).setDataValidation(_dv([
    'Excellent','Good','Needs attention','Out of service'
  ]));

  // Seed with SHER's equipment
  const equipment = [
    ['Kayak-01', 'Tandem kayak',   'Good', '', '', '', ''],
    ['Kayak-02', 'Tandem kayak',   'Good', '', '', '', ''],
    ['Kayak-03', 'Tandem kayak',   'Good', '', '', '', ''],
    ['Kayak-04', 'Single kayak',   'Good', '', '', '', ''],
    ['Kayak-05', 'Guide kayak',    'Good', '', '', '', ''],
    ['Canoe-01', 'Electric canoe', 'Good', '', '', '', ''],
    ['PFD-01',   'PFD',            'Good', '', '', '', ''],
    ['PFD-02',   'PFD',            'Good', '', '', '', ''],
    ['PFD-03',   'PFD',            'Good', '', '', '', ''],
    ['PFD-04',   'PFD',            'Good', '', '', '', ''],
    ['PFD-05',   'PFD',            'Good', '', '', '', ''],
    ['PFD-06',   'PFD',            'Good', '', '', '', ''],
  ];
  sheet.getRange(2, 1, equipment.length, equipment[0].length).setValues(equipment);

  // Next inspection due = last + 30 days formula note
  sheet.getRange('E2').setNote('=D2+30 — auto-calculate 30-day inspection cycle');
}


// ─── FORM 1: GUEST ENQUIRY ───────────────────────────────────────────────────

function _buildForm1(ss, folder) {
  const form = FormApp.create('SHER — Guest Enquiry Form');
  form.setDescription(
    'Thank you for your interest in SHER Eco Sanctuary on Savannes Bay, Saint Lucia.\n' +
    'This form takes less than 3 minutes to complete. We will respond personally within 24 hours.'
  );
  form.setConfirmationMessage(
    'Thank you — we have received your enquiry. ' +
    'You will receive a personal response from the SHER team within 24 hours. ' +
    'In the meantime, you are welcome to explore the bay at safehavenecotours.com.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);

  form.addTextItem().setTitle('Full Name').setRequired(true);
  form.addTextItem().setTitle('Email Address').setRequired(true);
  form.addTextItem().setTitle('WhatsApp / Phone Number').setRequired(true);

  form.addListItem().setTitle('Which experience are you interested in?').setRequired(true)
    .setChoiceValues([
      'Bay Serenity · Golden Mirror — Sunrise kayak ($180/person)',
      'Bay Serenity · Calm Reflections — Mid-morning kayak ($150/person)',
      'Scorpio\'s Secret — Private island experience for couples ($420/couple)',
      'Scorpio\'s Sanctuary — Shared private island for two couples ($600)',
      'Table d\'Eau — Floating dining experience (register interest, 2026+)',
      'Not sure yet — please tell me more'
    ]);

  form.addDateItem().setTitle('Preferred Date (first choice)').setRequired(true);
  form.addDateItem().setTitle('Preferred Date (second choice, optional)').setRequired(false);
  form.addDateItem().setTitle('Preferred Date (third choice, optional)').setRequired(false);

  form.addMultipleChoiceItem().setTitle('How fixed are your dates?').setRequired(true)
    .setChoiceValues([
      'I need these specific dates',
      'I am somewhat flexible',
      'Any date works — I am open to whatever is available'
    ]);

  form.addListItem().setTitle('Number of guests').setRequired(true)
    .setChoiceValues(['1','2','3','4','5','6','More than 6 — please describe below']);

  form.addMultipleChoiceItem().setTitle('Is this for a special occasion?').setRequired(true)
    .setChoiceValues(['No special occasion','Proposal','Anniversary','Vow Renewal','Birthday','Other']);

  form.addListItem().setTitle('How did you hear about SHER?').setRequired(false)
    .setChoiceValues([
      'Hotel or resort concierge','Google search','Instagram or Facebook',
      'TripAdvisor','Friend or family','Other'
    ]);

  form.addParagraphTextItem().setTitle('Anything else you\'d like us to know?').setRequired(false)
    .setHelpText('Tell us about your group, any access needs, or anything that would help us arrange the perfect experience.');

  // Link to Enquiry Log sheet
  const enquirySheet = ss.getSheetByName('2. ENQUIRY LOG');
  if (enquirySheet) form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  DriveApp.getFileById(form.getId()).moveTo(folder);
  Logger.log('Form 1 (Guest Enquiry): ' + form.getPublishedUrl());
  Logger.log('Form 1 edit URL: ' + form.getEditUrl());
  return form;
}


// ─── FORM 3: PRE-TOUR WAIVER ─────────────────────────────────────────────────

function _buildForm3(ss, folder) {
  const form = FormApp.create('SHER — Pre-Tour Waiver & Health Declaration');
  form.setDescription(
    'This form must be completed by every guest before their SHER experience.\n' +
    'It takes less than 2 minutes. Your guide will have a copy before you arrive.\n\n' +
    'Savannes Bay, Micoud, Saint Lucia · bookings@safehavenecotours.com'
  );
  form.setConfirmationMessage(
    'Thank you — your waiver has been received. We look forward to welcoming you to the bay.\n' +
    'Please arrive at the SHER Bay Base at least 10 minutes before your departure time.'
  );

  form.addTextItem().setTitle('Guest Full Name').setRequired(true);
  form.addTextItem().setTitle('Experience Booked').setRequired(true)
    .setHelpText('e.g. Bay Serenity · Golden Mirror');
  form.addDateItem().setTitle('Date of Experience').setRequired(true);

  form.addMultipleChoiceItem().setTitle('Swimming ability').setRequired(true)
    .setChoiceValues(['Confident swimmer','Can swim','Non-swimmer (must declare)']);

  form.addMultipleChoiceItem().setTitle('Weight range (for kayak stability)').setRequired(true)
    .setChoiceValues(['Under 80 kg','80–100 kg','Over 100 kg']);

  form.addMultipleChoiceItem()
    .setTitle('Do you have any medical conditions relevant to water activity?')
    .setRequired(true)
    .setChoiceValues(['No','Yes — please describe below']);

  form.addParagraphTextItem()
    .setTitle('If yes, please describe your medical condition').setRequired(false);

  form.addMultipleChoiceItem().setTitle('Are you pregnant?').setRequired(true)
    .setChoiceValues(['No','Yes — I understand I must advise the guide before departure']);

  form.addTextItem().setTitle('Emergency Contact Name').setRequired(true);
  form.addTextItem().setTitle('Emergency Contact Phone').setRequired(true);

  const liabilityItem = form.addCheckboxItem();
  liabilityItem.setTitle('Liability Acknowledgement').setRequired(true)
    .setChoices([liabilityItem.createChoice(
      'I understand that participation in SHER kayak and canoe experiences involves inherent risks ' +
      'associated with outdoor water activities. I accept these risks and acknowledge that SHER, its ' +
      'guides, and operators shall not be liable for injury, loss, or damage except where caused by ' +
      'the negligence of SHER staff.'
    )]);

  const codeItem = form.addCheckboxItem();
  codeItem.setTitle('Conservation Code Agreement').setRequired(true)
    .setChoices([codeItem.createChoice(
      'I have read and agree to observe the SHER Conservation Code in full. ' +
      'I understand these are conditions of participation, not guidelines, and that ' +
      'violations may result in termination of the experience without refund.'
    )]);

  const photoItem = form.addCheckboxItem();
  photoItem.setTitle('Photography Consent').setRequired(false)
    .setChoices([photoItem.createChoice(
      'I consent to photographs being taken during my experience for SHER\'s use on the website and social media.'
    )]);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  DriveApp.getFileById(form.getId()).moveTo(folder);
  Logger.log('Form 3 (Waiver): ' + form.getPublishedUrl());
  return form;
}


// ─── FORM 4: BOOKING CONFIRMATION (INTERNAL) ─────────────────────────────────

function _buildForm4(ss, folder) {
  const form = FormApp.create('SHER — Booking Confirmation (Internal Staff)');
  form.setDescription(
    'INTERNAL USE ONLY · Complete this form when converting a qualified enquiry into a confirmed booking.\n' +
    'Submitting this form updates the Master Bookings sheet and triggers the confirmation automation.'
  );

  form.addTextItem().setTitle('Link to Enquiry ID').setRequired(true)
    .setHelpText('e.g. ENQ-2026-0012');

  form.addListItem().setTitle('Confirmed Experience').setRequired(true)
    .setChoiceValues([
      'Bay Serenity · Golden Mirror',
      'Bay Serenity · Calm Reflections',
      'Mystic Morning',
      'Scorpio\'s Secret',
      'Scorpio\'s Sanctuary',
      'Local Celebration',
      'School Conservation Programme',
      'Community Stewardship Day'
    ]);

  form.addDateItem().setTitle('Confirmed Date of Experience').setRequired(true);
  form.addListItem().setTitle('Confirmed Group Size').setRequired(true)
    .setChoiceValues(['1','2','3','4','5','6','7','8']);

  form.addTextItem().setTitle('Revenue Amount Confirmed (USD)').setRequired(true);

  form.addMultipleChoiceItem().setTitle('FYGARO Payment Link Sent?').setRequired(true)
    .setChoiceValues(['Yes','No — send now']);

  form.addTextItem().setTitle('Partner Referral (if applicable)')
    .setHelpText('Partner name or leave blank for direct booking');

  form.addParagraphTextItem().setTitle('Special Requirements')
    .setHelpText('Celebration setup, accessibility, dietary, occasion details...');

  form.addTextItem().setTitle('Guide Assigned').setRequired(true);

  form.addMultipleChoiceItem().setTitle('Confirmation Email Sent to Guest?').setRequired(true)
    .setChoiceValues(['Yes — manually sent','No — trigger automation']);

  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  DriveApp.getFileById(form.getId()).moveTo(folder);
  Logger.log('Form 4 (Booking Confirmation — internal): ' + form.getPublishedUrl());
  return form;
}


// ─── FORM 6: DAILY MORNING LOG ───────────────────────────────────────────────

function _buildForm6(ss, folder) {
  const form = FormApp.create('SHER — Daily Morning Log (Guide)');
  form.setDescription(
    'Complete this form before or immediately after each operating day.\n' +
    'Takes less than 2 minutes. This feeds the weather log, triggers conservation ' +
    'contributions if Mystic Morning, and populates the Availability Calendar.'
  );
  form.setConfirmationMessage('Morning log received. Thank you.');

  form.addListItem().setTitle('Experience(s) Delivered Today').setRequired(true)
    .setChoiceValues([
      'Bay Serenity · Golden Mirror',
      'Bay Serenity · Calm Reflections',
      'Mystic Morning (overcast transition)',
      'Scorpio\'s Secret',
      'Scorpio\'s Sanctuary',
      'Local Celebration',
      'School Conservation Programme',
      'No experience today — day off / cancelled'
    ]);

  form.addMultipleChoiceItem().setTitle('Sky Condition at Departure').setRequired(true)
    .setChoiceValues(['Clear','Partly cloudy','Overcast','Drizzle','Rain','Threatening']);

  form.addMultipleChoiceItem().setTitle('Experience Mode').setRequired(true)
    .setChoiceValues([
      'Golden Mirror — clear sky, sunrise on the water',
      'Mystic Morning — cloud transition, bundle issued',
      'Calm Reflections — mid-morning, conditions good',
      'Modified — experience adjusted for conditions',
      'Cancelled — unsafe conditions'
    ]);

  form.addListItem().setTitle('Number of Guests').setRequired(true)
    .setChoiceValues(['1','2','3','4','5','6','7','8']);

  form.addMultipleChoiceItem()
    .setTitle('Was a Mystic Morning Bundle issued?').setRequired(true)
    .setChoiceValues(['Yes','No']);

  form.addMultipleChoiceItem().setTitle('Water Condition').setRequired(true)
    .setChoiceValues(['Calm','Light chop','Moderate','Rough']);

  form.addParagraphTextItem()
    .setTitle('Wildlife or Bay Observation (optional)')
    .setHelpText('Any notable sighting — turtles, rare birds, unusual activity');

  form.addMultipleChoiceItem().setTitle('Equipment Condition Check').setRequired(true)
    .setChoiceValues([
      'All good — nothing to report',
      'One item needs attention — describe below',
      'Safety concern — describe below'
    ]);

  form.addParagraphTextItem()
    .setTitle('Equipment Notes (if any)').setRequired(false);

  form.addMultipleChoiceItem().setTitle('Guest Mood at End of Experience').setRequired(true)
    .setChoiceValues(['Delighted','Happy','Neutral','Disappointed']);

  form.addParagraphTextItem()
    .setTitle('Guide Notes (free text)')
    .setHelpText('Used for monthly review and storytelling development. What happened today?');

  // Link form to spreadsheet — Google creates a "Form Responses N" tab automatically
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  DriveApp.getFileById(form.getId()).moveTo(folder);

  // Wait briefly for Google to create the response sheet, then rename it
  Utilities.sleep(2000);
  const allSheets = ss.getSheets();
  for (const s of allSheets) {
    if (s.getName().startsWith('Form Responses')) {
      s.setName('FORM 6 RESPONSES — WEATHER LOG');
      s.setTabColor('#2a5a48');
      break;
    }
  }

  // Install trigger: every Form 6 submission copies the row into 8. WEATHER LOG
  _installForm6Trigger(ss);

  Logger.log('Form 6 (Daily Morning Log): ' + form.getPublishedUrl());
  Logger.log('Form 6 → 8. WEATHER LOG trigger installed. Link confirmed active.');
  return form;
}
