/**
 * SHER TMS Web App Extension — Guide App handlers
 *
 * HOW TO ADD THIS TO THE DEPLOYED SCRIPT:
 * 1. Go to script.google.com → open the SHER TMS project
 * 2. Click + (New file) → Script → name it "WebApp"
 * 3. Paste this entire file into that new script file
 * 4. Verify SS_ID and SHER_EMAIL match the values in build-tms-phase2.gs
 * 5. Click Deploy → Manage deployments → edit the existing deployment
 *    → New version → Deploy
 * 6. Copy the updated web app URL (same /exec suffix, new version internally)
 *
 * This file adds:
 *   doGet  — handles getTodayBookings request from the Guide PWA
 *   doPost — handles all form submissions (website + guide app)
 */

// ── Constants — must match build-tms-phase2.gs ───────────────────────────────

var _WA_SS_ID         = '1ETwJ00x2MSr2iiRFIsCoTocSSP_u3eWdS8OZCjFXAqs';
var _WA_SHER_EMAIL    = 'bookings@safehavenecotours.com';
var _WA_PWA_LOG_SS_ID = '1A2u8H22XaOjeXhYh7qcr4CHXbjN3Jk97keF7zZLFYc8';

// Master TMS spreadsheet (contains 1. MASTER BOOKINGS tab)
var _MASTER_SS_ID = '1dXD23ZTwmr5J5XMK3heDI3EDKz3Vcu_nku4GxXp1T2Y';

// Supabase — Guide PWA backend
var _SB_URL = 'https://zbklfuhsmnmcwcqcpdxk.supabase.co';
var _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpia2xmdWhzbW5tY3djcWNwZHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjMxNzQsImV4cCI6MjA5MzgzOTE3NH0.r6RAWjrMGRu9I31hI9fd7wNRPxAnjR0haHuxmgWuMpc';

// ── doGet — called by Guide PWA to fetch today's bookings ─────────────────────

function doGet(e) {
  try {
    var params = e.parameter || {};
    if (params.formType === 'getTodayBookings') {
      return _getTodayBookings();
    }
    return _jsonOut({ status: 'error', message: 'Unknown GET request' });
  } catch (err) {
    return _jsonOut({ status: 'error', message: err.message });
  }
}

function _getTodayBookings() {
  var ss       = SpreadsheetApp.openById(_WA_SS_ID);
  var bookings = ss.getSheetByName('1. MASTER BOOKINGS');

  if (!bookings) {
    return _jsonOut({ status: 'success', bookings: [] });
  }

  var tz       = Session.getScriptTimeZone();
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var data     = bookings.getDataRange().getValues();
  var headers  = data[0];

  var colStatus  = headers.indexOf('Booking Status');
  var colExp     = headers.indexOf('Experience Name');
  var colDate    = headers.indexOf('Booking Date (Experience)');
  var colGuest   = headers.indexOf('Guest Name(s)');
  var colSize    = headers.indexOf('Group Size');
  var colTime    = headers.indexOf('Preferred Time');
  var colOcc     = headers.indexOf('Occasion Type');

  var results = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[colStatus]).trim() !== 'Confirmed') continue;

    var bookDate;
    try {
      bookDate = Utilities.formatDate(new Date(row[colDate]), tz, 'yyyy-MM-dd');
    } catch (err) {
      continue;
    }

    if (bookDate === todayStr) {
      results.push({
        guestName:  String(row[colGuest] || '').trim(),
        experience: String(row[colExp]   || '').trim(),
        departure:  String(row[colTime]  || '').trim(),
        groupSize:  String(row[colSize]  || '').trim(),
        occasion:   String(row[colOcc]   || '').trim()
      });
    }
  }

  return _jsonOut({ status: 'success', bookings: results });
}

// ── doPost — handles all POST submissions ─────────────────────────────────────

function doPost(e) {
  try {
    var data     = JSON.parse(e.postData.contents);
    var formType = data.formType;

    switch (formType) {
      case 'enquiry':            return _jsonOut(_waHandleEnquiry(data));
      case 'flexibility':        return _jsonOut(_waHandleFlexibility(data));
      case 'morningLog':         return _jsonOut(_waHandleMorningLog(data));
      case 'equipmentInspection':return _jsonOut(_waHandleEquipmentInspection(data));
      case 'incident':           return _jsonOut(_waHandleIncident(data));
      case 'postTourReset':      return _jsonOut(_waHandlePostTourReset(data));
      default:
        return _jsonOut({ status: 'error', message: 'Unknown formType: ' + formType });
    }
  } catch (err) {
    return _jsonOut({ status: 'error', message: err.message });
  }
}

// ── Website: Guest Enquiry ─────────────────────────────────────────────────────

function _waHandleEnquiry(d) {
  var ss  = SpreadsheetApp.openById(_WA_SS_ID);
  var log = ss.getSheetByName('2. ENQUIRY LOG');

  if (log) {
    var id = 'ENQ-' + new Date().getFullYear() + '-' + _pad(log.getLastRow(), 4);
    log.appendRow([
      id, new Date(),
      d['Full Name'] || '',
      d['Email Address'] || '',
      d['WhatsApp / Phone Number'] || '',
      d['Which experience are you interested in?'] || '',
      d['Preferred Date (first choice)'] || '',
      '', '', '',
      d['Number of guests'] || '',
      d['Is this for a special occasion?'] || '',
      d['How did you hear about SHER?'] || '',
      'New', '', '', '', '',
      d["Anything else you'd like us to know?"] || ''
    ]);
  }

  var email = d['Email Address'];
  if (email) {
    MailApp.sendEmail({
      to:      email,
      subject: 'Thank you for your enquiry — SHER Eco Sanctuary',
      body:    'Dear ' + (d['Full Name'] || 'Guest').split(' ')[0] + ',\n\n' +
               'Thank you for reaching out to SHER. We will respond personally within 24 hours.\n\n' +
               'SHER Eco Sanctuary\nSavannes Bay · Micoud · Saint Lucia\n' +
               'https://www.safehavenecotours.com'
    });
    MailApp.sendEmail({
      to:      _WA_SHER_EMAIL,
      subject: 'New Enquiry — ' + (d['Full Name'] || 'Unknown'),
      body:    JSON.stringify(d, null, 2)
    });
  }

  return { status: 'success' };
}

// ── Website: Date Flexibility / Waitlist ──────────────────────────────────────

function _waHandleFlexibility(d) {
  var email = d['Email Address'];
  if (email) {
    MailApp.sendEmail({
      to:      email,
      subject: 'We have noted your dates — SHER Eco Sanctuary',
      body:    'Dear ' + (d['Full Name'] || 'Guest').split(' ')[0] + ',\n\n' +
               'Thank you — we have added you to our availability list.\n\n' +
               'We will be in touch personally the moment a slot opens.\n\n' +
               'SHER Eco Sanctuary\nSavannes Bay · Micoud · Saint Lucia'
    });
    MailApp.sendEmail({
      to:      _WA_SHER_EMAIL,
      subject: 'Waitlist — ' + (d['Full Name'] || 'Unknown'),
      body:    JSON.stringify(d, null, 2)
    });
  }
  return { status: 'success' };
}

// ── Guide App: Morning Log (Form 6) ───────────────────────────────────────────

function _waHandleMorningLog(d) {
  var ss         = SpreadsheetApp.openById(_WA_SS_ID);
  var weatherLog = ss.getSheetByName('8. WEATHER LOG');

  if (weatherLog) {
    var exp      = d['Experience(s) Delivered Today'] || '';
    var modeRaw  = d['Experience Mode'] || '';
    var mode     = modeRaw.split(' —')[0];
    var isMystic = mode.toLowerCase().indexOf('mystic') !== -1;
    var guests   = parseInt(d['Number of Guests']) || 0;

    weatherLog.appendRow([
      new Date(),
      exp.indexOf('Calm') !== -1 ? '9:00 AM' : '5:15 AM',
      d['Sky Condition at Departure'] || '',
      mode,
      '',
      isMystic ? 'Yes' : 'No',
      isMystic ? guests : '',
      isMystic ? 'Yes' : 'No',
      isMystic ? guests * 25 : 0,
      d['Water Condition'] || '',
      d['Wildlife or Bay Observation (optional)'] || '',
      d['Guide Notes (free text)'] || ''
    ]);
  }

  // Log raw submission to PWA log sheet
  _logToPWASheet('FORM 6 — MORNING LOG', [
    new Date(),
    d['Experience(s) Delivered Today']           || '',
    d['Sky Condition at Departure']              || '',
    d['Experience Mode']                         || '',
    d['Number of Guests']                        || '',
    d['Was a Mystic Morning Bundle issued?']     || '',
    d['Water Condition']                         || '',
    d['Wildlife or Bay Observation (optional)']  || '',
    d['Equipment Condition Check']               || '',
    d['Equipment Notes (if any)']                || '',
    d['Guest Mood at End of Experience']         || '',
    d['Guide Notes (free text)']                 || ''
  ]);

  // Equipment flag notification
  var equipCheck = d['Equipment Condition Check'] || '';
  if (equipCheck && equipCheck !== 'All good — nothing to report') {
    MailApp.sendEmail({
      to:      _WA_SHER_EMAIL,
      subject: 'SHER TMS — Equipment Flag: ' + new Date().toDateString(),
      body:    'Equipment issue flagged in daily log (via Guide App):\n\n' +
               equipCheck + '\n\n' +
               (d['Equipment Notes (if any)'] || 'No additional notes.') +
               '\n\nResolve before next operating day.'
    });
  }

  return { status: 'success' };
}

// ── Guide App: Equipment Inspection (Form 7) ──────────────────────────────────

function _waHandleEquipmentInspection(d) {
  var flagged     = d['Any item flagged'] === 'Yes';
  var batteryLow  = d['Battery charge'] === 'Below 50%';

  if (flagged) {
    MailApp.sendEmail({
      to:      _WA_SHER_EMAIL,
      subject: 'SHER TMS — Equipment Flag (Pre-Launch): ' + new Date().toDateString(),
      body:    'Equipment issue flagged during pre-launch inspection.\n\n' +
               'Guide: ' + (d['Guide Name'] || 'Not specified') + '\n' +
               'Notes: ' + (d['Inspection Notes'] || 'None') +
               '\n\nDo not launch until issue is resolved.'
    });
  }

  if (batteryLow) {
    MailApp.sendEmail({
      to:      _WA_SHER_EMAIL,
      subject: 'SHER — Rescue Dinghy Battery Low: recharge before next operation',
      body:    'The 12V marine battery on the rescue dinghy was reported as Below 50% during the equipment inspection.\n\n' +
               'Guide: ' + (d['Guide Name'] || 'Not specified') + '\n' +
               'Date:  ' + new Date().toDateString() + '\n\n' +
               'Do not operate the rescue dinghy until the battery is recharged.\n' +
               'Confirm with the guide that it is safe to proceed before launch.'
    });
  }

  // Log raw submission to PWA log sheet
  _logToPWASheet('FORM 7 — EQUIPMENT INSPECTION', [
    new Date(),
    d['Guide Name']                  || '',
    d['Inspection Date']             || '',
    d['GT-01 cleared']               || '',
    d['GT-02 cleared']               || '',
    d['LG-01 cleared']               || '',
    d['SG-01 cleared']               || '',
    d['RD-01 hull']                  || '',
    d['RD-01 fittings']              || '',
    d['Motor mount']                 || '',
    d['Motor test run']              || '',
    d['Battery charge']              || '',
    d['Battery terminals']           || '',
    d['PFDs checked']                || '',
    d['First aid kit checked']       || '',
    d['Safety equipment checked']    || '',
    d['Communication device checked']|| '',
    d['Paddles checked']             || '',
    d['Refreshment kit prepared']    || '',
    d['Bay conditions assessed']     || '',
    d['Launch area clear']           || '',
    d['Any item flagged']            || '',
    d['Inspection Notes']            || ''
  ]);

  // Update Equipment Log with last inspection date
  var ss    = SpreadsheetApp.openById(_WA_SS_ID);
  var equip = ss.getSheetByName('11. EQUIPMENT LOG');
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  if (equip) {
    var data = equip.getDataRange().getValues();
    var checked = ['Kayak-01', 'Kayak-02', 'Kayak-03', 'Canoe-01',
                   'PFD-01',   'PFD-02',   'PFD-03',   'PFD-04',
                   'PFD-05',   'PFD-06'];
    for (var i = 1; i < data.length; i++) {
      if (checked.indexOf(String(data[i][0])) !== -1) {
        equip.getRange(i + 1, 4).setValue(today);
        equip.getRange(i + 1, 5).setValue(_addDays(today, 30));
      }
    }
  }

  return { status: 'success' };
}

// ── Guide App: Incident Report (Form 8) ───────────────────────────────────────

function _waHandleIncident(d) {
  var level   = d['Incident Level'] || '1';
  var type    = d['Incident Type']  || 'Other';
  var urgency = level === '3' ? 'EMERGENCY — ' : level === '2' ? 'URGENT — ' : '';
  var levels  = { '1': 'Minor', '2': 'Moderate', '3': 'Emergency' };

  // Log raw submission to PWA log sheet
  _logToPWASheet('FORM 8 — INCIDENT REPORTS', [
    new Date(),
    d['Incident Level']              || '',
    d['Incident Type']               || '',
    d['Date and Time']               || '',
    d['Guide Name']                  || '',
    d['Location']                    || '',
    d['Description']                 || '',
    d['Guests Involved']             || '',
    d['Guest Names']                 || '',
    d['Immediate Action Taken']      || '',
    d['Medical Attention Required']  || '',
    d['External Services Contacted'] || ''
  ]);

  MailApp.sendEmail({
    to:      _WA_SHER_EMAIL,
    subject: urgency + 'Incident Report — Level ' + level + ' — ' + type,
    body:
      'INCIDENT REPORT\n' +
      'Date/Time:    ' + (d['Date and Time'] || new Date().toString()) + '\n' +
      'Level:        ' + level + ' (' + (levels[level] || 'Unknown') + ')\n' +
      'Type:         ' + type + '\n' +
      'Guide:        ' + (d['Guide Name'] || 'Not specified') + '\n' +
      'Location:     ' + (d['Location'] || 'Not specified') + '\n' +
      'Guests:       ' + (d['Guests Involved'] || 'No') + '\n' +
      'Guest names:  ' + (d['Guest Names'] || 'N/A') + '\n\n' +
      'DESCRIPTION:\n' + (d['Description'] || 'None') + '\n\n' +
      'IMMEDIATE ACTION:\n' + (d['Immediate Action Taken'] || 'Not recorded') + '\n\n' +
      'Medical attention: ' + (d['Medical Attention Required'] || 'No') + '\n' +
      'External services: ' + (d['External Services Contacted'] || 'None') + '\n\n' +
      'Reported via SHER Guide App.'
  });

  return { status: 'success' };
}

// ── Guide App: Post-Tour Reset (Form 9) ───────────────────────────────────────

function _waHandlePostTourReset(d) {
  var ss    = SpreadsheetApp.openById(_WA_SS_ID);
  var today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

  // Log raw submission to PWA log sheet
  _logToPWASheet('FORM 9 — POST-TOUR RESET', [
    new Date(),
    d['Guide Name']                    || '',
    d['Experience Delivered']          || '',
    d['All guests safely returned']    || '',
    d['Equipment returned and stowed'] || '',
    d['Kayaks rinsed and secured']     || '',
    d['PFDs dried and stored']         || '',
    d['Launch area cleared']           || '',
    d['Access secured']                || '',
    d['Lost Property Found']           || '',
    d['Lost Property Description']     || '',
    d['Guide Notes']                   || ''
  ]);

  // Lost property notification
  if (d['Lost Property Found'] === 'Yes') {
    MailApp.sendEmail({
      to:      _WA_SHER_EMAIL,
      subject: 'SHER TMS — Lost Property: ' + today,
      body:    'Lost property found during post-tour reset.\n\n' +
               'Description: ' + (d['Lost Property Description'] || 'Not described') + '\n' +
               'Guide: '        + (d['Guide Name'] || 'Not specified')
    });
  }

  // Log to Staff Schedule
  var sched = ss.getSheetByName('10. STAFF SCHEDULE');
  if (sched) {
    sched.appendRow([
      today,
      d['Guide Name'] || '',
      'Lead Guide',
      d['Experience Delivered'] || '',
      '',
      '',
      'Yes',
      '',
      'Reset confirmed via Guide App. ' + (d['Guide Notes'] || '')
    ]);
  }

  return { status: 'success' };
}

// ── PWA log writer ────────────────────────────────────────────────────────────

function _logToPWASheet(sheetName, row) {
  try {
    var ss    = SpreadsheetApp.openById(_WA_PWA_LOG_SS_ID);
    var sheet = ss.getSheetByName(sheetName);
    if (sheet) sheet.appendRow(row);
  } catch (err) {
    Logger.log('PWA log write failed (' + sheetName + '): ' + err.message);
  }
}

// ── Supabase Booking Sync ─────────────────────────────────────────────────────

/**
 * Reads today's confirmed bookings from 1. MASTER BOOKINGS and writes them to
 * the Supabase today_bookings table so the Guide PWA can display them.
 *
 * Run manually via SHER Tools > Sync to Guide App, or automatically at 5 AM
 * daily via the trigger installed by installDailyTrigger().
 */
function syncTodayBookingsToSupabase() {
  var tz       = 'America/St_Lucia';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  // ── 1. Read confirmed bookings for today ────────────────────────────────────
  var ss    = SpreadsheetApp.openById(_MASTER_SS_ID);
  var sheet = ss.getSheetByName('1. MASTER BOOKINGS');

  if (!sheet) {
    Logger.log('syncTodayBookingsToSupabase: sheet "1. MASTER BOOKINGS" not found in ' + _MASTER_SS_ID);
    return;
  }

  var data    = sheet.getDataRange().getValues();
  var headers = data[0];

  var colStatus = headers.indexOf('Booking Status');
  var colExp    = headers.indexOf('Experience Name');
  var colDate   = headers.indexOf('Booking Date (Experience)');
  var colGuest  = headers.indexOf('Guest Name(s)');
  var colSize   = headers.indexOf('Group Size');
  var colTime   = headers.indexOf('Preferred Time');
  var colOcc    = headers.indexOf('Occasion Type');

  var bookings = [];
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    if (String(row[colStatus]).trim() !== 'Confirmed') continue;

    var bookDate;
    try {
      bookDate = Utilities.formatDate(new Date(row[colDate]), tz, 'yyyy-MM-dd');
    } catch (err) {
      continue;
    }

    if (bookDate !== todayStr) continue;

    bookings.push({
      booking_date: todayStr,
      guest_name:   String(row[colGuest] || '').trim(),
      experience:   String(row[colExp]   || '').trim(),
      departure:    String(row[colTime]  || '').trim(),
      group_size:   String(row[colSize]  || '').trim(),
      occasion:     String(row[colOcc]   || '').trim()
    });
  }

  Logger.log('syncTodayBookingsToSupabase: found ' + bookings.length + ' confirmed booking(s) for ' + todayStr);

  // ── 2. Delete today's existing rows from Supabase ──────────────────────────
  var sbHeaders = {
    'apikey':        _SB_KEY,
    'Authorization': 'Bearer ' + _SB_KEY,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal'
  };

  var delResp = UrlFetchApp.fetch(
    _SB_URL + '/rest/v1/today_bookings?booking_date=eq.' + todayStr,
    { method: 'delete', headers: sbHeaders, muteHttpExceptions: true }
  );
  Logger.log('Delete response: HTTP ' + delResp.getResponseCode());

  if (bookings.length === 0) {
    Logger.log('syncTodayBookingsToSupabase: no bookings to insert — done.');
    return;
  }

  // ── 3. Insert current confirmed bookings ───────────────────────────────────
  var insResp = UrlFetchApp.fetch(
    _SB_URL + '/rest/v1/today_bookings',
    {
      method:             'post',
      headers:            sbHeaders,
      payload:            JSON.stringify(bookings),
      muteHttpExceptions: true
    }
  );
  var insCode = insResp.getResponseCode();
  Logger.log('Insert response: HTTP ' + insCode);

  if (insCode === 201) {
    Logger.log('syncTodayBookingsToSupabase: SUCCESS — ' + bookings.length + ' booking(s) written to Supabase for ' + todayStr);
  } else {
    Logger.log('syncTodayBookingsToSupabase: INSERT FAILED — ' + insResp.getContentText());
  }
}

// ── Custom Menu ───────────────────────────────────────────────────────────────

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('SHER Tools')
    .addItem('Sync to Guide App', 'syncTodayBookingsToSupabase')
    .addToUi();
}

// ── Rescue Dinghy Battery Alert ───────────────────────────────────────────────

/**
 * Queries Supabase for any equipment inspection today where rd_battery_charge
 * is "Below 50%" and sends one alert email per day if found.
 * Schedule this to run every hour via a GAS time-based trigger, or add it
 * to installDailyTrigger() to run once at 5 AM alongside the booking sync.
 */
function checkBatteryAlerts() {
  var tz       = 'America/St_Lucia';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  var resp = UrlFetchApp.fetch(
    _SB_URL + '/rest/v1/guide_equipment_inspections' +
    '?rd_battery_charge=eq.Below 50%' +
    '&created_at=gte.' + todayStr + 'T00%3A00%3A00' +
    '&select=guide_name,rd_battery_charge,created_at' +
    '&limit=1',
    {
      headers: {
        'apikey':        _SB_KEY,
        'Authorization': 'Bearer ' + _SB_KEY
      },
      muteHttpExceptions: true
    }
  );

  var code = resp.getResponseCode();
  if (code !== 200) {
    Logger.log('checkBatteryAlerts: Supabase returned HTTP ' + code);
    return;
  }

  var rows = JSON.parse(resp.getContentText());
  if (!Array.isArray(rows) || rows.length === 0) {
    Logger.log('checkBatteryAlerts: no low-battery entries today');
    return;
  }

  // Guard: send at most one alert email per day
  var props    = PropertiesService.getScriptProperties();
  var alertKey = 'battery_alert_sent_' + todayStr;
  if (props.getProperty(alertKey)) {
    Logger.log('checkBatteryAlerts: alert already sent today');
    return;
  }

  var guide = rows[0].guide_name || 'Not recorded';
  MailApp.sendEmail({
    to:      _WA_SHER_EMAIL,
    subject: 'SHER — Rescue Dinghy Battery Low: recharge before next operation',
    body:    'The 12V marine battery on the rescue dinghy was reported as Below 50% ' +
             'during today’s equipment inspection.\n\n' +
             'Guide:  ' + guide + '\n' +
             'Date:   ' + todayStr + '\n\n' +
             'Action required: Do not operate the rescue dinghy until the battery ' +
             'is recharged. Confirm with the guide before next launch.\n\n' +
             'Logged via SHER Guide PWA — guide.safehavenecotours.com'
  });

  props.setProperty(alertKey, '1');
  Logger.log('checkBatteryAlerts: alert email sent for ' + todayStr + ' (guide: ' + guide + ')');
}

// ── Daily Trigger Installer ───────────────────────────────────────────────────

/**
 * Run this ONCE from the Apps Script editor to install the 5 AM daily trigger.
 * Safe to re-run — removes any existing trigger for the same function first.
 */
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'syncTodayBookingsToSupabase') {
      ScriptApp.deleteTrigger(t);
    }
  });

  ScriptApp.newTrigger('syncTodayBookingsToSupabase')
    .timeBased()
    .atHour(5)
    .everyDays(1)
    .inTimezone('America/St_Lucia')
    .create();

  Logger.log('Daily trigger installed: syncTodayBookingsToSupabase at 5 AM America/St_Lucia');
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function _jsonOut(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _pad(n, len) {
  return String(n).padStart(len, '0');
}

function _addDays(isoStr, days) {
  var d = new Date(isoStr);
  d.setDate(d.getDate() + days);
  return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}
