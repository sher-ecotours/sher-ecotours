/* ─── SHER Guide App ──────────────────────────────────────────────────────── */
'use strict';

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbwaiIdNQL9uS__m6A0zfepmbPJsaNAmdkzZZstCe_TU6P5rENkI6PWKQMeodGWK2UPinA/exec';

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
  home:       'SHER Guide',
  prelaunch:  'Pre-Launch Log',
  equipment:  'Equipment Check',
  incident:   'Incident Report',
  reset:      'Post-Tour Reset'
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
  if (screen) {
    screen.classList.add('active');
    screen.scrollTop = 0;
  }

  var header = document.getElementById('app-header');
  var titleEl = document.getElementById('header-title');
  titleEl.textContent = screenTitles[id] || 'SHER Guide';
  header.classList.toggle('header--incident', id === 'incident');

  // Show date only on home
  document.getElementById('header-date').style.display = id === 'home' ? 'block' : 'none';
}

function setDate() {
  var el = document.getElementById('header-date');
  el.textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric'
  });

  // Set incident datetime default to now
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

  // Show cached immediately if available
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

  // Try live fetch
  fetch(ENDPOINT + '?formType=getTodayBookings', { redirect: 'follow' })
    .then(function(r) { return r.json(); })
    .then(function(json) {
      if (json.status === 'success') {
        renderBookings(json.bookings);
        try {
          localStorage.setItem('sher_bookings_cache', JSON.stringify({
            data: json.bookings, ts: Date.now()
          }));
        } catch(e) {}
        if (noteEl) noteEl.textContent = 'Updated ' + fmtTime(new Date());
        if (metaEl) metaEl.style.display = 'flex';
      }
    })
    .catch(function() {
      if (!cached) {
        container.innerHTML =
          '<p class="no-bookings">Unable to load &mdash; no connection.<br/>Bookings will appear when connected.</p>' +
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
    if (b.groupSize) tags += '<span class="booking-tag">' + esc(b.groupSize) + ' guest' + (b.groupSize != '1' ? 's' : '') + '</span>';
    if (b.occasion && b.occasion !== 'None' && b.occasion !== '') {
      tags += '<span class="booking-tag booking-tag--occasion">' + esc(b.occasion) + '</span>';
    }
    return (
      '<div class="booking-card">' +
        '<div class="booking-experience">' + esc(b.experience) + '</div>' +
        '<div class="booking-guest">' + esc(b.guestName) + '</div>' +
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

  // Conditional field visibility
  on('f6-equip-condition', 'change', function(v) {
    toggle('f6-equip-notes-wrap', v !== '' && v !== 'All good — nothing to report');
  });
  on('f7-flagged', 'change', function(v) {
    toggle('f7-notes-wrap', v === 'Yes');
  });
  on('f8-guests-involved', 'change', function(v) {
    toggle('f8-guest-names-wrap', v === 'Yes');
  });
  on('f9-lost-property', 'change', function(v) {
    toggle('f9-lost-desc-wrap', v === 'Yes');
  });

  // Clear input-error on change
  document.querySelectorAll('.form-input, .form-select, .form-textarea').forEach(function(el) {
    el.addEventListener('input', function() { el.classList.remove('input-error'); });
    el.addEventListener('change', function() { el.classList.remove('input-error'); });
  });
}

// ── Form 6: Pre-Launch Log ──────────────────────────────────────────────────────

function onPrelaunchSubmit(e) {
  e.preventDefault();
  if (!validateRequired(e.target)) return;

  var payload = {
    formType: 'morningLog',
    'Experience(s) Delivered Today': val('f6-experience'),
    'Sky Condition at Departure':    val('f6-sky'),
    'Experience Mode':               val('f6-mode'),
    'Number of Guests':              val('f6-guests'),
    'Was a Mystic Morning Bundle issued?': val('f6-mystic'),
    'Water Condition':               val('f6-water'),
    'Wildlife or Bay Observation (optional)': val('f6-wildlife'),
    'Equipment Condition Check':     val('f6-equip-condition'),
    'Equipment Notes (if any)':      val('f6-equip-notes'),
    'Guest Mood at End of Experience': val('f6-mood'),
    'Guide Notes (free text)':       val('f6-guide-notes')
  };

  submitToTMS(payload, 'form-prelaunch',
    'Morning log submitted. Have a safe and extraordinary experience.');
}

// ── Form 7: Equipment Inspection ───────────────────────────────────────────────

function onEquipmentSubmit(e) {
  e.preventDefault();
  if (!validateRequired(e.target)) return;

  var payload = {
    formType: 'equipmentInspection',
    'Guide Name':      val('f7-guide'),
    'Inspection Date': todayISO()
  };

  // Collect all checkbox values
  e.target.querySelectorAll('input[type="checkbox"][data-field]').forEach(function(cb) {
    payload[cb.dataset.field] = cb.checked ? 'Yes' : 'No';
  });

  payload['Any item flagged']   = val('f7-flagged');
  payload['Inspection Notes']   = val('f7-notes');

  submitToTMS(payload, 'form-equipment', 'Equipment check logged.');
}

// ── Form 8: Incident Report ────────────────────────────────────────────────────

function onIncidentSubmit(e) {
  e.preventDefault();

  // Validate level selection
  var levelVal = document.querySelector('input[name="f8-level"]:checked');
  if (!levelVal) {
    showFormError(e.target, 'Please select an incident level (1, 2, or 3).');
    return;
  }
  if (!validateRequired(e.target)) return;

  var payload = {
    formType: 'incident',
    'Incident Level':              levelVal.value,
    'Incident Type':               val('f8-type'),
    'Date and Time':               val('f8-datetime'),
    'Guide Name':                  val('f8-guide'),
    'Location':                    val('f8-location'),
    'Description':                 val('f8-description'),
    'Guests Involved':             val('f8-guests-involved'),
    'Guest Names':                 val('f8-guest-names'),
    'Immediate Action Taken':      val('f8-action'),
    'Medical Attention Required':  val('f8-medical'),
    'External Services Contacted': val('f8-external')
  };

  submitToTMS(payload, 'form-incident',
    'Incident reported. Operations Lead has been notified.');
}

// ── Form 9: Post-Tour Reset ────────────────────────────────────────────────────

function onResetSubmit(e) {
  e.preventDefault();
  if (!validateRequired(e.target)) return;

  // Require all confirmation checkboxes
  var checks = e.target.querySelectorAll('.required-check');
  var allChecked = true;
  checks.forEach(function(cb) {
    var item = cb.closest('.check-item');
    if (!cb.checked) {
      if (item) item.classList.add('check-error');
      allChecked = false;
    } else {
      if (item) item.classList.remove('check-error');
    }
  });
  if (!allChecked) {
    showFormError(e.target, 'Please confirm all items before completing the day.');
    return;
  }

  var payload = {
    formType: 'postTourReset',
    'Guide Name':                  val('f9-guide'),
    'Experience Delivered':        val('f9-experience'),
    'All guests safely returned':  chk('f9-check-guests'),
    'Equipment returned and stowed': chk('f9-check-equipment'),
    'Kayaks rinsed and secured':   chk('f9-check-kayaks'),
    'PFDs dried and stored':       chk('f9-check-pfds'),
    'Launch area cleared':         chk('f9-check-launch'),
    'Access secured':              chk('f9-check-access'),
    'Lost Property Found':         val('f9-lost-property'),
    'Lost Property Description':   val('f9-lost-desc'),
    'Guide Notes':                 val('f9-notes')
  };

  submitToTMS(payload, 'form-reset', 'Day complete. Well done.');
}

// ── TMS submission ─────────────────────────────────────────────────────────────

function submitToTMS(payload, formId, successMsg) {
  var form = document.getElementById(formId);
  var btn  = form ? form.querySelector('.submit-btn') : null;
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  postToTMS(payload).then(function(ok) {
    if (!ok) queueSubmission(payload);
    showSuccess(formId, successMsg);
    updateQueueBanner();
  });
}

function postToTMS(payload) {
  return fetch(ENDPOINT, {
    method:  'POST',
    mode:    'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload)
  }).then(function() {
    return true;
  }).catch(function() {
    return false;
  });
}

function showSuccess(formId, message) {
  var form   = document.getElementById(formId);
  var screen = form ? form.closest('.screen') : null;
  if (!screen) return;

  var div = document.createElement('div');
  div.className = 'success-overlay';
  div.innerHTML =
    '<div class="success-card">' +
      '<div class="success-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>' +
      '</div>' +
      '<p class="success-msg">' + esc(message) + '</p>' +
      '<button class="success-btn" id="success-done-btn">Done</button>' +
    '</div>';

  screen.appendChild(div);

  div.querySelector('#success-done-btn').addEventListener('click', function() {
    div.remove();
    if (form) {
      form.reset();
      // Reset conditional wrappers
      form.querySelectorAll('.conditional-wrap').forEach(function(w) {
        w.classList.remove('visible');
        w.style.display = 'none';
      });
      // Re-enable submit button
      var btn = form.querySelector('.submit-btn');
      if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label || btn.textContent; }
      // Reset check-error states
      form.querySelectorAll('.check-error').forEach(function(el) {
        el.classList.remove('check-error');
      });
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
  err.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ── Offline queue ──────────────────────────────────────────────────────────────

function queueSubmission(payload) {
  try {
    var q = JSON.parse(localStorage.getItem('sher_queue') || '[]');
    q.push({ payload: payload, ts: Date.now() });
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
        return postToTMS(item.payload).then(function(ok) {
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
    var q = JSON.parse(localStorage.getItem('sher_queue') || '[]');
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
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}
