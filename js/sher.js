/* ============================================================
   SHER · Eco Sanctuary — Shared Site Script
   safehavenecotours.com
   ============================================================ */

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
      <span class="tagline">Nature Whispers · Souls Listen</span>
      <a href="${_R}index.html" onclick="toggleMobileMenu()">Home</a>
      <a href="${_R}${_P}golden-mirror.html" onclick="toggleMobileMenu()">Golden Mirror</a>
      <a href="${_R}${_P}scorpios-secret.html" onclick="toggleMobileMenu()">Scorpio's Secret</a>
      <a href="${_R}${_P}table-deau.html" onclick="toggleMobileMenu()">Table d'Eau</a>
      <a href="${book}" class="btn-primary" onclick="toggleMobileMenu()">Book Now</a>
    `;
  }

  const siteNav = document.getElementById('site-nav');
  if (siteNav) {
    siteNav.innerHTML = `
      <a href="${_R}index.html" class="nav-logo">
        <span class="nav-logo-name">SHER</span>
        <span class="nav-logo-sub">Eco Sanctuary</span>
      </a>
      <ul class="nav-links">
        <li><a href="${_R}index.html">Home</a></li>
        <li><a href="${_R}${_P}golden-mirror.html">Golden Mirror</a></li>
        <li><a href="${_R}${_P}scorpios-secret.html">Scorpio's Secret</a></li>
        <li><a href="${_R}${_P}table-deau.html">Table d'Eau</a></li>
        <li><a href="${book}" class="nav-cta">Book Now</a></li>
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
        <div class="footer-brand-name">SHER</div>
        <span class="footer-brand-sub">Eco Sanctuary</span>
        <p class="footer-tagline-line">Nature Whispers · Souls Listen</p>
        <p class="footer-location">Savannes Bay · Micoud · Saint Lucia</p>
        <a href="mailto:bookings@safehavenecotours.com" class="footer-email">bookings@safehavenecotours.com</a>
        <div class="footer-social">
          <a href="#" class="social-link" aria-label="Instagram">${ig}</a>
          <a href="#" class="social-link" aria-label="Facebook">${fb}</a>
        </div>
      </div>
      <div>
        <span class="footer-col-title">Experiences</span>
        <ul class="footer-col-links">
          <li><a href="${_R}${_P}golden-mirror.html">Bay Serenity · Golden Mirror</a></li>
          <li><a href="${_R}${_P}scorpios-secret.html">Scorpio's Secret</a></li>
          <li><a href="${_R}${_P}scorpios-secret.html#sanctuary">Scorpio's Sanctuary</a></li>
          <li><a href="${_R}${_P}table-deau.html">Table d'Eau</a></li>
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
        <span class="footer-col-title">Contact</span>
        <ul class="footer-col-links">
          <li><a href="mailto:bookings@safehavenecotours.com">Email Us</a></li>
          <li><a href="${_R}index.html#about">Safety Standards</a></li>
          <li><a href="${_R}index.html#about">Environmental Policy</a></li>
          <li><a href="#">Press Enquiries</a></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© 2026 Safe Haven Eco Resort. Savannes Bay, Micoud, Saint Lucia. Operated by Safeport Security Services Limited.</span>
      <div class="footer-bottom-links">
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
        <a href="#">Booking T&Cs</a>
      </div>
    </div>
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

function _injectAudioToggle() {
  const btn = document.createElement('button');
  btn.id = 'audio-toggle';
  btn.setAttribute('aria-label', 'Play ambient birdsong');
  btn.innerHTML = _iconOff;
  btn.addEventListener('click', _toggleBird);
  document.body.appendChild(btn);
}

function _initAudioTriggers() {
  const path = window.location.pathname;

  // ── Tour pages: attempt autoplay on load (requires prior browser gesture) ──
  const tourPages = ['golden-mirror.html', 'scorpios-secret.html', 'table-deau.html'];
  if (tourPages.some(p => path.includes(p))) {
    _initBird();
    _fadeIn();  // Will silently fail if browser blocks; toggle remains available
  }

  // ── Tour card clicks on index.html ──
  document.querySelectorAll('.exp-card').forEach(card => {
    card.addEventListener('click', _tryPlay);
  });

  // ── CTA buttons: Book · Reserve · Discover · Enquire ──
  const triggerRx = /\b(Book|Reserve|Discover|Enquire)\b/i;
  document.querySelectorAll(
    'a.btn-primary, a.btn-outline, button.btn-primary, button.btn-outline, a.nav-cta'
  ).forEach(el => {
    if (triggerRx.test(el.textContent || '')) {
      el.addEventListener('click', _tryPlay);
    }
  });
}

// ===== BOOT =====
document.addEventListener('DOMContentLoaded', () => {
  _buildNav();
  _buildFooter();
  _initNavScroll();
  _initReveal();
  _injectAudioToggle();
  _initAudioTriggers();
});
