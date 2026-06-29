/* SHER Staff Portal — Guide PWA */

const SUPA_URL = 'https://hvxqettaonfxmmntrsmd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHFldHRhb25meG1tbnRyc21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDk4NDEsImV4cCI6MjA5NzI4NTg0MX0.ZwJwVIiXNwtJW5prOpnwsYjIrfpA5MSvJFYBCv_q5J0';

const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

let _user = null;
let _todayBookings = [];

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) await afterLogin(session.user);
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN') await afterLogin(session.user);
    if (event === 'SIGNED_OUT') showLoginScreen();
  });
}

async function afterLogin(user) {
  const { data: role } = await sb.rpc('get_my_role');
  if (!['guide', 'admin'].includes(role)) {
    await sb.auth.signOut();
    loginErr('Access denied. Staff account required.');
    return;
  }
  _user = user;
  document.getElementById('login-screen').hidden = true;
  document.getElementById('app').hidden = false;
  await loadTodayBookings();
  showHome();
}

function showLoginScreen() {
  document.getElementById('login-screen').hidden = false;
  document.getElementById('app').hidden = true;
}

function loginErr(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.hidden = false;
}

document.getElementById('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('login-btn');
  btn.textContent = 'Signing in…';
  btn.disabled = true;
  document.getElementById('login-error').hidden = true;
  const { error } = await sb.auth.signInWithPassword({
    email:    document.getElementById('l-email').value.trim(),
    password: document.getElementById('l-pass').value
  });
  if (error) {
    loginErr(error.message);
    btn.textContent = 'Sign in';
    btn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => sb.auth.signOut());
document.getElementById('back-btn').addEventListener('click', showHome);

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────

async function loadTodayBookings() {
  const { data } = await sb.from('bookings')
    .select('id,booking_ref,lead_name,group_size,occasion_type,special_requirements,notes,prep_instructions,prep_instructions_updated_at,lead_phone,experiences(name,departure_time)')
    .eq('booking_date', today())
    .eq('status', 'confirmed')
    .order('created_at');
  _todayBookings = data || [];
}

function today() { return new Date().toISOString().split('T')[0]; }

function _fmtRelTime(iso) {
  const d    = new Date(iso);
  const now  = new Date();
  const diff = Math.floor((now - d) / 60000); // minutes ago
  if (diff < 1)   return 'just now';
  if (diff < 60)  return diff + ' min ago';
  if (diff < 120) return '1 hour ago';
  if (diff < 480) return Math.floor(diff / 60) + ' hours ago';
  // Same day — show time
  const isToday = d.toDateString() === now.toDateString();
  const t = d.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit', hour12:true });
  return isToday ? t + ' today' : d.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) + ' at ' + t;
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

function showHome() {
  document.getElementById('screen-home').hidden = false;
  document.getElementById('screen-form').hidden = true;
  renderHome();
}

function showScreen(title, html) {
  document.getElementById('form-title').textContent = title;
  document.getElementById('form-content').innerHTML = html;
  document.getElementById('screen-home').hidden = true;
  document.getElementById('screen-form').hidden = false;
  window.scrollTo(0, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────────────────────────

function renderHome() {
  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });
  const n = _todayBookings.length;

  document.getElementById('home-content').innerHTML = `
    <div class="home-date">${dateStr}</div>

    <div class="briefing-card" onclick="openBriefing()">
      <div class="briefing-count">${n}</div>
      <div class="briefing-label">Tour${n !== 1 ? 's' : ''} Confirmed Today</div>
      <div class="briefing-tap">Tap to view briefing →</div>
    </div>

    <div class="form-cards-label">Log a form</div>
    <div class="form-cards">
      <div class="form-card" onclick="openForm('form6')">
        <div class="fc-icon">📋</div>
        <div class="fc-title">Tour Log</div>
        <div class="fc-desc">Form 6 · After each experience</div>
      </div>
      <div class="form-card" onclick="openForm('form7')">
        <div class="fc-icon">🔧</div>
        <div class="fc-title">Equipment Check</div>
        <div class="fc-desc">Form 7 · Pre-launch</div>
      </div>
      <div class="form-card" onclick="openForm('form8')">
        <div class="fc-icon">⚠️</div>
        <div class="fc-title">Incident Report</div>
        <div class="fc-desc">Form 8 · Safety events</div>
      </div>
      <div class="form-card" onclick="openForm('form9')">
        <div class="fc-icon">✅</div>
        <div class="fc-title">Post-Tour Reset</div>
        <div class="fc-desc">Form 9 · After guests depart</div>
      </div>
      <div class="form-card" onclick="openForm('medical')">
        <div class="fc-icon">🏥</div>
        <div class="fc-title">Medical Report</div>
        <div class="fc-desc">Health incidents · Nurse</div>
      </div>
      <div class="form-card" onclick="openForm('photos')">
        <div class="fc-icon">📷</div>
        <div class="fc-title">Photo Session</div>
        <div class="fc-desc">Guest brief · Photographer</div>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Briefing
// ─────────────────────────────────────────────────────────────────────────────

// Occasion → default preparation checklist
const OCCASION_PREP = {
  'Proposal':          { color:'#d4a843', icon:'💍', items:['Red rose petals on kayak deck / shore', 'Champagne + 2 chilled flutes', 'Ring presentation viewpoint identified', 'Photographer briefed and on standby'] },
  'Anniversary':       { color:'#4caf7d', icon:'🥂', items:['Champagne + 2 chilled flutes', 'Fresh flowers or rose petals', 'Romantic scenic pause planned on route'] },
  'Honeymoon':         { color:'#d4a843', icon:'🌹', items:['Champagne + 2 chilled flutes', 'Fresh tropical flowers', 'Personalised welcome note from SHER'] },
  'Birthday':          { color:'#8899ee', icon:'🎂', items:['Birthday cake or dessert arranged', 'Balloons + confetti or ribbons ready', 'Birthday song prepared', 'Surprise timing agreed with partner'] },
  'Rekindle':          { color:'#d4a843', icon:'🔥', items:['Champagne + 2 chilled flutes', 'Rose petals', 'Private scenic viewpoint pause'] },
  'Remarriage':        { color:'#4caf7d', icon:'💐', items:['Champagne + 2 chilled flutes', 'Fresh flowers', 'Celebratory ribbons or confetti'] },
  'New Life Chapter':  { color:'#4caf7d', icon:'🌟', items:['Champagne + 2 chilled flutes', 'Celebratory positive atmosphere'] },
  'Holiday / Leisure': { color:'#6baed6', icon:'🌴', items:['Fresh refreshments and snacks ready', 'Relaxed flexible pace — no rush', 'Local treats if requested by partner'] },
};

function openBriefing() {
  if (!_todayBookings.length) {
    showScreen("Today's Briefing", '<div class="empty">No confirmed tours today.</div>');
    return;
  }

  showScreen("Today's Briefing", `
    <div class="briefing-list">
      ${_todayBookings.map(b => {
        const occ  = b.occasion_type ? (OCCASION_PREP[b.occasion_type] || null) : null;
        const clr  = occ?.color || '#d4a843';
        const reqs = b.special_requirements || b.notes || '';

        return `
        <div class="briefing-item${occ ? ' has-occasion' : ''}">

          <div class="bi-top">
            <div class="bi-top-left">
              <div class="bi-ref">${b.booking_ref}</div>
              <div class="bi-name">${b.lead_name}</div>
              <div class="bi-exp">${b.experiences?.name || '—'}</div>
            </div>
            <div class="bi-top-right">
              ${b.experiences?.departure_time ? `<div class="bi-time">${b.experiences.departure_time}</div>` : ''}
              ${b.group_size ? `<div class="bi-guests">${b.group_size} guest${b.group_size !== 1 ? 's' : ''}</div>` : ''}
              ${b.lead_phone ? `<div class="bi-phone"><a href="tel:${b.lead_phone}" style="color:var(--gold)">${b.lead_phone}</a></div>` : ''}
            </div>
          </div>

          ${occ ? `
          <div class="bi-occasion-banner" style="background:${clr}18;border-color:${clr}38;color:${clr}">
            <span class="bi-occ-icon">${occ.icon}</span>
            <span class="bi-occ-label">${b.occasion_type.toUpperCase()}</span>
          </div>
          <div class="bi-prep">
            <div class="bi-prep-title">Default Preparation Checklist</div>
            <ul class="bi-prep-list">
              ${occ.items.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>` : ''}

          ${b.prep_instructions ? `
          <div class="bi-ops">
            <div class="bi-ops-title">
              <span>Operations Instructions</span>
              ${b.prep_instructions_updated_at
                ? `<span class="bi-ops-updated">Updated ${_fmtRelTime(b.prep_instructions_updated_at)}</span>`
                : ''}
            </div>
            <div class="bi-ops-text">${b.prep_instructions}</div>
          </div>` : ''}

          ${reqs ? `
          <div class="bi-special">
            <div class="bi-special-title">${occ ? "Partner's Specific Instructions" : 'Special Requirements'}</div>
            <div class="bi-special-text">${reqs}</div>
          </div>` : ''}

          ${!occ && !b.prep_instructions && !reqs ? `
          <div class="bi-no-occasion">Standard tour — no special setup required.</div>` : ''}

        </div>`;
      }).join('')}
    </div>`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Form Router
// ─────────────────────────────────────────────────────────────────────────────

function openForm(name) {
  const map = {
    form6:   ['Tour Log',           renderForm6],
    form7:   ['Equipment Check',    renderForm7],
    form8:   ['Incident Report',    renderForm8],
    form9:   ['Post-Tour Reset',    renderForm9],
    medical: ['Medical Report',     renderMedical],
    photos:  ['Photography Session',renderPhotos]
  };
  const [title, render] = map[name];
  showScreen(title, render());
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function val(id) { return (document.getElementById(id)?.value || '').trim(); }

function getRadio(name) {
  return document.querySelector(`input[name="${name}"]:checked`)?.value || '';
}

function radioGroup(name, options, def = '') {
  return `<div class="radio-group">
    ${options.map(([v, label]) => `
      <label class="radio-opt${v === def ? ' checked' : ''}">
        <input type="radio" name="${name}" value="${v}" ${v === def ? 'checked' : ''}
               onchange="this.closest('.radio-group').querySelectorAll('.radio-opt').forEach(l=>l.classList.remove('checked'));this.closest('.radio-opt').classList.add('checked')"/>
        ${label}
      </label>`).join('')}
  </div>`;
}

function bookingSelect(id) {
  if (!_todayBookings.length) {
    return `<select id="${id}" class="field-input"><option value="">No confirmed tours today</option></select>`;
  }
  return `<select id="${id}" class="field-input">
    <option value="">Select booking…</option>
    ${_todayBookings.map(b => `<option value="${b.id}">${b.booking_ref} — ${b.lead_name}</option>`).join('')}
  </select>`;
}

function eqRow(name, label) {
  return `<div class="eq-row">
    <div class="eq-label">${label}</div>
    ${radioGroup(name, [['OK','OK'],['Needs Attention','⚠ Attention'],['Out of Service','🔴 OOS']], 'OK')}
  </div>`;
}

function showResult(msgId, error, btn, label) {
  const el = document.getElementById(msgId);
  if (error) {
    el.innerHTML = `<div class="form-error">Error: ${error.message}</div>`;
    btn.disabled = false;
    btn.textContent = label;
  } else {
    el.innerHTML = `<div class="form-success">✓ Submitted successfully</div>`;
    btn.textContent = '✓ Done';
    setTimeout(showHome, 1800);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Form 6 — Tour Log
// ─────────────────────────────────────────────────────────────────────────────

function renderForm6() {
  return `<form class="staff-form" onsubmit="submitForm6(event)">
    <div class="form-field"><label>Booking</label>${bookingSelect('f6-booking')}</div>
    <div class="form-field">
      <label>Experience Delivered</label>
      <input type="text" id="f6-exp" class="field-input" placeholder="e.g. Mystic Morning Kayak"/>
    </div>
    <div class="form-field">
      <label>Sky Condition</label>
      ${radioGroup('f6-sky',[['Clear','☀ Clear'],['Partly Cloudy','⛅ Partly Cloudy'],['Overcast','☁ Overcast'],['Light Rain','🌦 Light Rain'],['Heavy Rain','⛈ Heavy Rain']])}
    </div>
    <div class="form-field">
      <label>Experience Mode</label>
      ${radioGroup('f6-mode',[['Golden Mirror','✨ Golden Mirror'],['Mystic Morning','🌫 Mystic Morning'],['Calm Reflections','🪞 Calm Reflections'],['Modified','⚡ Modified'],['Cancelled','✖ Cancelled']])}
    </div>
    <div class="form-field">
      <label>Number of Guests</label>
      <input type="number" id="f6-guests" class="field-input" min="1" placeholder="e.g. 4"/>
    </div>
    <div class="form-field">
      <label>Mystic Bundle Issued</label>
      ${radioGroup('f6-mystic',[['Yes','Yes'],['No','No'],['N/A','N/A']],'N/A')}
    </div>
    <div class="form-field">
      <label>Water Condition</label>
      ${radioGroup('f6-water',[['Calm','🪷 Calm'],['Light Chop','〜 Light Chop'],['Moderate','〰 Moderate'],['Rough','🌊 Rough']])}
    </div>
    <div class="form-field">
      <label>Wildlife Observed</label>
      <textarea id="f6-wildlife" class="field-input" rows="3" placeholder="Species, behaviour, location…"></textarea>
    </div>
    <div class="form-field">
      <label>Equipment Condition</label>
      ${radioGroup('f6-eqcond',[['All Good','✅ All Good'],['Minor Issue','⚠ Minor Issue'],['Major Issue','🔴 Major Issue']])}
    </div>
    <div class="form-field">
      <label>Equipment Notes</label>
      <textarea id="f6-eqnotes" class="field-input" rows="2" placeholder="Any defects noted…"></textarea>
    </div>
    <div class="form-field">
      <label>Guest Mood</label>
      ${radioGroup('f6-mood',[['Excellent','😊 Excellent'],['Good','🙂 Good'],['Neutral','😐 Neutral'],['Disappointed','😞 Disappointed']])}
    </div>
    <div class="form-field">
      <label>Guide Notes</label>
      <textarea id="f6-notes" class="field-input" rows="3" placeholder="Anything else to record…"></textarea>
    </div>
    <div id="f6-msg"></div>
    <button type="submit" class="submit-btn">Submit Tour Log</button>
  </form>`;
}

async function submitForm6(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled = true; btn.textContent = 'Submitting…';
  const mode = getRadio('f6-mode');
  const { error } = await sb.from('guide_morning_logs').insert({
    guide_user_id:       _user.id,
    booking_id:          val('f6-booking') || null,
    experience_delivered:val('f6-exp'),
    sky_condition:       getRadio('f6-sky'),
    experience_mode:     mode,
    number_of_guests:    val('f6-guests'),
    mystic_bundle_issued:getRadio('f6-mystic'),
    water_condition:     getRadio('f6-water'),
    wildlife_observation:val('f6-wildlife'),
    equipment_condition: getRadio('f6-eqcond'),
    equipment_notes:     val('f6-eqnotes'),
    guest_mood:          getRadio('f6-mood'),
    guide_notes:         val('f6-notes'),
    conservation_triggered: mode === 'Mystic Morning'
  });
  showResult('f6-msg', error, btn, 'Submit Tour Log');
}

// ─────────────────────────────────────────────────────────────────────────────
// Form 7 — Equipment Inspection
// ─────────────────────────────────────────────────────────────────────────────

function renderForm7() {
  return `<form class="staff-form" onsubmit="submitForm7(event)">
    <div class="form-field">
      <label>Your Name</label>
      <input type="text" id="f7-name" class="field-input" placeholder="Full name"/>
    </div>
    <div class="eq-section-title">Kayaks</div>
    ${eqRow('f7-gt01','GT-01 — Guest Tandem Kayak 1')}
    ${eqRow('f7-gt02','GT-02 — Guest Tandem Kayak 2')}
    ${eqRow('f7-lg01','LG-01 — Lead Guide Kayak')}
    ${eqRow('f7-sg01','SG-01 — Supporting Guide Kayak')}
    <div class="eq-section-title">Rescue Dinghy (RD-01)</div>
    ${eqRow('f7-rd-hull','Hull Condition')}
    ${eqRow('f7-rd-fit','Fittings')}
    ${eqRow('f7-rd-mount','Motor Mount')}
    ${eqRow('f7-rd-motor','Motor Test')}
    ${eqRow('f7-rd-bat','Battery Charge')}
    ${eqRow('f7-rd-term','Battery Terminals')}
    <div class="eq-section-title">Safety Equipment</div>
    ${eqRow('f7-pfds','PFDs — Full Fleet')}
    ${eqRow('f7-fak','First Aid Kit')}
    ${eqRow('f7-safety','Safety Equipment (general)')}
    ${eqRow('f7-comms','Communication Device')}
    ${eqRow('f7-paddles','Paddles')}
    ${eqRow('f7-refresh','Refreshment Kit')}
    <div class="eq-section-title">Site Conditions</div>
    ${eqRow('f7-bay','Bay Conditions')}
    ${eqRow('f7-launch','Launch Area')}
    <div class="form-field" style="margin-top:16px">
      <label>Inspection Notes</label>
      <textarea id="f7-notes" class="field-input" rows="3" placeholder="Flag any issues or observations…"></textarea>
    </div>
    <div id="f7-msg"></div>
    <button type="submit" class="submit-btn">Submit Inspection</button>
  </form>`;
}

async function submitForm7(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled = true; btn.textContent = 'Submitting…';
  const names = ['f7-gt01','f7-gt02','f7-lg01','f7-sg01','f7-rd-hull','f7-rd-fit',
    'f7-rd-mount','f7-rd-motor','f7-rd-bat','f7-rd-term','f7-pfds','f7-fak',
    'f7-safety','f7-comms','f7-paddles','f7-refresh','f7-bay','f7-launch'];
  const anyFlagged = names.some(n => getRadio(n) !== 'OK');
  const { error } = await sb.from('guide_equipment_inspections').insert({
    guide_user_id:        _user.id,
    guide_name:           val('f7-name'),
    inspection_date:      today(),
    kayak_gt01:           getRadio('f7-gt01'),
    kayak_gt02:           getRadio('f7-gt02'),
    kayak_lg01:           getRadio('f7-lg01'),
    kayak_sg01:           getRadio('f7-sg01'),
    rd_hull:              getRadio('f7-rd-hull'),
    rd_fittings:          getRadio('f7-rd-fit'),
    rd_motor_mount:       getRadio('f7-rd-mount'),
    rd_motor_test:        getRadio('f7-rd-motor'),
    rd_battery_charge:    getRadio('f7-rd-bat'),
    rd_battery_terminals: getRadio('f7-rd-term'),
    pfds_checked:         getRadio('f7-pfds'),
    first_aid_kit:        getRadio('f7-fak'),
    safety_equipment:     getRadio('f7-safety'),
    communication_device: getRadio('f7-comms'),
    paddles:              getRadio('f7-paddles'),
    refreshment_kit:      getRadio('f7-refresh'),
    bay_conditions:       getRadio('f7-bay'),
    launch_area:          getRadio('f7-launch'),
    any_item_flagged:     anyFlagged ? 'Yes' : 'No',
    inspection_notes:     val('f7-notes')
  });
  showResult('f7-msg', error, btn, 'Submit Inspection');
}

// ─────────────────────────────────────────────────────────────────────────────
// Form 8 — Incident Report
// ─────────────────────────────────────────────────────────────────────────────

function renderForm8() {
  return `<form class="staff-form" onsubmit="submitForm8(event)">
    <div class="form-field">
      <label>Incident Level</label>
      ${radioGroup('f8-level',[['Minor','🟡 Minor'],['Moderate','🟠 Moderate'],['Serious','🔴 Serious'],['Critical','🆘 Critical']])}
    </div>
    <div class="form-field">
      <label>Incident Type</label>
      <select id="f8-type" class="field-input">
        <option value="">Select type…</option>
        <option>Injury</option><option>Near Miss</option>
        <option>Equipment Failure</option><option>Weather</option>
        <option>Guest Medical</option><option>Security</option><option>Other</option>
      </select>
    </div>
    <div class="form-field">
      <label>Date &amp; Time</label>
      <input type="datetime-local" id="f8-dt" class="field-input"/>
    </div>
    <div class="form-field">
      <label>Your Name</label>
      <input type="text" id="f8-name" class="field-input" placeholder="Full name"/>
    </div>
    <div class="form-field">
      <label>Location</label>
      <input type="text" id="f8-loc" class="field-input" placeholder="Where did it happen?"/>
    </div>
    <div class="form-field">
      <label>Description</label>
      <textarea id="f8-desc" class="field-input" rows="4" placeholder="What exactly happened…" required></textarea>
    </div>
    <div class="form-field">
      <label>Guests Involved?</label>
      ${radioGroup('f8-guests',[['Yes','Yes'],['No','No']])}
    </div>
    <div class="form-field">
      <label>Guest Names (if applicable)</label>
      <textarea id="f8-gnames" class="field-input" rows="2" placeholder="Names of guests involved…"></textarea>
    </div>
    <div class="form-field">
      <label>Immediate Action Taken</label>
      <textarea id="f8-action" class="field-input" rows="3" placeholder="What did you do first?…"></textarea>
    </div>
    <div class="form-field">
      <label>Medical Attention</label>
      <select id="f8-med" class="field-input">
        <option value="">Select…</option>
        <option>None Required</option><option>First Aid</option>
        <option>Nurse Called</option><option>Ambulance</option><option>Hospital</option>
      </select>
    </div>
    <div class="form-field">
      <label>External Services Contacted</label>
      <textarea id="f8-ext" class="field-input" rows="2" placeholder="Emergency services, hospital…"></textarea>
    </div>
    <div id="f8-msg"></div>
    <button type="submit" class="submit-btn">Submit Incident Report</button>
  </form>`;
}

async function submitForm8(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled = true; btn.textContent = 'Submitting…';
  const { error } = await sb.from('guide_incidents').insert({
    guide_user_id:   _user.id,
    incident_level:  getRadio('f8-level'),
    incident_type:   val('f8-type'),
    incident_datetime: val('f8-dt'),
    guide_name:      val('f8-name'),
    location:        val('f8-loc'),
    description:     val('f8-desc'),
    guests_involved: getRadio('f8-guests'),
    guest_names:     val('f8-gnames'),
    immediate_action:val('f8-action'),
    medical_attention:val('f8-med'),
    external_services:val('f8-ext')
  });
  showResult('f8-msg', error, btn, 'Submit Incident Report');
}

// ─────────────────────────────────────────────────────────────────────────────
// Form 9 — Post-Tour Reset
// ─────────────────────────────────────────────────────────────────────────────

function renderForm9() {
  return `<form class="staff-form" onsubmit="submitForm9(event)">
    <div class="form-field">
      <label>Your Name</label>
      <input type="text" id="f9-name" class="field-input" placeholder="Full name"/>
    </div>
    <div class="form-field">
      <label>Experience Delivered</label>
      <input type="text" id="f9-exp" class="field-input" placeholder="e.g. Bay Serenity Kayak"/>
    </div>
    <div class="eq-section-title">Reset Checklist</div>
    <div class="eq-row">
      <div class="eq-label">Guests Returned Safely</div>
      ${radioGroup('f9-guests',[['Yes','Yes'],['No','No'],['N/A','N/A']])}
    </div>
    <div class="eq-row">
      <div class="eq-label">Equipment Stowed</div>
      ${radioGroup('f9-eq',[['Yes','Yes'],['Partial','Partial'],['No','No']])}
    </div>
    <div class="eq-row">
      <div class="eq-label">Kayaks Secured</div>
      ${radioGroup('f9-kayaks',[['Yes','Yes'],['No','No']])}
    </div>
    <div class="eq-row">
      <div class="eq-label">PFDs Stored</div>
      ${radioGroup('f9-pfds',[['Yes','Yes'],['No','No']])}
    </div>
    <div class="eq-row">
      <div class="eq-label">Launch Area Cleared</div>
      ${radioGroup('f9-launch',[['Yes','Yes'],['No','No']])}
    </div>
    <div class="eq-row">
      <div class="eq-label">Access Secured</div>
      ${radioGroup('f9-access',[['Yes','Yes'],['No','No']])}
    </div>
    <div class="form-field" style="margin-top:16px">
      <label>Guest Mood on Departure</label>
      ${radioGroup('f9-mood',[['Excellent','😊 Excellent'],['Good','🙂 Good'],['Neutral','😐 Neutral'],['Disappointed','😞 Disappointed']])}
    </div>
    <div class="form-field">
      <label>Lost Property Found?</label>
      ${radioGroup('f9-lost',[['Yes','Yes'],['No','No']])}
    </div>
    <div class="form-field">
      <label>Lost Property Description</label>
      <textarea id="f9-lostdesc" class="field-input" rows="2" placeholder="Describe item and where found…"></textarea>
    </div>
    <div class="form-field">
      <label>Guide Notes</label>
      <textarea id="f9-notes" class="field-input" rows="3" placeholder="Anything else to record…"></textarea>
    </div>
    <div id="f9-msg"></div>
    <button type="submit" class="submit-btn">Submit Post-Tour Reset</button>
  </form>`;
}

async function submitForm9(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled = true; btn.textContent = 'Submitting…';
  const { error } = await sb.from('guide_post_tour_resets').insert({
    guide_user_id:       _user.id,
    guide_name:          val('f9-name'),
    experience_delivered:val('f9-exp'),
    guests_returned:     getRadio('f9-guests'),
    equipment_stowed:    getRadio('f9-eq'),
    kayaks_secured:      getRadio('f9-kayaks'),
    pfds_stored:         getRadio('f9-pfds'),
    launch_cleared:      getRadio('f9-launch'),
    access_secured:      getRadio('f9-access'),
    guest_mood:          getRadio('f9-mood'),
    lost_property_found: getRadio('f9-lost'),
    lost_property_desc:  val('f9-lostdesc'),
    guide_notes:         val('f9-notes')
  });
  showResult('f9-msg', error, btn, 'Submit Post-Tour Reset');
}

// ─────────────────────────────────────────────────────────────────────────────
// Medical Report
// ─────────────────────────────────────────────────────────────────────────────

function renderMedical() {
  return `<form class="staff-form" onsubmit="submitMedical(event)">
    <div class="form-field">
      <label>Nurse Name</label>
      <input type="text" id="med-name" class="field-input" placeholder="Full name" required/>
    </div>
    <div class="form-field"><label>Linked Booking (if any)</label>${bookingSelect('med-booking')}</div>
    <div class="form-field">
      <label>Patient Name</label>
      <input type="text" id="med-patient" class="field-input" placeholder="Full name" required/>
    </div>
    <div class="form-field">
      <label>Patient Type</label>
      ${radioGroup('med-ptype',[['guest','Guest'],['staff','Staff'],['visitor','Visitor']])}
    </div>
    <div class="form-field">
      <label>Time of Incident</label>
      <input type="time" id="med-time" class="field-input"/>
    </div>
    <div class="form-field">
      <label>Location</label>
      <input type="text" id="med-loc" class="field-input" placeholder="Where did this occur?"/>
    </div>
    <div class="form-field">
      <label>Chief Complaint</label>
      <textarea id="med-complaint" class="field-input" rows="2" placeholder="Patient's main complaint…" required></textarea>
    </div>
    <div class="form-field">
      <label>Symptoms Observed</label>
      <textarea id="med-symp" class="field-input" rows="3" placeholder="Signs and symptoms…"></textarea>
    </div>
    <div class="form-field">
      <label>Vital Signs</label>
      <textarea id="med-vitals" class="field-input" rows="2" placeholder="BP, Pulse, SpO2, Temp…"></textarea>
    </div>
    <div class="form-field">
      <label>Relevant Medical History</label>
      <textarea id="med-hist" class="field-input" rows="2" placeholder="Known conditions, allergies, medications…"></textarea>
    </div>
    <div class="form-field">
      <label>Treatment Given</label>
      <textarea id="med-treat" class="field-input" rows="3" placeholder="Describe treatment provided…" required></textarea>
    </div>
    <div class="form-field">
      <label>Medications Administered</label>
      <textarea id="med-meds" class="field-input" rows="2" placeholder="Name, dose, route, time…"></textarea>
    </div>
    <div class="form-field">
      <label>Outcome</label>
      <select id="med-outcome" class="field-input">
        <option value="">Select outcome…</option>
        <option value="treated_on_site">Treated on Site</option>
        <option value="referred_to_clinic">Referred to Clinic</option>
        <option value="hospitalized">Hospitalized</option>
        <option value="no_action_required">No Action Required</option>
        <option value="other">Other</option>
      </select>
    </div>
    <div class="form-field">
      <label>Outcome Notes</label>
      <textarea id="med-outnotes" class="field-input" rows="2" placeholder="Additional outcome details…"></textarea>
    </div>
    <div class="form-field">
      <label>Follow-up Required?</label>
      ${radioGroup('med-fu',[['yes','Yes'],['no','No']],'no')}
    </div>
    <div class="form-field">
      <label>Follow-up Notes</label>
      <textarea id="med-funotes" class="field-input" rows="2" placeholder="What follow-up is needed?…"></textarea>
    </div>
    <div class="form-field">
      <label>External Services Contacted</label>
      <textarea id="med-ext" class="field-input" rows="2" placeholder="Ambulance, hospital, emergency contact…"></textarea>
    </div>
    <div class="form-field">
      <label>Nurse Notes</label>
      <textarea id="med-notes" class="field-input" rows="3" placeholder="Additional clinical notes…"></textarea>
    </div>
    <div id="med-msg"></div>
    <button type="submit" class="submit-btn">Submit Medical Report</button>
  </form>`;
}

async function submitMedical(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled = true; btn.textContent = 'Submitting…';
  const { error } = await sb.from('medical_reports').insert({
    nurse_user_id:           _user.id,
    nurse_name:              val('med-name'),
    booking_id:              val('med-booking') || null,
    patient_name:            val('med-patient'),
    patient_type:            getRadio('med-ptype'),
    date_of_incident:        today(),
    time_of_incident:        val('med-time'),
    location:                val('med-loc'),
    chief_complaint:         val('med-complaint'),
    symptoms:                val('med-symp'),
    vital_signs:             val('med-vitals'),
    medical_history_relevant:val('med-hist'),
    treatment_given:         val('med-treat'),
    medications_administered:val('med-meds'),
    outcome:                 val('med-outcome') || null,
    outcome_notes:           val('med-outnotes'),
    follow_up_required:      getRadio('med-fu') === 'yes',
    follow_up_notes:         val('med-funotes'),
    external_services:       val('med-ext'),
    nurse_notes:             val('med-notes')
  });
  showResult('med-msg', error, btn, 'Submit Medical Report');
}

// ─────────────────────────────────────────────────────────────────────────────
// Photography Session
// ─────────────────────────────────────────────────────────────────────────────

function renderPhotos() {
  return `<form class="staff-form" onsubmit="submitPhotos(event)">
    <div class="form-field"><label>Linked Booking</label>${bookingSelect('ph-booking')}</div>
    <div class="eq-section-title">Guest Profile</div>
    <div class="form-field">
      <label>Guest Names</label>
      <input type="text" id="ph-guests" class="field-input" placeholder="Full names of subjects" required/>
    </div>
    <div class="form-field">
      <label>Where Are They From?</label>
      <input type="text" id="ph-origin" class="field-input" placeholder="Country, city…"/>
    </div>
    <div class="form-field">
      <label>How They Found SHER</label>
      <input type="text" id="ph-found" class="field-input" placeholder="Instagram, hotel referral, word of mouth…"/>
    </div>
    <div class="form-field">
      <label>Group Composition</label>
      ${radioGroup('ph-group',[['Couple','💑 Couple'],['Family','👨‍👩‍👧 Family'],['Solo','🧍 Solo'],['Group','👥 Group']])}
    </div>
    <div class="eq-section-title">Occasion</div>
    <div class="form-field">
      <label>Occasion Type</label>
      <select id="ph-occ" class="field-input">
        <option value="">Select occasion…</option>
        <option>Proposal</option><option>Anniversary</option><option>Honeymoon</option>
        <option>Birthday</option><option>Rekindle</option><option>Remarriage</option>
        <option>New Life Chapter</option><option>Holiday / Leisure</option><option>Other</option>
      </select>
    </div>
    <div class="form-field">
      <label>Their Story / Context</label>
      <textarea id="ph-story" class="field-input" rows="3" placeholder="How long together, significance of this trip…"></textarea>
    </div>
    <div class="form-field">
      <label>Mood / Tone</label>
      ${radioGroup('ph-mood',[['Romantic','💫 Romantic'],['Adventurous','🌿 Adventurous'],['Serene','🕊 Serene'],['Playful','✨ Playful'],['Dramatic','🎭 Dramatic']])}
    </div>
    <div class="eq-section-title">Preferences</div>
    <div class="form-field">
      <label>Photography Style</label>
      ${radioGroup('ph-style',[['Candid','🎞 Candid'],['Posed','🖼 Posed'],['Documentary','📖 Documentary'],['Mixed','🔀 Mixed']])}
    </div>
    <div class="form-field">
      <label>Must-Have Shots</label>
      <textarea id="ph-must" class="field-input" rows="3" placeholder="Non-negotiable shots they absolutely need…"></textarea>
    </div>
    <div class="form-field">
      <label>Anything to Avoid</label>
      <textarea id="ph-avoid" class="field-input" rows="2" placeholder="Angles, poses, or content to exclude…"></textarea>
    </div>
    <div class="form-field">
      <label>Special Props / Items</label>
      <textarea id="ph-props" class="field-input" rows="2" placeholder="Ring box, flowers, signage, champagne…"></textarea>
    </div>
    <div class="eq-section-title">Shot List</div>
    <div class="form-field">
      <label>Full Shot List</label>
      <textarea id="ph-shots" class="field-input" rows="7" placeholder="1. Arrival at launch site&#10;2. Pre-launch moment&#10;3. On the water — wide&#10;4. Intimate close — paddling together&#10;5. …"></textarea>
    </div>
    <div class="eq-section-title">Delivery</div>
    <div class="form-field">
      <label>Delivery Format</label>
      ${radioGroup('ph-fmt',[['digital_download','💻 Digital Download'],['usb','💾 USB'],['both','Both'],['print_package','🖨 Print Package']])}
    </div>
    <div class="form-field">
      <label>Delivery Deadline</label>
      <input type="text" id="ph-deadline" class="field-input" placeholder="e.g. Within 7 days, Before departure…"/>
    </div>
    <div class="form-field">
      <label>Delivery Notes</label>
      <textarea id="ph-delivery" class="field-input" rows="2" placeholder="Email address, format, resolution…"></textarea>
    </div>
    <div class="form-field">
      <label>Photographer Notes</label>
      <textarea id="ph-notes" class="field-input" rows="3" placeholder="Any other notes for this session…"></textarea>
    </div>
    <div id="ph-msg"></div>
    <button type="submit" class="submit-btn">Save Session Brief</button>
  </form>`;
}

async function submitPhotos(e) {
  e.preventDefault();
  const btn = e.target.querySelector('.submit-btn');
  btn.disabled = true; btn.textContent = 'Saving…';
  const { error } = await sb.from('photography_sessions').insert({
    photographer_user_id:_user.id,
    booking_id:          val('ph-booking') || null,
    guest_names:         val('ph-guests'),
    guest_origin:        val('ph-origin'),
    how_they_found_sher: val('ph-found'),
    group_composition:   getRadio('ph-group'),
    occasion:            val('ph-occ'),
    occasion_details:    val('ph-story'),
    mood_tone:           getRadio('ph-mood'),
    style_preferences:   getRadio('ph-style'),
    must_have_shots:     val('ph-must'),
    avoid:               val('ph-avoid'),
    special_props:       val('ph-props'),
    shot_list:           val('ph-shots'),
    delivery_format:     getRadio('ph-fmt') || null,
    delivery_deadline:   val('ph-deadline'),
    delivery_notes:      val('ph-delivery'),
    photographer_notes:  val('ph-notes')
  });
  showResult('ph-msg', error, btn, 'Save Session Brief');
}

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

init();
