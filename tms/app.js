/* SHER TMS — Tour Management System */

const SUPA_URL = 'https://hvxqettaonfxmmntrsmd.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh2eHFldHRhb25meG1tbnRyc21kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3MDk4NDEsImV4cCI6MjA5NzI4NTg0MX0.ZwJwVIiXNwtJW5prOpnwsYjIrfpA5MSvJFYBCv_q5J0';

const sb = window.supabase.createClient(SUPA_URL, SUPA_KEY);

// ─────────────────────────────────────────────────────────────────────────────
// Screen management
// ─────────────────────────────────────────────────────────────────────────────

function showScreen(id) {
  ['login-screen','forgot-screen','newpass-screen'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.hidden = (s !== id);
  });
  const app = document.getElementById('app');
  if (app) app.hidden = true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Forgot password
// ─────────────────────────────────────────────────────────────────────────────

document.getElementById('forgot-link').addEventListener('click', e => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  if (email) document.getElementById('f-email').value = email;
  showScreen('forgot-screen');
});

document.getElementById('back-login').addEventListener('click', e => {
  e.preventDefault();
  showScreen('login-screen');
});

document.getElementById('forgot-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('forgot-btn');
  const msg = document.getElementById('forgot-msg');
  msg.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Sending…';

  const { error } = await sb.auth.resetPasswordForEmail(
    document.getElementById('f-email').value.trim(),
    { redirectTo: 'https://tms.shersanctuary.com' }
  );

  if (error) {
    msg.textContent = error.message;
    msg.style.color = '';
    msg.hidden = false;
  } else {
    msg.textContent = 'Reset link sent — check your email.';
    msg.style.color = 'var(--green, #4caf7d)';
    msg.hidden = false;
  }
  btn.disabled = false;
  btn.textContent = 'Send reset link';
});

document.getElementById('newpass-form').addEventListener('submit', async e => {
  e.preventDefault();
  const btn = document.getElementById('newpass-btn');
  const msg = document.getElementById('newpass-msg');
  msg.hidden = true;

  const pass    = document.getElementById('np-pass').value;
  const confirm = document.getElementById('np-confirm').value;

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

  // Password updated — proceed to app
  const { data: { session } } = await sb.auth.getSession();
  if (session) await afterLogin(session.user);
});

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────

async function init() {
  const { data: { session } } = await sb.auth.getSession();
  if (session) await afterLogin(session.user);
  else showScreen('login-screen');

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') { showScreen('newpass-screen'); return; }
    if (event === 'SIGNED_IN') await afterLogin(session.user);
    if (event === 'SIGNED_OUT') showScreen('login-screen');
  });
}

async function afterLogin(user) {
  const { data: role, error: roleErr } = await sb.rpc('get_my_role');
  console.log('afterLogin — role:', role, 'error:', roleErr);
  if (roleErr) {
    await sb.auth.signOut();
    loginError('Role check failed: ' + JSON.stringify(roleErr));
    return;
  }
  if (role !== 'admin') {
    await sb.auth.signOut();
    loginError('Access denied. Role returned: "' + (role ?? 'null') + '"');
    return;
  }
  // Hide all auth screens, show app
  ['login-screen','forgot-screen','newpass-screen'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.hidden = true;
  });
  document.getElementById('app').hidden = false;
  document.getElementById('user-email').textContent = user.email;
  document.getElementById('today-label').textContent = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  navigate('dashboard');
}

function showLoginScreen() {
  showScreen('login-screen');
}

function loginError(msg) {
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
    email:    document.getElementById('login-email').value.trim(),
    password: document.getElementById('login-password').value
  });

  if (error) {
    loginError(error.message);
    btn.textContent = 'Sign in';
    btn.disabled = false;
  }
});

document.getElementById('logout-btn').addEventListener('click', () => sb.auth.signOut());

// ─────────────────────────────────────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────────────────────────────────────

const SECTION_TITLES = {
  dashboard:        'Dashboard',
  bookings:         'Bookings',
  today:            'Today',
  'partner-requests': 'Partner Requests',
  experiences:      'Experiences',
  partners:         'Partners',
  concierges:       'Concierges',
  commissions:      'Commissions',
  payouts:          'Payouts',
  ripples:          'Ripples Redemptions',
  equipment:        'Equipment',
  conservation:     'Conservation',
  waitlist:         'Waitlist'
};

const RENDERERS = {
  dashboard:        renderDashboard,
  bookings:         renderBookings,
  today:            renderToday,
  'partner-requests': renderPartnerRequests,
  experiences:      renderExperiences,
  partners:         renderPartners,
  concierges:       renderConcierges,
  commissions:      renderCommissions,
  payouts:          renderPayouts,
  ripples:          renderRipples,
  equipment:        renderEquipment,
  conservation:     renderConservation,
  waitlist:         renderWaitlist
};

document.querySelectorAll('.nav-item').forEach(el => {
  el.addEventListener('click', () => {
    navigate(el.dataset.section);
    document.getElementById('sidebar').classList.remove('open');
  });
});

document.getElementById('menu-toggle').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});

function navigate(section) {
  document.querySelectorAll('.nav-item').forEach(el =>
    el.classList.toggle('active', el.dataset.section === section)
  );
  document.getElementById('section-title').textContent = SECTION_TITLES[section] || section;
  (RENDERERS[section] || (() => {}))();
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function setContent(html) { document.getElementById('content').innerHTML = html; }

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDT(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function badge(val, cls) {
  return `<span class="badge ${cls || ''}">${val || '—'}</span>`;
}

function bookingBadge(status) {
  const map = { enquiry:'b-enquiry', pending:'b-enquiry', qualified:'b-qualified',
                confirmed:'b-confirmed', completed:'b-completed',
                cancelled:'b-cancelled', deferred:'b-deferred',
                balance_due:'b-enquiry', paid_in_full:'b-confirmed', no_show:'b-cancelled' };
  return badge(status?.replace('_',' '), map[status] || '');
}

function expBadge(status) {
  return badge(status, 'b-' + (status || ''));
}

function condBadge(cond) {
  if (!cond) return '—';
  if (cond === 'Excellent')      return badge(cond, 'b-Excellent');
  if (cond === 'Good')           return badge(cond, 'b-Good');
  if (cond.startsWith('Needs'))  return badge(cond, 'b-needs');
  if (cond.startsWith('Out'))    return badge(cond, 'b-out');
  return badge(cond);
}

function weekBounds() {
  const now = new Date();
  const mon = new Date(now); mon.setDate(now.getDate() - ((now.getDay()+6)%7));
  const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  return [mon.toISOString().split('T')[0], sun.toISOString().split('T')[0]];
}

function today() { return new Date().toISOString().split('T')[0]; }

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard
// ─────────────────────────────────────────────────────────────────────────────

async function renderDashboard() {
  setContent('<div class="loading">Loading…</div>');

  const [wStart, wEnd] = weekBounds();
  const td = today();

  const [
    { count: pendingEnq },
    { count: partnerPending },
    { count: todayTours },
    { count: weekTours },
    { count: activePartners },
    { count: pendingComm },
    { count: pendingRipl },
    { data: recent },
    { data: todayOccasions }
  ] = await Promise.all([
    sb.from('bookings').select('*', { count:'exact', head:true }).eq('status','enquiry').neq('source','partner'),
    sb.from('bookings').select('*', { count:'exact', head:true }).eq('source','partner').eq('status','enquiry'),
    sb.from('bookings').select('*', { count:'exact', head:true }).eq('booking_date', td).eq('status','confirmed'),
    sb.from('bookings').select('*', { count:'exact', head:true }).gte('booking_date', wStart).lte('booking_date', wEnd).in('status',['confirmed','completed']),
    sb.from('partners').select('*', { count:'exact', head:true }).eq('status','active'),
    sb.from('commissions').select('*', { count:'exact', head:true }).eq('status','pending'),
    sb.from('redemptions').select('*', { count:'exact', head:true }).eq('status','requested'),
    sb.from('bookings')
      .select('id,booking_ref,lead_name,status,source,created_at,experiences(name)')
      .order('created_at', { ascending:false }).limit(10),
    sb.from('bookings')
      .select('id,booking_ref,lead_name,occasion_type,special_requirements,notes,experiences(name,departure_time)')
      .eq('booking_date', td)
      .eq('status', 'confirmed')
      .not('occasion_type', 'is', null)
      .order('created_at')
  ]);

  // Update sidebar badges
  const prBadge = document.getElementById('pr-badge');
  if (prBadge) { prBadge.textContent = partnerPending || 0; prBadge.style.display = partnerPending > 0 ? 'inline' : 'none'; }
  const commBadge = document.getElementById('comm-badge');
  if (commBadge) { commBadge.textContent = pendingComm || 0; commBadge.style.display = pendingComm > 0 ? 'inline' : 'none'; }
  const riplBadge = document.getElementById('ripl-badge');
  if (riplBadge) { riplBadge.textContent = pendingRipl || 0; riplBadge.style.display = pendingRipl > 0 ? 'inline' : 'none'; }

  setContent(`
    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">Pending Enquiries</div>
        <div class="stat-value gold">${pendingEnq || 0}</div>
        <div class="stat-sub">Awaiting response</div>
      </div>
      <div class="stat-card" style="${partnerPending > 0 ? 'border-color:var(--gold);' : ''}">
        <div class="stat-label">Partner Requests</div>
        <div class="stat-value ${partnerPending > 0 ? 'gold' : ''}">${partnerPending || 0}</div>
        <div class="stat-sub"><a href="#" onclick="navigate('partner-requests')" style="color:var(--gold)">Review now →</a></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Today's Tours</div>
        <div class="stat-value">${todayTours || 0}</div>
        <div class="stat-sub">Confirmed for today</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">This Week</div>
        <div class="stat-value">${weekTours || 0}</div>
        <div class="stat-sub">Confirmed bookings</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Active Partners</div>
        <div class="stat-value">${activePartners || 0}</div>
        <div class="stat-sub">Hotels &amp; guesthouses</div>
      </div>
      <div class="stat-card" style="${pendingComm > 0 ? 'border-color:var(--gold);' : ''}">
        <div class="stat-label">Pending Commissions</div>
        <div class="stat-value ${pendingComm > 0 ? 'gold' : ''}">${pendingComm || 0}</div>
        <div class="stat-sub"><a href="#" onclick="navigate('commissions')" style="color:var(--gold)">Review →</a></div>
      </div>
      ${pendingRipl > 0 ? `
      <div class="stat-card" style="border-color:var(--amber)">
        <div class="stat-label">Ripples Requests</div>
        <div class="stat-value" style="color:var(--amber)">${pendingRipl}</div>
        <div class="stat-sub"><a href="#" onclick="navigate('ripples')" style="color:var(--amber)">Review →</a></div>
      </div>` : ''}
    </div>

    ${todayOccasions?.length ? `
    <div class="sh"><h3>Today's Special Occasions</h3></div>
    <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:28px">
      ${todayOccasions.map(b => {
        const reqs = b.special_requirements || b.notes || '';
        return `
        <div style="background:var(--surface);border:1px solid rgba(212,168,67,0.3);border-radius:8px;padding:14px 18px">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap">
            <div>
              <div style="font-size:11px;color:var(--gold);font-weight:600;letter-spacing:.06em;margin-bottom:4px">${b.booking_ref}</div>
              <div style="font-size:15px;font-weight:500">${b.lead_name}</div>
              <div style="font-size:12px;color:var(--muted)">${b.experiences?.name||'—'}${b.experiences?.departure_time?' · '+b.experiences.departure_time:''}</div>
            </div>
            <div style="background:rgba(212,168,67,0.12);color:var(--gold);font-size:12px;font-weight:600;padding:5px 12px;border-radius:20px;white-space:nowrap">
              ${b.occasion_type}
            </div>
          </div>
          ${reqs ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:var(--amber)">${reqs}</div>` : ''}
        </div>`;
      }).join('')}
    </div>` : ''}

    <div class="sh">
      <h3>Recent Bookings</h3>
      <button class="btn btn-ghost" onclick="navigate('bookings')">View all</button>
    </div>
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Ref</th><th>Guest</th><th>Experience</th><th>Received</th><th>Status</th>
        </tr></thead>
        <tbody>
          ${(recent || []).map(b => `
            <tr>
              <td style="color:var(--gold);font-weight:600;font-size:11px;letter-spacing:.05em">${b.booking_ref || '—'}</td>
              <td>${b.lead_name}</td>
              <td style="color:var(--muted)">${b.experiences?.name || '—'}</td>
              <td style="color:var(--muted);font-size:12px">${fmtDT(b.created_at)}</td>
              <td>${bookingBadge(b.status)}</td>
            </tr>`).join('')
            || '<tr><td colspan="5" class="empty">No bookings yet</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Bookings
// ─────────────────────────────────────────────────────────────────────────────

let _bookingFilter = 'all';

async function renderBookings() {
  const tabs = ['all','enquiry','qualified','confirmed','completed','cancelled','deferred','pending'];
  setContent(`
    <div class="tabs">
      ${tabs.map(s => `<button class="tab ${_bookingFilter===s?'active':''}" onclick="_filterBookings('${s}')">${s==='all'?'All':cap(s)}</button>`).join('')}
    </div>
    <div class="toolbar">
      <input type="search" id="bk-search" placeholder="Search ref, name, email…"
             oninput="_searchBookings(this.value)" style="width:260px"/>
    </div>
    <div id="bk-wrap"><div class="loading">Loading…</div></div>
  `);
  await _loadBookings();
}

async function _loadBookings() {
  let q = sb.from('bookings')
    .select('id,booking_ref,lead_name,lead_email,status,source,created_at,booking_date,group_size,experiences(name)')
    .order('created_at', { ascending:false })
    .limit(300);
  if (_bookingFilter !== 'all') q = q.eq('status', _bookingFilter);

  const { data, error } = await q;
  const wrap = document.getElementById('bk-wrap');
  if (!wrap) return;

  if (error) { wrap.innerHTML = `<div class="empty">Error: ${error.message}</div>`; return; }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="tms-table" id="bk-table">
        <thead><tr>
          <th>Ref</th><th>Guest</th><th>Experience</th>
          <th>Date</th><th>Pax</th><th>Source</th><th>Status</th><th>Received</th>
        </tr></thead>
        <tbody>
          ${(data||[]).map(b => `
            <tr data-q="${esc(b.booking_ref+' '+b.lead_name+' '+b.lead_email).toLowerCase()}"
                style="cursor:pointer" onclick="_openBooking('${b.id}')">
              <td style="color:var(--gold);font-weight:600;font-size:11px">${b.booking_ref||'—'}</td>
              <td>
                <div>${b.lead_name}</div>
                <div style="font-size:11px;color:var(--muted)">${b.lead_email}</div>
              </td>
              <td style="color:var(--muted)">${b.experiences?.name||'—'}</td>
              <td style="color:var(--muted);font-size:12px">${b.booking_date?fmtDate(b.booking_date):'—'}</td>
              <td>${b.group_size||'—'}</td>
              <td><span style="font-size:11px;color:var(--muted)">${b.source||'—'}</span></td>
              <td>${bookingBadge(b.status)}</td>
              <td style="color:var(--muted);font-size:12px">${fmtDT(b.created_at)}</td>
            </tr>`).join('')
            || '<tr><td colspan="8" class="empty">No bookings</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

function _filterBookings(status) { _bookingFilter = status; renderBookings(); }

function _searchBookings(q) {
  document.querySelectorAll('#bk-table tbody tr').forEach(row => {
    row.style.display = (row.dataset.q||'').includes(q.toLowerCase()) ? '' : 'none';
  });
}

async function _openBooking(id) {
  const { data: b } = await sb.from('bookings')
    .select('*,experiences(name,category,booking_flow,departure_time),partners(name)')
    .eq('id', id).single();
  if (!b) return;

  const preferred = Array.isArray(b.preferred_dates) ? b.preferred_dates.filter(Boolean).join(' · ') : '—';

  document.getElementById('bk-wrap').innerHTML = `
    <div class="detail-panel">
      <div class="detail-top">
        <div>
          <div class="detail-ref">${b.booking_ref}</div>
          <div class="detail-name">${b.lead_name}</div>
        </div>
        <div class="detail-actions">
          ${b.source==='partner' && b.status==='enquiry' ? `
            <button class="btn btn-primary" onclick="_approvePartnerBooking('${id}');renderBookings()">Approve</button>
            <button class="btn btn-danger"  onclick="_declinePartnerBooking('${id}')">Decline</button>
          ` : `
            ${b.status==='enquiry'   ? `<button class="btn btn-primary" onclick="_setStatus('${id}','qualified')">Mark Qualified</button>` : ''}
            ${b.status==='qualified' ? `<button class="btn btn-primary" onclick="_setStatus('${id}','confirmed')">Confirm Booking</button>` : ''}
            ${b.status==='confirmed' ? `<button class="btn btn-success" onclick="_setStatus('${id}','completed')">Mark Completed</button>` : ''}
            ${!['cancelled','completed','deferred'].includes(b.status) ? `<button class="btn btn-danger"  onclick="_setStatus('${id}','cancelled')">Cancel</button>` : ''}
            ${!['cancelled','completed','deferred'].includes(b.status) ? `<button class="btn btn-ghost"   onclick="_setStatus('${id}','deferred')">Defer</button>` : ''}
            ${b.status==='deferred' ? `<button class="btn btn-primary" onclick="_setStatus('${id}','enquiry')">Re-open</button>` : ''}
          `}
          <button class="btn btn-ghost" onclick="_loadBookings()">&#8592; Back</button>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        ${bookingBadge(b.status)}
        <span class="badge" style="background:rgba(255,255,255,0.06);color:var(--muted)">${b.source}</span>
      </div>
      <div class="detail-grid">
        <div><div class="df-label">Experience</div><div class="df-value">${b.experiences?.name||'—'}</div></div>
        <div><div class="df-label">Category</div><div class="df-value" style="color:var(--muted)">${b.experiences?.category||'—'}</div></div>
        <div><div class="df-label">Confirmed Date</div><div class="df-value">${b.booking_date?fmtDate(b.booking_date):'—'}</div></div>
        <div><div class="df-label">Preferred Dates</div><div class="df-value" style="font-size:12px;color:var(--muted)">${preferred}</div></div>
        <div><div class="df-label">Flexibility</div><div class="df-value">${b.date_flexibility||'—'}</div></div>
        <div><div class="df-label">Group Size</div><div class="df-value">${b.group_size||'—'}</div></div>
        <div><div class="df-label">Email</div><div class="df-value"><a href="mailto:${b.lead_email}" style="color:var(--gold)">${b.lead_email}</a></div></div>
        <div><div class="df-label">Phone</div><div class="df-value">${b.lead_phone||'—'}</div></div>
        <div><div class="df-label">Occasion</div><div class="df-value">${b.occasion_type||'—'}</div></div>
        <div><div class="df-label">How Heard</div><div class="df-value">${b.how_heard||'—'}</div></div>
        <div><div class="df-label">Partner</div><div class="df-value">${b.partners?.name||'—'}</div></div>
        <div><div class="df-label">Guide</div><div class="df-value">${b.guide_assigned||'Unassigned'}</div></div>
        <div><div class="df-label">Revenue (USD)</div><div class="df-value" style="color:var(--gold)">${b.revenue_usd?'$'+Number(b.revenue_usd).toFixed(2):'—'}</div></div>
        <div><div class="df-label">Payment Status</div><div class="df-value">${b.payment_status}</div></div>
        <div><div class="df-label">Waiver</div><div class="df-value">${b.waiver_status}</div></div>
        <div><div class="df-label">Received</div><div class="df-value" style="color:var(--muted)">${fmtDT(b.created_at)}</div></div>
        <div><div class="df-label">Confirmation Email</div><div class="df-value" style="color:${b.confirmation_sent_at ? 'var(--green)' : 'var(--muted)'}">${b.confirmation_sent_at ? 'Sent ' + fmtDT(b.confirmation_sent_at) : 'Not yet sent'}</div></div>
      </div>
      ${b.special_requirements ? `
        <div class="detail-notes" style="border-top-color:rgba(224,160,64,0.25);background:rgba(224,160,64,0.05)">
          <div class="df-label" style="margin-bottom:6px;color:var(--amber)">Partner Special Requirements</div>
          <div style="white-space:pre-line">${b.special_requirements}</div>
        </div>` : ''}
      ${b.notes ? `<div class="detail-notes"><div class="df-label" style="margin-bottom:6px">Internal Notes</div>${b.notes}</div>` : ''}

      <div class="detail-notes prep-inst-section" style="border-top-color:rgba(76,175,125,0.3);background:rgba(76,175,125,0.04)">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px">
          <div class="df-label" style="color:var(--green)">Tour Preparation Instructions</div>
          ${b.prep_instructions_updated_at
            ? `<span style="font-size:11px;color:rgba(76,175,125,0.6)">Last updated ${fmtDT(b.prep_instructions_updated_at)}</span>`
            : `<span style="font-size:11px;color:var(--muted)">Not yet set — guide will see only the generic occasion checklist</span>`}
        </div>
        <textarea id="prep-inst-${id}"
          rows="4"
          placeholder="e.g. No champagne in stock today — use sparkling juice instead. Photographer confirmed for 09:30. Red petals in storage room B."
          style="width:100%;background:var(--bg);border:1px solid var(--border);border-radius:5px;
                 color:var(--text);font-size:13px;padding:10px 13px;resize:vertical;
                 font-family:inherit;line-height:1.6;transition:border-color .15s"
          onfocus="this.style.borderColor='var(--green)'" onblur="this.style.borderColor='var(--border)'"
        >${b.prep_instructions || ''}</textarea>
        <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
          <button class="btn btn-success" onclick="_savePrep('${id}')">Save Instructions</button>
          <span id="prep-msg-${id}" style="font-size:12px"></span>
        </div>
      </div>
    </div>`;
}

async function _savePrep(id) {
  const ta  = document.getElementById('prep-inst-' + id);
  const msg = document.getElementById('prep-msg-' + id);
  if (!ta) return;
  const val = ta.value.trim();
  const { error } = await sb.from('bookings').update({
    prep_instructions:            val || null,
    prep_instructions_updated_at: new Date().toISOString()
  }).eq('id', id);
  if (error) {
    msg.textContent = 'Error: ' + error.message;
    msg.style.color = 'var(--red)';
  } else {
    msg.textContent = 'Saved.';
    msg.style.color = 'var(--green)';
    setTimeout(() => { msg.textContent = ''; }, 3000);
  }
}

async function _setStatus(id, status) {
  const upd = { status };
  if (status === 'confirmed') upd.confirmed_at = new Date().toISOString();
  if (status === 'completed') upd.completed_at = new Date().toISOString();
  const { error } = await sb.from('bookings').update(upd).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  renderBookings();
}

// ─────────────────────────────────────────────────────────────────────────────
// Partner Requests
// ─────────────────────────────────────────────────────────────────────────────

async function renderPartnerRequests() {
  setContent('<div class="loading">Loading partner requests…</div>');

  const { data, error } = await sb
    .from('bookings')
    .select('id,booking_ref,lead_name,lead_email,lead_phone,booking_date,group_size,occasion_type,special_requirements,status,created_at,experiences(name),partners(name)')
    .eq('source', 'partner')
    .not('status', 'in', '("completed","cancelled")')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) { setContent(`<div class="empty">Error: ${error.message}</div>`); return; }

  const pending   = (data||[]).filter(b => b.status === 'enquiry');
  const actioned  = (data||[]).filter(b => b.status !== 'enquiry');

  setContent(`
    <div class="sh" style="margin-bottom:16px">
      <h3>Awaiting Review (${pending.length})</h3>
    </div>

    ${pending.length ? `
    <div style="display:flex;flex-direction:column;gap:12px;margin-bottom:32px">
      ${pending.map(b => `
        <div class="detail-panel" style="padding:16px 20px" id="pr-${b.id}">
          <div class="detail-top" style="margin-bottom:10px">
            <div>
              <div class="detail-ref">${b.booking_ref}</div>
              <div class="detail-name">${b.lead_name}</div>
              <div style="font-size:12px;color:var(--muted);margin-top:2px">${b.partners?.name||'—'}</div>
            </div>
            <div class="detail-actions">
              <button class="btn btn-primary" onclick="_approvePartnerBooking('${b.id}')">Confirm</button>
              <button class="btn btn-danger"  onclick="_declinePartnerBooking('${b.id}')">Decline</button>
            </div>
          </div>
          <div class="detail-grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px 16px">
            <div><div class="df-label">Experience</div><div class="df-value">${b.experiences?.name||'—'}</div></div>
            <div><div class="df-label">Date</div><div class="df-value">${b.booking_date?fmtDate(b.booking_date):'TBC'}</div></div>
            <div><div class="df-label">Guests</div><div class="df-value">${b.group_size||'—'}</div></div>
            <div><div class="df-label">Email</div><div class="df-value"><a href="mailto:${b.lead_email}" style="color:var(--gold)">${b.lead_email}</a></div></div>
            ${b.lead_phone ? `<div><div class="df-label">Phone</div><div class="df-value">${b.lead_phone}</div></div>` : ''}
            ${b.occasion_type ? `<div><div class="df-label">Occasion</div><div class="df-value">${b.occasion_type}</div></div>` : ''}
            <div><div class="df-label">Received</div><div class="df-value" style="color:var(--muted)">${fmtDT(b.created_at)}</div></div>
          </div>
          ${b.special_requirements ? `<div class="detail-notes" style="margin-top:10px"><div class="df-label" style="margin-bottom:4px">Special Requirements</div>${b.special_requirements}</div>` : ''}
        </div>
      `).join('')}
    </div>` : '<div class="empty" style="margin-bottom:32px">No partner requests awaiting review.</div>'}

    ${actioned.length ? `
    <div class="sh"><h3>Recently Actioned (${actioned.length})</h3></div>
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr><th>Ref</th><th>Guest</th><th>Property</th><th>Experience</th><th>Date</th><th>Status</th></tr></thead>
        <tbody>
          ${actioned.map(b => `
            <tr style="cursor:pointer" onclick="_openBooking('${b.id}')">
              <td style="color:var(--gold);font-weight:600;font-size:11px">${b.booking_ref||'—'}</td>
              <td>${b.lead_name}</td>
              <td style="color:var(--muted)">${b.partners?.name||'—'}</td>
              <td style="color:var(--muted)">${b.experiences?.name||'—'}</td>
              <td style="color:var(--muted);font-size:12px">${b.booking_date?fmtDate(b.booking_date):'—'}</td>
              <td>${bookingBadge(b.status)}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>` : ''}
  `);
}

async function _approvePartnerBooking(id) {
  const { error } = await sb.from('bookings').update({
    status: 'confirmed',
    confirmed_at: new Date().toISOString()
  }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  renderPartnerRequests();
}

async function _declinePartnerBooking(id) {
  if (!confirm('Decline this booking request?')) return;
  const { error } = await sb.from('bookings').update({ status: 'cancelled' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  renderPartnerRequests();
}

// ─────────────────────────────────────────────────────────────────────────────
// Today
// ─────────────────────────────────────────────────────────────────────────────

async function renderToday() {
  setContent('<div class="loading">Loading today\'s schedule…</div>');
  const td = today();

  const { data } = await sb.from('bookings')
    .select('*,experiences(name,category,departure_time,duration_minutes)')
    .eq('booking_date', td)
    .in('status', ['confirmed','completed'])
    .order('created_at');

  const dateStr = new Date().toLocaleDateString('en-US', {
    weekday:'long', month:'long', day:'numeric', year:'numeric'
  });

  if (!data?.length) {
    setContent(`
      <div style="font-size:13px;color:var(--muted);margin-bottom:20px">${dateStr}</div>
      <div class="empty">No confirmed tours today.</div>`);
    return;
  }

  setContent(`
    <div style="font-size:13px;color:var(--muted);margin-bottom:20px">
      ${dateStr} — <span style="color:var(--text)">${data.length} tour${data.length!==1?'s':''}</span>
    </div>
    <div class="today-grid">
      ${data.map(b => `
        <div class="today-card">
          <div class="today-card-top">
            <div class="today-ref">${b.booking_ref}</div>
            ${bookingBadge(b.status)}
          </div>
          <div class="today-name">${b.lead_name}</div>
          <div class="today-exp">${b.experiences?.name||'—'}</div>
          <div class="today-meta">
            <div>
              <div class="tm-label">Group Size</div>
              <div class="tm-value">${b.group_size||'—'} guest${b.group_size!==1?'s':''}</div>
            </div>
            <div>
              <div class="tm-label">Departure</div>
              <div class="tm-value">${b.experiences?.departure_time||'—'}</div>
            </div>
            <div>
              <div class="tm-label">Guide</div>
              <div class="tm-value" style="${!b.guide_assigned?'color:var(--red)':''}">
                ${b.guide_assigned||'⚠ Unassigned'}
              </div>
            </div>
            <div>
              <div class="tm-label">Waiver</div>
              <div class="tm-value" style="${b.waiver_status==='signed'?'color:var(--green)':b.waiver_status==='sent'?'color:var(--amber)':'color:var(--muted)'}">
                ${b.waiver_status}
              </div>
            </div>
            ${b.occasion_type?`
            <div style="grid-column:1/-1">
              <div class="tm-label">Occasion</div>
              <div class="tm-value" style="color:var(--gold)">${b.occasion_type}</div>
            </div>`:''}
            ${b.lead_phone?`
            <div style="grid-column:1/-1">
              <div class="tm-label">Contact</div>
              <div class="tm-value"><a href="tel:${b.lead_phone}" style="color:var(--gold)">${b.lead_phone}</a></div>
            </div>`:''}
          </div>
          ${b.special_requirements?`
            <div class="today-notes" style="border-left:3px solid var(--amber);background:rgba(224,160,64,0.06);padding:12px 14px;border-radius:0 6px 6px 0">
              <div style="font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--amber);margin-bottom:5px">Partner Special Requirements</div>
              ${b.special_requirements}
            </div>` : ''}
          ${b.notes?`<div class="today-notes">${b.notes}</div>`:''}
        </div>`).join('')}
    </div>`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Experiences
// ─────────────────────────────────────────────────────────────────────────────

async function renderExperiences() {
  setContent('<div class="loading">Loading…</div>');
  const { data, error } = await sb.from('experiences').select('*').order('sort_order');
  if (error) { setContent(`<div class="empty">${error.message}</div>`); return; }

  const cats = [...new Set((data||[]).map(e => e.category))];
  setContent(cats.map(cat => {
    const exps = (data||[]).filter(e => e.category === cat);
    return `
      <div class="exp-section">
        <div class="exp-section-title">${cat}</div>
        <div class="exp-grid">
          ${exps.map(e => `
            <div class="exp-card">
              <div class="exp-card-top">
                <div class="exp-name">${e.name}</div>
                ${expBadge(e.status)}
              </div>
              <div class="exp-cat">${e.booking_flow} · ${e.pricing_model?.replace(/_/g,' ')}</div>
              <div class="exp-price">${e.public_price_usd?'$'+Number(e.public_price_usd).toFixed(0):'—'}</div>
              <div class="exp-price-note">Public USD${e.partner_price_usd?' · Partner $'+Number(e.partner_price_usd).toFixed(0):''}</div>
              <div class="exp-meta">
                ${e.max_capacity?`<span>${e.max_capacity} max</span>`:''}
                ${e.departure_time?`<span>${e.departure_time}</span>`:''}
                ${e.duration_minutes?`<span>${e.duration_minutes} min</span>`:''}
                ${e.deposit_percent?`<span>${e.deposit_percent}% deposit</span>`:''}
                ${e.concierge_points?`<span>${e.concierge_points} pts</span>`:''}
              </div>
            </div>`).join('')}
        </div>
      </div>`;
  }).join(''));
}

// ─────────────────────────────────────────────────────────────────────────────
// Partners
// ─────────────────────────────────────────────────────────────────────────────

function tierBadge(tier) {
  const cfg = {
    standard:  { col:'var(--muted)',  bg:'rgba(255,255,255,0.06)' },
    preferred: { col:'var(--gold)',   bg:'var(--gold-bg)' },
    elite:     { col:'var(--green)',  bg:'var(--green-bg)' },
  };
  const { col, bg } = cfg[tier] || cfg.standard;
  return `<span style="font-size:10px;font-weight:600;padding:2px 8px;border-radius:3px;color:${col};background:${bg};text-transform:capitalize;white-space:nowrap">${tier||'standard'}</span>`;
}

async function renderPartners() {
  setContent('<div class="loading">Loading…</div>');
  const { data, error } = await sb.from('partners').select('*').order('name');
  if (error) { setContent(`<div class="empty">${error.message}</div>`); return; }
  if (!data?.length) { setContent('<div class="empty">No partners registered yet.</div>'); return; }

  setContent(`
    <div class="sh">
      <h3>All Partners (${data.length})</h3>
      <button class="btn btn-ghost" onclick="_runTierCompute(this)">Run Tier Compute</button>
    </div>
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Partner</th><th>Type</th><th>Contact</th>
          <th>Tier</th><th>Commission</th><th>FAM Tour</th><th>Status</th><th>Since</th>
        </tr></thead>
        <tbody>
          ${data.map(p => `
            <tr style="cursor:pointer" onclick="_openPartner('${p.id}')">
              <td style="font-weight:500">${p.name}</td>
              <td style="color:var(--muted)">${p.type||'—'}</td>
              <td>
                <div>${p.contact_name||'—'}</div>
                ${p.contact_email?`<div style="font-size:11px;color:var(--muted)">${p.contact_email}</div>`:''}
              </td>
              <td>
                ${tierBadge(p.commission_tier)}
                ${p.tier_locked_at?`<div style="font-size:10px;color:var(--muted);margin-top:3px">Locked ${fmtDate(p.tier_locked_at)}</div>`:''}
              </td>
              <td style="color:var(--gold)">${p.commission_rate_override?Number(p.commission_rate_override)+'%*':p.commission_rate?Number(p.commission_rate)+'%':'—'}</td>
              <td>${p.fam_tour_taken
                  ?`<span style="color:var(--green)">✓${p.fam_tour_date?' '+fmtDate(p.fam_tour_date):''}</span>`
                  :'<span style="color:var(--muted)">—</span>'}</td>
              <td><span class="badge b-${p.status}">${p.status}</span></td>
              <td style="color:var(--muted);font-size:12px">${p.date_onboarded?fmtDate(p.date_onboarded):'—'}</td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`);
}

async function _runTierCompute(btn) {
  if (!confirm('Run tier compute for all active partners?\n\nThis updates commission tiers based on last month\'s confirmed booking volume.')) return;
  btn.disabled = true;
  btn.textContent = 'Computing…';
  const { error } = await sb.rpc('compute_partner_tiers');
  btn.disabled = false;
  btn.textContent = 'Run Tier Compute';
  if (error) { alert('Error: ' + error.message); return; }
  alert('Tier compute complete. Partner tiers have been updated.');
  renderPartners();
}

async function _openPartner(id) {
  const [{ data: p }, { count: pendComm }, { data: recentBk }, { data: concs }] = await Promise.all([
    sb.from('partners').select('*').eq('id', id).single(),
    sb.from('commissions').select('*', { count:'exact', head:true }).eq('partner_id', id).eq('status','pending'),
    sb.from('bookings')
      .select('id,booking_ref,lead_name,status,booking_date,experiences(name)')
      .eq('partner_id', id).order('created_at', { ascending:false }).limit(5),
    sb.from('concierges').select('id,first_name,last_name,email,status,ripples_balance')
      .eq('partner_id', id).order('created_at', { ascending:false }),
  ]);
  if (!p) return;

  const inp = (val) => `background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:13px;padding:9px 12px;width:100%;margin-top:4px`;

  setContent(`
    <div class="detail-panel">
      <div class="detail-top">
        <div>
          <div class="detail-ref">Partner · ${p.type||''}</div>
          <div class="detail-name">${p.name}</div>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;align-items:center">
            ${tierBadge(p.commission_tier)}
            <span class="badge b-${p.status}">${p.status}</span>
            ${p.tier_locked_at?`<span style="font-size:10px;color:var(--muted)">Tier locked ${fmtDate(p.tier_locked_at)}</span>`:''}
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-ghost" onclick="renderPartners()">&#8592; Back</button>
        </div>
      </div>

      <div class="detail-grid" style="margin-bottom:24px">
        <div><div class="df-label">Bookings Count</div><div class="df-value">${p.bookings_count||0}</div></div>
        <div><div class="df-label">Pending Commissions</div><div class="df-value" style="color:${pendComm>0?'var(--gold)':'inherit'}">${pendComm||0} <a href="#" onclick="navigate('commissions')" style="font-size:11px;color:var(--gold)">→ Review</a></div></div>
        <div><div class="df-label">Confirmation Mode</div><div class="df-value">${p.confirmation_mode||'standard'}</div></div>
        <div><div class="df-label">Trusted Since</div><div class="df-value">${p.trusted_since?fmtDate(p.trusted_since):'—'}</div></div>
      </div>

      <div class="sh" style="margin-bottom:16px"><h3>Edit Partner</h3></div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 24px;margin-bottom:24px">
        <div>
          <div class="df-label">Name</div>
          <input id="pe-name" style="${inp()}" value="${esc(p.name||'')}">
        </div>
        <div>
          <div class="df-label">Type</div>
          <input id="pe-type" style="${inp()}" value="${esc(p.type||'')}" placeholder="Hotel, Guesthouse, Villa…">
        </div>
        <div>
          <div class="df-label">Contact Name</div>
          <input id="pe-cname" style="${inp()}" value="${esc(p.contact_name||'')}">
        </div>
        <div>
          <div class="df-label">Contact Email</div>
          <input id="pe-cemail" type="email" style="${inp()}" value="${esc(p.contact_email||'')}">
        </div>
        <div>
          <div class="df-label">Contact Phone</div>
          <input id="pe-cphone" style="${inp()}" value="${esc(p.contact_phone||'')}">
        </div>
        <div>
          <div class="df-label">Status</div>
          <select id="pe-status" style="${inp()};cursor:pointer">
            <option value="active" ${p.status==='active'?'selected':''}>Active</option>
            <option value="inactive" ${p.status==='inactive'?'selected':''}>Inactive</option>
            <option value="pending" ${p.status==='pending'?'selected':''}>Pending</option>
          </select>
        </div>
        <div>
          <div class="df-label">Commission Rate Override (%)</div>
          <input id="pe-rate-override" type="number" step="0.01" min="0" max="100" style="${inp()}"
            value="${p.commission_rate_override||''}" placeholder="Leave blank to use tier rate">
        </div>
        <div>
          <div class="df-label">Confirmation Mode</div>
          <select id="pe-confmode" style="${inp()};cursor:pointer">
            <option value="standard" ${p.confirmation_mode!=='trusted'?'selected':''}>Standard</option>
            <option value="trusted" ${p.confirmation_mode==='trusted'?'selected':''}>Trusted (auto-confirm)</option>
          </select>
        </div>
        <div>
          <div class="df-label">Trusted Since</div>
          <input id="pe-trusted" type="date" style="${inp()}" value="${p.trusted_since||''}">
        </div>
        <div>
          <div class="df-label">FAM Tour Date</div>
          <input id="pe-fam-date" type="date" style="${inp()}" value="${p.fam_tour_date||''}">
        </div>
        <div style="display:flex;align-items:center;gap:10px;padding-top:18px">
          <input id="pe-fam" type="checkbox" ${p.fam_tour_taken?'checked':''} style="width:15px;height:15px;cursor:pointer">
          <label for="pe-fam" class="df-label" style="margin:0;cursor:pointer">FAM Tour Taken</label>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px">
        <button class="btn btn-primary" onclick="_savePartner('${id}')">Save Changes</button>
        <span id="partner-save-msg" style="font-size:12px"></span>
      </div>

      ${recentBk?.length ? `
      <div class="sh" style="margin-bottom:12px"><h3>Recent Bookings</h3></div>
      <div class="table-wrap">
        <table class="tms-table">
          <thead><tr><th>Ref</th><th>Guest</th><th>Experience</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            ${recentBk.map(b => `
              <tr style="cursor:pointer" onclick="_openBooking('${b.id}')">
                <td style="color:var(--gold);font-size:11px;font-weight:600">${b.booking_ref||'—'}</td>
                <td>${b.lead_name}</td>
                <td style="color:var(--muted)">${b.experiences?.name||'—'}</td>
                <td style="color:var(--muted);font-size:12px">${b.booking_date?fmtDate(b.booking_date):'—'}</td>
                <td>${bookingBadge(b.status)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : ''}

      <div class="sh" style="margin-bottom:12px;margin-top:24px">
        <h3>Concierges (${concs?.length||0})</h3>
        <button class="btn btn-ghost" style="font-size:11px;padding:4px 10px"
          onclick="navigate('concierges')">Manage all →</button>
      </div>
      ${concs?.length ? `
      <div class="table-wrap">
        <table class="tms-table">
          <thead><tr><th>Name</th><th>Email</th><th>Ripples</th><th>Status</th><th></th></tr></thead>
          <tbody>
            ${concs.map(c => `
              <tr>
                <td style="font-weight:500">${c.first_name} ${c.last_name}</td>
                <td style="font-size:12px;color:var(--muted)">${c.email}</td>
                <td style="color:var(--gold);font-weight:600">${c.ripples_balance||0}</td>
                <td><span class="badge b-${c.status==='active'?'active':'inactive'}">${c.status}</span></td>
                <td><button class="btn btn-ghost" style="padding:3px 8px;font-size:11px" onclick="_editConcierge('${c.id}')">Edit</button></td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div style="font-size:12px;color:var(--muted);padding:8px 0">No concierges linked to this partner yet.</div>'}
    </div>`);
}

async function _savePartner(id) {
  const msg = document.getElementById('partner-save-msg');
  const override = document.getElementById('pe-rate-override').value;
  const { error } = await sb.from('partners').update({
    name:                     document.getElementById('pe-name').value.trim(),
    type:                     document.getElementById('pe-type').value.trim() || null,
    contact_name:             document.getElementById('pe-cname').value.trim() || null,
    contact_email:            document.getElementById('pe-cemail').value.trim() || null,
    contact_phone:            document.getElementById('pe-cphone').value.trim() || null,
    status:                   document.getElementById('pe-status').value,
    commission_rate_override: override ? Number(override) : null,
    confirmation_mode:        document.getElementById('pe-confmode').value,
    trusted_since:            document.getElementById('pe-trusted').value || null,
    fam_tour_taken:           document.getElementById('pe-fam').checked,
    fam_tour_date:            document.getElementById('pe-fam-date').value || null,
  }).eq('id', id);
  if (error) { msg.textContent = 'Error: ' + error.message; msg.style.color = 'var(--red)'; }
  else { msg.textContent = 'Saved.'; msg.style.color = 'var(--green)'; setTimeout(() => { msg.textContent = ''; }, 3000); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Concierges
// ─────────────────────────────────────────────────────────────────────────────

async function renderConcierges() {
  setContent('<div class="loading">Loading…</div>');
  const { data, error } = await sb
    .from('concierges')
    .select('*,partners(name)')
    .order('created_at', { ascending: false });
  if (error) { setContent(`<div class="empty">${error.message}</div>`); return; }

  setContent(`
    <div class="sh">
      <h3>All Concierges (${data?.length || 0})</h3>
      <button class="btn btn-primary" onclick="_showAddConcierge()">+ Add Concierge</button>
    </div>

    <div id="conc-form-wrap"></div>

    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Name</th><th>Partner</th><th>Email</th>
          <th>Ripples Balance</th><th>Earned Total</th><th>Status</th><th>Added</th><th></th>
        </tr></thead>
        <tbody>
          ${(data||[]).map(c => `
            <tr>
              <td style="font-weight:500">${c.first_name} ${c.last_name}</td>
              <td style="color:var(--muted)">${c.partners?.name||'—'}</td>
              <td style="font-size:12px"><a href="mailto:${c.email}" style="color:var(--gold)">${c.email}</a></td>
              <td style="color:var(--gold);font-weight:600">${c.ripples_balance||0}</td>
              <td style="color:var(--muted)">${c.ripples_earned_total||0}</td>
              <td><span class="badge b-${c.status==='active'?'active':'inactive'}">${c.status}</span></td>
              <td style="color:var(--muted);font-size:12px">${fmtDT(c.created_at)}</td>
              <td><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="_editConcierge('${c.id}')">Edit</button></td>
            </tr>`).join('')
            || '<tr><td colspan="8" class="empty">No concierges yet. Add one to get started.</td></tr>'}
        </tbody>
      </table>
    </div>`);
}

async function _showAddConcierge() {
  const { data: partners } = await sb.from('partners').select('id,name').eq('status','active').order('name');
  const inp = `background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:13px;padding:9px 12px;width:100%;margin-top:4px`;
  const wrap = document.getElementById('conc-form-wrap');
  if (!wrap) return;

  wrap.innerHTML = `
    <div class="detail-panel" style="margin-bottom:20px;padding:20px">
      <div class="sh" style="margin-bottom:16px">
        <h3>New Concierge Account</h3>
        <button class="btn btn-ghost" onclick="document.getElementById('conc-form-wrap').innerHTML=''">Cancel</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:16px">
        <div>
          <div class="df-label">First Name</div>
          <input id="nc-fname" style="${inp}" placeholder="e.g. Marie">
        </div>
        <div>
          <div class="df-label">Last Name</div>
          <input id="nc-lname" style="${inp}" placeholder="e.g. Joseph">
        </div>
        <div>
          <div class="df-label">Email Address</div>
          <input id="nc-email" type="email" style="${inp}" placeholder="concierge@hotel.com">
        </div>
        <div>
          <div class="df-label">Phone (optional)</div>
          <input id="nc-phone" style="${inp}" placeholder="+1 758 …">
        </div>
        <div style="grid-column:1/-1">
          <div class="df-label">Partner Property</div>
          <select id="nc-partner" style="${inp};cursor:pointer">
            <option value="">Select property…</option>
            ${(partners||[]).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="font-size:11px;color:var(--muted);margin-bottom:14px">
        A password-set link will be generated for the concierge to activate their account on the Partner PWA.
      </div>
      <div style="display:flex;align-items:center;gap:12px">
        <button class="btn btn-primary" onclick="_createConcierge(this)">Create Account</button>
        <span id="nc-msg" style="font-size:12px"></span>
      </div>
      <div id="nc-link-wrap" hidden style="margin-top:16px;padding:14px;background:var(--green-bg);border:1px solid rgba(76,175,125,0.3);border-radius:6px">
        <div style="font-size:11px;color:var(--green);font-weight:600;margin-bottom:8px">✓ Account created — send this link to the concierge to set their password:</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="nc-link" readonly style="${inp};font-size:11px;color:var(--muted);flex:1" value="">
          <button class="btn btn-ghost" style="white-space:nowrap" onclick="navigator.clipboard.writeText(document.getElementById('nc-link').value).then(()=>this.textContent='Copied!').catch(()=>{})">Copy</button>
        </div>
        <div style="font-size:11px;color:var(--muted);margin-top:8px">Link expires in 24 hours. Share via WhatsApp or email.</div>
      </div>
    </div>`;
}

async function _createConcierge(btn) {
  const msg    = document.getElementById('nc-msg');
  const fname  = document.getElementById('nc-fname')?.value.trim();
  const lname  = document.getElementById('nc-lname')?.value.trim();
  const email  = document.getElementById('nc-email')?.value.trim();
  const phone  = document.getElementById('nc-phone')?.value.trim();
  const pid    = document.getElementById('nc-partner')?.value;

  if (!fname || !lname || !email || !pid) {
    msg.textContent = 'Please fill in all required fields.';
    msg.style.color = 'var(--red)'; return;
  }

  btn.disabled = true; btn.textContent = 'Creating…';
  msg.textContent = ''; msg.style.color = '';

  const { data, error } = await sb.functions.invoke('create-concierge', {
    body: { first_name: fname, last_name: lname, email, phone: phone||null, partner_id: pid },
  });

  btn.disabled = false; btn.textContent = 'Create Account';

  if (error || data?.error) {
    let errMsg = data?.error || error?.message || 'Unknown error';
    try { const ctx = await error?.context?.json(); if (ctx?.error) errMsg = ctx.error; } catch(_) {}
    msg.textContent = 'Error: ' + errMsg;
    msg.style.color = 'var(--red)'; return;
  }

  msg.textContent = 'Account created.';
  msg.style.color = 'var(--green)';

  if (data?.login_link) {
    const wrap = document.getElementById('nc-link-wrap');
    const inp  = document.getElementById('nc-link');
    if (wrap && inp) { inp.value = data.login_link; wrap.hidden = false; }
  }

  // Refresh concierge table
  const { data: concs } = await sb.from('concierges').select('*,partners(name)').order('created_at', { ascending:false });
  const tbody = document.querySelector('.tms-table tbody');
  if (tbody && concs) {
    tbody.innerHTML = concs.map(c => `
      <tr>
        <td style="font-weight:500">${c.first_name} ${c.last_name}</td>
        <td style="color:var(--muted)">${c.partners?.name||'—'}</td>
        <td style="font-size:12px"><a href="mailto:${c.email}" style="color:var(--gold)">${c.email}</a></td>
        <td style="color:var(--gold);font-weight:600">${c.ripples_balance||0}</td>
        <td style="color:var(--muted)">${c.ripples_earned_total||0}</td>
        <td><span class="badge b-${c.status==='active'?'active':'inactive'}">${c.status}</span></td>
        <td style="color:var(--muted);font-size:12px">${fmtDT(c.created_at)}</td>
        <td><button class="btn btn-ghost" style="padding:4px 10px;font-size:11px" onclick="_editConcierge('${c.id}')">Edit</button></td>
      </tr>`).join('');
  }
}

async function _editConcierge(id) {
  const { data: c } = await sb.from('concierges').select('*,partners(name)').eq('id', id).single();
  if (!c) return;

  const { data: ledger } = await sb.from('ripples_ledger')
    .select('transaction_type,ripples_delta,balance_after,created_at,notes')
    .eq('concierge_id', id).order('created_at', { ascending:false }).limit(10);

  const inp = `background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:13px;padding:9px 12px;width:100%;margin-top:4px`;

  setContent(`
    <div class="detail-panel">
      <div class="detail-top">
        <div>
          <div class="detail-ref">${c.partners?.name||'—'}</div>
          <div class="detail-name">${c.first_name} ${c.last_name}</div>
          <div style="display:flex;gap:8px;margin-top:6px;align-items:center">
            <span class="badge b-${c.status==='active'?'active':'inactive'}">${c.status}</span>
            <span style="font-size:12px;color:var(--gold)">⬡ ${c.ripples_balance||0} ripples</span>
          </div>
        </div>
        <div class="detail-actions">
          <button class="btn btn-ghost" onclick="renderConcierges()">&#8592; Back</button>
        </div>
      </div>

      <div class="detail-grid" style="margin-bottom:24px">
        <div><div class="df-label">Email</div><div class="df-value"><a href="mailto:${c.email}" style="color:var(--gold)">${c.email}</a></div></div>
        <div><div class="df-label">Ripples Earned Total</div><div class="df-value" style="color:var(--gold)">${c.ripples_earned_total||0}</div></div>
        <div><div class="df-label">Ripples Redeemed Total</div><div class="df-value">${c.ripples_redeemed_total||0}</div></div>
        <div><div class="df-label">Member Since</div><div class="df-value" style="color:var(--muted)">${fmtDT(c.created_at)}</div></div>
      </div>

      <div class="sh" style="margin-bottom:14px"><h3>Edit Details</h3></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;margin-bottom:20px">
        <div>
          <div class="df-label">First Name</div>
          <input id="ec-fname" style="${inp}" value="${esc(c.first_name||'')}">
        </div>
        <div>
          <div class="df-label">Last Name</div>
          <input id="ec-lname" style="${inp}" value="${esc(c.last_name||'')}">
        </div>
        <div>
          <div class="df-label">Phone</div>
          <input id="ec-phone" style="${inp}" value="${esc(c.phone||'')}">
        </div>
        <div>
          <div class="df-label">Status</div>
          <select id="ec-status" style="${inp};cursor:pointer">
            <option value="active" ${c.status==='active'?'selected':''}>Active</option>
            <option value="inactive" ${c.status==='inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px">
        <button class="btn btn-primary" onclick="_saveConcierge('${id}')">Save Changes</button>
        <span id="ec-msg" style="font-size:12px"></span>
      </div>

      ${ledger?.length ? `
      <div class="sh" style="margin-bottom:12px"><h3>Ripples Ledger</h3></div>
      <div class="table-wrap">
        <table class="tms-table">
          <thead><tr><th>Type</th><th>Delta</th><th>Balance After</th><th>Date</th></tr></thead>
          <tbody>
            ${ledger.map(l => `
              <tr>
                <td><span class="badge b-${l.transaction_type==='earned'?'confirmed':l.transaction_type==='redeemed'?'enquiry':'cancelled'}">${l.transaction_type}</span></td>
                <td style="color:${l.ripples_delta>0?'var(--green)':'var(--red)'};font-weight:600">${l.ripples_delta>0?'+':''}${l.ripples_delta}</td>
                <td style="color:var(--gold)">${l.balance_after}</td>
                <td style="color:var(--muted);font-size:12px">${fmtDT(l.created_at)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>` : '<div style="font-size:12px;color:var(--muted);padding:12px 0">No Ripples transactions yet.</div>'}
    </div>`);
}

async function _saveConcierge(id) {
  const msg = document.getElementById('ec-msg');
  const { error } = await sb.from('concierges').update({
    first_name: document.getElementById('ec-fname').value.trim(),
    last_name:  document.getElementById('ec-lname').value.trim(),
    phone:      document.getElementById('ec-phone').value.trim() || null,
    status:     document.getElementById('ec-status').value,
  }).eq('id', id);
  if (error) { msg.textContent = 'Error: ' + error.message; msg.style.color = 'var(--red)'; }
  else { msg.textContent = 'Saved.'; msg.style.color = 'var(--green)'; setTimeout(() => { msg.textContent = ''; }, 3000); }
}

// ─────────────────────────────────────────────────────────────────────────────
// Commissions
// ─────────────────────────────────────────────────────────────────────────────

let _commFilter = 'pending';

async function renderCommissions() {
  const tabs = ['pending','approved','paid','all'];
  setContent(`
    <div class="tabs">
      ${tabs.map(s => `<button class="tab ${_commFilter===s?'active':''}" onclick="_filterCommissions('${s}')">${cap(s)}</button>`).join('')}
    </div>
    <div id="comm-wrap"><div class="loading">Loading…</div></div>
  `);
  await _loadCommissions();
}

function _filterCommissions(f) { _commFilter = f; renderCommissions(); }

async function _loadCommissions() {
  let q = sb.from('commissions')
    .select('id,status,booking_value_usd,commission_rate,commission_amount_usd,commission_tier_at_booking,approved_at,created_at,bookings(booking_ref,lead_name,booking_date,experiences(name)),partners(name)')
    .order('created_at', { ascending:false }).limit(300);
  if (_commFilter !== 'all') q = q.eq('status', _commFilter);

  const { data, error } = await q;
  const wrap = document.getElementById('comm-wrap');
  if (!wrap) return;
  if (error) { wrap.innerHTML = `<div class="empty">Error: ${error.message}</div>`; return; }
  if (!data?.length) { wrap.innerHTML = `<div class="empty">No ${_commFilter==='all'?'':_commFilter+' '}commissions found.</div>`; return; }

  const total = data.reduce((s, c) => s + Number(c.commission_amount_usd || 0), 0);
  wrap.innerHTML = `
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <span style="font-size:12px;color:var(--muted)">Total shown: <strong style="color:var(--gold)">$${total.toFixed(2)} USD</strong></span>
    </div>
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Booking</th><th>Partner</th><th>Tour Date</th>
          <th>Booking Value</th><th>Tier</th><th>Rate</th><th>Commission</th><th>Status</th><th></th>
        </tr></thead>
        <tbody>
          ${data.map(c => `
            <tr>
              <td>
                <div style="color:var(--gold);font-size:11px;font-weight:600">${c.bookings?.booking_ref||'—'}</div>
                <div style="font-size:11px;color:var(--muted)">${c.bookings?.lead_name||''}</div>
                <div style="font-size:10px;color:var(--muted)">${c.bookings?.experiences?.name||''}</div>
              </td>
              <td>${c.partners?.name||'—'}</td>
              <td style="color:var(--muted);font-size:12px">${c.bookings?.booking_date?fmtDate(c.bookings.booking_date):'—'}</td>
              <td style="color:var(--muted)">$${Number(c.booking_value_usd||0).toFixed(2)}</td>
              <td>${tierBadge(c.commission_tier_at_booking)}</td>
              <td style="color:var(--muted)">${c.commission_rate?Number(c.commission_rate)+'%':'—'}</td>
              <td style="color:var(--gold);font-weight:600">$${Number(c.commission_amount_usd||0).toFixed(2)}</td>
              <td><span class="badge b-${c.status==='pending'?'enquiry':c.status==='approved'?'qualified':c.status==='paid'?'confirmed':'cancelled'}">${c.status}</span></td>
              <td style="white-space:nowrap">
                ${c.status==='pending'?`<button class="btn btn-primary" style="padding:5px 10px;font-size:11px" onclick="_approveCommission('${c.id}')">Approve</button>`:''}
                ${c.status==='approved'?`<button class="btn btn-ghost" style="padding:5px 10px;font-size:11px" onclick="_reverseCommission('${c.id}')">Reverse</button>`:''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function _approveCommission(id) {
  const { error } = await sb.from('commissions').update({ status:'approved', approved_at:new Date().toISOString() }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  _loadCommissions();
}

async function _reverseCommission(id) {
  if (!confirm('Reverse this commission back to pending?')) return;
  const { error } = await sb.from('commissions').update({ status:'pending', approved_at:null }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  _loadCommissions();
}

// ─────────────────────────────────────────────────────────────────────────────
// Payouts
// ─────────────────────────────────────────────────────────────────────────────

async function renderPayouts() {
  setContent('<div class="loading">Loading…</div>');
  const [{ data: partners }, { data: history }] = await Promise.all([
    sb.from('partners').select('id,name').eq('status','active').order('name'),
    sb.from('payouts')
      .select('id,payout_amount_usd,payout_method,reference,paid_at,notes,created_at,partners(name)')
      .order('created_at', { ascending:false }).limit(100),
  ]);

  const inp = `background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:13px;padding:9px 12px;width:100%;margin-top:4px`;

  setContent(`
    <div style="display:grid;grid-template-columns:360px 1fr;gap:20px;align-items:start">

      <div class="detail-panel" style="padding:20px">
        <div class="sh" style="margin-bottom:16px"><h3>Create Payout</h3></div>

        <div style="margin-bottom:12px">
          <div class="df-label">Partner</div>
          <select id="payout-partner" style="${inp};cursor:pointer" onchange="_loadPayoutPool(this.value)">
            <option value="">Select partner…</option>
            ${(partners||[]).map(p => `<option value="${p.id}">${p.name}</option>`).join('')}
          </select>
        </div>

        <div id="payout-pool" style="font-size:12px;color:var(--muted);padding:10px 0">
          Select a partner to load their approved commissions.
        </div>

        <div id="payout-form" hidden>
          <div style="margin-bottom:12px">
            <div class="df-label">Payout Method</div>
            <select id="payout-method" style="${inp};cursor:pointer">
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
              <option value="mobile_money">Mobile Money</option>
            </select>
          </div>
          <div style="margin-bottom:12px">
            <div class="df-label">Reference / Transaction ID</div>
            <input id="payout-ref" style="${inp}" placeholder="e.g. TRF-20260630-001">
          </div>
          <div style="margin-bottom:12px">
            <div class="df-label">Date Paid</div>
            <input id="payout-date" type="date" style="${inp}" value="${today()}">
          </div>
          <div style="margin-bottom:16px">
            <div class="df-label">Notes</div>
            <textarea id="payout-notes" style="${inp};resize:vertical;min-height:60px"></textarea>
          </div>
          <div id="payout-total" style="font-size:14px;color:var(--gold);font-weight:600;margin-bottom:14px"></div>
          <button class="btn btn-primary" onclick="_createPayout()">Create Payout Record</button>
          <div id="payout-msg" style="font-size:12px;margin-top:8px"></div>
        </div>
      </div>

      <div>
        <div class="sh" style="margin-bottom:12px"><h3>Payout History</h3></div>
        <div class="table-wrap">
          <table class="tms-table">
            <thead><tr>
              <th>Partner</th><th>Amount</th><th>Method</th><th>Reference</th><th>Date Paid</th><th>Notes</th>
            </tr></thead>
            <tbody>
              ${(history||[]).map(p => `
                <tr>
                  <td style="font-weight:500">${p.partners?.name||'—'}</td>
                  <td style="color:var(--gold);font-weight:600">$${Number(p.payout_amount_usd||0).toFixed(2)}</td>
                  <td style="color:var(--muted)">${(p.payout_method||'').replace(/_/g,' ')}</td>
                  <td style="font-size:12px;color:var(--muted)">${p.reference||'—'}</td>
                  <td style="font-size:12px;color:var(--muted)">${p.paid_at?fmtDate(p.paid_at):'—'}</td>
                  <td style="font-size:12px;color:var(--muted)">${p.notes||'—'}</td>
                </tr>`).join('')
                || '<tr><td colspan="6" class="empty">No payouts recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>`);
}

async function _loadPayoutPool(partnerId) {
  const pool = document.getElementById('payout-pool');
  const form = document.getElementById('payout-form');
  if (!partnerId) {
    pool.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:10px 0">Select a partner to load their approved commissions.</div>`;
    form.hidden = true; return;
  }

  const { data, error } = await sb.from('commissions')
    .select('id,commission_amount_usd,created_at,bookings(booking_ref,lead_name,booking_date)')
    .eq('partner_id', partnerId).eq('status','approved').is('payout_id', null)
    .order('created_at');

  if (error) { pool.innerHTML = `<div class="empty">Error: ${error.message}</div>`; return; }
  if (!data?.length) {
    pool.innerHTML = `<div style="font-size:12px;color:var(--muted);padding:10px 0">No approved commissions awaiting payout for this partner.</div>`;
    form.hidden = true; return;
  }

  pool.innerHTML = `
    <div style="font-size:11px;color:var(--muted);margin-bottom:8px">Select commissions to include:</div>
    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
      ${data.map(c => `
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:8px 10px;background:var(--bg);border-radius:5px;border:1px solid var(--border)">
          <input type="checkbox" value="${c.id}" data-amount="${c.commission_amount_usd||0}"
            onchange="_updatePayoutTotal()" style="width:14px;height:14px;cursor:pointer">
          <div style="flex:1;min-width:0">
            <div style="font-size:11px;color:var(--gold);font-weight:600">${c.bookings?.booking_ref||'—'} · ${c.bookings?.lead_name||''}</div>
            <div style="font-size:10px;color:var(--muted)">${c.bookings?.booking_date?fmtDate(c.bookings.booking_date):'—'}</div>
          </div>
          <div style="font-size:13px;color:var(--gold);font-weight:600;white-space:nowrap">$${Number(c.commission_amount_usd||0).toFixed(2)}</div>
        </label>`).join('')}
    </div>`;

  document.getElementById('payout-total').textContent = 'Total selected: $0.00 USD';
  form.hidden = false;
}

function _updatePayoutTotal() {
  const boxes = document.querySelectorAll('#payout-pool input[type="checkbox"]:checked');
  const total = Array.from(boxes).reduce((s, el) => s + Number(el.dataset.amount), 0);
  const el = document.getElementById('payout-total');
  if (el) el.textContent = `Total selected: $${total.toFixed(2)} USD`;
}

async function _createPayout() {
  const boxes = Array.from(document.querySelectorAll('#payout-pool input[type="checkbox"]:checked'));
  if (!boxes.length) { alert('Select at least one commission to include.'); return; }

  const partnerId = document.getElementById('payout-partner').value;
  const commIds   = boxes.map(el => el.value);
  const total     = boxes.reduce((s, el) => s + Number(el.dataset.amount), 0);
  const msg       = document.getElementById('payout-msg');

  const { data: payout, error: pe } = await sb.from('payouts').insert({
    partner_id:        partnerId,
    payout_amount_usd: total,
    commission_ids:    commIds,
    payout_method:     document.getElementById('payout-method').value,
    reference:         document.getElementById('payout-ref').value.trim() || null,
    paid_at:           document.getElementById('payout-date').value || null,
    notes:             document.getElementById('payout-notes').value.trim() || null,
  }).select().single();

  if (pe) { msg.textContent = 'Error: ' + pe.message; msg.style.color = 'var(--red)'; return; }

  const { error: ce } = await sb.from('commissions')
    .update({ status:'paid', payout_id:payout.id }).in('id', commIds);
  if (ce) { msg.textContent = 'Payout created but commission update failed: ' + ce.message; msg.style.color = 'var(--amber)'; return; }

  msg.textContent = `Payout of $${total.toFixed(2)} recorded.`;
  msg.style.color = 'var(--green)';
  setTimeout(() => renderPayouts(), 1500);
}

// ─────────────────────────────────────────────────────────────────────────────
// Ripples Redemptions
// ─────────────────────────────────────────────────────────────────────────────

let _riplFilter = 'requested';

async function renderRipples() {
  const tabs = ['requested','approved','paid','declined','all'];
  setContent(`
    <div class="tabs">
      ${tabs.map(s => `<button class="tab ${_riplFilter===s?'active':''}" onclick="_filterRedemptions('${s}')">${cap(s)}</button>`).join('')}
    </div>
    <div id="ripl-wrap"><div class="loading">Loading…</div></div>
  `);
  await _loadRedemptions();
}

function _filterRedemptions(f) { _riplFilter = f; renderRipples(); }

async function _loadRedemptions() {
  let q = sb.from('redemptions')
    .select('id,redemption_type,ripples_cost,cash_value_usd,payout_method,payout_reference,status,approved_at,paid_at,created_at,concierges(first_name,last_name,ripples_balance,partners(name)),experiences(name)')
    .order('created_at', { ascending:false }).limit(200);
  if (_riplFilter !== 'all') q = q.eq('status', _riplFilter);

  const { data, error } = await q;
  const wrap = document.getElementById('ripl-wrap');
  if (!wrap) return;
  if (error) { wrap.innerHTML = `<div class="empty">Error: ${error.message}</div>`; return; }
  if (!data?.length) { wrap.innerHTML = `<div class="empty">No ${_riplFilter==='all'?'':_riplFilter+' '}redemption requests.</div>`; return; }

  wrap.innerHTML = `
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Concierge</th><th>Partner</th><th>Type</th>
          <th>Ripples</th><th>Cash Value</th><th>Status</th><th>Requested</th><th></th>
        </tr></thead>
        <tbody>
          ${data.map(r => `
            <tr>
              <td>
                <div style="font-weight:500">${r.concierges?.first_name||''} ${r.concierges?.last_name||''}</div>
                <div style="font-size:10px;color:var(--muted)">Balance: ${r.concierges?.ripples_balance||0} ripples</div>
              </td>
              <td style="color:var(--muted)">${r.concierges?.partners?.name||'—'}</td>
              <td>
                <div>${r.redemption_type==='free_tour'?'Free Tour':'Cash Payout'}</div>
                ${r.redemption_type==='free_tour'&&r.experiences?.name?`<div style="font-size:10px;color:var(--muted)">${r.experiences.name}</div>`:''}
                ${r.redemption_type==='cash'&&r.payout_method?`<div style="font-size:10px;color:var(--muted)">${r.payout_method.replace(/_/g,' ')}</div>`:''}
              </td>
              <td style="color:var(--gold);font-weight:600">${r.ripples_cost}</td>
              <td style="color:var(--muted)">${r.cash_value_usd?'$'+Number(r.cash_value_usd).toFixed(2):'—'}</td>
              <td><span class="badge b-${r.status==='requested'?'enquiry':r.status==='approved'?'qualified':r.status==='paid'?'confirmed':'cancelled'}">${r.status}</span></td>
              <td style="color:var(--muted);font-size:12px">${fmtDT(r.created_at)}</td>
              <td style="white-space:nowrap">
                ${r.status==='requested'?`
                  <button class="btn btn-primary" style="padding:5px 10px;font-size:11px;margin-right:4px" onclick="_approveRedemption('${r.id}')">Approve</button>
                  <button class="btn btn-danger" style="padding:5px 10px;font-size:11px" onclick="_declineRedemption('${r.id}')">Decline</button>`:''}
                ${r.status==='approved'?`<button class="btn btn-success" style="padding:5px 10px;font-size:11px" onclick="_markRedemptionPaid('${r.id}')">Mark Paid</button>`:''}
                ${r.payout_reference?`<div style="font-size:10px;color:var(--muted);margin-top:4px">Ref: ${r.payout_reference}</div>`:''}
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>`;
}

async function _approveRedemption(id) {
  const { error } = await sb.from('redemptions').update({ status:'approved', approved_at:new Date().toISOString() }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  _loadRedemptions();
}

async function _declineRedemption(id) {
  if (!confirm('Decline this redemption request?\nThe concierge\'s Ripples balance will not be deducted.')) return;
  const { error } = await sb.from('redemptions').update({ status:'declined' }).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }
  _loadRedemptions();
}

async function _markRedemptionPaid(id) {
  const ref = prompt('Enter payout reference (optional):');
  if (ref === null) return;

  const { data: r } = await sb.from('redemptions').select('concierge_id,ripples_cost').eq('id', id).single();
  if (!r) { alert('Could not load redemption.'); return; }

  const updates = { status:'paid', paid_at:today() };
  if (ref.trim()) updates.payout_reference = ref.trim();

  const { error } = await sb.from('redemptions').update(updates).eq('id', id);
  if (error) { alert('Error: ' + error.message); return; }

  const { data: conc } = await sb.from('concierges').select('ripples_balance,ripples_redeemed_total').eq('id', r.concierge_id).single();
  const newBalance  = Math.max(0, (conc?.ripples_balance || 0) - r.ripples_cost);
  const newRedeemed = (conc?.ripples_redeemed_total || 0) + r.ripples_cost;

  await sb.from('concierges').update({ ripples_balance:newBalance, ripples_redeemed_total:newRedeemed }).eq('id', r.concierge_id);
  await sb.from('ripples_ledger').insert({
    concierge_id: r.concierge_id, redemption_id: id,
    transaction_type: 'redeemed', ripples_delta: -r.ripples_cost, balance_after: newBalance,
  });

  _loadRedemptions();
}

// ─────────────────────────────────────────────────────────────────────────────
// Equipment
// ─────────────────────────────────────────────────────────────────────────────

async function renderEquipment() {
  setContent('<div class="loading">Loading…</div>');
  const { data, error } = await sb.from('equipment').select('*').order('equipment_label');
  if (error) { setContent(`<div class="empty">${error.message}</div>`); return; }

  const flagged = (data||[]).filter(e => e.condition === 'Needs attention' || e.condition === 'Out of service');

  setContent(`
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Label</th><th>Name</th><th>Type</th>
          <th>Condition</th><th>Last Inspection</th><th>Next Due</th><th>Active</th>
        </tr></thead>
        <tbody>
          ${(data||[]).map(eq => `
            <tr>
              <td style="color:var(--gold);font-weight:600;font-size:11px">${eq.equipment_label}</td>
              <td>${eq.name}</td>
              <td style="color:var(--muted)">${eq.type||'—'}</td>
              <td>${condBadge(eq.condition)}</td>
              <td style="color:var(--muted);font-size:12px">${eq.last_inspection_date?fmtDate(eq.last_inspection_date):'—'}</td>
              <td style="color:var(--muted);font-size:12px">${eq.next_inspection_due?fmtDate(eq.next_inspection_due):'—'}</td>
              <td>${eq.active?'<span style="color:var(--green)">✓</span>':'<span style="color:var(--muted)">—</span>'}</td>
            </tr>`).join('')
            || '<tr><td colspan="7" class="empty">No equipment registered</td></tr>'}
        </tbody>
      </table>
    </div>
    ${flagged.length?`<div class="warn-banner">⚠ ${flagged.length} item${flagged.length>1?'s':''} need${flagged.length===1?'s':''} attention: ${flagged.map(e=>e.equipment_label).join(', ')}</div>`:''}
  `);
}

// ─────────────────────────────────────────────────────────────────────────────
// Conservation
// ─────────────────────────────────────────────────────────────────────────────

async function renderConservation() {
  setContent('<div class="loading">Loading…</div>');

  const QUALIFIED = ['confirmed', 'completed', 'paid_in_full'];
  const SLNT_RATE = 0.07;
  const fmtUSD   = n => '$' + Number(n || 0).toFixed(2);

  const [
    { data: bookings     },
    { data: disbursements },
    { data: contributions },
  ] = await Promise.all([
    sb.from('bookings')
      .select('booking_date, group_size, experiences(public_price_usd)')
      .in('status', QUALIFIED).order('booking_date', { ascending: false }).limit(500),
    sb.from('conservation_disbursements')
      .select('*').order('quarter_start', { ascending: false }).limit(20),
    sb.from('conservation_contributions')
      .select('*,bookings(booking_ref,lead_name)').order('created_at', { ascending: false }),
  ]);

  function qLabel(dateStr) {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`;
  }
  function qStart(dateStr) {
    const d = new Date(dateStr);
    const q = Math.floor(d.getMonth() / 3);
    return new Date(d.getFullYear(), q * 3, 1).toISOString().split('T')[0];
  }

  // Group confirmed bookings by quarter
  const quarterMap = {};
  (bookings || []).forEach(bk => {
    const key = qLabel(bk.booking_date);
    if (!key) return;
    const gross = (bk.experiences?.public_price_usd || 0) * (bk.group_size || 0);
    if (!quarterMap[key]) quarterMap[key] = { label: key, start: qStart(bk.booking_date), revenue: 0, levy: 0, count: 0 };
    quarterMap[key].revenue += gross;
    quarterMap[key].levy    += gross * SLNT_RATE;
    quarterMap[key].count   += 1;
  });
  const quarters        = Object.values(quarterMap);
  const disbursedLabels = new Set((disbursements || []).map(d => d.period_label));
  const undisbursed     = quarters.filter(q => !disbursedLabels.has(q.label));

  const contTotal = (contributions || []).reduce((s, c) => s + Number(c.amount_xcd || 0), 0);
  const inp = `background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);font-size:13px;padding:9px 12px;width:100%;margin-top:4px`;

  setContent(`
    <div class="sh" style="margin-bottom:16px">
      <h3>SLNT Stewardship Levy — 7% of Net Tour Revenue</h3>
    </div>

    <div style="display:grid;grid-template-columns:360px 1fr;gap:20px;align-items:start;margin-bottom:40px">

      <div class="detail-panel" style="padding:20px">
        <div class="sh" style="margin-bottom:14px"><h3>Record Disbursement</h3></div>
        <div id="disb-msg" style="font-size:12px;margin-bottom:10px"></div>

        <div style="margin-bottom:12px">
          <div class="df-label">Quarter</div>
          <select id="disb-quarter" style="${inp};cursor:pointer" onchange="_prefillDisbursement()">
            <option value="">— Select quarter —</option>
            ${undisbursed.map(q =>
              `<option value="${esc(q.label)}" data-start="${q.start}" data-revenue="${q.revenue.toFixed(2)}" data-levy="${q.levy.toFixed(2)}">${q.label} — levy ${fmtUSD(q.levy)}</option>`
            ).join('')}
            <option value="__manual__">Enter manually</option>
          </select>
        </div>

        <div style="margin-bottom:12px">
          <div class="df-label">Quarter Start Date</div>
          <input id="disb-start" type="date" style="${inp}">
        </div>

        <div style="margin-bottom:12px">
          <div class="df-label">Net Revenue USD <span style="color:var(--muted);font-weight:400;font-size:10px">— gross shown, update if FYGARO net differs</span></div>
          <input id="disb-revenue" type="number" step="0.01" min="0" style="${inp}" placeholder="0.00" oninput="_recalcLevy()">
        </div>

        <div style="margin-bottom:12px">
          <div class="df-label">Levy Amount USD — 7%</div>
          <input id="disb-levy" type="number" step="0.01" min="0" style="${inp}" placeholder="0.00">
        </div>

        <div style="margin-bottom:12px">
          <div class="df-label">Date Disbursed</div>
          <input id="disb-date" type="date" style="${inp}" value="${today()}">
        </div>

        <div style="margin-bottom:12px">
          <div class="df-label">Bank Reference / Transfer ID</div>
          <input id="disb-ref" style="${inp}" placeholder="e.g. SLNT-Q3-2026-001">
        </div>

        <div style="margin-bottom:16px">
          <div class="df-label">Notes (optional)</div>
          <textarea id="disb-notes" style="${inp};resize:vertical;min-height:54px"></textarea>
        </div>

        <button class="btn btn-primary" onclick="_recordDisbursement()">Record Disbursement</button>
      </div>

      <div>
        <div class="sh" style="margin-bottom:12px"><h3>Disbursement History</h3></div>
        <div class="table-wrap" style="margin-bottom:28px">
          <table class="tms-table">
            <thead><tr>
              <th>Quarter</th><th>Net Revenue</th><th>Levy (7%)</th><th>Disbursed</th><th>Reference</th>
            </tr></thead>
            <tbody>
              ${(disbursements || []).length
                ? (disbursements || []).map(d => `
                    <tr>
                      <td style="font-weight:600;color:var(--gold)">${d.period_label}</td>
                      <td style="color:var(--muted)">${d.total_net_revenue_usd ? fmtUSD(d.total_net_revenue_usd) : '—'}</td>
                      <td style="color:var(--gold);font-weight:600">${d.levy_usd ? fmtUSD(d.levy_usd) : '—'}</td>
                      <td style="color:var(--muted);font-size:12px">${d.disbursed_at ? fmtDate(d.disbursed_at) : '—'}</td>
                      <td style="font-size:12px;color:var(--muted)">${d.reference || '—'}</td>
                    </tr>`).join('')
                : '<tr><td colspan="5" class="empty">No disbursements recorded yet.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="sh" style="margin-bottom:12px"><h3>Quarterly Accumulation</h3></div>
        <div class="table-wrap">
          <table class="tms-table">
            <thead><tr>
              <th>Quarter</th><th>Bookings</th><th>Revenue (gross)</th><th>7% Levy</th><th>Status</th>
            </tr></thead>
            <tbody>
              ${quarters.length
                ? quarters.map(q => {
                    const isD = disbursedLabels.has(q.label);
                    return `
                      <tr>
                        <td style="font-weight:600">${q.label}</td>
                        <td style="color:var(--muted)">${q.count}</td>
                        <td style="color:var(--muted)">${fmtUSD(q.revenue)}</td>
                        <td style="color:var(--gold);font-weight:600">${fmtUSD(q.levy)}</td>
                        <td><span class="badge ${isD ? 'b-confirmed' : 'b-enquiry'}">${isD ? 'Disbursed' : 'Accumulating'}</span></td>
                      </tr>`;
                  }).join('')
                : '<tr><td colspan="5" class="empty">No confirmed bookings yet</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="sh" style="margin-bottom:12px">
      <h3>Guest Stewardship Contributions</h3>
    </div>
    <div class="cons-hero" style="margin-bottom:16px">
      <div class="cons-total">EC$${contTotal.toFixed(2)}</div>
      <div class="cons-label">Total voluntary contributions to PSEPA Stewardship Fund</div>
    </div>
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Date</th><th>Booking</th><th>Type</th>
          <th>Amount EC$</th><th>Certificate</th><th>Transferred</th>
        </tr></thead>
        <tbody>
          ${(contributions || []).map(c => `
            <tr>
              <td style="color:var(--muted);font-size:12px">${fmtDT(c.created_at)}</td>
              <td>
                <div style="color:var(--gold);font-size:11px;font-weight:600">${c.bookings?.booking_ref || '—'}</div>
                <div style="font-size:11px;color:var(--muted)">${c.bookings?.lead_name || ''}</div>
              </td>
              <td><span class="badge b-enquiry">${c.contribution_type}</span></td>
              <td style="color:var(--gold)">$${Number(c.amount_xcd || 0).toFixed(2)}</td>
              <td>${c.certificate_issued ? '<span style="color:var(--green)">✓</span>' : '<span style="color:var(--muted)">—</span>'}</td>
              <td style="color:var(--muted);font-size:12px">${c.transfer_date ? fmtDate(c.transfer_date) : '—'}</td>
            </tr>`).join('')
            || '<tr><td colspan="6" class="empty">No contributions recorded yet</td></tr>'}
        </tbody>
      </table>
    </div>
  `);
}

function _prefillDisbursement() {
  const sel = document.getElementById('disb-quarter');
  const opt = sel ? sel.options[sel.selectedIndex] : null;
  if (!opt || !opt.value || opt.value === '__manual__') {
    const s = document.getElementById('disb-start');
    if (s) s.value = '';
    return;
  }
  const start   = document.getElementById('disb-start');
  const revenue = document.getElementById('disb-revenue');
  const levy    = document.getElementById('disb-levy');
  if (start)   start.value   = opt.dataset.start   || '';
  if (revenue) revenue.value = opt.dataset.revenue || '';
  if (levy)    levy.value    = opt.dataset.levy    || '';
}

function _recalcLevy() {
  const rev  = parseFloat(document.getElementById('disb-revenue')?.value || 0);
  const levEl = document.getElementById('disb-levy');
  if (levEl) levEl.value = (rev * 0.07).toFixed(2);
}

async function _recordDisbursement() {
  const msg     = document.getElementById('disb-msg');
  const selVal  = document.getElementById('disb-quarter')?.value || '';
  const start   = document.getElementById('disb-start')?.value  || '';
  const revenue = parseFloat(document.getElementById('disb-revenue')?.value || 0);
  const levy    = parseFloat(document.getElementById('disb-levy')?.value    || 0);
  const date    = document.getElementById('disb-date')?.value   || '';
  const ref     = (document.getElementById('disb-ref')?.value   || '').trim();
  const notes   = (document.getElementById('disb-notes')?.value || '').trim();

  let label = selVal === '__manual__' ? prompt('Enter quarter label (e.g. Q3 2026):') : selVal;
  if (!label) { msg.textContent = 'Quarter label is required.'; msg.style.color = 'var(--red)'; return; }
  if (!start) { msg.textContent = 'Quarter start date is required.'; msg.style.color = 'var(--red)'; return; }
  if (!date)  { msg.textContent = 'Disbursement date is required.'; msg.style.color = 'var(--red)'; return; }

  const btn = document.querySelector('[onclick="_recordDisbursement()"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }
  msg.textContent = ''; msg.style.color = '';

  const { error } = await sb.from('conservation_disbursements').insert({
    period_label:          label.trim(),
    quarter_start:         start,
    total_net_revenue_usd: revenue || null,
    levy_usd:              levy    || null,
    disbursed_at:          new Date(date).toISOString(),
    reference:             ref   || null,
    notes:                 notes || null,
  });

  if (btn) { btn.disabled = false; btn.textContent = 'Record Disbursement'; }

  if (error) {
    msg.textContent = 'Error: ' + error.message;
    msg.style.color = 'var(--red)';
    return;
  }

  msg.textContent = `Disbursement for ${label.trim()} recorded.`;
  msg.style.color = 'var(--green)';
  setTimeout(() => renderConservation(), 1200);
}

// ─────────────────────────────────────────────────────────────────────────────
// Waitlist
// ─────────────────────────────────────────────────────────────────────────────

async function renderWaitlist() {
  setContent('<div class="loading">Loading…</div>');
  const { data, error } = await sb.from('waitlist')
    .select('*,experiences(name)')
    .order('created_at', { ascending:false });
  if (error) { setContent(`<div class="empty">${error.message}</div>`); return; }

  setContent(`
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Name</th><th>Email</th><th>Experience</th>
          <th>Occasion</th><th>Flexibility</th><th>Status</th><th>Added</th>
        </tr></thead>
        <tbody>
          ${(data||[]).map(w => `
            <tr>
              <td style="font-weight:500">${w.full_name}</td>
              <td><a href="mailto:${w.email_address}" style="color:var(--gold);font-size:12px">${w.email_address}</a></td>
              <td style="color:var(--muted)">${w.experiences?.name||'Any'}</td>
              <td style="color:var(--muted)">${w.occasion||'—'}</td>
              <td style="color:var(--muted)">${w.flexibility_level||'—'}</td>
              <td><span class="badge ${w.status==='active'?'b-confirmed':'b-completed'}">${w.status}</span></td>
              <td style="color:var(--muted);font-size:12px">${fmtDT(w.created_at)}</td>
            </tr>`).join('')
            || '<tr><td colspan="7" class="empty">Waitlist is empty</td></tr>'}
        </tbody>
      </table>
    </div>`);
}

// ─────────────────────────────────────────────────────────────────────────────
// Utility
// ─────────────────────────────────────────────────────────────────────────────

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
function esc(s) { return (s||'').replace(/"/g,'&quot;'); }

// ─────────────────────────────────────────────────────────────────────────────
// Boot
// ─────────────────────────────────────────────────────────────────────────────

init();
