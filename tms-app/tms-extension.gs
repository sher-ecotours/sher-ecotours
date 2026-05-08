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
  var flagged = d['Any item flagged'] === 'Yes';

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

  // Log raw submission to PWA log sheet
  _logToPWASheet('FORM 7 — EQUIPMENT INSPECTION', [
    new Date(),
    d['Guide Name']                  || '',
    d['Inspection Date']             || '',
    d['Kayak-01 cleared']            || '',
    d['Kayak-02 cleared']            || '',
    d['Kayak-03 cleared']            || '',
    d['Guide kayak cleared']         || '',
    d['Electric canoe cleared']      || '',
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
