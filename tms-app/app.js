/* ─── SHER Guide App — Supabase backend ──────────────────────────────────── */
'use strict';

const SUPABASE_URL      = 'https://hvxqettaonfxmmntrsmd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHFldHRhb25meG1tbnRyc21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDk4NDEsImV4cCI6MjA5NzI4NTg0MX0.ZwJwVIiXNwtJW5prOpnwsYjIrfpA5MSvJFYBCv_q5J0';

// ── Supabase REST helpers ──────────────────────────────────────────────────────

function _sbHeaders() {
  return {
    'apikey':        SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type':  'application/json',
    'Prefer':        'return=minimal'
  };
}

function _sbInsert(table, data) {
  return fetch(SUPABASE_URL + '/rest/v1/' + table, {
    method:  'POST',
    headers: _sbHeaders(),
    body:    JSON.stringify(data)
  })
  .then(function(r) { return r.status === 201; })
  .catch(function()  { return false; });
}

function _sbSelect(table, query) {
  return fetch(SUPABASE_URL + '/rest/v1/' + table + '?' + query, {
    headers: {
      'apikey':        SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    }
  })
  .then(function(r) { return r.json(); });
}

// ── Boot ───────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  registerSW();
  initNav();
  initForms();
  setDate();
  loadBookings();
  flushQueue();
  updateQueueBanner();
  window.addEventListener('online', function() { flushQueue(); updateQueueBanner(); });
});

function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./service-worker.js').catch(function() {});
  }
}

// ── Navigation ─────────────────────────────────────────────────────────────────

var screenTitles = {
  home:      'SHER Guide',
  prelaunch: 'Pre-Launch Log',
  equipment: 'Equipment Check',
  incident:  'Incident Report',
  reset:     'Post-Tour Reset'
};

function initNav() {
  document.querySelectorAll('.tab-btn[data-screen]').forEach(function(btn) {
    btn.addEventListener('click', function() { showScreen(btn.dataset.screen); });
  });
  document.querySelectorAll('.action-btn[data-screen]').forEach(function(btn) {
    btn.addEventListener('click', function() { showScreen(btn.dataset.screen); });
  });
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(function(s) {
    s.classList.remove('active');
  });
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.screen === id);
  });

  var screen = document.getElementById('screen-' + id);
  if (screen) { screen.classList.add('active'); screen.scrollTop = 0; }

  var titleEl = document.getElementById('header-title');
  titleEl.textContent = screenTitles[id] || 'SHER Guide';

  var header = document.getElementById('app-header');
  header.classList.toggle('header--incident', id === 'incident');

  document.getElementById('header-date').style.display = id === 'home' ? 'block' : 'none';
}

function setDate() {
  document.getElementById('header-date').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  var dtInput = document.getElementById('f8-datetime');
  if (dtInput) {
    var now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    dtInput.value = now.toISOString().slice(0, 16);
  }
}

// ── Bookings ────────────────────────────────────────────────────────────────────

function loadBookings() {
  var container = document.getElementById('bookings-container');
  var metaEl    = document.getElementById('bookings-meta');
  var noteEl    = document.getElementById('bookings-cache-note');

  var cached = null;
  try {
    var raw = localStorage.getItem('sher_bookings_cache');
    if (raw) cached = JSON.parse(raw);
  } catch(e) {}

  if (cached && cached.data) {
    renderBookings(cached.data);
    if (noteEl) noteEl.textContent = 'Cached ' + fmtTime(new Date(cached.ts));
    if (metaEl) metaEl.style.display = 'flex';
  }

  var today = todayISO();
  _sbSelect('today_bookings',
    'booking_date=eq.' + today +
    '&select=guest_name,experience,departure,group_size,occasion' +
    '&order=departure.asc'
  )
  .then(function(rows) {
    if (!Array.isArray(rows)) {
      console.warn('[SHER] today_bookings error:', JSON.stringify(rows));
      if (!cached) {
        container.innerHTML = '<p class="no-bookings">Could not load bookings. Check console for details.</p>' +
          '<button class="retry-btn" onclick="loadBookings()">Try again</button>';
      }
      return;
    }
    console.log('[SHER] today_bookings returned', rows.length, 'row(s) for', today);
    var bookings = rows.map(function(r) {
      return {
        guestName:  r.guest_name  || '',
        experience: r.experience  || '',
        departure:  r.departure   || '',
        groupSize:  r.group_size  || '',
        occasion:   r.occasion    || ''
      };
    });
    renderBookings(bookings);
    try {
      localStorage.setItem('sher_bookings_cache', JSON.stringify({
        data: bookings, ts: Date.now()
      }));
    } catch(e) {}
    if (noteEl) noteEl.textContent = 'Updated ' + fmtTime(new Date());
    if (metaEl) metaEl.style.display = 'flex';
  })
  .catch(function() {
    if (!cached) {
      container.innerHTML =
        '<p class="no-bookings">No connection. Bookings will appear when connected.</p>' +
        '<button class="retry-btn" onclick="loadBookings()">Try again</button>';
    }
  });
}

function renderBookings(bookings) {
  var container = document.getElementById('bookings-container');
  if (!bookings || !bookings.length) {
    container.innerHTML = '<p class="no-bookings">No experiences scheduled today.</p>';
    return;
  }
  container.innerHTML = bookings.map(function(b) {
    var tags = '';
    if (b.departure) tags += '<span class="booking-tag">' + esc(b.departure) + '</span>';
    if (b.groupSize)  tags += '<span class="booking-tag">' + esc(b.groupSize) + ' guest' + (b.groupSize != '1' ? 's' : '') + '</span>';
    if (b.occasion && b.occasion !== 'None' && b.occasion !== '') {
      tags += '<span class="booking-tag booking-tag--occasion">' + esc(b.occasion) + '</span>';
    }
    return (
      '<div class="booking-card">' +
        '<div class="booking-experience">' + esc(b.experience) + '</div>' +
        '<div class="booking-guest">'      + esc(b.guestName)  + '</div>' +
        (tags ? '<div class="booking-meta">' + tags + '</div>' : '') +
      '</div>'
    );
  }).join('');
}

// ── Form wiring ────────────────────────────────────────────────────────────────

function initForms() {
  document.getElementById('form-prelaunch').addEventListener('submit', onPrelaunchSubmit);
  document.getElementById('form-equipment').addEventListener('submit', onEquipmentSubmit);
  document.getElementById('form-incident').addEventListener('submit', onIncidentSubmit);
  document.getElementById('form-reset').addEventListener('submit', onResetSubmit);

  on('f6-equip-condition', 'change', function(v) {
    toggle('f6-equip-notes-wrap', v !== '' && v !== 'All good — nothing to report');
  });
  on('f7-battery-charge', 'change', function(v) {
    var warn = document.getElementById('f7-battery-warning');
    if (warn) warn.classList.toggle('visible', v === 'Below 50%');
  });
  on('f7-flagged',          'change', function(v) { toggle('f7-notes-wrap',         v === 'Yes'); });
  on('f8-guests-involved',  'change', function(v) { toggle('f8-guest-names-wrap',   v === 'Yes'); });
  on('f9-lost-property',    'change', function(v) { toggle('f9-lost-desc-wrap',     v === 'Yes'); });

  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function(el) {
    el.addEventListener('input',  function() { el.classList.remove('input-error'); });
    el.addEventListener('change', function() { el.classList.remove('input-error'); });
  });
}

// ── Form 6: Pre-Launch Log ──────────────────────────────────────────────────────

function onPrelaunchSubmit(e) {
  e.preventDefault();
  if (!validateRequired(e.target)) return;

  submitToSupabase('guide_morning_logs', {
    experience_delivered: val('f6-experience'),
    sky_condition:        val('f6-sky'),
    experience_mode:      val('f6-mode'),
    number_of_guests:     val('f6-guests'),
    mystic_bundle_issued: val('f6-mystic'),
    water_condition:      val('f6-water'),
    wildlife_observation: val('f6-wildlife'),
    equipment_condition:  val('f6-equip-condition'),
    equipment_notes:      val('f6-equip-notes'),
    guest_mood:           val('f6-mood'),
    guide_notes:          val('f6-guide-notes')
  }, 'form-prelaunch', 'Morning log submitted. Have a safe and extraordinary experience.');
}

// ── Form 7: Equipment Inspection ───────────────────────────────────────────────

var _f7FieldMap = {
  'GT-01 cleared':              'kayak_gt01',
  'GT-02 cleared':              'kayak_gt02',
  'LG-01 cleared':              'kayak_lg01',
  'SG-01 cleared':              'kayak_sg01',
  'RD-01 hull':                 'rd_hull',
  'RD-01 fittings':             'rd_fittings',
  'Motor mount':                'rd_motor_mount',
  'Motor test run':             'rd_motor_test',
  'Battery terminals':          'rd_battery_terminals',
  'PFDs checked':               'pfds_checked',
  'First aid kit checked':      'first_aid_kit',
  'Safety equipment checked':   'safety_equipment',
  'Communication device checked': 'communication_device',
  'Paddles checked':            'paddles',
  'Refreshment kit prepared':   'refreshment_kit',
  'Bay conditions assessed':    'bay_conditions',
  'Launch area clear':          'launch_area'
};

function onEquipmentSubmit(e) {
  e.preventDefault();
  if (!validateRequired(e.target)) return;

  var data = {
    guide_name:        val('f7-guide'),
    inspection_date:   todayISO(),
    rd_battery_charge: val('f7-battery-charge'),
    any_item_flagged:  val('f7-flagged'),
    inspection_notes:  val('f7-notes')
  };

  e.target.querySelectorAll('input[type="checkbox"][data-field]').forEach(function(cb) {
    var col = _f7FieldMap[cb.dataset.field];
    if (col) data[col] = cb.checked ? 'Yes' : 'No';
  });

  submitToSupabase('guide_equipment_inspections', data,
    'form-equipment', 'Equipment check logged.');
}

// ── Form 8: Incident Report ────────────────────────────────────────────────────

function onIncidentSubmit(e) {
  e.preventDefault();

  var levelVal = document.querySelector('input[name="f8-level"]:checked');
  if (!levelVal) {
    showFormError(e.target, 'Please select an incident level (1, 2, or 3).');
    return;
  }
  if (!validateRequired(e.target)) return;

  submitToSupabase('guide_incidents', {
    incident_level:    levelVal.value,
    incident_type:     val('f8-type'),
    incident_datetime: val('f8-datetime'),
    guide_name:        val('f8-guide'),
    location:          val('f8-location'),
    description:       val('f8-description'),
    guests_involved:   val('f8-guests-involved'),
    guest_names:       val('f8-guest-names'),
    immediate_action:  val('f8-action'),
    medical_attention: val('f8-medical'),
    external_services: val('f8-external')
  }, 'form-incident', 'Incident reported. Operations Lead has been notified.');
}

// ── Form 9: Post-Tour Reset ────────────────────────────────────────────────────

function onResetSubmit(e) {
  e.preventDefault();
  if (!validateRequired(e.target)) return;

  var checks = e.target.querySelectorAll('.required-check');
  var allChecked = true;
  checks.forEach(function(cb) {
    var item = cb.closest('.check-item');
    if (!cb.checked) { if (item) item.classList.add('check-error'); allChecked = false; }
    else             { if (item) item.classList.remove('check-error'); }
  });
  if (!allChecked) {
    showFormError(e.target, 'Please confirm all items before completing the day.');
    return;
  }

  submitToSupabase('guide_post_tour_resets', {
    guide_name:           val('f9-guide'),
    experience_delivered: val('f9-experience'),
    guests_returned:      chk('f9-check-guests'),
    equipment_stowed:     chk('f9-check-equipment'),
    kayaks_secured:       chk('f9-check-kayaks'),
    pfds_stored:          chk('f9-check-pfds'),
    launch_cleared:       chk('f9-check-launch'),
    access_secured:       chk('f9-check-access'),
    guest_mood:           val('f9-mood'),
    lost_property_found:  val('f9-lost-property'),
    lost_property_desc:   val('f9-lost-desc'),
    guide_notes:          val('f9-notes')
  }, 'form-reset', 'Day complete. Well done.');
}

// ── Supabase submission ────────────────────────────────────────────────────────

function submitToSupabase(table, data, formId, successMsg) {
  var form = document.getElementById(formId);
  var btn  = form ? form.querySelector('.submit-btn') : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  _sbInsert(table, data).then(function(ok) {
    if (!ok) queueSubmission(table, data);
    showSuccess(formId, successMsg);
    updateQueueBanner();
  });
}

function showSuccess(formId, message) {
  var form   = document.getElementById(formId);
  var screen = form ? form.closest('.screen') : null;
  if (!screen) return;

  var originalLabel = form.querySelector('.submit-btn') ?
    form.querySelector('.submit-btn').getAttribute('data-label') || '' : '';

  var div = document.createElement('div');
  div.className = 'success-overlay';
  div.innerHTML =
    '<div class="success-card">' +
      '<div class="success-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
          '<circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/>' +
        '</svg>' +
      '</div>' +
      '<p class="success-msg">' + esc(message) + '</p>' +
      '<button class="success-btn" id="success-done-btn">Done</button>' +
    '</div>';

  screen.appendChild(div);

  div.querySelector('#success-done-btn').addEventListener('click', function() {
    div.remove();
    if (form) {
      form.reset();
      form.querySelectorAll('.conditional-wrap').forEach(function(w) { w.style.display = 'none'; });
      form.querySelectorAll('.check-error').forEach(function(el) { el.classList.remove('check-error'); });
      var btn = form.querySelector('.submit-btn');
      if (btn) {
        btn.disabled    = false;
        btn.textContent = originalLabel || btn.textContent;
      }
    }
    showScreen('home');
    loadBookings();
  });
}

function showFormError(form, msg) {
  var err = form.querySelector('.form-error-msg');
  if (!err) {
    err = document.createElement('p');
    err.className = 'form-error-msg';
    form.insertBefore(err, form.firstChild);
  }
  err.textContent = msg;
  form.scrollTop = 0;
}

// ── Offline queue ──────────────────────────────────────────────────────────────

function queueSubmission(table, data) {
  try {
    var q = JSON.parse(localStorage.getItem('sher_queue') || '[]');
    q.push({ table: table, data: data, ts: Date.now() });
    localStorage.setItem('sher_queue', JSON.stringify(q));
  } catch(e) {}
}

function flushQueue() {
  try {
    var q = JSON.parse(localStorage.getItem('sher_queue') || '[]');
    if (!q.length) return;
    var remaining = [];
    var chain = Promise.resolve();
    q.forEach(function(item) {
      chain = chain.then(function() {
        return _sbInsert(item.table, item.data).then(function(ok) {
          if (!ok) remaining.push(item);
        });
      });
    });
    chain.then(function() {
      localStorage.setItem('sher_queue', JSON.stringify(remaining));
      updateQueueBanner();
    });
  } catch(e) {}
}

function updateQueueBanner() {
  try {
    var q      = JSON.parse(localStorage.getItem('sher_queue') || '[]');
    var banner = document.getElementById('queue-banner');
    if (banner) banner.classList.toggle('visible', q.length > 0);
  } catch(e) {}
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function val(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function chk(id) {
  var el = document.getElementById(id);
  return (el && el.checked) ? 'Yes' : 'No';
}

function on(id, event, cb) {
  var el = document.getElementById(id);
  if (el) el.addEventListener(event, function() { cb(el.value); });
}

function toggle(id, show) {
  var el = document.getElementById(id);
  if (el) el.style.display = show ? 'block' : 'none';
}

function validateRequired(form) {
  var valid = true;
  form.querySelectorAll('[required]').forEach(function(el) {
    var empty = !el.value.trim();
    el.classList.toggle('input-error', empty);
    if (empty) valid = false;
  });
  if (!valid) showFormError(form, 'Please complete all required fields.');
  return valid;
}

function esc(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
