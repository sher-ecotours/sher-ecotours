/**
 * SHER Eco Sanctuary — Tour Management System
 * Phase 2: Automations, Forms & Dashboards
 * Google Apps Script · Single-run installation
 *
 * HOW TO RUN:
 * 1. Open script.google.com — open the SHER TMS Builder project (same as Phase 1)
 *    OR create a new project (File → New project)
 * 2. Paste this entire file as a new script (File → New → Script file)
 * 3. Verify SS_ID below matches your master spreadsheet URL
 * 4. Click Run → buildSHERTMSPhase2
 * 5. Approve permissions when prompted
 * 6. View → Execution log for all form URLs and trigger confirmations
 *
 * What this script builds:
 *   Part A · Form 2 — Guest Date Flexibility (website-facing waitlist)
 *            Form 5 — Post-Tour Feedback (sent to guests after experience)
 *   Part B · 8 automations installed as triggers:
 *            1  Enquiry auto-reply
 *            2  Booking confirmation email
 *            3  Mystic Morning trigger → conservation + credit + delayed email
 *            4  48-hour guest reminder (nightly)
 *            5  Daily guide morning brief (4:30 AM)
 *            6  Post-tour feedback request (11 AM + 6 PM)
 *            7  Weekly revenue report (Monday 7 AM)
 *            8  Availability conflict check (on Form 4 submit)
 */

// ─── CONSTANTS — confirm before running ─────────────────────────────────────

const SS_ID         = '1ETwJ00x2MSr2iiRFIsCoTocSSP_u3eWdS8OZCjFXAqs';
const SHER_EMAIL    = 'bookings@safehavenecotours.com';
const WAIVER_URL    = 'https://docs.google.com/forms/d/e/1FAIpQLScd5chUXUTUDkt8o6O2zdtoElkzUOqGlgwIOrXqUaVz6u3V2g/viewform';
const WEBSITE_URL   = 'https://www.safehavenecotours.com';
const CODE_URL      = 'https://www.safehavenecotours.com/pages/conservation-code.html';
const MEETING_POINT = 'Savannes Bay launch area, Micoud, Saint Lucia (adjacent to Lot 890 on the bay road)';


// ─── ENTRY POINT ────────────────────────────────────────────────────────────

function buildSHERTMSPhase2() {
  const ss = SpreadsheetApp.openById(SS_ID);

  Logger.log('Opening spreadsheet: ' + ss.getName());

  // Part A — Forms
  const form2 = _buildForm2(ss);
  const form5 = _buildForm5(ss);

  // Store feedback URL so automations can reference it
  PropertiesService.getScriptProperties().setProperties({
    FEEDBACK_FORM_URL : form5.getPublishedUrl(),
    SS_ID             : SS_ID
  });

  // Part B — Triggers
  _installAllTriggers(ss);

  Logger.log('');
  Logger.log('=== SHER TMS PHASE 2 BUILD COMPLETE ===');
  Logger.log('Form 2 (Date Flexibility — website): ' + form2.getPublishedUrl());
  Logger.log('Form 5 (Post-Tour Feedback — send to guests): ' + form5.getPublishedUrl());
  Logger.log('All 8 automations installed as triggers.');
  Logger.log('');
  Logger.log('NEXT: Add Form 2 link to website booking pages.');
  Logger.log('NEXT: Test each automation using the test functions at the bottom of this file.');
}


// ══════════════════════════════════════════════════════════════════════════════
// PART A — FORMS
// ══════════════════════════════════════════════════════════════════════════════

function _buildForm2(ss) {
  const form = FormApp.create('SHER — Guest Date Flexibility & Waitlist');
  form.setDescription(
    'Can\'t find the right date? Tell us your window.\n\n' +
    'We will contact you personally when a slot opens that matches your availability — ' +
    'before any public announcement.'
  );
  form.setConfirmationMessage(
    'Thank you — we have added you to our availability list. ' +
    'We will be in touch the moment a matching slot opens.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(false);

  form.addTextItem().setTitle('Full Name').setRequired(true);
  form.addTextItem().setTitle('Email Address').setRequired(true);
  form.addTextItem().setTitle('WhatsApp / Phone Number').setRequired(true);

  form.addListItem().setTitle('Which experience are you interested in?').setRequired(true)
    .setChoiceValues([
      'Bay Serenity · Golden Mirror ($180/person)',
      'Bay Serenity · Calm Reflections ($150/person)',
      'Scorpio\'s Secret ($420/couple)',
      'Scorpio\'s Sanctuary ($600/two couples)',
      'Table d\'Eau (register interest — launching 2026+)',
      'Not sure yet'
    ]);

  form.addDateItem().setTitle('Available from').setRequired(true);
  form.addDateItem().setTitle('Available until').setRequired(true);

  form.addCheckboxItem().setTitle('Days of week preferred').setRequired(false)
    .setChoiceValues(['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']);

  form.addMultipleChoiceItem().setTitle('Preferred time').setRequired(true)
    .setChoiceValues([
      'Dawn — 5:15 AM (Bay Serenity · Golden Mirror)',
      'Mid-morning — 9:00 AM (Bay Serenity · Calm Reflections)',
      'Either / Flexible',
      'By appointment (Scorpio\'s Secret / Scorpio\'s Sanctuary)'
    ]);

  form.addListItem().setTitle('Is this for a special occasion?').setRequired(false)
    .setChoiceValues(['No','Proposal','Anniversary','Vow Renewal','Birthday','Other']);

  form.addMultipleChoiceItem().setTitle('How would you like us to contact you?').setRequired(true)
    .setChoiceValues([
      'Contact me when anything opens in my window',
      'Early morning (5:15 AM) slots only',
      'My specific window only — do not suggest other dates'
    ]);

  // Create response tab and link form
  const waitlistSheet = _getOrCreateSheet(ss, 'FORM 2 — FLEXIBILITY WAITLIST', '#7a9a68');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Utilities.sleep(1500);
  _renameLatestResponseSheet(ss, 'FORM 2 — FLEXIBILITY WAITLIST RESPONSES');

  Logger.log('Form 2 created: ' + form.getPublishedUrl());
  return form;
}


function _buildForm5(ss) {
  const form = FormApp.create('SHER — Post-Tour Feedback');
  form.setDescription(
    'We hope your morning on the bay has stayed with you today.\n' +
    'If you would like to share how it felt, we would be glad to hear.\n\n' +
    'This takes less than 2 minutes.'
  );
  form.setConfirmationMessage('Thank you. Your feedback means a great deal to us.');
  form.setCollectEmail(false);

  // Section 1 — main questions
  form.addScaleItem()
    .setTitle('Overall experience rating')
    .setBounds(1, 5)
    .setLabels('Not what I expected', 'Extraordinary')
    .setRequired(true);

  form.addListItem().setTitle('Which experience did you take?').setRequired(true)
    .setChoiceValues([
      'Bay Serenity · Golden Mirror',
      'Bay Serenity · Calm Reflections',
      'Mystic Morning',
      'Scorpio\'s Secret',
      'Scorpio\'s Sanctuary',
      'Other'
    ]);

  form.addParagraphTextItem()
    .setTitle('What was the most memorable moment?')
    .setRequired(false);

  form.addMultipleChoiceItem().setTitle('Was the guide excellent?').setRequired(true)
    .setChoiceValues(['Yes — outstanding','Good','Could improve']);

  // Weather question with conditional navigation
  const weatherItem = form.addMultipleChoiceItem()
    .setTitle('Weather delivered')
    .setRequired(true);

  // Section 2 — Mystic Morning only
  const mysticBreak = form.addPageBreakItem()
    .setTitle('Your Mystic Morning')
    .setHelpText('This question is for guests whose sunrise transitioned to a Mystic Morning.');

  form.addMultipleChoiceItem()
    .setTitle('How did you feel about the Mystic Morning?')
    .setRequired(false)
    .setChoiceValues([
      'I loved it — the warmth and atmosphere were special',
      'It was fine — I understood the weather',
      'I would have preferred a golden morning'
    ]);

  // Section 3 — continuation for all guests
  const continueBreak = form.addPageBreakItem()
    .setTitle('About your experience');

  // Set weather choices with navigation
  weatherItem.setChoices([
    weatherItem.createChoice('Golden Mirror — clear sunrise', continueBreak),
    weatherItem.createChoice('Mystic Morning — overcast, warm bundle', mysticBreak),
    weatherItem.createChoice('Calm Reflections — mid-morning', continueBreak),
    weatherItem.createChoice('Other', continueBreak)
  ]);

  // Section 3 questions
  form.addMultipleChoiceItem().setTitle('Would you return?').setRequired(true)
    .setChoiceValues(['Definitely','Probably','Not sure','Unlikely']);

  form.addMultipleChoiceItem().setTitle('Would you recommend SHER?').setRequired(true)
    .setChoiceValues(['Yes — already have','Yes','Maybe','No']);

  form.addParagraphTextItem()
    .setTitle('Any suggestions for us?')
    .setRequired(false);

  form.addMultipleChoiceItem()
    .setTitle('May we share your feedback?').setRequired(true)
    .setChoiceValues(['Yes — please do','Yes, but anonymously only','No']);

  // Link to spreadsheet
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  Utilities.sleep(1500);
  _renameLatestResponseSheet(ss, 'FORM 5 — FEEDBACK LOG RESPONSES');

  Logger.log('Form 5 created: ' + form.getPublishedUrl());
  return form;
}


// ══════════════════════════════════════════════════════════════════════════════
// PART B — TRIGGER INSTALLATION
// ══════════════════════════════════════════════════════════════════════════════

function _installAllTriggers(ss) {
  // Remove all existing triggers to avoid duplicates
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  Logger.log('Existing triggers cleared.');

  // Form submit dispatcher — handles Forms 1, 4, 5, 6
  ScriptApp.newTrigger('onSHERFormSubmit')
    .forSpreadsheet(ss).onFormSubmit().create();
  Logger.log('Trigger installed: onSHERFormSubmit (form submit dispatcher)');

  // Automation 4 — 48-hour reminder, nightly 8 PM
  ScriptApp.newTrigger('_check48HourReminders')
    .timeBased().everyDays(1).atHour(20).create();
  Logger.log('Trigger installed: _check48HourReminders (nightly 8 PM)');

  // Automation 5 — daily guide brief, 4:30 AM
  ScriptApp.newTrigger('_sendDailyGuideBrief')
    .timeBased().everyDays(1).atHour(4).create();
  Logger.log('Trigger installed: _sendDailyGuideBrief (daily 4 AM)');

  // Automation 6 — feedback requests, 11 AM and 6 PM
  ScriptApp.newTrigger('_sendFeedbackRequests')
    .timeBased().everyDays(1).atHour(11).create();
  ScriptApp.newTrigger('_sendFeedbackRequests')
    .timeBased().everyDays(1).atHour(18).create();
  Logger.log('Trigger installed: _sendFeedbackRequests (11 AM + 6 PM)');

  // Automation 7 — weekly report, Monday 7 AM
  ScriptApp.newTrigger('_sendWeeklyReport')
    .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(7).create();
  Logger.log('Trigger installed: _sendWeeklyReport (Monday 7 AM)');

  // Mystic Morning delayed email processor
  ScriptApp.newTrigger('_processMysticMorningEmails')
    .timeBased().everyDays(1).atHour(15).create();
  Logger.log('Trigger installed: _processMysticMorningEmails (daily 3 PM)');
}


// ══════════════════════════════════════════════════════════════════════════════
// FORM SUBMIT DISPATCHER
// ══════════════════════════════════════════════════════════════════════════════

function onSHERFormSubmit(e) {
  try {
    const vals = e.namedValues;

    // Route by unique field presence
    if (vals['Link to Enquiry ID']) {
      // Form 4 — Booking Confirmation (internal)
      _handleBookingConfirmation(vals, e);

    } else if (vals['Experience(s) Delivered Today']) {
      // Form 6 — Daily Morning Log
      _handleMorningLog(vals, e);

    } else if (vals['Full Name'] && vals['Which experience are you interested in?'] &&
               vals['WhatsApp / Phone Number']) {
      // Form 1 — Guest Enquiry (has WhatsApp field; Form 2 also has it but different experience field)
      _handleEnquiry(vals, e);

    } else if (vals['Overall experience rating']) {
      // Form 5 — Post-Tour Feedback
      _handleFeedback(vals, e);
    }

  } catch (err) {
    MailApp.sendEmail(SHER_EMAIL, 'SHER TMS — Trigger Error',
      'Error in onSHERFormSubmit: ' + err.message + '\n\nStack: ' + err.stack);
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 1 — ENQUIRY AUTO-REPLY
// ══════════════════════════════════════════════════════════════════════════════

function _handleEnquiry(vals, e) {
  const name       = _firstVal(vals, 'Full Name');
  const email      = _firstVal(vals, 'Email Address');
  const experience = _firstVal(vals, 'Which experience are you interested in?');
  const guests     = _firstVal(vals, 'Number of guests');
  const dates      = [
    _firstVal(vals, 'Preferred Date (first choice)'),
    _firstVal(vals, 'Preferred Date (second choice, optional)'),
    _firstVal(vals, 'Preferred Date (third choice, optional)')
  ].filter(Boolean).join(', ') || 'To be confirmed';
  const whatsapp   = _firstVal(vals, 'WhatsApp / Phone Number');
  const source     = _firstVal(vals, 'How did you hear about SHER?');
  const occasion   = _firstVal(vals, 'Is this for a special occasion?');
  const notes      = _firstVal(vals, "Anything else you'd like us to know?");
  const firstName  = name.split(' ')[0];

  if (!email) return;

  // Email to guest
  const guestSubject = 'Thank you for your enquiry — SHER Eco Sanctuary';
  const guestBody = `Dear ${firstName},

Thank you for reaching out to SHER. We have received your enquiry and will respond personally within 24 hours.

${_weatherPhilosophyParagraph()}

We look forward to speaking with you soon.

SHER Eco Sanctuary
Savannes Bay · Micoud · Saint Lucia
${WEBSITE_URL}`;

  MailApp.sendEmail({ to: email, subject: guestSubject, body: guestBody });

  // Internal notification to SHER team
  const internalSubject = 'New Enquiry — ' + name + ' · ' + experience;
  const internalBody = `New enquiry received via website form.

Name:        ${name}
Email:       ${email}
WhatsApp:    ${whatsapp}
Experience:  ${experience}
Guests:      ${guests}
Dates:       ${dates}
Occasion:    ${occasion || 'None'}
Source:      ${source || 'Not stated'}
Notes:       ${notes || 'None'}

Respond within 24 hours.`;

  MailApp.sendEmail({ to: SHER_EMAIL, subject: internalSubject, body: internalBody });

  // Log to Enquiry Log sheet
  const ss = SpreadsheetApp.openById(SS_ID);
  const log = ss.getSheetByName('2. ENQUIRY LOG');
  if (log) {
    const id = 'ENQ-' + new Date().getFullYear() + '-' + _zeroPad(log.getLastRow(), 4);
    log.appendRow([
      id, new Date(), name, email, whatsapp,
      experience, _firstVal(vals,'Preferred Date (first choice)'),
      _firstVal(vals,'Preferred Date (second choice, optional)'),
      _firstVal(vals,'Preferred Date (third choice, optional)'),
      _firstVal(vals,'How fixed are your dates?'),
      guests, occasion, source, 'New', '', '', '', '', notes
    ]);
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 2 + 8 — BOOKING CONFIRMATION + CONFLICT CHECK
// ══════════════════════════════════════════════════════════════════════════════

function _handleBookingConfirmation(vals, e) {
  const ss = SpreadsheetApp.openById(SS_ID);

  const enquiryId   = _firstVal(vals, 'Link to Enquiry ID');
  const experience  = _firstVal(vals, 'Confirmed Experience');
  const dateStr     = _firstVal(vals, 'Confirmed Date of Experience');
  const groupSize   = parseInt(_firstVal(vals, 'Confirmed Group Size')) || 1;
  const revenue     = _firstVal(vals, 'Revenue Amount Confirmed (USD)');
  const guide       = _firstVal(vals, 'Guide Assigned');
  const partner     = _firstVal(vals, 'Partner Referral (if applicable)');
  const special     = _firstVal(vals, 'Special Requirements');
  const fygaroSent  = _firstVal(vals, 'FYGARO Payment Link Sent?');

  // Look up guest details from Enquiry Log
  const enquiryLog = ss.getSheetByName('2. ENQUIRY LOG');
  let guestName = '', guestEmail = '';
  if (enquiryLog && enquiryId) {
    const logData = enquiryLog.getDataRange().getValues();
    for (let i = 1; i < logData.length; i++) {
      if (String(logData[i][0]).trim() === enquiryId.trim()) {
        guestName  = logData[i][2];
        guestEmail = logData[i][3];
        break;
      }
    }
  }

  // ── AUTOMATION 8: CONFLICT CHECK ──────────────────────────────────────────
  const conflict = _checkAvailabilityConflict(ss, dateStr, experience, groupSize);
  if (conflict) {
    const alertBody = `BOOKING CONFLICT DETECTED

Date:         ${dateStr}
Experience:   ${experience}
Guest:        ${guestName || enquiryId}
Group size:   ${groupSize}
Conflict:     ${conflict}

Do not confirm this booking until conflict is resolved manually.
Check the Availability Calendar tab for details.`;

    MailApp.sendEmail({
      to: SHER_EMAIL,
      subject: 'SHER TMS — Booking Conflict Detected: ' + dateStr,
      body: alertBody
    });
    return; // Stop — do not confirm or email guest
  }

  // ── AUTOMATION 2: BOOKING CONFIRMATION EMAIL ──────────────────────────────
  const bookingDate = new Date(dateStr);
  const month = bookingDate.getMonth() + 1;
  const isHighSeason = (month >= 6 && month <= 10);

  let whatToBring = 'A light layer (mornings on the water can be fresh), water, your camera, and comfortable clothing.';
  if (experience.includes('Calm Reflections')) {
    whatToBring = 'Sun protection, water, your camera, and comfortable clothing suited to the bay.';
  }

  const confirmSubject = `Your SHER experience is confirmed — ${experience}, ${dateStr}`;
  let confirmBody = `Dear ${guestName || 'Guest'},

Your experience with SHER is confirmed. We are delighted to welcome you to the bay.

──────────────────────────────
BOOKING DETAILS
Experience:     ${experience}
Date:           ${dateStr}
Departure:      ${_departureTime(experience)}
Group size:     ${groupSize} ${groupSize === 1 ? 'guest' : 'guests'}
Guide:          ${guide || 'To be confirmed'}
Meeting point:  ${MEETING_POINT}
──────────────────────────────

WHAT TO BRING
${whatToBring}

WAIVER
Please complete your health declaration and Conservation Code agreement before arrival:
${WAIVER_URL}

${fygaroSent === 'No — send now' ? 'PAYMENT\nA secure payment link will be sent separately. Please complete payment at least 48 hours before your experience.\n\n' : ''}THE CONSERVATION CODE
Every SHER guest observes our Conservation Code before entering the bay. Please read it before you arrive:
${CODE_URL}

${_weatherPhilosophyParagraph()}
${isHighSeason ? '\n' + _highSeasonParagraph() : ''}

We look forward to seeing you on the bay.

SHER Eco Sanctuary
Savannes Bay · Micoud · Saint Lucia
${WEBSITE_URL}`;

  if (guestEmail) {
    MailApp.sendEmail({ to: guestEmail, subject: confirmSubject, body: confirmBody });
  }

  // Update Master Bookings and Availability Calendar
  _addToMasterBookings(ss, {
    enquiryId, experience, guestName, guestEmail,
    dateStr, groupSize, revenue, guide, partner, special
  });
  _updateAvailabilityCalendar(ss, dateStr, experience, groupSize);

  Logger.log('Booking confirmed for ' + guestName + ' on ' + dateStr);
}


function _checkAvailabilityConflict(ss, dateStr, experience, groupSize) {
  const cal = ss.getSheetByName('4. AVAILABILITY CALENDAR');
  if (!cal) return null;

  const data = cal.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const rowDate = String(data[i][0]).trim();
    if (rowDate !== dateStr) continue;

    const isletExp = experience.includes('Scorpio') || experience.includes('Islet');

    if (isletExp) {
      // Check Scorpion Islet slot (col 8, index 7)
      if (String(data[i][7]).trim() === 'Booked') {
        return 'Scorpion Islet slot already booked on ' + dateStr + '. One landing per day permitted.';
      }
    } else {
      // Check Bay Serenity capacity (col 5, index 4 = guests booked)
      const alreadyBooked = parseInt(data[i][4]) || 0;
      const slotStatus    = String(data[i][3]).trim();
      if (slotStatus === 'Booked' || (alreadyBooked + groupSize) > 6) {
        return 'Bay Serenity slot on ' + dateStr + ' is full or at capacity (' + alreadyBooked + '/6 already booked).';
      }
    }
    return null; // Date found, no conflict
  }
  return null; // Date not found in calendar — allow (no data = available)
}


function _addToMasterBookings(ss, d) {
  const bookings = ss.getSheetByName('1. MASTER BOOKINGS');
  if (!bookings) return;
  const id = 'SHER-' + new Date().getFullYear() + '-' + _zeroPad(bookings.getLastRow(), 4);
  bookings.appendRow([
    id, 'Confirmed', d.experience, d.guestName, d.guestEmail, '',
    d.dateStr, _departureTime(d.experience), d.groupSize, '',
    d.revenue, 'Deposit received', 'Yes', '', d.partner || '',
    'Not sent', '', d.guide, '', 'None', 'Not submitted', '', d.special
  ]);
}


function _updateAvailabilityCalendar(ss, dateStr, experience, groupSize) {
  const cal = ss.getSheetByName('4. AVAILABILITY CALENDAR');
  if (!cal) return;
  const data = cal.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]).trim() !== dateStr) continue;
    const isletExp = experience.includes('Scorpio') || experience.includes('Islet');
    if (isletExp) {
      cal.getRange(i + 1, 8).setValue('Booked');
      cal.getRange(i + 1, 9).setValue(experience);
    } else {
      const already = parseInt(data[i][4]) || 0;
      const total   = already + groupSize;
      cal.getRange(i + 1, 5).setValue(total);
      if (total >= 6) cal.getRange(i + 1, 4).setValue('Booked');
    }
    break;
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 3 — MYSTIC MORNING TRIGGER
// ══════════════════════════════════════════════════════════════════════════════

function _handleMorningLog(vals, e) {
  const ss = SpreadsheetApp.openById(SS_ID);

  // Always write to Weather Log (carries forward from Phase 1 repair)
  const weatherLog = ss.getSheetByName('8. WEATHER LOG');
  if (weatherLog) {
    const experienceRaw = _firstVal(vals, 'Experience(s) Delivered Today');
    const mode          = _firstVal(vals, 'Experience Mode').split(' —')[0];
    const isMystic      = mode.toLowerCase().includes('mystic');
    const guestCount    = parseInt(_firstVal(vals, 'Number of Guests')) || 0;

    weatherLog.appendRow([
      new Date(),
      experienceRaw.includes('Calm') ? '9:00 AM' : '5:15 AM',
      _firstVal(vals, 'Sky Condition at Departure'),
      mode,
      '',
      isMystic ? 'Yes' : 'No',
      isMystic ? guestCount : '',
      isMystic ? 'Yes' : 'No',
      isMystic ? (guestCount * 25) : 0,
      _firstVal(vals, 'Water Condition'),
      _firstVal(vals, 'Wildlife or Bay Observation (optional)'),
      _firstVal(vals, 'Guide Notes (free text)')
    ]);
  }

  // Equipment flag
  const equipCheck = _firstVal(vals, 'Equipment Condition Check');
  if (equipCheck !== 'All good — nothing to report') {
    MailApp.sendEmail({
      to: SHER_EMAIL,
      subject: 'SHER TMS — Equipment Flag: ' + new Date().toDateString(),
      body: 'Equipment issue flagged in daily morning log:\n\n' +
            equipCheck + '\n\n' +
            (_firstVal(vals, 'Equipment Notes (if any)') || 'No additional notes.') +
            '\n\nCheck the Equipment Log and resolve before next operating day.'
    });
  }

  // If Mystic Morning — conservation fund + guest credit + delayed email
  const mode = _firstVal(vals, 'Experience Mode');
  if (!mode.toLowerCase().includes('mystic')) return;

  const guestCount = parseInt(_firstVal(vals, 'Number of Guests')) || 0;
  const amountEC   = guestCount * 25;
  const amountUSD  = Math.round(amountEC / 2.7 * 100) / 100;

  // Write to Conservation Fund
  const conservFund = ss.getSheetByName('9. CONSERVATION FUND');
  if (conservFund) {
    const cumTotal = _conservFundTotal(conservFund) + amountEC;
    conservFund.appendRow([
      new Date(), '', 'Mystic Morning transition',
      amountEC, amountUSD, '', 'No', cumTotal, '', 'No', ''
    ]);
  }

  // Find guest from Master Bookings by today's date
  const today = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const guestInfo = _lookupGuestByDate(ss, today);

  if (!guestInfo.email) return;

  // Write future credit to Guest Database
  const guestDb = ss.getSheetByName('3. GUEST DATABASE');
  if (guestDb) {
    const expiry = new Date(); expiry.setMonth(expiry.getMonth() + 12);
    const data = guestDb.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (data[i][2] === guestInfo.email) {
        guestDb.getRange(i + 1, 12).setValue(30); // Active Credit USD
        guestDb.getRange(i + 1, 13).setValue(Utilities.formatDate(expiry, Session.getScriptTimeZone(), 'yyyy-MM-dd'));
        break;
      }
    }
  }

  // Schedule delayed email (3 hours from now via properties + daily processor)
  const pending = JSON.parse(
    PropertiesService.getScriptProperties().getProperty('PENDING_MYSTIC_EMAILS') || '[]'
  );
  pending.push({
    email    : guestInfo.email,
    name     : guestInfo.name,
    guests   : guestCount,
    amountEC : amountEC,
    amountUSD: amountUSD,
    sendAfter: Date.now() + (3 * 60 * 60 * 1000)
  });
  PropertiesService.getScriptProperties().setProperty('PENDING_MYSTIC_EMAILS', JSON.stringify(pending));
}


function _processMysticMorningEmails() {
  const props   = PropertiesService.getScriptProperties();
  const pending = JSON.parse(props.getProperty('PENDING_MYSTIC_EMAILS') || '[]');
  const now     = Date.now();
  const remaining = [];

  for (const item of pending) {
    if (item.sendAfter <= now) {
      _sendMysticMorningEmail(item);
    } else {
      remaining.push(item);
    }
  }
  props.setProperty('PENDING_MYSTIC_EMAILS', JSON.stringify(remaining));
}


function _sendMysticMorningEmail(item) {
  const firstName = item.name ? item.name.split(' ')[0] : 'Guest';
  const subject   = 'Your Mystic Morning — SHER Eco Sanctuary';
  const body      = `Dear ${firstName},

We hope this morning on the bay has settled in you in the way only mornings on the water can.

The clouds that greeted you at dawn were not a compromise — they were the bay in a different mood. A Mystic Morning is rarer than a golden one, and in its own way, more honest.

As a small acknowledgement, we have made a conservation contribution of EC$${item.amountEC} to the Pointe Sable Environmental Protection Area stewardship fund in the name of everyone who was on the water this morning.

We have also held USD $30 as a credit against your next SHER experience, valid for 12 months. It is there whenever you feel ready to return.

Mention this email when you book and we will apply it automatically.

With gratitude for your presence on the bay.

SHER Eco Sanctuary
Savannes Bay · Micoud · Saint Lucia
${WEBSITE_URL}`;

  MailApp.sendEmail({ to: item.email, subject, body });
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 4 — 48-HOUR GUEST REMINDER
// ══════════════════════════════════════════════════════════════════════════════

function _check48HourReminders() {
  const ss       = SpreadsheetApp.openById(SS_ID);
  const bookings = ss.getSheetByName('1. MASTER BOOKINGS');
  if (!bookings) return;

  const data      = bookings.getDataRange().getValues();
  const headers   = data[0];
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + 2);
  const targetStr  = Utilities.formatDate(targetDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');

  const colStatus   = headers.indexOf('Booking Status');
  const colExp      = headers.indexOf('Experience Name');
  const colDate     = headers.indexOf('Booking Date (Experience)');
  const colGuest    = headers.indexOf('Guest Name(s)');
  const colEmail    = headers.indexOf('Guest Email');
  const colGuide    = headers.indexOf('Guide Assigned');
  const colTime     = headers.indexOf('Preferred Time');
  const colOccasion = headers.indexOf('Occasion Type');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[colStatus]).trim() !== 'Confirmed') continue;

    const bookDate = Utilities.formatDate(new Date(row[colDate]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (bookDate !== targetStr) continue;

    const email      = String(row[colEmail]).trim();
    const name       = String(row[colGuest]).trim();
    const firstName  = name.split(' ')[0];
    const experience = String(row[colExp]).trim();
    const guide      = String(row[colGuide]).trim();
    const departure  = String(row[colTime]).trim() || _departureTime(experience);
    const occasion   = String(row[colOccasion]).trim();

    const bookMonth = new Date(row[colDate]).getMonth() + 1;
    const isMysticSeason = bookMonth >= 6 && bookMonth <= 10;

    const subject = 'See you soon — your SHER experience is in 48 hours';
    let body = `Dear ${firstName},

This is a reminder that your SHER experience is in 48 hours. We are looking forward to meeting you on the bay.

──────────────────────────────
YOUR EXPERIENCE
Experience:     ${experience}
Date:           ${row[colDate]}
Departure:      ${departure}
Guide:          ${guide || 'Your SHER guide'}
Meeting point:  ${MEETING_POINT}
──────────────────────────────

WHAT TO BRING
A light layer for the dawn (mornings on the water can be fresh), water, your camera, and comfortable clothing.

THE CONSERVATION CODE
A reminder to read our Conservation Code before you arrive:
${CODE_URL}

Whatever the bay offers tomorrow morning, we will be there with you.`;

    if (isMysticSeason) {
      body += '\n\nThe season suggests we may wake to a Mystic Morning. We will have something warm for you.';
    }

    body += `\n\nSHER Eco Sanctuary\nSavannes Bay · Micoud · Saint Lucia\n${WEBSITE_URL}`;

    if (email) {
      MailApp.sendEmail({ to: email, subject, body });
    }
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 5 — DAILY GUIDE MORNING BRIEF
// ══════════════════════════════════════════════════════════════════════════════

function _sendDailyGuideBrief() {
  const ss       = SpreadsheetApp.openById(SS_ID);
  const bookings = ss.getSheetByName('1. MASTER BOOKINGS');
  const calendar = ss.getSheetByName('4. AVAILABILITY CALENDAR');
  if (!bookings) return;

  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const data     = bookings.getDataRange().getValues();
  const headers  = data[0];

  const colStatus  = headers.indexOf('Booking Status');
  const colExp     = headers.indexOf('Experience Name');
  const colDate    = headers.indexOf('Booking Date (Experience)');
  const colGuest   = headers.indexOf('Guest Name(s)');
  const colSize    = headers.indexOf('Group Size');
  const colTime    = headers.indexOf('Preferred Time');
  const colOcc     = headers.indexOf('Occasion Type');
  const colSpecial = headers.indexOf('Notes');
  const colWaiver  = headers.indexOf('Waiver Status');

  const todayBookings = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[colStatus]).trim() !== 'Confirmed') continue;
    const bookDate = Utilities.formatDate(new Date(row[colDate]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (bookDate === todayStr) todayBookings.push(row);
  }

  if (todayBookings.length === 0) return; // No bookings today — no brief sent

  // Determine refreshment profile from season
  let season = 'Shoulder';
  if (calendar) {
    const calData = calendar.getDataRange().getValues();
    for (let i = 1; i < calData.length; i++) {
      if (String(calData[i][0]).trim() === todayStr) {
        season = String(calData[i][2]).trim();
        break;
      }
    }
  }
  const refreshment = season === 'Mystic'
    ? 'Mystic profile: cocoa tea, local bakes, warm bundle'
    : 'Golden profile: fresh fruit, juice, light snack';

  let briefBody = `SHER MORNING BRIEF — ${todayStr}
${'─'.repeat(40)}

${todayBookings.length} experience${todayBookings.length > 1 ? 's' : ''} confirmed today.
Season: ${season} · Refreshment: ${refreshment}

${'─'.repeat(40)}\n`;

  todayBookings.forEach((row, idx) => {
    briefBody += `
BOOKING ${idx + 1}
Guests:       ${row[colGuest]}
Experience:   ${row[colExp]}
Group size:   ${row[colSize]}
Departure:    ${row[colTime] || _departureTime(String(row[colExp]))}
Occasion:     ${row[colOcc] || 'None'}
Waiver:       ${row[colWaiver] || 'Not sent'}
Special req:  ${row[colSpecial] || 'None'}
`;
  });

  briefBody += `\n${'─'.repeat(40)}\nHave a safe and extraordinary morning.\nSHER TMS`;

  MailApp.sendEmail({
    to     : SHER_EMAIL,
    subject: 'SHER Morning Brief — ' + todayStr,
    body   : briefBody
  });
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 6 — POST-TOUR FEEDBACK REQUEST
// ══════════════════════════════════════════════════════════════════════════════

function _sendFeedbackRequests() {
  const ss       = SpreadsheetApp.openById(SS_ID);
  const bookings = ss.getSheetByName('1. MASTER BOOKINGS');
  if (!bookings) return;

  const feedbackUrl = PropertiesService.getScriptProperties()
    .getProperty('FEEDBACK_FORM_URL') || '[FEEDBACK FORM URL]';

  const data    = bookings.getDataRange().getValues();
  const headers = data[0];

  const colStatus   = headers.indexOf('Booking Status');
  const colEmail    = headers.indexOf('Guest Email');
  const colGuest    = headers.indexOf('Guest Name(s)');
  const colFeedback = headers.indexOf('Post-Tour Feedback');

  // Add Feedback Sent column if missing
  let colFbSent = headers.indexOf('Feedback Sent');
  if (colFbSent === -1) {
    colFbSent = headers.length;
    bookings.getRange(1, colFbSent + 1).setValue('Feedback Sent');
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[colStatus]).trim()  !== 'Completed') continue;
    if (String(row[colFeedback]).trim() === 'Submitted') continue;
    if (colFbSent < row.length && String(row[colFbSent]).trim() === 'Y') continue;

    const email     = String(row[colEmail]).trim();
    const name      = String(row[colGuest]).trim();
    const firstName = name.split(' ')[0];
    if (!email) continue;

    MailApp.sendEmail({
      to     : email,
      subject: 'If the morning is still with you — SHER Eco Sanctuary',
      body   : `Dear ${firstName},

We hope your morning on the bay has stayed with you today. If you would like to share how it felt, we would be glad to hear.

${feedbackUrl}

Thank you for spending the morning with us.

SHER Eco Sanctuary
${WEBSITE_URL}`
    });

    // Mark feedback sent
    bookings.getRange(i + 1, colFbSent + 1).setValue('Y');
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION 7 — WEEKLY REVENUE REPORT
// ══════════════════════════════════════════════════════════════════════════════

function _sendWeeklyReport() {
  const ss = SpreadsheetApp.openById(SS_ID);

  const weekEnd    = new Date();
  const weekStart  = new Date(); weekStart.setDate(weekEnd.getDate() - 7);
  const dateLabel  = Utilities.formatDate(weekEnd, Session.getScriptTimeZone(), 'dd MMM yyyy');

  // Revenue data
  const revData = _readSheetData(ss, '7. REVENUE TRACKER');
  let totalRevenue = 0;
  const byExperience = {};
  let totalGuests = 0;
  let conservThisWeek = 0;

  revData.forEach(row => {
    const d = new Date(row[0]);
    if (!row[0] || d < weekStart || d > weekEnd) return;
    const revenue = parseFloat(row[3]) || 0;
    const exp     = String(row[2]);
    totalRevenue += revenue;
    byExperience[exp] = (byExperience[exp] || 0) + revenue;
  });

  // Guest count
  const bookData = _readSheetData(ss, '1. MASTER BOOKINGS');
  bookData.forEach(row => {
    const d = new Date(row[6]);
    if (!row[6] || d < weekStart || d > weekEnd) return;
    if (String(row[1]) === 'Completed') totalGuests += (parseInt(row[8]) || 0);
  });

  // Enquiries
  const enqData = _readSheetData(ss, '2. ENQUIRY LOG');
  let totalEnquiries = 0, converted = 0;
  enqData.forEach(row => {
    const d = new Date(row[1]);
    if (!row[1] || d < weekStart || d > weekEnd) return;
    totalEnquiries++;
    if (String(row[13]).includes('Converted')) converted++;
  });

  // Conservation fund
  const conservData = _readSheetData(ss, '9. CONSERVATION FUND');
  conservData.forEach(row => {
    const d = new Date(row[0]);
    if (!row[0] || d < weekStart || d > weekEnd) return;
    conservThisWeek += parseFloat(row[3]) || 0;
  });

  // Equipment flags
  const equipData = _readSheetData(ss, '11. EQUIPMENT LOG');
  const equipFlags = equipData.filter(row =>
    row[2] && String(row[2]) !== 'Excellent' && String(row[2]) !== 'Good'
  );

  // Build report
  let expBreakdown = '';
  Object.entries(byExperience).forEach(([exp, rev]) => {
    expBreakdown += `  ${exp}: USD $${rev.toFixed(2)}\n`;
  });

  const reportBody = `SHER WEEKLY REPORT — w/e ${dateLabel}
${'═'.repeat(44)}

REVENUE
Total this week:         USD $${totalRevenue.toFixed(2)}
By experience:
${expBreakdown || '  No revenue recorded this week.\n'}
OPERATIONS
Guests hosted:           ${totalGuests}
Enquiries received:      ${totalEnquiries}
Enquiries converted:     ${converted}
Conversion rate:         ${totalEnquiries > 0 ? Math.round(converted/totalEnquiries*100) : 0}%

CONSERVATION
Fund contributions:      EC$ ${conservThisWeek.toFixed(2)} this week

EQUIPMENT
${equipFlags.length === 0
  ? 'All equipment reported in good condition.'
  : equipFlags.map(r => '⚠ ' + r[0] + ': ' + r[2] + (r[5] ? ' — ' + r[5] : '')).join('\n')
}

${'═'.repeat(44)}
Generated by SHER TMS · ${new Date().toDateString()}`;

  MailApp.sendEmail({
    to     : SHER_EMAIL,
    subject: 'SHER Weekly Report — w/e ' + dateLabel,
    body   : reportBody
  });
}


// ══════════════════════════════════════════════════════════════════════════════
// AUTOMATION — FEEDBACK HANDLER (Form 5)
// ══════════════════════════════════════════════════════════════════════════════

function _handleFeedback(vals, e) {
  const ss = SpreadsheetApp.openById(SS_ID);

  const rating     = _firstVal(vals, 'Overall experience rating');
  const experience = _firstVal(vals, 'Which experience did you take?');
  const guide      = _firstVal(vals, 'Was the guide excellent?');
  const share      = _firstVal(vals, 'May we share your feedback?');
  const memo       = _firstVal(vals, 'What was the most memorable moment?');

  // Write to Feedback Log
  const fbLog = ss.getSheetByName('FORM 5 — FEEDBACK LOG RESPONSES');
  // (responses already there from form destination — just process)

  // If high rating and consented — notify team for review request
  const ratingNum = parseInt(rating) || 0;
  if (ratingNum >= 4 && share !== 'No') {
    MailApp.sendEmail({
      to     : SHER_EMAIL,
      subject: `★ ${rating}/5 — ${experience} — Review candidate`,
      body   : `New ${rating}/5 feedback received for ${experience}.\n\nMost memorable moment: ${memo || 'Not provided'}\n\nGuide rating: ${guide}\n\nThis guest has consented to sharing (${share}) — consider following up for a Google or TripAdvisor review.`
    });
  }

  // If disappointed — alert team immediately
  if (ratingNum <= 2) {
    MailApp.sendEmail({
      to     : SHER_EMAIL,
      subject: `SHER TMS — Guest Feedback Alert: ${rating}/5 — ${experience}`,
      body   : `Low feedback received.\n\nExperience: ${experience}\nRating: ${rating}/5\nGuide: ${guide}\nMemorable moment: ${memo || 'Not provided'}\n\nPlease follow up with this guest directly.`
    });
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function _firstVal(namedValues, key) {
  const entry = namedValues[key];
  return (entry && entry[0]) ? entry[0].trim() : '';
}

function _zeroPad(n, length) {
  return String(n).padStart(length, '0');
}

function _departureTime(experience) {
  if (!experience) return 'By appointment';
  if (experience.includes('Calm')) return '9:00 AM';
  if (experience.includes('Golden') || experience.includes('Mystic')) return '5:15 AM';
  return 'By appointment';
}

function _weatherPhilosophyParagraph() {
  return 'You have not booked a weather forecast. You have booked a morning on one of Saint Lucia\'s most protected and extraordinary bays. Whatever it offers, we will be there to meet it with you.';
}

function _highSeasonParagraph() {
  return 'You are booking during the Caribbean\'s most dramatic season — a time when the islands are at their most alive and most honestly themselves. Whatever the bay offers, we will meet it with you.';
}

function _lookupGuestByDate(ss, dateStr) {
  const bookings = ss.getSheetByName('1. MASTER BOOKINGS');
  if (!bookings) return { email: '', name: '' };
  const data    = bookings.getDataRange().getValues();
  const headers = data[0];
  const colDate  = headers.indexOf('Booking Date (Experience)');
  const colEmail = headers.indexOf('Guest Email');
  const colGuest = headers.indexOf('Guest Name(s)');
  for (let i = 1; i < data.length; i++) {
    const d = Utilities.formatDate(new Date(data[i][colDate]), Session.getScriptTimeZone(), 'yyyy-MM-dd');
    if (d === dateStr && String(data[i][1]).trim() === 'Confirmed') {
      return { email: data[i][colEmail], name: data[i][colGuest] };
    }
  }
  return { email: '', name: '' };
}

function _readSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
}

function _conservFundTotal(sheet) {
  if (sheet.getLastRow() < 2) return 0;
  const data = sheet.getRange(2, 8, sheet.getLastRow() - 1, 1).getValues();
  let max = 0;
  data.forEach(r => { const v = parseFloat(r[0]) || 0; if (v > max) max = v; });
  return max;
}

function _getOrCreateSheet(ss, name, color) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (color) sheet.setTabColor(color);
  }
  return sheet;
}

function _renameLatestResponseSheet(ss, newName) {
  const sheets = ss.getSheets();
  for (let i = sheets.length - 1; i >= 0; i--) {
    if (sheets[i].getName().startsWith('Form Responses')) {
      sheets[i].setName(newName);
      return;
    }
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// TEST FUNCTIONS — run individually to verify each automation
// ══════════════════════════════════════════════════════════════════════════════

function TEST_weeklyReport()      { _sendWeeklyReport(); }
function TEST_guideBrief()        { _sendDailyGuideBrief(); }
function TEST_feedbackRequests()  { _sendFeedbackRequests(); }
function TEST_48hReminders()      { _check48HourReminders(); }
function TEST_mysticEmails()      { _processMysticMorningEmails(); }
