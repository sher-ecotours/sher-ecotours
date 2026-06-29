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
    { data: recent },
    { data: todayOccasions }
  ] = await Promise.all([
    sb.from('bookings').select('*', { count:'exact', head:true }).eq('status','enquiry').neq('source','partner'),
    sb.from('bookings').select('*', { count:'exact', head:true }).eq('source','partner').eq('status','enquiry'),
    sb.from('bookings').select('*', { count:'exact', head:true }).eq('booking_date', td).eq('status','confirmed'),
    sb.from('bookings').select('*', { count:'exact', head:true }).gte('booking_date', wStart).lte('booking_date', wEnd).in('status',['confirmed','completed']),
    sb.from('partners').select('*', { count:'exact', head:true }).eq('status','active'),
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

  // Update partner requests badge in sidebar
  const prBadge = document.getElementById('pr-badge');
  if (prBadge) {
    prBadge.textContent = partnerPending || 0;
    prBadge.style.display = partnerPending > 0 ? 'inline' : 'none';
  }

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

async function renderPartners() {
  setContent('<div class="loading">Loading…</div>');
  const { data, error } = await sb.from('partners').select('*').order('name');
  if (error) { setContent(`<div class="empty">${error.message}</div>`); return; }

  if (!data?.length) { setContent('<div class="empty">No partners registered yet.</div>'); return; }

  setContent(`
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Partner</th><th>Type</th><th>Contact</th>
          <th>Commission</th><th>FAM Tour</th><th>Status</th><th>Since</th>
        </tr></thead>
        <tbody>
          ${data.map(p => `
            <tr>
              <td style="font-weight:500">${p.name}</td>
              <td style="color:var(--muted)">${p.type||'—'}</td>
              <td>
                <div>${p.contact_name||'—'}</div>
                ${p.contact_email?`<div style="font-size:11px;color:var(--muted)">${p.contact_email}</div>`:''}
              </td>
              <td style="color:var(--gold)">${p.commission_rate?Number(p.commission_rate)+'%':'—'}</td>
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
  const { data, error } = await sb.from('conservation_contributions')
    .select('*,bookings(booking_ref,lead_name)')
    .order('created_at', { ascending:false });

  const total = (data||[]).reduce((s,c) => s + Number(c.amount_xcd||0), 0);

  setContent(`
    <div class="cons-hero">
      <div class="cons-total">EC$${total.toFixed(2)}</div>
      <div class="cons-label">Total contributed to PSEPA Stewardship Fund</div>
    </div>
    <div class="table-wrap">
      <table class="tms-table">
        <thead><tr>
          <th>Date</th><th>Booking</th><th>Type</th>
          <th>Amount EC$</th><th>Certificate</th><th>Transferred</th>
        </tr></thead>
        <tbody>
          ${(data||[]).map(c => `
            <tr>
              <td style="color:var(--muted);font-size:12px">${fmtDT(c.created_at)}</td>
              <td>
                <div style="color:var(--gold);font-size:11px;font-weight:600">${c.bookings?.booking_ref||'—'}</div>
                <div style="font-size:11px;color:var(--muted)">${c.bookings?.lead_name||''}</div>
              </td>
              <td><span class="badge b-enquiry">${c.contribution_type}</span></td>
              <td style="color:var(--gold)">$${Number(c.amount_xcd||0).toFixed(2)}</td>
              <td>${c.certificate_issued?'<span style="color:var(--green)">✓</span>':'<span style="color:var(--muted)">—</span>'}</td>
              <td style="color:var(--muted);font-size:12px">${c.transfer_date?fmtDate(c.transfer_date):'—'}</td>
            </tr>`).join('')
            || '<tr><td colspan="6" class="empty">No contributions recorded yet</td></tr>'}
        </tbody>
      </table>
    </div>`);
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
