/* ── SHER Partner Portal app.js ── */
'use strict';

const SUPA_URL = 'https://hvxqettaonfxmmntrsmd.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHFldHRhb25meG1tbnRyc21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDk4NDEsImV4cCI6MjA5NzI4NTg0MX0.ZwJwVIiXNwtJW5prOpnwsYjIrfpA5MSvJFYBCv_q5J0';

const sb = window.supabase.createClient(SUPA_URL, SUPA_ANON);

/* ── State ── */
let _role       = null;  // 'partner' | 'concierge'
let _partnerId  = null;
let _conciergeId = null;
let _partnerData  = null;   // row from partners table
let _conciergeData = null;  // row from concierges table
let _experiences  = [];
let _activePanel  = null;

/* ── Helpers ── */
const $  = id  => document.getElementById(id);
const el = tag => document.createElement(tag);

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function fmtDate(s) {
  if (!s) return '—';
  const d = new Date(s);
  return d.toLocaleDateString('en-LC', { day:'numeric', month:'short', year:'numeric' });
}

function fmtMoney(n) {
  if (n == null) return '—';
  return 'USD ' + Number(n).toFixed(2);
}

function fmtXCD(n) {
  if (n == null) return '—';
  return 'XCD ' + Number(n).toFixed(2);
}

function statusClass(s) {
  const map = {
    pending:'status-pending', confirmed:'status-confirmed',
    completed:'status-completed', cancelled:'status-cancelled',
    enquiry:'status-enquiry', balance_due:'status-balance_due',
    paid_in_full:'status-paid_in_full', no_show:'status-no_show',
  };
  return map[s] || 'status-enquiry';
}

function tierClass(t) {
  if (t === 'elite')     return 'tier-elite';
  if (t === 'preferred') return 'tier-preferred';
  return 'tier-standard';
}

/* ── Screen helpers ── */
function showScreen(id) {
  ['login-screen','forgot-screen','newpass-screen'].forEach(s => {
    $(s).hidden = (s !== id);
  });
}

/* ── Password recovery: detect reset link on page load ── */
sb.auth.onAuthStateChange(async (event, session) => {
  if (event === 'PASSWORD_RECOVERY') {
    showScreen('newpass-screen');
  }
});

/* ── Forgot password link ── */
$('forgot-link').addEventListener('click', e => {
  e.preventDefault();
  $('f-email').value = $('l-email').value || '';
  showScreen('forgot-screen');
});

$('back-to-login').addEventListener('click', e => {
  e.preventDefault();
  showScreen('login-screen');
});

/* ── Forgot password form ── */
$('forgot-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn  = $('forgot-btn');
  const msg  = $('forgot-msg');
  msg.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Sending…';

  const { error } = await sb.auth.resetPasswordForEmail(
    $('f-email').value.trim(),
    { redirectTo: 'https://partners.shersanctuary.com' }
  );

  if (error) {
    msg.textContent = error.message;
    msg.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Send reset link';
    return;
  }

  msg.style.color = 'var(--green)';
  msg.textContent = 'Reset link sent — check your email.';
  msg.hidden = false;
  btn.disabled = false;
  btn.textContent = 'Send reset link';
});

/* ── New password form ── */
$('newpass-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn  = $('newpass-btn');
  const msg  = $('newpass-msg');
  msg.hidden = true;

  const pass    = $('np-pass').value;
  const confirm = $('np-confirm').value;

  if (pass !== confirm) {
    msg.textContent = 'Passwords do not match.';
    msg.hidden = false;
    return;
  }
  if (pass.length < 8) {
    msg.textContent = 'Password must be at least 8 characters.';
    msg.hidden = false;
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Saving…';

  const { error } = await sb.auth.updateUser({ password: pass });

  if (error) {
    msg.textContent = error.message;
    msg.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Set new password';
    return;
  }

  // Password updated — boot the app
  await bootApp();
});

/* ── Auth ── */
$('login-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn  = $('login-btn');
  const errEl = $('login-error');
  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const { data, error } = await sb.auth.signInWithPassword({
    email:    $('l-email').value.trim(),
    password: $('l-pass').value,
  });

  if (error) {
    errEl.textContent = error.message;
    errEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Sign in';
    return;
  }

  await bootApp();
});

$('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  location.reload();
});

async function bootApp() {
  try {
    const { data: roleData } = await sb.rpc('get_my_role');
    _role = roleData;

    if (!['partner','concierge'].includes(_role)) {
      await sb.auth.signOut();
      showLoginError('Access denied — this portal is for partners and concierges only.');
      return;
    }

    if (_role === 'partner') {
      const { data: pid } = await sb.rpc('get_my_partner_id');
      _partnerId = pid;
      const { data: pdata } = await sb
        .from('partners')
        .select('id,name,contact_name,commission_tier,commission_rate,confirmation_mode,trusted_since')
        .eq('id', _partnerId)
        .single();
      _partnerData = pdata;
      $('header-title').textContent = _partnerData?.name || 'Partner Portal';
    }

    if (_role === 'concierge') {
      const { data: cid } = await sb.rpc('get_my_concierge_id');
      _conciergeId = cid;
      const { data: cdata } = await sb
        .from('concierges')
        .select('id,first_name,last_name,partner_id,ripples_balance,ripples_earned_total,ripples_redeemed_total,is_independent_operator')
        .eq('id', _conciergeId)
        .single();
      _conciergeData = cdata;
      _partnerId = _conciergeData?.partner_id;
      $('header-title').textContent =
        [_conciergeData?.first_name, _conciergeData?.last_name].filter(Boolean).join(' ') || 'Concierge';
    }

    renderRoleBadge();
    renderTabBar();
    $('login-screen').hidden = true;
    $('app').hidden = false;
    switchTab('experiences');

  } catch (err) {
    await sb.auth.signOut();
    showLoginError('Could not load your profile. Please try again.');
    console.error(err);
  }
}

function showLoginError(msg) {
  const errEl = $('login-error');
  errEl.textContent = msg;
  errEl.hidden = false;
  $('login-btn').disabled = false;
  $('login-btn').textContent = 'Sign in';
}

/* ── Role badge ── */
function renderRoleBadge() {
  const bar = $('role-badge-bar');
  if (_role === 'partner') {
    const tier  = _partnerData?.commission_tier || 'standard';
    const rate  = _partnerData?.commission_rate  || '12.00';
    const trusted = _partnerData?.confirmation_mode === 'trusted';
    bar.innerHTML =
      `<span class="tier-badge ${tierClass(tier)}">${esc(tier)} · ${rate}%</span>` +
      (trusted ? '<span class="trust-badge">Trusted Partner</span>' : '');
  } else {
    const bal = _conciergeData?.ripples_balance || 0;
    bar.innerHTML =
      `<span class="ripples-mini">${bal} Ripples <span>available</span></span>`;
  }
}

/* ── Tab bar ── */
const PARTNER_TABS    = [
  { id:'experiences', label:'Experiences' },
  { id:'book',        label:'New Booking' },
  { id:'bookings',    label:'Bookings'    },
  { id:'earn',        label:'Commission'  },
  { id:'action',      label:'Payouts'     },
];
const CONCIERGE_TABS_BASE = [
  { id:'bookings', label:'My Bookings' },
  { id:'earn',     label:'My Ripples'  },
  { id:'action',   label:'Redeem'      },
];
const CONCIERGE_TABS_OPERATOR = [
  { id:'experiences', label:'Experiences'  },
  { id:'book',        label:'New Booking'  },
  { id:'bookings',    label:'My Bookings'  },
  { id:'earn',        label:'My Ripples'   },
  { id:'action',      label:'Redeem'       },
];

function renderTabBar() {
  let tabs;
  if (_role === 'partner') {
    tabs = PARTNER_TABS;
  } else {
    tabs = _conciergeData?.is_independent_operator
      ? CONCIERGE_TABS_OPERATOR
      : CONCIERGE_TABS_BASE;
  }
  const bar  = $('tab-bar');
  bar.innerHTML = '';
  tabs.forEach(t => {
    const btn = el('button');
    btn.className = 'tab';
    btn.dataset.panel = t.id;
    btn.textContent   = t.label;
    btn.addEventListener('click', () => switchTab(t.id));
    bar.appendChild(btn);
  });
}

function switchTab(panelId) {
  // Hide all panels
  ['experiences','book','bookings','earn','action'].forEach(id => {
    $('panel-' + id).hidden = true;
  });
  // Deactivate tabs
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));

  // Show target
  $('panel-' + panelId).hidden = false;
  _activePanel = panelId;

  const btn = document.querySelector(`.tab[data-panel="${panelId}"]`);
  if (btn) btn.classList.add('active');

  // Load content
  switch (panelId) {
    case 'experiences': loadExperiencesTab();  break;
    case 'book':        loadBookTab();          break;
    case 'bookings':    loadBookingsTab();      break;
    case 'earn':        _role === 'partner' ? loadCommissionTab() : loadRipplesTab(); break;
    case 'action':      _role === 'partner' ? loadPayoutsTab()    : loadRedeemTab();  break;
  }
}

/* ════════════════════════════════════════════════════════
   EXPERIENCES TAB
════════════════════════════════════════════════════════ */
async function loadExperiencesTab() {
  const cont = $('content-experiences');
  cont.innerHTML = '<p class="empty">Loading experiences…</p>';

  const { data, error } = await sb
    .from('experiences')
    .select('id,name,category,public_price_usd,max_capacity,departure_time,duration_minutes,status,ripples_awarded,is_parent')
    .in('status', ['live','coming_soon'])
    .order('status', { ascending:true })
    .order('name', { ascending:true });

  if (error || !data?.length) {
    cont.innerHTML = `<p class="empty">${error ? 'Could not load experiences: ' + esc(error.message) : 'No experiences available right now.'}</p>`;
    return;
  }

  _experiences = data;

  cont.innerHTML =
    '<p class="panel-subtitle">Live &amp; Coming Soon</p>' +
    '<div class="exp-grid">' +
    data.map(exp => `
      <div class="exp-card${exp.status === 'coming_soon' ? ' coming-soon' : ''}">
        <div class="exp-top">
          <div class="exp-name">${esc(exp.name)}</div>
          <span class="exp-badge ${exp.status === 'live' ? 'badge-live' : 'badge-soon'}">
            ${exp.status === 'live' ? 'Live' : 'Coming Soon'}
          </span>
        </div>
        <div class="exp-meta">
          ${exp.category ? `<span class="exp-meta-item">${esc(exp.category)}</span>` : ''}
          ${exp.departure_time ? `<span class="exp-meta-item">Departs ${esc(exp.departure_time)}</span>` : ''}
          ${exp.duration_minutes ? `<span class="exp-meta-item">${exp.duration_minutes} min</span>` : ''}
          ${exp.max_capacity ? `<span class="exp-meta-item">Max ${exp.max_capacity} guests</span>` : ''}
          ${exp.ripples_awarded ? `<span class="exp-meta-item">${exp.ripples_awarded} Ripples</span>` : ''}
        </div>
        <div class="exp-price">
          USD ${Number(exp.public_price_usd || 0).toFixed(0)}<small class="exp-price-note"> per person</small>
        </div>
        ${exp.status === 'live' ? `
          <button class="book-btn" onclick="preSelectExperience('${exp.id}')">
            Book this experience
          </button>` : ''}
      </div>
    `).join('') +
    '</div>';
}

function preSelectExperience(expId) {
  switchTab('book');
  setTimeout(() => {
    const sel = document.getElementById('bf-exp');
    if (sel) { sel.value = expId; }
  }, 80);
}

/* ════════════════════════════════════════════════════════
   NEW BOOKING TAB
════════════════════════════════════════════════════════ */
async function loadBookTab() {
  const cont = $('content-book');
  const liveExps = _experiences.filter(e => e.status === 'live');

  // Fetch property concierges for attribution dropdown (partner login only)
  let conciergeOptions = '';
  if (_role === 'partner' && _partnerId) {
    const { data: concs } = await sb
      .from('concierges')
      .select('id, first_name, last_name')
      .eq('partner_id', _partnerId)
      .eq('status', 'active')
      .order('first_name');
    if (concs?.length) {
      conciergeOptions = concs.map(c =>
        `<option value="${c.id}">${esc(c.first_name)} ${esc(c.last_name)}</option>`
      ).join('');
    }
  }

  const agentSection = _role === 'partner' ? `
      <p class="section-title">Concierge Attribution</p>
      <div class="form-field">
        <label>Referred / Handled by Agent</label>
        <select id="bf-concierge" class="field-input">
          <option value="">— Direct booking (no agent) —</option>
          ${conciergeOptions}
        </select>
        <span class="field-hint">Select the concierge who referred or is handling this guest. Their Ripples will be credited automatically on confirmation.</span>
      </div>` : '';

  cont.innerHTML = `
    <p class="panel-subtitle">Submit a Booking Request</p>

    <div id="book-result"></div>

    <form id="booking-form">

      <p class="section-title">Experience &amp; Date</p>

      <div class="form-field">
        <label>Experience *</label>
        <select id="bf-exp" class="field-input" required>
          <option value="">— Select experience —</option>
          ${liveExps.map(e =>
            `<option value="${e.id}">${esc(e.name)} — USD ${Number(e.public_price_usd||0).toFixed(0)} pp</option>`
          ).join('')}
        </select>
      </div>

      <div class="form-field">
        <label>Preferred Date *</label>
        <input type="date" id="bf-date" class="field-input" required
          min="${new Date().toISOString().split('T')[0]}"/>
      </div>

      <div class="form-field">
        <label>Number of Guests *</label>
        <select id="bf-guests" class="field-input" required>
          <option value="">— Select —</option>
          ${[...Array(12)].map((_,i) =>
            `<option value="${i+1}">${i+1} guest${i ? 's' : ''}</option>`
          ).join('')}
        </select>
      </div>

      <p class="section-title">Lead Guest Details</p>

      <div class="form-field">
        <label>Full Name *</label>
        <input type="text" id="bf-name" class="field-input"
          placeholder="Guest's full name" required/>
      </div>

      <div class="form-field">
        <label>Email *</label>
        <input type="email" id="bf-email" class="field-input"
          placeholder="guest@example.com" required/>
      </div>

      <div class="form-field">
        <label>Phone</label>
        <input type="tel" id="bf-phone" class="field-input" placeholder="+1 758 …"/>
      </div>

      <div class="form-field">
        <label>Country / Hotel</label>
        <input type="text" id="bf-country" class="field-input"
          placeholder="Country of origin or hotel name"/>
      </div>

      <p class="section-title">Occasion &amp; Notes</p>

      <div class="form-field">
        <label>Occasion Type</label>
        <select id="bf-occasion" class="field-input">
          <option value="">— None / Standard —</option>
          <option value="honeymoon">Honeymoon</option>
          <option value="proposal">Proposal</option>
          <option value="anniversary">Anniversary</option>
          <option value="birthday">Birthday</option>
          <option value="family">Family celebration</option>
          <option value="other">Other special occasion</option>
        </select>
      </div>

      <div class="form-field">
        <label>Special Requirements</label>
        <textarea id="bf-notes" class="field-input" rows="3"
          placeholder="Dietary needs, accessibility, special requests…"></textarea>
      </div>

      ${agentSection}

      <button type="submit" class="submit-btn" id="bf-submit">Submit Booking Request</button>
    </form>
  `;

  document.getElementById('booking-form').addEventListener('submit', submitBooking);
}

async function submitBooking(e) {
  e.preventDefault();
  const btn = $('bf-submit');
  const res = $('book-result');
  btn.disabled = true;
  btn.textContent = 'Submitting…';
  res.innerHTML = '';

  const expId    = $('bf-exp').value;
  const dateVal  = $('bf-date').value;
  const guests   = parseInt($('bf-guests').value);
  const leadName = $('bf-name').value.trim();
  const email    = $('bf-email').value.trim();
  const phone    = $('bf-phone').value.trim();
  const country  = $('bf-country').value.trim();
  const occasion = $('bf-occasion').value;
  const notes    = $('bf-notes').value.trim();

  if (!expId || !dateVal || !guests || !leadName || !email) {
    res.innerHTML = '<div class="form-error">Please fill in all required fields.</div>';
    btn.disabled = false;
    btn.textContent = 'Submit Booking Request';
    return;
  }

  const exp = _experiences.find(x => x.id === expId);

  const payload = {
    experience_id:    expId,
    partner_id:       _partnerId,
    source:           'partner',
    booking_date:     dateVal,
    group_size:       guests,
    lead_name:        leadName,
    lead_email:       email,
    lead_phone:       phone || null,
    nationality:      country || null,
    occasion_type:    occasion || null,
    special_requirements: notes || null,
  };

  if (_role === 'concierge' && _conciergeId) {
    payload.concierge_id = _conciergeId;
  } else if (_role === 'partner') {
    const agentEl = $('bf-concierge');
    if (agentEl?.value) payload.concierge_id = agentEl.value;
  }

  const { error } = await sb.from('bookings').insert([payload]);

  if (error) {
    res.innerHTML = `<div class="form-error">Could not submit booking: ${esc(error.message)}</div>`;
    btn.disabled = false;
    btn.textContent = 'Submit Booking Request';
    return;
  }

  res.innerHTML = `
    <div class="form-success">
      Booking request submitted for <strong>${esc(leadName)}</strong>.<br/>
      Experience: ${esc(exp?.name || '')} · ${guests} guest${guests > 1 ? 's' : ''} · ${fmtDate(dateVal)}
    </div>`;

  // Reset form
  document.getElementById('booking-form').reset();
  btn.disabled = false;
  btn.textContent = 'Submit Booking Request';
}

/* ════════════════════════════════════════════════════════
   BOOKINGS / MY BOOKINGS TAB
════════════════════════════════════════════════════════ */
async function loadBookingsTab() {
  const cont  = $('content-bookings');
  const title = _role === 'partner' ? 'All Property Bookings' : 'My Bookings';
  cont.innerHTML = `<p class="panel-subtitle">${title}</p><p class="empty">Loading…</p>`;

  // For concierge view, join ripples_ledger to show Ripples earned per booking
  const selectCols = _role === 'concierge'
    ? `id, booking_ref, status, booking_date, group_size,
       lead_name, occasion_type,
       experiences(name, public_price_usd, ripples_awarded),
       ripples_ledger(ripples_awarded, created_at)`
    : `id, booking_ref, status, booking_date, group_size,
       lead_name, lead_email, created_at, occasion_type, source,
       experiences(name)`;

  let query = sb
    .from('bookings')
    .select(selectCols)
    .order('booking_date', { ascending: false })
    .limit(50);

  if (_role === 'concierge') {
    query = query.eq('concierge_id', _conciergeId);
  }

  const { data, error } = await query;

  if (error) {
    cont.innerHTML = `<p class="panel-subtitle">${title}</p>
      <div class="form-error">Could not load bookings: ${esc(error.message)}</div>`;
    return;
  }

  if (!data?.length) {
    cont.innerHTML = `<p class="panel-subtitle">${title}</p>
      <p class="empty">No bookings yet.</p>`;
    return;
  }

  const cards = data.map(bk => {
    const baseCard = `
      <div class="booking-card">
        <div class="bk-top">
          <span class="bk-ref">${esc(bk.booking_ref || '')}</span>
          <span class="status-badge ${statusClass(bk.status)}">${esc(bk.status).replace('_',' ')}</span>
        </div>
        <div class="bk-name">${esc(bk.lead_name)}</div>
        <div class="bk-exp">${esc(bk.experiences?.name || '—')}</div>
        <div class="bk-date">
          ${bk.booking_date ? fmtDate(bk.booking_date) : 'Date TBC'} · ${bk.group_size} guest${bk.group_size > 1 ? 's' : ''}
          ${bk.occasion_type ? ` · ${esc(bk.occasion_type)}` : ''}
        </div>`;

    if (_role === 'concierge') {
      const pricePerPerson = bk.experiences?.public_price_usd;
      const totalValue     = pricePerPerson ? (Number(pricePerPerson) * bk.group_size) : null;
      // ripples_ledger is 1-to-many; grab first matching row for this concierge
      const rippleRow = Array.isArray(bk.ripples_ledger) ? bk.ripples_ledger[0] : bk.ripples_ledger;
      const ripples   = rippleRow?.ripples_awarded ?? null;

      return baseCard + `
        <div class="bk-rate-row">
          ${pricePerPerson != null ? `<span class="bk-rate">USD ${Number(pricePerPerson).toFixed(0)} pp</span>` : ''}
          ${totalValue    != null ? `<span class="bk-total">Total: USD ${Number(totalValue).toFixed(0)}</span>` : ''}
          ${ripples       != null
            ? `<span class="bk-ripples ripples-earned">+${ripples} Ripples${bk.status === 'confirmed' ? '' : ' (pending)'}</span>`
            : `<span class="bk-ripples ripples-pending">Ripples on confirmation</span>`}
        </div>
      </div>`;
    }

    return baseCard + '</div>';
  }).join('');

  cont.innerHTML =
    `<p class="panel-subtitle">${title} (${data.length})</p>` +
    '<div class="booking-list">' + cards + '</div>';
}

/* ════════════════════════════════════════════════════════
   COMMISSION TAB  (partner only)
════════════════════════════════════════════════════════ */
async function loadCommissionTab() {
  const cont = $('content-earn');
  cont.innerHTML = '<p class="panel-subtitle">Commission Dashboard</p><p class="empty">Loading…</p>';

  const { data, error } = await sb
    .from('commissions')
    .select('id, booking_id, amount_usd, status, created_at, bookings(booking_ref, lead_name, booking_date)')
    .eq('partner_id', _partnerId)
    .order('created_at', { ascending:false })
    .limit(60);

  if (error) {
    cont.innerHTML = `<p class="panel-subtitle">Commission Dashboard</p>
      <div class="form-error">Could not load commissions: ${esc(error.message)}</div>`;
    return;
  }

  const rows   = data || [];
  const tier   = _partnerData?.commission_tier  || 'standard';
  const rate   = _partnerData?.commission_rate   || '12.00';
  const trusted = _partnerData?.confirmation_mode === 'trusted';

  const pending  = rows.filter(r => r.status === 'pending').reduce((a,r) => a + Number(r.amount_usd||0), 0);
  const approved = rows.filter(r => r.status === 'approved').reduce((a,r) => a + Number(r.amount_usd||0), 0);
  const paid     = rows.filter(r => r.status === 'paid').reduce((a,r) => a + Number(r.amount_usd||0), 0);

  cont.innerHTML = `
    <p class="panel-subtitle">Commission Dashboard</p>

    <div class="comm-tier-card">
      <div class="ctc-left">
        <div class="ctc-label">Your Tier</div>
        <div class="ctc-tier">${esc(tier.charAt(0).toUpperCase()+tier.slice(1))}</div>
        ${trusted ? '<div style="font-size:12px;color:var(--green);margin-top:3px">Trusted Partner</div>' : ''}
      </div>
      <div style="text-align:right">
        <div class="ctc-rate">${rate}%</div>
        <div class="ctc-rate-label">commission rate</div>
      </div>
    </div>

    <div class="comm-summary">
      <div class="comm-card">
        <div class="cc-label">Pending</div>
        <div class="cc-value">${fmtMoney(pending)}</div>
        <div class="cc-sub">awaiting approval</div>
      </div>
      <div class="comm-card">
        <div class="cc-label">Approved</div>
        <div class="cc-value">${fmtMoney(approved)}</div>
        <div class="cc-sub">due next payout</div>
      </div>
      <div class="comm-card full">
        <div class="cc-label">Total Paid</div>
        <div class="cc-value">${fmtMoney(paid)}</div>
        <div class="cc-sub">all time</div>
      </div>
    </div>

    <div style="margin:0 0 10px">
      <p class="panel-subtitle" style="margin-top:0">Commission History</p>
      <div class="comm-list">
        ${rows.length ? rows.map(r => `
          <div class="comm-row">
            <div class="cr-left">
              <div class="cr-ref">${esc(r.bookings?.booking_ref || '')}</div>
              <div class="cr-name">${esc(r.bookings?.lead_name || '—')}</div>
              <div class="cr-date">${fmtDate(r.created_at)}</div>
            </div>
            <div class="cr-right">
              <div class="cr-amount">${fmtMoney(r.amount_usd)}</div>
              <div class="cr-status">${esc(r.status)}</div>
            </div>
          </div>
        `).join('') : '<p class="empty" style="padding:24px 0">No commissions yet.</p>'}
      </div>
    </div>

    <p style="font-size:12px;color:var(--muted);margin-top:16px;padding:12px;background:var(--surface);border-radius:8px">
      Commission tiers: Standard 12% (1–5 bookings/month), Preferred 15% (6–12),
      Elite 18% (13+). Tier is locked at the start of each month based on the
      previous month's volume.
    </p>
  `;
}

/* ════════════════════════════════════════════════════════
   PAYOUTS TAB  (partner only)
════════════════════════════════════════════════════════ */
async function loadPayoutsTab() {
  const cont = $('content-action');
  cont.innerHTML = '<p class="panel-subtitle">Payout History</p><p class="empty">Loading…</p>';

  const { data, error } = await sb
    .from('payouts')
    .select('id, payout_amount_usd, payout_method, reference, paid_at, notes')
    .eq('partner_id', _partnerId)
    .order('paid_at', { ascending:false });

  if (error) {
    cont.innerHTML = `<p class="panel-subtitle">Payout History</p>
      <div class="form-error">Could not load payouts: ${esc(error.message)}</div>`;
    return;
  }

  if (!data?.length) {
    cont.innerHTML = `<p class="panel-subtitle">Payout History</p>
      <p class="empty">No payouts on record yet.</p>`;
    return;
  }

  cont.innerHTML =
    `<p class="panel-subtitle">Payout History (${data.length})</p>` +
    '<div class="payout-list">' +
    data.map(p => `
      <div class="payout-row">
        <div>
          <div class="pr-amount">${fmtMoney(p.payout_amount_usd)}</div>
          <div class="pr-date">${fmtDate(p.paid_at)}</div>
          <div class="pr-method">${esc(p.payout_method || '—')}</div>
          ${p.reference ? `<div class="pr-ref">Ref: ${esc(p.reference)}</div>` : ''}
        </div>
      </div>
    `).join('') +
    '</div>';
}

/* ════════════════════════════════════════════════════════
   MY RIPPLES TAB  (concierge only)
════════════════════════════════════════════════════════ */
async function loadRipplesTab() {
  const cont = $('content-earn');
  cont.innerHTML = '<p class="panel-subtitle">My Ripples</p><p class="empty">Loading…</p>';

  const { data: ledger, error } = await sb
    .from('ripples_ledger')
    .select('id, ripples_delta, balance_after, notes, created_at, bookings(booking_ref, experiences(name))')
    .eq('concierge_id', _conciergeId)
    .order('created_at', { ascending:false })
    .limit(40);

  if (error) {
    cont.innerHTML = `<p class="panel-subtitle">My Ripples</p>
      <div class="form-error">Could not load Ripples: ${esc(error.message)}</div>`;
    return;
  }

  // Refresh balance from concierges row
  const { data: cdata } = await sb
    .from('concierges')
    .select('ripples_balance,ripples_earned_total,ripples_redeemed_total')
    .eq('id', _conciergeId)
    .single();

  if (cdata) {
    _conciergeData = { ..._conciergeData, ...cdata };
    renderRoleBadge();
  }

  const bal     = _conciergeData?.ripples_balance     || 0;
  const earned  = _conciergeData?.ripples_earned_total || 0;
  const redeemed = _conciergeData?.ripples_redeemed_total || 0;

  cont.innerHTML = `
    <div class="ripples-hero">
      <div class="rh-label">SHER Ripples Balance</div>
      <div class="rh-balance">${bal}</div>
      <div class="rh-unit">Ripples available</div>
      <div class="rh-sub">
        <div class="rh-stat">
          <div class="rh-stat-val">${earned}</div>
          <div class="rh-stat-lbl">Earned total</div>
        </div>
        <div class="rh-stat">
          <div class="rh-stat-val">${redeemed}</div>
          <div class="rh-stat-lbl">Redeemed</div>
        </div>
      </div>
    </div>

    <p style="font-size:12px;color:var(--muted);padding:12px;background:var(--surface);border-radius:8px;margin-bottom:20px">
      Earn Ripples every time a guest you book completes their tour:
      Bay Kayak 50 pts · Canoe 100 pts · Proposal/Occasion 150 pts · Cultural 50 pts.
      Redeem from the Redeem tab.
    </p>

    <p class="panel-subtitle" style="margin-top:0">Transaction History</p>
    <div class="ledger-list">
      ${(ledger||[]).length ? ledger.map(row => {
        const earned = row.ripples_delta > 0;
        const note   = row.notes || row.bookings?.experiences?.name || (earned ? 'Earned' : 'Redeemed');
        return `
          <div class="ledger-row">
            <div class="lr-left">
              <div class="lr-note">${esc(note)}</div>
              <div class="lr-date">${fmtDate(row.created_at)}</div>
            </div>
            <div class="lr-delta ${earned ? 'lr-earned' : 'lr-spent'}">
              ${earned ? '+' : ''}${row.ripples_delta}
            </div>
          </div>`;
      }).join('') : '<p class="empty">No transactions yet.</p>'}
    </div>
  `;
}

/* ════════════════════════════════════════════════════════
   REDEEM TAB  (concierge only)
════════════════════════════════════════════════════════ */
const REDEMPTION_OPTIONS = [
  {
    id: 'free_kayak',
    name: 'Free Bay Kayak Tour',
    cost: 300,
    desc: 'One complimentary Bay Kayak or Calm Reflections experience for you to enjoy.',
    type: 'free_tour',
  },
  {
    id: 'free_scorpio',
    name: 'Free Scorpio\'s Secret',
    cost: 500,
    desc: 'One complimentary Scorpio\'s Secret (Golden Mirror) canoe experience.',
    type: 'free_tour',
  },
  {
    id: 'cash_25',
    name: 'Cash — USD $25',
    cost: 500,
    desc: 'Redeem USD $25 cash payout, paid to your registered account.',
    type: 'cash',
  },
  {
    id: 'cash_50',
    name: 'Cash — USD $50',
    cost: 1000,
    desc: 'Redeem USD $50 cash payout, paid to your registered account.',
    type: 'cash',
  },
];

let _selectedRedemption = null;

async function loadRedeemTab() {
  const cont = $('content-action');
  cont.innerHTML = '<p class="panel-subtitle">Redeem Ripples</p><p class="empty">Loading…</p>';

  // Refresh balance
  const { data: cdata } = await sb
    .from('concierges')
    .select('ripples_balance,ripples_earned_total,ripples_redeemed_total')
    .eq('id', _conciergeId)
    .single();

  if (cdata) {
    _conciergeData = { ..._conciergeData, ...cdata };
    renderRoleBadge();
  }

  const bal = _conciergeData?.ripples_balance || 0;

  // Load pending/past redemptions
  const { data: redemptions } = await sb
    .from('redemptions')
    .select('id,option_id,ripples_spent,status,notes,requested_at,fulfilled_at')
    .eq('concierge_id', _conciergeId)
    .order('requested_at', { ascending:false })
    .limit(20);

  cont.innerHTML = `
    <p class="panel-subtitle">Redeem Ripples &mdash; Balance: <strong style="color:var(--gold)">${bal}</strong></p>

    <div id="redeem-result"></div>

    <div class="redeem-grid">
      ${REDEMPTION_OPTIONS.map(opt => {
        const canAfford = bal >= opt.cost;
        return `
          <div class="redeem-card${canAfford ? '' : ' cant-afford'}"
               id="rc-${opt.id}"
               ${canAfford ? `onclick="selectRedemption('${opt.id}')"` : ''}>
            <div class="rc-top">
              <span class="rc-name">${esc(opt.name)}</span>
              <span class="rc-cost">${opt.cost} pts</span>
            </div>
            <div class="rc-desc">${esc(opt.desc)}</div>
          </div>`;
      }).join('')}
    </div>

    <div id="redeem-form-area"></div>

    ${(redemptions||[]).length ? `
      <p class="panel-subtitle" style="margin-top:24px">Redemption History</p>
      <div class="redemption-list">
        ${redemptions.map(r => {
          const opt = REDEMPTION_OPTIONS.find(o => o.id === r.option_id);
          return `
            <div class="redemption-row">
              <div class="rr-top">
                <span class="rr-type">${esc(opt?.name || r.option_id)}</span>
                <span class="rr-cost">${r.ripples_spent} pts</span>
              </div>
              <div class="rr-status status-badge ${statusClass(r.status)}" style="display:inline-block">
                ${esc(r.status)}
              </div>
              <span style="font-size:12px;color:var(--muted);margin-left:8px">${fmtDate(r.requested_at)}</span>
            </div>`;
        }).join('')}
      </div>
    ` : ''}
  `;
}

window.selectRedemption = function(optId) {
  _selectedRedemption = optId;
  const opt = REDEMPTION_OPTIONS.find(o => o.id === optId);

  // Highlight selected card
  document.querySelectorAll('.redeem-card').forEach(c => c.classList.remove('selected'));
  const card = document.getElementById('rc-' + optId);
  if (card) card.classList.add('selected');

  const formArea = $('redeem-form-area');
  formArea.innerHTML = `
    <div style="background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:18px;margin-top:4px">
      <p style="font-size:15px;font-weight:500;margin-bottom:8px">Confirm Redemption</p>
      <p style="font-size:14px;color:var(--muted);margin-bottom:14px">
        ${esc(opt.name)} — ${opt.cost} Ripples
      </p>
      ${opt.type === 'cash' ? `
        <div class="form-field" style="margin-bottom:12px">
          <label>Payment details / notes</label>
          <textarea id="redeem-notes" class="field-input" rows="2"
            placeholder="Bank transfer details or preferred payment method…"></textarea>
        </div>` : ''}
      <button class="submit-btn" onclick="submitRedemption('${optId}')">
        Redeem ${opt.cost} Ripples
      </button>
    </div>
  `;
};

window.submitRedemption = async function(optId) {
  const opt = REDEMPTION_OPTIONS.find(o => o.id === optId);
  const res = $('redeem-result');
  const btn = document.querySelector('#redeem-form-area .submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

  const bal = _conciergeData?.ripples_balance || 0;
  if (bal < opt.cost) {
    res.innerHTML = '<div class="form-error">Insufficient Ripples balance.</div>';
    if (btn) { btn.disabled = false; btn.textContent = `Redeem ${opt.cost} Ripples`; }
    return;
  }

  const notes = document.getElementById('redeem-notes')?.value?.trim() || null;

  const { error } = await sb.from('redemptions').insert([{
    concierge_id:  _conciergeId,
    option_id:     optId,
    ripples_spent: opt.cost,
    redemption_type: opt.type,
    status:        'pending',
    notes,
  }]);

  if (error) {
    res.innerHTML = `<div class="form-error">Could not submit: ${esc(error.message)}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = `Redeem ${opt.cost} Ripples`; }
    return;
  }

  res.innerHTML = `
    <div class="form-success">
      Redemption request submitted — ${opt.name} (${opt.cost} Ripples).<br/>
      The SHER team will process this within 2–3 working days.
    </div>`;

  // Reload to show updated balance and history
  setTimeout(() => loadRedeemTab(), 1200);
};

/* ── Init ── */
(async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    await bootApp();
  } else {
    showScreen('login-screen');
  }
})();
