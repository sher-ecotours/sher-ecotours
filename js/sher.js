// FYGARO PAYMENT LINKS — replace placeholders when live account is approved
// Golden Mirror:        https://fygaro.com/pay/GOLDEN-MIRROR-PLACEHOLDER
// Scorpio's Secret:     https://fygaro.com/pay/SCORPIOS-SECRET-PLACEHOLDER
// Scorpio's Sanctuary:  https://fygaro.com/pay/SCORPIOS-SANCTUARY-PLACEHOLDER

/* ============================================================
   SHER · Sanctuary Experiences — Shared Site Script
   shersanctuary.com
   TODO: confirm shersanctuary.com is the live Netlify domain
   ============================================================ */

// ===== SUPABASE — website form submissions =====
const _SB_URL = 'https://zbklfuhsmnmcwcqcpdxk.supabase.co';
const _SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpia2xmdWhzbW5tY3djcWNwZHhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjMxNzQsImV4cCI6MjA5MzgzOTE3NH0.r6RAWjrMGRu9I31hI9fd7wNRPxAnjR0haHuxmgWuMpc';

// ===== FYGARO PAYMENT URL CONSTANTS =====
const _FYGARO = {
  goldenMirror:       'https://fygaro.com/pay/GOLDEN-MIRROR-PLACEHOLDER',
  calmReflections:    'https://fygaro.com/pay/CALM-REFLECTIONS-PLACEHOLDER',
  scorpiosSecret:     'https://fygaro.com/pay/SCORPIOS-SECRET-PLACEHOLDER',
  scorpiosSanctuary:  'https://fygaro.com/pay/SCORPIOS-SANCTUARY-PLACEHOLDER',
};

// ===== PATH DETECTION =====
const _inPages = /\/pages\//.test(window.location.pathname);
const _R = _inPages ? '../' : '';          // root prefix
const _P = _inPages ? '' : 'pages/';      // pages prefix

// ===== BOOK NOW HREF (adapts to page) =====
function _bookHref() {
  if (document.getElementById('booking'))     return '#booking';
  if (document.getElementById('booking-bar')) return '#booking-bar';
  return '#experiences';
}

// ===== NAV RENDER =====
function _buildNav() {
  const book = _bookHref();

  const mobileMenu = document.getElementById('mobile-menu');
  if (mobileMenu) {
    mobileMenu.innerHTML = `
      <button id="mobile-close" onclick="toggleMobileMenu()" aria-label="Close menu">&#x2715;</button>
      <img src="${_R}images/SHER-nav-logo.png" alt="SHER Saint Lucia" style="max-width:160px;width:100%;height:auto;display:block;margin-bottom:8px;mix-blend-mode:screen"/>
      <a href="${_R}index.html" onclick="toggleMobileMenu()">Home</a>
      <a href="${_R}${_P}golden-mirror.html" onclick="toggleMobileMenu()">Golden Mirror</a>
      <a href="${_R}${_P}calm-reflections.html" onclick="toggleMobileMenu()">Calm Reflections</a>
      <a href="${_R}${_P}scorpios-secret.html" onclick="toggleMobileMenu()">Scorpio's Secret</a>
      <a href="${_R}${_P}book.html" class="btn-primary" onclick="toggleMobileMenu()">Book Now</a>
    `;
  }

  const siteNav = document.getElementById('site-nav');
  if (siteNav) {
    siteNav.innerHTML = `
      <a href="${_R}index.html" class="nav-logo">
        <span class="nav-logo-mark"><img src="${_R}images/SHER-nav-logo.png" alt="SHER Saint Lucia" class="nav-logo-img" style="mix-blend-mode:screen;display:block;"/></span>
      </a>
      <ul class="nav-links">
        <li><a href="${_R}index.html">Home</a></li>
        <li><a href="${_R}${_P}golden-mirror.html">Golden Mirror</a></li>
        <li><a href="${_R}${_P}calm-reflections.html">Calm Reflections</a></li>
        <li><a href="${_R}${_P}scorpios-secret.html">Scorpio's Secret</a></li>
        <li><a href="${_R}${_P}book.html" class="nav-cta">Book Now</a></li>
      </ul>
      <button class="nav-burger" onclick="toggleMobileMenu()" aria-label="Open menu">
        <span></span><span></span><span></span>
      </button>
    `;

    // Mark active link
    const path = window.location.pathname;
    siteNav.querySelectorAll('.nav-links a:not(.nav-cta)').forEach(a => {
      const h = a.getAttribute('href');
      if (h && path.endsWith(h.replace(_R, '').replace(_P, ''))) {
        a.classList.add('active');
      }
    });
  }
}

// ===== FOOTER RENDER =====
function _buildFooter() {
  const footer = document.getElementById('site-footer');
  if (!footer) return;

  const ig = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`;
  const fb = `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`;

  footer.innerHTML = `
    <div class="footer-inner">
      <div>
        <img src="${_R}images/SHER-nav-logo.png" alt="SHER Saint Lucia" class="footer-logo-img"/>
        <p class="footer-location">Savannes Bay, Micoud<br/>Saint Lucia, West Indies</p>
        <a href="mailto:bookings@shersanctuary.com" class="footer-email">bookings@shersanctuary.com</a>
        <a href="https://wa.me/17587165206" class="footer-email" target="_blank" rel="noopener" style="margin-top:6px;display:block">+1 758 716 5206 (WhatsApp)</a>
        <div class="footer-social">
          <a href="#" class="social-link" aria-label="Instagram">${ig}</a>
          <a href="#" class="social-link" aria-label="Facebook">${fb}</a>
        </div>
      </div>
      <div>
        <span class="footer-col-title">Experiences</span>
        <ul class="footer-col-links">
          <li><a href="${_R}${_P}golden-mirror.html">Bay Serenity · Golden Mirror</a></li>
          <li><a href="${_R}${_P}calm-reflections.html">Bay Serenity · Calm Reflections</a></li>
          <li><a href="${_R}${_P}scorpios-secret.html">Scorpio's Secret</a></li>
          <li><a href="${_R}${_P}scorpios-secret.html#sanctuary">Scorpio's Sanctuary</a></li>
          <li><a href="${_R}${_P}table-deau.html">Table d'Eau</a></li>
          <li><a href="${_R}${_P}book.html" style="color:var(--gold-lt)">Book an Experience →</a></li>
        </ul>
      </div>
      <div>
        <span class="footer-col-title">Explore</span>
        <ul class="footer-col-links">
          <li><a href="${_R}index.html#the-bay">The Bay</a></li>
          <li><a href="${_R}index.html#protected">Conservation</a></li>
          <li><a href="${_R}index.html#about">About SHER</a></li>
          <li><a href="${_R}index.html#testimonials">Guest Stories</a></li>
        </ul>
      </div>
      <div>
        <span class="footer-col-title">Contact &amp; Legal</span>
        <ul class="footer-col-links">
          <li><a href="mailto:bookings@shersanctuary.com">Email Us</a></li>
          <li><a href="https://wa.me/17587165206" target="_blank" rel="noopener">WhatsApp</a></li>
          <li><a href="${_R}${_P}privacy-policy.html">Privacy Policy</a></li>
          <li><a href="${_R}${_P}booking-terms.html">Booking Terms</a></li>
          <li><a href="${_R}${_P}safety-standards.html">Safety Standards</a></li>
          <li><a href="${_R}${_P}environmental-policy.html">Environmental Policy</a></li>
          <li><a href="${_R}${_P}press.html">Press Enquiries</a></li>
          <li><a href="${_R}${_P}partners.html" style="opacity:0.45;font-size:11px">Partner Portal</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 SHER Sanctuary Experiences. Savannes Bay, Micoud, Saint Lucia. Operated by Safeport Security Services Limited.</span>
      <div class="footer-bottom-links">
        <a href="${_R}${_P}privacy-policy.html">Privacy Policy</a>
        <a href="${_R}${_P}booking-terms.html">Booking T&amp;Cs</a>
      </div>
    </div>
    <p class="footer-parent">SHER is a trading name of Safeport Security Services Limited, registered in Saint Lucia, West Indies. Payments processed securely by FYGARO.</p>
  `;
}

// ===== MOBILE MENU TOGGLE =====
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (!menu) return;
  const open = menu.classList.toggle('open');
  document.body.style.overflow = open ? 'hidden' : '';
}

// ===== NAV SCROLL STATE =====
function _initNavScroll() {
  const nav = document.getElementById('site-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

// ===== REVEAL ON SCROLL =====
function _initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.10 });
  els.forEach(el => obs.observe(el));
}

// ============================================================
// AUDIO — Ambient Birdsong
// Place audio/birdsong.mp3 in the repository root audio/ folder.
// The toggle button is always visible; audio will play as soon
// as the browser has received a prior user gesture.
// ============================================================

const _audioSrc = _inPages ? '../audio/birdsong.mp3' : 'audio/birdsong.mp3';
let   _bird        = null;   // Audio element
let   _birdReady   = false;  // Element initialised
let   _birdPlaying = false;  // Currently audible
let   _birdFadeId  = null;   // setInterval handle for fade

// SVGs injected into the toggle button
const _iconOn  = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
const _iconOff = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

function _initBird() {
  if (_birdReady) return;
  _bird = new Audio(_audioSrc);
  _bird.loop    = true;
  _bird.volume  = 0;
  _bird.preload = 'auto';
  _birdReady    = true;
}

function _fadeIn(targetVol, durationMs) {
  targetVol  = targetVol  || 0.25;
  durationMs = durationMs || 2000;
  if (!_bird) return;
  clearInterval(_birdFadeId);
  const steps   = 50;
  const stepMs  = durationMs / steps;
  const stepVol = targetVol / steps;

  _bird.play().then(() => {
    _birdPlaying = true;
    _syncToggleUI();
    _birdFadeId = setInterval(() => {
      _bird.volume = Math.min(_bird.volume + stepVol, targetVol);
      if (_bird.volume >= targetVol - 0.001) clearInterval(_birdFadeId);
    }, stepMs);
  }).catch(() => {
    // Browser blocked autoplay — toggle button remains visible for manual start
  });
}

function _fadeOut(durationMs) {
  durationMs = durationMs || 800;
  if (!_bird) return;
  clearInterval(_birdFadeId);
  const startVol = _bird.volume;
  const steps    = 30;
  const stepMs   = durationMs / steps;
  const stepVol  = startVol  / steps;

  _birdFadeId = setInterval(() => {
    _bird.volume = Math.max(_bird.volume - stepVol, 0);
    if (_bird.volume <= 0.001) {
      clearInterval(_birdFadeId);
      _bird.pause();
      _bird.volume  = 0;
      _birdPlaying  = false;
      _syncToggleUI();
    }
  }, stepMs);
}

function _tryPlay() {
  _initBird();
  if (!_birdPlaying) _fadeIn();
}

// Called by the toggle button
function _toggleBird() {
  _initBird();
  if (_birdPlaying) {
    _fadeOut();
  } else {
    _fadeIn();
  }
}

function _syncToggleUI() {
  const btn = document.getElementById('audio-toggle');
  if (!btn) return;
  if (_birdPlaying) {
    btn.classList.add('playing');
    btn.setAttribute('aria-label', 'Mute ambient birdsong');
    btn.innerHTML = _iconOn;
  } else {
    btn.classList.remove('playing');
    btn.setAttribute('aria-label', 'Play ambient birdsong');
    btn.innerHTML = _iconOff;
  }
}

// Track last touch time to prevent double-fire on iOS (touchstart + click)
let _lastTouchMs = 0;

function _injectAudioToggle() {
  const btn = document.createElement('button');
  btn.id    = 'audio-toggle';
  btn.type  = 'button';
  btn.setAttribute('aria-label', 'Play ambient birdsong');
  btn.innerHTML = _iconOff;

  // iOS Safari: touchstart fires before click and avoids the 300ms delay.
  // preventDefault() stops the synthetic click from also firing.
  btn.addEventListener('touchstart', function(e) {
    e.preventDefault();
    _lastTouchMs = Date.now();
    _toggleBird();
  }, { passive: false });

  // Desktop: click fires normally.
  // iOS: skip if touchstart already handled this interaction.
  btn.addEventListener('click', function() {
    if (Date.now() - _lastTouchMs < 600) return;
    _toggleBird();
  });

  document.body.appendChild(btn);
}

function _initAudioTriggers() {
  const path = window.location.pathname;

  // ── Tour pages: attempt autoplay on load (requires prior browser gesture) ──
  const tourPages = ['golden-mirror.html', 'scorpios-secret.html', 'table-deau.html'];
  if (tourPages.some(p => path.includes(p))) {
    _initBird();
    _fadeIn();  // Silently respects browser autoplay policy; toggle is always available
  }

  // ── Tour card clicks on index.html ──
  document.querySelectorAll('.exp-card').forEach(card => {
    card.addEventListener('touchstart', function() { _lastTouchMs = Date.now(); _tryPlay(); }, { passive: true });
    card.addEventListener('click', function() {
      if (Date.now() - _lastTouchMs < 600) return;
      _tryPlay();
    });
  });

  // ── CTA buttons: Book · Reserve · Discover · Enquire ──
  const triggerRx = /\b(Book|Reserve|Discover|Enquire)\b/i;
  document.querySelectorAll(
    'a.btn-primary, a.btn-outline, button.btn-primary, button.btn-outline, a.nav-cta'
  ).forEach(el => {
    if (triggerRx.test(el.textContent || '')) {
      el.addEventListener('touchstart', function() { _lastTouchMs = Date.now(); _tryPlay(); }, { passive: true });
      el.addEventListener('click', function() {
        if (Date.now() - _lastTouchMs < 600) return;
        _tryPlay();
      });
    }
  });
}


// ===== BOOKING MODALS =====
function _buildModals() {
  const svg_card = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`;
  const svg_mail = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`;
  const close = (id) => `<button class="sher-modal-close" onclick="closeSherModal('${id}')" aria-label="Close">&#x2715;</button>`;
  const field = (lbl, inner) => `<div class="sher-modal-field"><label class="sher-modal-label">${lbl}</label>${inner}</div>`;
  const input = (id, type, ph) => `<input class="sher-modal-input" id="${id}" type="${type}" placeholder="${ph}"/>`;
  const sel   = (id, opts) => `<select class="sher-modal-select" id="${id}"><option value="" disabled selected>Select…</option>${opts}</select>`;
  const row   = (a, b) => `<div class="sher-modal-row">${a}${b}</div>`;

  const wrap = document.createElement('div');
  wrap.id = 'sher-modals';
  wrap.innerHTML = `

  <!-- ── GOLDEN MIRROR ── -->
  <div class="sher-modal-overlay" id="modal-golden-mirror" onclick="_modalBg(event,'golden-mirror')">
    <div class="sher-modal">
      ${close('golden-mirror')}
      <span class="sher-modal-eyebrow">Book Your Experience</span>
      <h2 class="sher-modal-title">Bay Serenity &middot; Golden Mirror</h2>
      <p class="sher-modal-price">USD $175 per person &middot; Sunrise Kayak &middot; Maximum 6 guests</p>
      ${field('Preferred Date', `<input class="sher-modal-input" id="gm-date" type="date"/>`)}
      ${field('Number of Guests', sel('gm-guests','<option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option>'))}
      ${field('Full Name', input('gm-name','text','Your full name'))}
      ${row(
        field('Email Address', input('gm-email','email','your@email.com')),
        field('WhatsApp Number', input('gm-phone','tel','+1 758 000 0000'))
      )}
      ${field('Any Special Requests (optional)', `<textarea class="sher-modal-textarea" id="gm-notes" placeholder="Dietary requirements, occasions, accessibility needs…"></textarea>`)}
      <div class="sher-modal-actions">
        <button class="sher-modal-submit" onclick="_fygaroPay('golden-mirror',_FYGARO.goldenMirror,this)">
          ${svg_card} Proceed to Payment
        </button>
      </div>
      <p class="sher-modal-note">We will confirm your booking within 4 hours. Payment is processed securely through FYGARO.</p>
    </div>
  </div>

  <!-- ── CALM REFLECTIONS ── -->
  <div class="sher-modal-overlay" id="modal-calm-reflections" onclick="_modalBg(event,'calm-reflections')">
    <div class="sher-modal">
      ${close('calm-reflections')}
      <span class="sher-modal-eyebrow">Book Your Experience</span>
      <h2 class="sher-modal-title">Bay Serenity &middot; Calm Reflections</h2>
      <p class="sher-modal-price">USD $150 per person &middot; Mid-Morning Kayak &middot; Maximum 6 guests</p>
      ${field('Preferred Date', `<input class="sher-modal-input" id="cr-date" type="date"/>`)}
      ${field('Number of Guests', sel('cr-guests','<option>1</option><option>2</option><option>3</option><option>4</option><option>5</option><option>6</option>'))}
      ${field('Full Name', input('cr-name','text','Your full name'))}
      ${row(
        field('Email Address', input('cr-email','email','your@email.com')),
        field('WhatsApp Number', input('cr-phone','tel','+1 758 000 0000'))
      )}
      ${field('Any Special Requests (optional)', `<textarea class="sher-modal-textarea" id="cr-notes" placeholder="Dietary requirements, occasions, accessibility needs…"></textarea>`)}
      <div class="sher-modal-actions">
        <button class="sher-modal-submit" onclick="_fygaroPay('calm-reflections',_FYGARO.calmReflections,this)">
          ${svg_card} Proceed to Payment
        </button>
      </div>
      <p class="sher-modal-note">We will confirm your booking within 4 hours. Payment is processed securely through FYGARO.</p>
    </div>
  </div>

  <!-- ── SCORPIO'S SECRET ── -->
  <div class="sher-modal-overlay" id="modal-scorpios-secret" onclick="_modalBg(event,'scorpios-secret')">
    <div class="sher-modal">
      ${close('scorpios-secret')}
      <span class="sher-modal-eyebrow">Reserve Your Experience</span>
      <h2 class="sher-modal-title">Scorpio&rsquo;s Secret</h2>
      <p class="sher-modal-price">USD $420 flat rate per couple &middot; All-inclusive &middot; One couple only</p>
      ${field('Preferred Date', `<input class="sher-modal-input" id="ss-date" type="date"/>`)}
      ${field('Occasion', sel('ss-occasion','<option>Proposal</option><option>Wedding / Newlyweds</option><option>Vow Renewal</option><option>Love Revelation</option><option>Anniversary</option><option>Other</option>'))}
      ${row(
        field('Your Name', input('ss-name1','text','Your name')),
        field('Your Partner\'s Name', input('ss-name2','text','Partner\'s name'))
      )}
      ${row(
        field('Email Address', input('ss-email','email','your@email.com')),
        field('WhatsApp Number', input('ss-phone','tel','+1 758 000 0000'))
      )}
      ${field('Any Special Arrangements', `<textarea class="sher-modal-textarea" id="ss-notes" placeholder="Details seen only by your SHER guide…"></textarea>`)}
      <div class="sher-modal-actions">
        <button class="sher-modal-submit" onclick="_fygaroPay('scorpios-secret',_FYGARO.scorpiosSecret,this)">
          ${svg_card} Proceed to Payment
        </button>
      </div>
      <p class="sher-modal-note">This experience is completely private. Details shared here are seen only by your SHER guide.</p>
    </div>
  </div>

  <!-- ── SCORPIO'S SANCTUARY ── -->
  <div class="sher-modal-overlay" id="modal-scorpios-sanctuary" onclick="_modalBg(event,'scorpios-sanctuary')">
    <div class="sher-modal">
      ${close('scorpios-sanctuary')}
      <span class="sher-modal-eyebrow">Reserve Your Experience</span>
      <h2 class="sher-modal-title">Scorpio&rsquo;s Sanctuary</h2>
      <p class="sher-modal-price">USD $600 flat rate &middot; Two couples &middot; All-inclusive &middot; Shared booking only</p>
      ${field('Preferred Date', `<input class="sher-modal-input" id="san-date" type="date"/>`)}
      ${field('Occasion', sel('san-occasion','<option>Wedding / Newlyweds</option><option>Anniversary</option><option>Celebration</option><option>Other</option>'))}
      ${row(
        field('Couple 1 — Name', input('san-c1a','text','Name')),
        field('Couple 1 — Partner', input('san-c1b','text','Partner\'s name'))
      )}
      ${row(
        field('Couple 2 — Name', input('san-c2a','text','Name')),
        field('Couple 2 — Partner', input('san-c2b','text','Partner\'s name'))
      )}
      ${row(
        field('Email Address', input('san-email','email','your@email.com')),
        field('WhatsApp Number', input('san-phone','tel','+1 758 000 0000'))
      )}
      ${field('Any Special Arrangements (optional)', `<textarea class="sher-modal-textarea" id="san-notes" placeholder="Let us know anything that would help us arrange your experience…"></textarea>`)}
      <div class="sher-modal-actions">
        <button class="sher-modal-submit" onclick="_fygaroPay('scorpios-sanctuary',_FYGARO.scorpiosSanctuary,this)">
          ${svg_card} Proceed to Payment
        </button>
      </div>
      <p class="sher-modal-note">Both couples must book together. Strangers are never paired.</p>
    </div>
  </div>

  <!-- ── TABLE D'EAU ── -->
  <div class="sher-modal-overlay" id="modal-table-deau" onclick="_modalBg(event,'table-deau')">
    <div class="sher-modal">
      ${close('table-deau')}
      <span class="sher-modal-eyebrow">Register Your Interest</span>
      <h2 class="sher-modal-title">Be Among the First</h2>
      <p class="sher-modal-price">Table d&rsquo;Eau &middot; Launching 2026 &middot; No payment required now</p>
      ${field('Full Name', input('td-name','text','Your full name'))}
      ${field('Email Address', input('td-email','email','your@email.com'))}
      ${field('You Are', sel('td-prop','<option>Staying at a resort</option><option>Villa guest</option><option>Local resident</option><option>Other</option>'))}
      ${field('Preferred Experience', sel('td-exp','<option>L\'Aube — one couple</option><option>L\'Estuaire — two couples</option>'))}
      ${field('Anything you would like us to know (optional)', `<textarea class="sher-modal-textarea" id="td-notes" placeholder="Occasion, special requirements, questions…"></textarea>`)}
      <div class="sher-modal-actions">
        <button class="sher-modal-submit" onclick="_submitTableDeau()">
          ${svg_mail} Register My Interest
        </button>
      </div>
      <p class="sher-modal-note">No payment required now. We will contact you personally when Table d&rsquo;Eau opens.</p>
    </div>
  </div>
  `;
  document.body.appendChild(wrap);
}

function _fygaroPay(modalId, url, btn) {
  if (url.indexOf('PLACEHOLDER') !== -1) {
    // Pre-launch: show holding message, disable button, auto-close
    btn.innerHTML = 'Enquiry Received';
    btn.disabled  = true;
    btn.style.cssText += ';opacity:0.55;cursor:default;transform:none;box-shadow:none';

    var actions = btn.parentNode;
    var msg = document.createElement('p');
    msg.style.cssText = 'color:#d4a843;font-style:italic;font-family:"Cormorant Garamond",serif;' +
      'font-size:14px;line-height:1.75;margin-top:18px;text-align:center';
    msg.innerHTML = 'Thank you for your interest. Our secure payment system is being finalised. ' +
      'We will contact you within 4 hours to confirm your booking and arrange payment. ' +
      'You can also reach us directly on WhatsApp: ' +
      '<a href="https://wa.me/17587165206" style="color:#d4a843" target="_blank" rel="noopener">+1&nbsp;758&nbsp;716&nbsp;5206</a>';
    actions.appendChild(msg);

    setTimeout(function () { closeSherModal(modalId); }, 5000);
  } else {
    window.open(url, '_blank', 'noopener');
  }
}

function openSherModal(id) {
  const el = document.getElementById('modal-' + id);
  if (!el) return;
  el.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeSherModal(id) {
  const el = document.getElementById('modal-' + id);
  if (!el) return;
  el.classList.remove('open');
  document.body.style.overflow = '';
}
function _modalBg(e, id) {
  if (e.target === document.getElementById('modal-' + id)) closeSherModal(id);
}
function _submitTableDeau() {
  const name  = (document.getElementById('td-name')  || {}).value || '';
  const email = (document.getElementById('td-email') || {}).value || '';
  const prop  = (document.getElementById('td-prop')  || {}).value || '';
  const exp   = (document.getElementById('td-exp')   || {}).value || '';
  const notes = (document.getElementById('td-notes') || {}).value || '';
  const body  = [
    "Table d'Eau Interest Registration",
    '─────────────────────────',
    'Name: ' + name,
    'Email: ' + email,
    'Guest type: ' + prop,
    'Preferred experience: ' + exp,
    '',
    'Notes:',
    notes || '(none)',
  ].join('\n');
  window.location.href = 'mailto:bookings@shersanctuary.com'
    + '?subject=' + encodeURIComponent("Table d'Eau Interest — " + name)
    + '&body=' + encodeURIComponent(body);
}

// ===== ENQUIRY & WAITLIST MODAL TRIGGERS =====

function openEnquiryForm(e) {
  if (e) e.preventDefault();
  // Pre-select experience based on current page
  var expSel = document.getElementById('enq-exp');
  if (expSel && !expSel.value) {
    var p = window.location.pathname;
    var guess = p.includes('golden-mirror')    ? 'Bay Serenity · Golden Mirror ($175/person)'
               : p.includes('calm-reflections') ? 'Bay Serenity · Calm Reflections ($150/person)'
               : p.includes('scorpios-secret')  ? "Scorpio’s Secret ($420/couple)"
               : p.includes('table-deau')        ? "Table d’Eau (Register Interest, 2027+)"
               : '';
    if (guess) Array.from(expSel.options).forEach(function(o){ if(o.value===guess) o.selected=true; });
  }
  openSherModal('enquiry');
}

function openWaitlistForm(e) {
  if (e) e.preventDefault();
  openSherModal('waitlist');
}

// ── Field value helper ──
function _v(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ── Supabase insert helper ──
function _sbInsert(table, data, onSuccess, btnEl) {
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Sending…'; }
  fetch(_SB_URL + '/rest/v1/' + table, {
    method  : 'POST',
    headers : {
      'apikey'       : _SB_KEY,
      'Authorization': 'Bearer ' + _SB_KEY,
      'Content-Type' : 'application/json',
      'Prefer'       : 'return=minimal'
    },
    body: JSON.stringify(data)
  })
  .then(onSuccess)
  .catch(onSuccess);
}

// ── Enquiry form submit ──
function _submitEnquiry() {
  var required = ['enq-name','enq-email','enq-phone','enq-exp','enq-date','enq-guests'];
  var missing = required.filter(function(id){ return !_v(id); });
  if (missing.length) {
    missing.forEach(function(id){
      var el = document.getElementById(id);
      if (el) { el.style.borderColor = 'rgba(192,57,43,0.8)'; el.focus(); }
    });
    return;
  }
  var btn = document.getElementById('enq-submit-btn');
  _sbInsert('enquiries', {
    full_name:        _v('enq-name'),
    email_address:    _v('enq-email'),
    whatsapp_phone:   _v('enq-phone'),
    experience:       _v('enq-exp'),
    preferred_date:   _v('enq-date'),
    number_of_guests: _v('enq-guests'),
    special_occasion: _v('enq-occasion'),
    how_heard:        _v('enq-source'),
    notes:            _v('enq-notes')
  }, _showEnquirySuccess, btn);
}

function _showEnquirySuccess() {
  var inner = document.querySelector('#modal-enquiry .sher-modal');
  if (!inner) return;
  inner.innerHTML =
    '<span class="sher-modal-eyebrow">Received</span>' +
    '<h2 class="sher-modal-title" style="margin-bottom:18px">Thank you</h2>' +
    '<p style="font-size:15px;font-weight:300;color:rgba(240,230,200,0.72);line-height:1.85;margin-bottom:28px">' +
      'Thank you — we will be in touch within 24 hours.' +
    '</p>' +
    '<button class="sher-modal-submit" onclick="closeSherModal(\'enquiry\')">Close</button>';
}

// ── Waitlist form submit ──
function _submitWaitlist() {
  var required = ['wl-name','wl-email','wl-phone','wl-exp','wl-from','wl-until','wl-contact'];
  var missing = required.filter(function(id){ return !_v(id); });
  if (missing.length) {
    missing.forEach(function(id){
      var el = document.getElementById(id);
      if (el) { el.style.borderColor = 'rgba(192,57,43,0.8)'; el.focus(); }
    });
    return;
  }
  var btn = document.getElementById('wl-submit-btn');
  _sbInsert('waitlist', {
    full_name:          _v('wl-name'),
    email_address:      _v('wl-email'),
    whatsapp_phone:     _v('wl-phone'),
    available_from:     _v('wl-from'),
    available_until:    _v('wl-until'),
    experience:         _v('wl-exp'),
    contact_preference: _v('wl-contact')
  }, _showWaitlistSuccess, btn);
}

function _showWaitlistSuccess() {
  var inner = document.querySelector('#modal-waitlist .sher-modal');
  if (!inner) return;
  inner.innerHTML =
    '<span class="sher-modal-eyebrow">You are on our list</span>' +
    '<h2 class="sher-modal-title" style="margin-bottom:18px">Thank you</h2>' +
    '<p style="font-size:15px;font-weight:300;color:rgba(240,230,200,0.72);line-height:1.85;margin-bottom:28px">' +
      'You are on our availability list. We will be in touch when a slot opens.' +
      '</p>' +
    '<button class="sher-modal-submit" onclick="closeSherModal(\'waitlist\')">Close</button>';
}

// Close any open modal on ESC
document.addEventListener('keydown', function(e) {
  if (e.key !== 'Escape') return;
  document.querySelectorAll('.sher-modal-overlay.open').forEach(function(el) {
    el.classList.remove('open');
  });
  document.body.style.overflow = '';
});

// ===== ENQUIRY & WAITLIST MODALS =====
function _buildEnquiryModals() {
  var expOpts = [
    'Bay Serenity · Golden Mirror ($175/person)',
    'Bay Serenity · Calm Reflections ($150/person)',
    "Scorpio's Secret ($420/couple)",
    "Scorpio's Sanctuary ($600/two couples)",
    'The Proposal ($550/couple)',
    'The Anniversary ($620/couple)',
    'The Vow Renewal ($720/couple)',
    'The Birthday Sanctuary (from $480)',
    'The Sanctuary Table ($820 flat)',
    "Table d'Eau (Register Interest, 2027+)",
    'Not sure yet — tell me more'
  ].map(function(v){ return '<option value="'+v+'">'+v+'</option>'; }).join('');

  var div = document.createElement('div');
  div.innerHTML =

  // ── GUEST ENQUIRY FORM (Form 1) ──────────────────────────────────────────
  '<div class="sher-modal-overlay" id="modal-enquiry" onclick="_modalBg(event,\'enquiry\')">' +
    '<div class="sher-modal">' +
      '<button class="sher-modal-close" onclick="closeSherModal(\'enquiry\')" aria-label="Close">&#x2715;</button>' +
      '<span class="sher-modal-eyebrow">Request Your Window</span>' +
      '<h2 class="sher-modal-title">Private Tour Enquiry</h2>' +
      '<p class="sher-modal-price">We respond personally within 24 hours — never by automated reply.</p>' +

      '<div class="sher-modal-field"><label class="sher-modal-label">Full Name</label>' +
        '<input class="sher-modal-input" id="enq-name" type="text" placeholder="Your full name"/></div>' +

      '<div class="sher-modal-row">' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Email Address</label>' +
          '<input class="sher-modal-input" id="enq-email" type="email" placeholder="your@email.com"/></div>' +
        '<div class="sher-modal-field"><label class="sher-modal-label">WhatsApp / Phone Number</label>' +
          '<input class="sher-modal-input" id="enq-phone" type="tel" placeholder="+1 758 000 0000"/></div>' +
      '</div>' +

      '<div class="sher-modal-field"><label class="sher-modal-label">Which experience are you interested in?</label>' +
        '<select class="sher-modal-select" id="enq-exp"><option value="" disabled selected>Select an experience…</option>'+expOpts+'</select></div>' +

      '<div class="sher-modal-row">' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Preferred Date</label>' +
          '<input class="sher-modal-input" id="enq-date" type="date"/></div>' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Number of guests</label>' +
          '<select class="sher-modal-select" id="enq-guests">' +
            '<option value="" disabled selected>Select…</option>' +
            '<option>1</option><option>2</option><option>3</option>' +
            '<option>4</option><option>5</option><option>6</option>' +
          '</select></div>' +
      '</div>' +

      '<div class="sher-modal-row">' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Is this for a special occasion?</label>' +
          '<select class="sher-modal-select" id="enq-occasion">' +
            '<option value="None">None</option><option>Proposal</option>' +
            '<option>Anniversary</option><option>Vow Renewal</option><option>Birthday</option><option>Other</option>' +
          '</select></div>' +
        '<div class="sher-modal-field"><label class="sher-modal-label">How did you hear about SHER?</label>' +
          '<select class="sher-modal-select" id="enq-source">' +
            '<option value="">Prefer not to say</option>' +
            '<option value="Resort concierge">Resort concierge</option>' +
            '<option value="Google">Google</option>' +
            '<option value="Social media">Social media</option>' +
            '<option value="Friend">Friend</option>' +
            '<option value="Other">Other</option>' +
          '</select></div>' +
      '</div>' +

      '<div class="sher-modal-field"><label class="sher-modal-label">Anything else? (optional)</label>' +
        '<textarea class="sher-modal-textarea" id="enq-notes" placeholder="Access needs, celebration details, questions…"></textarea></div>' +

      '<div class="sher-modal-actions">' +
        '<button class="sher-modal-submit" id="enq-submit-btn" onclick="_submitEnquiry()">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
          ' Request a Private Tour Window' +
        '</button>' +
      '</div>' +
      '<p class="sher-modal-note">We will never share your details. You will receive a personal reply — not an automated email.</p>' +
    '</div>' +
  '</div>' +

  // ── DATE FLEXIBILITY / WAITLIST (Form 2) ─────────────────────────────────
  '<div class="sher-modal-overlay" id="modal-waitlist" onclick="_modalBg(event,\'waitlist\')">' +
    '<div class="sher-modal">' +
      '<button class="sher-modal-close" onclick="closeSherModal(\'waitlist\')" aria-label="Close">&#x2715;</button>' +
      '<span class="sher-modal-eyebrow">Availability List</span>' +
      '<h2 class="sher-modal-title">Tell Us Your Window</h2>' +
      '<p class="sher-modal-price">We will contact you the moment a matching slot opens — before any public announcement.</p>' +

      '<div class="sher-modal-field"><label class="sher-modal-label">Full Name</label>' +
        '<input class="sher-modal-input" id="wl-name" type="text" placeholder="Your full name"/></div>' +

      '<div class="sher-modal-row">' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Email Address</label>' +
          '<input class="sher-modal-input" id="wl-email" type="email" placeholder="your@email.com"/></div>' +
        '<div class="sher-modal-field"><label class="sher-modal-label">WhatsApp / Phone Number</label>' +
          '<input class="sher-modal-input" id="wl-phone" type="tel" placeholder="+1 758 000 0000"/></div>' +
      '</div>' +

      '<div class="sher-modal-row">' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Available from</label>' +
          '<input class="sher-modal-input" id="wl-from" type="date"/></div>' +
        '<div class="sher-modal-field"><label class="sher-modal-label">Available until</label>' +
          '<input class="sher-modal-input" id="wl-until" type="date"/></div>' +
      '</div>' +

      '<div class="sher-modal-field"><label class="sher-modal-label">Which experience?</label>' +
        '<select class="sher-modal-select" id="wl-exp"><option value="" disabled selected>Select an experience…</option>'+expOpts+'</select></div>' +

      '<div class="sher-modal-field"><label class="sher-modal-label">How would you like us to contact you?</label>' +
        '<select class="sher-modal-select" id="wl-contact">' +
          '<option value="" disabled selected>Select…</option>' +
          '<option value="Contact me when anything opens">Contact me when anything opens</option>' +
          '<option value="My specific window only">My specific window only</option>' +
        '</select></div>' +

      '<div class="sher-modal-actions">' +
        '<button class="sher-modal-submit" id="wl-submit-btn" onclick="_submitWaitlist()">' +
          '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>' +
          ' Add Me to the Availability List' +
        '</button>' +
      '</div>' +
      '<p class="sher-modal-note">You will hear from us personally. We never send automated availability alerts.</p>' +
    '</div>' +
  '</div>';

  document.body.appendChild(div);
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  _buildNav();
  _buildFooter();
  _initNavScroll();
  _initReveal();
  _injectAudioToggle();
  _initAudioTriggers();
  _buildModals();
  _buildEnquiryModals();
});
