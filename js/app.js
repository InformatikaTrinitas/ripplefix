// ============================================================
// RIPPLE — app.js
// Main Application Controller (SPA Router + All Sections)
// ============================================================

import {
  state, LAYERS, DAILY_QUESTIONS, ONBOARDING_QUESTIONS,
  generateMirrorNarrative, generateCityFeatures, BUTTERFLY_CHAINS,
  clamp, globeColorFromHealth, scoreToHealth
} from './data.js';
import { GlobeRenderer, MiniGlobe } from './globe.js';
import { RippleEngine, GlobalRippleMap } from './ripple.js';

// ── Globals ───────────────────────────────────────────────────
let globeLanding = null;
let globeMirror = null;
let globeFull = null;
let miniGlobe = null;
let rippleEngine = null;
let globalMap = null;

let currentSection = 'landing';
let onboardingStep = 0;
let onboardingData = {};
let currentDailyTab = 'mind';

// ── DOM Refs ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  await initGlobes();
  initRippleOverlay();
  initNav();
  renderLanding();
  
  // Initialize Integrated Sections (Daily Input & Ripple Mind)
  // We initialize them on load so they are ready for the long-scrolling landing page
  if (window.DAILY && window.DAILY.init) window.DAILY.init();
  if (window.MIND && window.MIND.init) window.MIND.init();

  showSection('landing');

  // Populate Profile Dashboard Data & Sidebar
  if (localStorage.getItem('ripple_auth') === 'true') {
    const name = localStorage.getItem('ripple_name') || 'Pelajar';
    const cleanName = name.split('@')[0];
    const avatarUrl = `url('https://api.dicebear.com/7.x/notionists/svg?seed=${cleanName}&backgroundColor=f97316')`;

    // Profile Page
    const pMission = document.getElementById('p-mission');

    if (pName) pName.textContent = cleanName;
    if (pEmail) pEmail.textContent = name.includes('@') ? name : `${cleanName.toLowerCase().replace(/\s/g, '')}@earthmirror.id`;
    if (pAv) pAv.style.backgroundImage = avatarUrl;
    if (pMission) pMission.textContent = localStorage.getItem('ripple_mission') || 'Menyelamatkan Lingkungan';

    const sIG = localStorage.getItem('ripple_ig') || '';
    const sX = localStorage.getItem('ripple_x') || '';
    const sFB = localStorage.getItem('ripple_fb') || '';
    const pSocIG = document.getElementById('p-soc-ig');
    const pSocX = document.getElementById('p-soc-x');
    const pSocFB = document.getElementById('p-soc-fb');

    if (pSocIG) { pSocIG.href = sIG || '#'; pSocIG.style.opacity = sIG ? '1' : '0.5'; pSocIG.style.pointerEvents = sIG ? 'auto' : 'none'; }
    if (pSocX) { pSocX.href = sX || '#'; pSocX.style.opacity = sX ? '1' : '0.5'; pSocX.style.pointerEvents = sX ? 'auto' : 'none'; }
    if (pSocFB) { pSocFB.href = sFB || '#'; pSocFB.style.opacity = sFB ? '1' : '0.5'; pSocFB.style.pointerEvents = sFB ? 'auto' : 'none'; }

    // Sidebar Profile
    const sName = document.getElementById('nav-profile-name');
    const sAv = document.getElementById('nav-profile-avatar');
    if (sName) sName.textContent = cleanName;
    if (sAv) sAv.style.backgroundImage = avatarUrl;
  }

  // Check auth intro overlay
  const introOverlay = document.getElementById('welcome-intro');
  if (introOverlay) {
    if (localStorage.getItem('ripple_intro') === 'pending') {
      const name = localStorage.getItem('ripple_name') || 'Pelajar';
      const type = localStorage.getItem('ripple_intro_type') || 'login';
      const title = document.getElementById('welcome-title');
      const desc = document.getElementById('welcome-desc');

      const displayName = name.length > 15 ? name.split('@')[0] : name;

      if (type === 'register') {
        title.innerHTML = `Halo, <span style="color:#f97316;">${displayName}</span>!`;
        desc.innerHTML = `Selamat datang di RIPPLE Bumi.<br>Akunmu berhasil disinkronisasi dengan jaringan 12.4 juta pelajar lainnya.<br>Setiap tindakan kecilmu sekarang akan terekam oleh Earth Mirror.`;
      } else {
        title.innerHTML = `Selamat datang kembali, <span style="color:#f97316;">${displayName}</span>!`;
        desc.innerHTML = `Sistem RIPPLE telah memuat Earth Mirror-mu.<br>Siap untuk membuat dampak positif hari ini?`;
      }
      introOverlay.style.display = 'flex';
    } else {
      introOverlay.style.display = 'none';
      introOverlay.remove();
    }
  }

  // Check onboarding state
  const saved = localStorage.getItem('ripple_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      Object.assign(state, parsed);
      updateAllGlobes();
    } catch (_) { }
  }

  // Start ambient ripples
  setTimeout(() => rippleEngine?.startAmbient(), 2000);

  // Pre-populate Earth Mirror panel so it's ready when user navigates there
  setTimeout(() => populateEarthMirrorPanel(), 1500);

  // Global state sync listener
  window.addEventListener('ripple-state-update', () => {
    updateAllGlobes();
    saveState();
  });
});


// ── Globe Init ────────────────────────────────────────────────
async function initGlobes() {
  // Landing globe (right-column visual — 440px fixed)
  const landingCanvas = $('globe-canvas-landing');
  if (landingCanvas) {
    landingCanvas.width = 440;
    landingCanvas.height = 440;
    globeLanding = new GlobeRenderer(landingCanvas, {
      size: 440, health: state.globeHealth, autoRotate: true, interactive: false,
    });
    await globeLanding.init();
  }

  // Sidebar mirror globe
  const mirrorCanvas = $('globe-canvas-mirror');
  if (mirrorCanvas) {
    mirrorCanvas.width = 200;
    mirrorCanvas.height = 200;
    globeMirror = new GlobeRenderer(mirrorCanvas, {
      size: 200, health: state.globeHealth, autoRotate: true, interactive: true,
    });
    await globeMirror.init();
  }

  // Full mirror page globe
  const fullCanvas = $('globe-canvas-full');
  if (fullCanvas) {
    fullCanvas.width = 480;
    fullCanvas.height = 480;
    globeFull = new GlobeRenderer(fullCanvas, {
      size: 480, health: state.globeHealth, autoRotate: true, interactive: true,
    });
    await globeFull.init();
  }

  // Nav mini globe
  const navCanvas = $('nav-globe-canvas');
  if (navCanvas) {
    navCanvas.width = 32;
    navCanvas.height = 32;
    miniGlobe = new MiniGlobe(navCanvas, state.globeHealth);
    await miniGlobe.init();
  }
}

function updateAllGlobes() {
  state.globeHealth = scoreToHealth(state.totalScore);
  [globeLanding, globeMirror, globeFull, miniGlobe].forEach(g => {
    if (g) g.setHealth(state.globeHealth);
  });
  updateMirrorUI();
}

// ── Ripple Init ───────────────────────────────────────────────
function initRippleOverlay() {
  const svg = $('ripple-svg');
  if (!svg) return;
  rippleEngine = new RippleEngine(svg);
  rippleEngine.start();
}

// ── Navigation ────────────────────────────────────────────────
function initNav() {
  // Inject hamburger toggle button and overlay
  if (!document.querySelector('.nav-toggle-btn')) {
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'nav-toggle-btn';
    toggleBtn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>`;
    document.body.appendChild(toggleBtn);

    const overlay = document.createElement('div');
    overlay.id = 'nav-overlay';
    document.body.appendChild(overlay);

    toggleBtn.addEventListener('click', () => {
      document.body.classList.add('nav-open');
    });

    overlay.addEventListener('click', () => {
      document.body.classList.remove('nav-open');
    });
  }

  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.body.classList.remove('nav-open'); // Auto close on click

      let sec = btn.dataset.nav;

      // If already on landing flow and nav to daily/mind, just scroll
      if ((sec === 'daily' || sec === 'mind') && currentSection === 'landing') {
        const targetEl = document.getElementById(`section-${sec}`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }

      if (sec === 'daily') {
        if (!state.onboarded) { showSection('onboarding'); return; }
        // Initialize Daily section logic/canvases if not already
        if (window.DAILY && window.DAILY.init) window.DAILY.init();
      }
      if (sec === 'butterfly') renderButterflySection();
      if (sec === 'global') {
        if (window.GLOBAL && window.GLOBAL.init) window.GLOBAL.init();
      }
      if (sec === 'focus') {
        if (window.FOCUS && window.FOCUS.init) window.FOCUS.init();
      }
      if (sec === 'mirror') renderMirrorSection();
      if (sec === 'mind') {
        if (window.MIND && window.MIND.init) window.MIND.init();
      }
      showSection(sec);
    });
  });

  document.getElementById('nav-globe-canvas')?.addEventListener('click', () => {
    document.body.classList.remove('nav-open');
    showSection(currentSection === 'mirror' ? 'dashboard' : 'mirror');
    if (currentSection === 'mirror') renderMirrorSection();
  });
}

// ── Close Intro ───────────────────────────────────────────────
window.closeIntro = function () {
  const introOverlay = document.getElementById('welcome-intro');
  if (introOverlay) {
    introOverlay.classList.add('hidden');
    localStorage.setItem('ripple_intro', 'done');
    setTimeout(() => {
      introOverlay.style.display = 'none';
    }, 800);
  }
}

// ── Team Chat Widget ──────────────────────────────────────────
window.toggleTeamChat = function () {
  const win = document.getElementById('team-chat-window');
  if (win) win.classList.toggle('open');
};

// ── Logout ────────────────────────────────────────────────────
window.handleLogout = function () {
  localStorage.removeItem('ripple_auth');
  localStorage.removeItem('ripple_name');
  window.location.href = 'login.html';
};

// ── Theme Settings ────────────────────────────────────────────
window.setTheme = function (theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('ripple_theme', theme);

  const btnDark  = document.getElementById('theme-btn-dark');
  const btnLight = document.getElementById('theme-btn-light');
  if (btnDark && btnLight) {
    btnDark.style.background   = theme === 'dark'  ? 'rgba(249,115,22,0.1)' : 'transparent';
    btnDark.style.color        = theme === 'dark'  ? '#f97316' : 'var(--text-2)';
    btnDark.style.borderColor  = theme === 'dark'  ? '#f97316' : 'transparent';
    btnLight.style.background  = theme === 'light' ? 'rgba(249,115,22,0.1)' : 'transparent';
    btnLight.style.color       = theme === 'light' ? '#f97316' : 'var(--text-2)';
    btnLight.style.borderColor = theme === 'light' ? '#f97316' : 'transparent';
  }

  // Patch inline-styled elements that CSS can't reach
  patchInlineStyles(theme);
};

function patchInlineStyles(theme) {
  const isLight = theme === 'light';

  // Map of dark bg rgba values → light replacements
  const DARK_BG_PATTERNS = [
    'rgba(13,13,20,1)',
    'rgba(13,13,20,0.6)',
    'rgba(13, 13, 20, 1)',
    'rgba(10,9,7,0.92)',
    'rgba(10, 9, 7, 0.92)',
    'rgba(15,12,8,0.8)',
    'rgba(14,11,9,0.98)',
    'rgba(20,16,10,0.8)',
    'rgba(20,16,10,0.7)',
    'rgba(20,16,10,0.5)',
  ];
  const LIGHT_BG = '#ffffff';
  const DARK_BG_RESTORE = [
    'rgba(13,13,20,1)',
    'rgba(13,13,20,0.6)',
    'rgba(13,13,20,1)',
    'rgba(10,9,7,0.92)',
    'rgba(10,9,7,0.92)',
    'rgba(15,12,8,0.8)',
    'rgba(14,11,9,0.98)',
    'rgba(20,16,10,0.8)',
    'rgba(20,16,10,0.7)',
    'rgba(20,16,10,0.5)',
  ];

  document.querySelectorAll('[style]').forEach(el => {
    const orig = el.getAttribute('style') || '';
    let patched = orig;

    if (isLight) {
      // Store original for dark-mode restore
      if (!el._darkStyle) el._darkStyle = orig;

      // Replace hard-coded dark backgrounds
      DARK_BG_PATTERNS.forEach(pat => {
        patched = patched.split(pat).join(LIGHT_BG);
      });
      // Fix hard-coded dark text colors
      patched = patched.replace(/color:\s*rgba\(240,237,232,0\.5\)/g, 'color:rgba(71,85,105,0.9)');
      patched = patched.replace(/color:\s*rgba\(240,\s*237,\s*232,\s*0\.5\)/g, 'color:rgba(71,85,105,0.9)');
      patched = patched.replace(/color:\s*#f0ede8/g, 'color:#0f172a');
      patched = patched.replace(/#f0ede8/g, '#0f172a');

      el.setAttribute('style', patched);
    } else {
      // Restore original dark style
      if (el._darkStyle !== undefined) {
        el.setAttribute('style', el._darkStyle);
        delete el._darkStyle;
      }
    }
  });

  // Special element fixes for light mode
  const sectionFocus = document.getElementById('section-focus');
  if (sectionFocus) sectionFocus.style.background = isLight ? '#f1f5f9' : '#0d0d14';

  const sectionSettings = document.getElementById('section-settings');
  if (sectionSettings) sectionSettings.style.background = isLight ? '#f1f5f9' : '';

  const sectionHome = document.getElementById('section-home');
  if (sectionHome && isLight) sectionHome.style.background = '#f1f5f9';
  else if (sectionHome) sectionHome.style.background = '';

  // Fix philosophy icons dark circles
  document.querySelectorAll('#section-focus .philosophy-icon').forEach(el => {
    el.style.background = isLight ? '#e2e8f0' : 'rgba(26,26,42,1)';
    el.style.border     = isLight ? '1.5px solid rgba(0,0,0,0.15)' : '1px solid rgba(245,114,42,0.12)';
  });

  // Fix the focus-state-item and ripple-card backdrops
  document.querySelectorAll('#section-focus .focus-state-item, #section-focus .ripple-card, #section-focus .debt-panel').forEach(el => {
    el.style.background = isLight ? '#ffffff' : '';
    el.style.borderColor = isLight ? 'rgba(0,0,0,0.12)' : '';
  });
}

window.addEventListener('DOMContentLoaded', () => {
  const currentTheme = localStorage.getItem('ripple_theme') || 'dark';
  window.setTheme(currentTheme);
});

// ── Profile Settings ──────────────────────────────────────────
window.isEditingProfile = false;

window.editProfile = function (btn) {
  const nameEl = document.getElementById('p-name');
  const missionEl = document.getElementById('p-mission');
  const socialsEl = document.getElementById('p-socials');

  if (!window.isEditingProfile) {
    window.isEditingProfile = true;
    btn.innerHTML = '💾';
    btn.style.color = '#22c55e'; // Save color

    const currentName = nameEl.textContent;
    const currentMission = missionEl.textContent;
    const currentIG = localStorage.getItem('ripple_ig') || '';
    const currentX = localStorage.getItem('ripple_x') || '';
    const currentFB = localStorage.getItem('ripple_fb') || '';

    nameEl.innerHTML = `<input type="text" id="edit-p-name" value="${currentName}" class="em-chat-input" style="font-size:1.2rem; padding:4px 12px; height:auto; width:100%; margin-bottom: 8px; font-family: var(--font-display);">`;
    missionEl.innerHTML = `<input type="text" id="edit-p-mission" value="${currentMission}" class="em-chat-input" style="font-size:0.88rem; padding:4px 8px; height:auto; width:220px; display:inline-block; margin-top:4px;">`;

    socialsEl.innerHTML = `
      <div style="display:flex; flex-direction:column; gap:6px; margin-top:10px; width: 100%;">
        <input type="text" id="edit-p-ig" placeholder="URL Instagram (https://ig...)" value="${currentIG}" class="em-chat-input" style="font-size:0.8rem; padding:4px 8px; width:100%; height:auto;">
        <input type="text" id="edit-p-x" placeholder="URL X/Twitter..." value="${currentX}" class="em-chat-input" style="font-size:0.8rem; padding:4px 8px; width:100%; height:auto;">
        <input type="text" id="edit-p-fb" placeholder="URL Facebook..." value="${currentFB}" class="em-chat-input" style="font-size:0.8rem; padding:4px 8px; width:100%; height:auto;">
      </div>
    `;

    document.getElementById('edit-p-name').focus();

  } else {
    window.isEditingProfile = false;
    btn.innerHTML = '✎';
    btn.style.color = '';

    let newName = document.getElementById('edit-p-name')?.value || 'Pelajar';
    let newMission = document.getElementById('edit-p-mission')?.value || 'Menyelamatkan Lingkungan';

    const newIG = document.getElementById('edit-p-ig')?.value.trim() || '';
    const newX = document.getElementById('edit-p-x')?.value.trim() || '';
    const newFB = document.getElementById('edit-p-fb')?.value.trim() || '';

    newName = newName.trim() || 'Pelajar';
    newMission = newMission.trim() || 'Menyelamatkan Lingkungan';

    localStorage.setItem('ripple_name', newName);
    localStorage.setItem('ripple_mission', newMission);
    localStorage.setItem('ripple_ig', newIG);
    localStorage.setItem('ripple_x', newX);
    localStorage.setItem('ripple_fb', newFB);

    if (typeof state !== 'undefined') {
      state.userName = newName;
      if (typeof saveState === 'function') saveState();
    }

    nameEl.textContent = newName;
    missionEl.textContent = newMission;
    socialsEl.innerHTML = `
      <a href="${newIG || '#'}" target="_blank" class="p-social-icon" id="p-soc-ig" style="${newIG ? '' : 'opacity:0.5; pointer-events:none;'}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
      </a>
      <a href="${newX || '#'}" target="_blank" class="p-social-icon" id="p-soc-x" style="${newX ? '' : 'opacity:0.5; pointer-events:none;'}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.008 4.076H5.078z"/></svg>
      </a>
      <a href="${newFB || '#'}" target="_blank" class="p-social-icon" id="p-soc-fb" style="${newFB ? '' : 'opacity:0.5; pointer-events:none;'}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
      </a>
    `;

    const elementsToUpdate = ['nav-profile-name'];
    elementsToUpdate.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = newName;
    });

    const avatarUrl = `url('https://api.dicebear.com/7.x/notionists/svg?seed=${newName.split('@')[0]}&backgroundColor=f97316')`;
    const avatarElements = ['p-avatar-large', 'nav-profile-avatar'];
    avatarElements.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.backgroundImage = avatarUrl;
    });

    const pEmail = document.getElementById('p-email');
    if (pEmail) {
      if (!newName.includes('@')) {
        pEmail.textContent = newName.toLowerCase().replace(/\s/g, '') + '@earthmirror.id';
      } else {
        pEmail.textContent = newName;
      }
    }
  }
};

const TEAM_RESPONSES = {
  'apa itu': 'Ripple adalah platform Earth Mirror yang mengubah kebiasaan harianmu menjadi simulasi visual bumi secara real-time. Semakin positif pilihanmu, semakin hijau buminya! 🌍',
  'gabung': 'Wah, kami selalu mencari talenta baru! Kamu punya minat di riset, desain UI/UX, atau web dev? Kirim kontakmu ke team@ripple.id ya! 🚀',
  'kolaborasi': 'Sangat menarik! Kami terbuka untuk kolaborasi dengan institusi, sekolah, atau penggerak lingkungan lokal. Boleh tahu ide spesifikmu?',
  'kontribusi': 'Kamu bisa berkontribusi dengan konsisten menggunakan Ripple, menyebarkan kesadaran lingkungan, atau ikut event sosial di kotamu. 🙌',
  'default': 'Halo! Terima kasih pesannya. Saat ini tim sedang fokus offline untuk persiapan peluncuran, tapi pesanmu sudah tersimpan rapi. Hubungi kami lebih lanjut di ripple@earthmirror.id ✉️'
};

window.sendTeamMsg = function (msg) {
  const input = document.getElementById('tc-input');
  const text = msg || input?.value.trim();
  if (!text) return;

  const body = document.getElementById('tc-body');
  const chips = document.getElementById('tc-chips');

  // Add sent msg
  body.innerHTML += `
    <div class="tc-msg tc-sent fade-in">
      <div class="tc-bubble">${text}</div>
    </div>
  `;

  if (input) input.value = '';
  if (msg && chips) chips.style.display = 'none';
  body.scrollTop = body.scrollHeight;

  // Simulate typing & reply
  setTimeout(() => {
    const typingId = 'typing-' + Date.now();
    body.innerHTML += `
      <div class="tc-msg tc-received fade-in" id="${typingId}">
        <div class="tc-av-small" style="background-image:url('https://api.dicebear.com/7.x/notionists/svg?seed=Nadia&backgroundColor=f59e0b');"></div>
        <div class="tc-bubble" style="color:var(--text-3); font-style:italic;">Membalas pesan...</div>
      </div>
    `;
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
      document.getElementById(typingId)?.remove();

      const tl = text.toLowerCase();
      let reply = TEAM_RESPONSES['default'];
      if (tl.includes('apa itu') || tl.includes('ripple')) reply = TEAM_RESPONSES['apa itu'];
      else if (tl.includes('gabung') || tl.includes('join')) reply = TEAM_RESPONSES['gabung'];
      else if (tl.includes('kolaborasi') || tl.includes('collab')) reply = TEAM_RESPONSES['kolaborasi'];
      else if (tl.includes('kontribusi') || tl.includes('bantu')) reply = TEAM_RESPONSES['kontribusi'];

      body.innerHTML += `
        <div class="tc-msg tc-received fade-in">
          <div class="tc-av-small" style="background-image:url('https://api.dicebear.com/7.x/notionists/svg?seed=Nadia&backgroundColor=f59e0b');"></div>
          <div class="tc-bubble">${reply}</div>
        </div>
      `;
      body.scrollTop = body.scrollHeight;
    }, 1200);
  }, 400);
};

function showSection(name) {
  // 1. Hide all main sections
  document.querySelectorAll('[data-section]').forEach(el => {
    el.classList.remove('active');
  });

  // 2. Resolve alias (e.g. 'global' -> 'landing')
  let targetName = name;
  const aliased = document.querySelector(`[data-section-alias="${name}"]`);
  if (aliased) {
    targetName = aliased.dataset.section;
  }

  // 3. Special Case: Landing Flow (Home, Global, About, Daily, Mind)
  // These are often shown together in a long-scroll flow
  if (targetName === 'landing' || targetName === 'about') {
    ['landing', 'about', 'daily', 'mind', 'mirror'].forEach(s => {
      const el = document.querySelector(`[data-section="${s}"]`);
      if (el) el.classList.add('active');
    });
    
    // Auto-init mirror if we're showing it
    if (window.populateEarthMirrorPanel) populateEarthMirrorPanel();
    
    // If it's About, we might also need its parent if it's nested
    const aboutEl = document.querySelector('[data-section="about"]');
    if (aboutEl && aboutEl.parentElement.closest('[data-section]')) {
      aboutEl.parentElement.closest('[data-section]').classList.add('active');
    }
  } else {
    // 4. Default: Show single target section
    const target = document.querySelector(`[data-section="${targetName}"]`);
    if (target) {
      target.classList.add('active');
      
      // If the target is nested (like 'about' inside 'focus'), show parent too
      let parent = target.parentElement.closest('[data-section]');
      while (parent) {
        parent.classList.add('active');
        parent = parent.parentElement.closest('[data-section]');
      }
    }
  }

  currentSection = targetName;

  // Update nav active state
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.nav === name);
  });

  // Re-apply theme patch so newly visible elements get correct colors
  const savedTheme = localStorage.getItem('ripple_theme') || 'dark';
  if (typeof patchInlineStyles === 'function') patchInlineStyles(savedTheme);

  // Scroll logic
  if (name === 'about') {
    const aboutSec = document.querySelector('[data-section="about"]') || document.getElementById('focus-about');
    if (aboutSec) aboutSec.scrollIntoView({ behavior: 'smooth' });
  } else if (name === 'global') {
    const statsBar = document.querySelector('.hg-stats-bar');
    if (statsBar) statsBar.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Stagger animations
  setTimeout(() => {
    document.querySelectorAll('.stagger-item').forEach(el => el.classList.add('visible'));
  }, 100);
}

// ── SECTION: LANDING ─────────────────────────────────────────
function renderLanding() {
  const startBtn = $('btn-start');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      if (state.onboarded) { showSection('dashboard'); renderDashboard(); }
      else { showSection('onboarding'); startOnboarding(); }
    });
  }
  const learnBtn = $('btn-about');
  if (learnBtn) learnBtn.addEventListener('click', () => showSection('about'));
}

// ── SECTION: ONBOARDING ──────────────────────────────────────
function startOnboarding() {
  onboardingStep = 0;
  onboardingData = {};
  renderOnboardingStep();
}

function renderOnboardingStep() {
  const q = ONBOARDING_QUESTIONS[onboardingStep];
  const container = $('onboarding-question-area');
  if (!container || !q) return;

  // Progress
  const pct = ((onboardingStep) / ONBOARDING_QUESTIONS.length) * 100;
  $('onboarding-progress-fill').style.width = pct + '%';
  $('onboarding-step-label').textContent = `${onboardingStep + 1} / ${ONBOARDING_QUESTIONS.length}`;

  let html = `<div class="onboarding-question">
    <p class="q-number">Pertanyaan ${onboardingStep + 1}</p>
    <h2 class="q-label">${q.label}</h2>`;
  if (q.hint) html += `<p class="q-hint">${q.hint}</p>`;

  if (q.type === 'text') {
    html += `<input type="text" id="q-input" class="q-text-input" placeholder="${q.placeholder || ''}" autocomplete="off">`;
  } else if (q.type === 'choice') {
    html += `<div class="q-choices">`;
    q.options.forEach((opt, i) => {
      html += `<button class="q-choice-btn" data-idx="${i}">${opt}</button>`;
    });
    html += `</div>`;
  }
  html += `</div>`;
  container.innerHTML = html;
  container.querySelector('.onboarding-question').classList.add('fade-in');

  // Events
  if (q.type === 'text') {
    const inp = container.querySelector('#q-input');
    inp?.focus();
    inp?.addEventListener('keydown', e => { if (e.key === 'Enter') nextOnboardingStep(); });
  } else {
    container.querySelectorAll('.q-choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.q-choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        onboardingData[q.id] = { value: q.options[+btn.dataset.idx], index: +btn.dataset.idx };
        setTimeout(nextOnboardingStep, 500);
      });
    });
  }
}

function nextOnboardingStep() {
  const q = ONBOARDING_QUESTIONS[onboardingStep];
  if (q.type === 'text') {
    const val = document.querySelector('#q-input')?.value?.trim();
    if (!val) { document.querySelector('#q-input')?.focus(); return; }
    onboardingData[q.id] = { value: val };
  }

  onboardingStep++;
  if (onboardingStep >= ONBOARDING_QUESTIONS.length) {
    finishOnboarding();
  } else {
    renderOnboardingStep();
    // Emit ripple for each answered question
    rippleEngine?.emit('positive', '✨');
  }
}

function prevOnboardingStep() {
  if (onboardingStep === 0) { showSection('landing'); return; }
  onboardingStep--;
  renderOnboardingStep();
}

function finishOnboarding() {
  state.onboarded = true;
  state.userName = onboardingData.name?.value || 'Pelajar';
  state.userCity = onboardingData.city?.value || 'Jakarta';
  state.userGrade = onboardingData.grade?.value || 'SMA';
  state.userConcern = onboardingData.biggest_concern?.value || 'Perubahan Iklim';
  state.userDream = onboardingData.daily_dream?.value || 'Damai';

  saveState();
  rippleEngine?.emit('positive', '🌍 Bumi-mu siap!');
  showToast('Selamat datang, ' + state.userName + '! 🌍', 'Bumi-mu telah dikalibrasi berdasarkan jawabanmu.', 'positive');

  setTimeout(() => {
    showSection('dashboard');
    renderDashboard();
  }, 1200);
}

// ── SECTION: DASHBOARD ───────────────────────────────────────
function renderDashboard() {
  const header = $('dashboard-header');
  if (header) {
    header.innerHTML = `
      <p class="caption">Dashboard Personal</p>
      <h1 class="display-2">Halo, <span class="gradient-text">${state.userName || 'Pelajar'}</span> 👋</h1>
      <p style="color:var(--text-2);margin-top:8px;">Bumi yang sedang kamu bangun — berdasarkan keputusanmu sejauh ini.</p>`;
  }

  renderLayerCards();
  updateMirrorUI();
}

function renderLayerCards() {
  const container = $('layer-cards-container');
  if (!container) return;

  container.innerHTML = LAYERS.map(layer => {
    const score = state.layerScores[layer.id] || 0;
    const pct = clamp(50 + (score / 100) * 50, 0, 100);
    const col = score >= 0 ? 'var(--green)' : 'var(--red)';
    const sign = score > 0 ? '+' : '';
    return `
      <div class="layer-card stagger-item" data-layer="${layer.id}" style="--layer-color:${layer.color}">
        <div class="layer-header">
          <span class="layer-emoji">${layer.emoji}</span>
          <div class="layer-title">
            <h3>${layer.label}</h3>
            <p>${layer.sublabel}</p>
          </div>
          <span class="layer-score-display" style="color:${col}">${sign}${score}</span>
        </div>
        <div class="layer-bar-track">
          <div class="layer-bar-fill" style="width:${pct}%;background:${layer.color}"></div>
        </div>
        <p class="layer-action-hint">${layer.description}</p>
        <p class="layer-action-hint" style="margin-top:6px;color:${layer.color};font-weight:600;">→ Tap untuk input harian</p>
      </div>`;
  }).join('');

  container.querySelectorAll('.layer-card').forEach(card => {
    card.addEventListener('click', () => {
      currentDailyTab = card.dataset.layer;
      renderDailySection(currentDailyTab);
      showSection('daily');
    });
  });

  setTimeout(() => container.querySelectorAll('.stagger-item').forEach(el => el.classList.add('visible')), 50);
}

function updateMirrorUI() {
  const health = state.globeHealth;
  const el = $('mirror-health-val');
  if (el) {
    const label = health > 70 ? '🌳 Tumbuh' : health > 40 ? '⚡ Seimbang' : '🔥 Kritis';
    el.textContent = label;
    el.style.color = health > 70 ? 'var(--green)' : health > 40 ? 'var(--amber)' : 'var(--red)';
  }

  const sub = $('mirror-health-sub');
  if (sub) sub.textContent = `Kesehatan Bumi-mu: ${health}/100`;

  const total = $('mirror-stat-total');
  if (total) total.textContent = state.totalScore > 0 ? `+${state.totalScore}` : state.totalScore;

  const week = $('mirror-stat-week');
  if (week) week.textContent = `Minggu ${state.week}`;
}

// ── SECTION: DAILY INPUT ─────────────────────────────────────
function renderDailySection(activeLayer = 'mind') {
  currentDailyTab = activeLayer;
  renderDailyTabs();
  renderDailyForm(activeLayer);
}

function renderDailyTabs() {
  const tabs = $('daily-tabs');
  if (!tabs) return;
  tabs.innerHTML = LAYERS.map(l => `
    <button class="daily-tab ${l.id === currentDailyTab ? 'active' : ''}" data-layer="${l.id}">
      ${l.emoji} ${l.label}
    </button>`).join('');
  tabs.querySelectorAll('.daily-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      currentDailyTab = btn.dataset.layer;
      renderDailyTabs();
      renderDailyForm(currentDailyTab);
    });
  });
}

function renderDailyForm(layerId) {
  const layer = LAYERS.find(l => l.id === layerId);
  const questions = DAILY_QUESTIONS[layerId] || [];
  const form = $('daily-form-container');
  if (!form || !layer) return;

  const headerEl = $('daily-form-header');
  if (headerEl) {
    headerEl.innerHTML = `
      <h2 class="display-2">${layer.emoji} <span class="gradient-text">${layer.label}</span></h2>
      <p style="color:var(--text-2);margin-top:8px;">${layer.description}</p>`;
  }

  const answers = {};

  form.innerHTML = questions.map((q, qi) => {
    let input = '';
    if (q.type === 'slider') {
      const mid = Math.round((q.min + q.max) / 2);
      input = `
        <div class="dq-slider-wrap">
          <p class="slider-val-display" id="sval-${qi}">${mid}${q.unit}</p>
          <input type="range" class="dq-slider" id="slider-${qi}"
            min="${q.min}" max="${q.max}" step="${q.step}" value="${mid}"
            data-qi="${qi}" data-unit="${q.unit}">
        </div>`;
    } else if (q.type === 'choice') {
      input = `<div class="q-choices">${q.options.map((opt, oi) =>
        `<button class="q-choice-btn" data-qi="${qi}" data-oi="${oi}">${opt}</button>`
      ).join('')}</div>`;
    } else if (q.type === 'toggle') {
      input = `<div class="dq-toggle-wrap">
        <button class="toggle-opt yes" data-qi="${qi}" data-val="1">✅ Ya</button>
        <button class="toggle-opt no"  data-qi="${qi}" data-val="0">❌ Tidak</button>
      </div>`;
    }
    return `
      <div class="card daily-question-card stagger-item">
        <p class="dq-label">${q.label}</p>
        ${input}
      </div>`;
  }).join('');

  // Attach events
  form.querySelectorAll('.dq-slider').forEach(sl => {
    const qi = +sl.dataset.qi;
    const unit = sl.dataset.unit;
    const valEl = form.querySelector(`#sval-${qi}`);
    answers[qi] = +sl.value;
    sl.addEventListener('input', () => {
      answers[qi] = +sl.value;
      if (valEl) valEl.textContent = sl.value + unit;
      updateRipplePreview(layerId, questions, answers);
    });
  });

  form.querySelectorAll('.q-choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = +btn.dataset.qi;
      form.querySelectorAll(`.q-choice-btn[data-qi="${qi}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      answers[qi] = +btn.dataset.oi;
      updateRipplePreview(layerId, questions, answers);
    });
  });

  form.querySelectorAll('.toggle-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      const qi = +btn.dataset.qi;
      form.querySelectorAll(`.toggle-opt[data-qi="${qi}"]`).forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      answers[qi] = +btn.dataset.val;
      updateRipplePreview(layerId, questions, answers);
    });
  });

  // Submit
  const submitBtn = $('daily-submit-btn');
  if (submitBtn) {
    submitBtn.onclick = () => submitDailyInput(layerId, questions, answers);
  }

  setTimeout(() => form.querySelectorAll('.stagger-item').forEach(el => el.classList.add('visible')), 80);
}

function calcLayerScore(layerId, questions, answers) {
  let total = 0;
  questions.forEach((q, i) => {
    if (answers[i] !== undefined) total += q.scoreMap(answers[i]);
    else {
      // Defaults
      if (q.type === 'slider') total += q.scoreMap((q.min + q.max) / 2);
      else if (q.type === 'toggle') total += 0;
    }
  });
  return clamp(total, -100, 100);
}

function updateRipplePreview(layerId, questions, answers) {
  const score = calcLayerScore(layerId, questions, answers);
  const preview = $('daily-ripple-preview');
  if (!preview) return;
  const layer = LAYERS.find(l => l.id === layerId);
  const type = score > 5 ? 'positive' : score < -5 ? 'negative' : 'neutral';
  const ripple = score > 5 ? layer.ripplePositive[0] : score < -5 ? layer.rippleNegative[0] : 'Dampak netral';
  const col = score > 5 ? 'var(--green)' : score < -5 ? 'var(--red)' : 'var(--amber)';
  preview.innerHTML = `
    <strong>🌊 Ripple Effect:</strong>
    <span style="color:${col};margin-left:6px;">${ripple}</span>`;
}

function submitDailyInput(layerId, questions, answers) {
  const score = calcLayerScore(layerId, questions, answers);
  const layer = LAYERS.find(l => l.id === layerId);

  // Update state
  state.layerScores[layerId] = clamp((state.layerScores[layerId] || 0) + Math.round(score * 0.15), -100, 100);
  state.totalScore = clamp(
    Object.values(state.layerScores).reduce((a, b) => a + b, 0) / LAYERS.length,
    -100, 100
  );
  state.totalScore = Math.round(state.totalScore);
  state.dailyInputs.push({ layer: layerId, score, date: new Date().toISOString() });

  updateAllGlobes();
  saveState();

  // Trigger ripple
  const type = score > 5 ? 'positive' : score < -5 ? 'negative' : 'neutral';
  rippleEngine?.emit(type, type === 'positive' ? '🌱' : type === 'negative' ? '⚠️' : '〰️');
  [globeLanding, globeMirror, globeFull, miniGlobe].forEach(g => g?.pulse());

  // AI Bubble
  const narrative = generateMirrorNarrative(layerId, score, state.userName);
  showAIBubble('🪞 Earth Mirror', narrative);

  // Toast
  const rippleMsg = score > 5 ? layer.ripplePositive[0] : score < -5 ? layer.rippleNegative[0] : 'Dampak tercatat';
  showToast(layer.emoji + ' ' + layer.label + ' diperbarui', rippleMsg, type);

  // Move to next layer or dashboard
  const idx = LAYERS.findIndex(l => l.id === layerId);
  if (idx < LAYERS.length - 1) {
    setTimeout(() => {
      currentDailyTab = LAYERS[idx + 1].id;
      renderDailyTabs();
      renderDailyForm(currentDailyTab);
    }, 1500);
  } else {
    setTimeout(() => {
      showSection('dashboard');
      renderDashboard();
    }, 1500);
  }
}

// ── SECTION: EARTH MIRROR ─────────────────────────────────────
function renderMirrorSection() {
  const h = state.globeHealth;
  const col = h > 70 ? 'var(--green)' : h > 40 ? 'var(--amber)' : 'var(--red)';
  const condition = h > 70 ? 'Tumbuh & Berkembang' : h > 40 ? 'Bertahan & Berjuang' : 'Dalam Krisis';

  const labelContainer = $('mirror-label-container');
  if (labelContainer) {
    labelContainer.innerHTML = LAYERS.map(layer => {
      const score = state.layerScores[layer.id] || 0;
      const narrative = generateMirrorNarrative(layer.id, score, state.userName);
      return `
        <div class="mirror-label-row card stagger-item">
          <h3 style="color:${layer.color}">${layer.emoji} ${layer.label}</h3>
          <p>${narrative.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>
        </div>`;
    }).join('');
    setTimeout(() => labelContainer.querySelectorAll('.stagger-item').forEach(el => el.classList.add('visible')), 100);
  }

  const proj = $('mirror-projection');
  if (proj) {
    proj.innerHTML = `
      <h3>🌍 Bumi-mu di 2050: <span style="color:${col}">${condition}</span></h3>
      <p style="color:var(--text-2);margin-top:12px;">
        Berdasarkan trajektori pilihan harianmu, peradaban yang sedang kamu bangun 
        memiliki karakteristik yang unik — sebuah dunia yang hanya bisa ada karena pilihanmu.
        Skor kesehatan bumi-mu saat ini: <strong style="color:${col}">${h}/100</strong>.
      </p>`;
  }
}

// ── SECTION: BUTTERFLY EFFECT ─────────────────────────────────
function renderButterflySection(chainKey = 'transport') {
  const selector = $('butterfly-selector');
  if (selector) {
    const keys = Object.keys(BUTTERFLY_CHAINS);
    selector.innerHTML = keys.map(k => `
      <button class="butterfly-opt ${k === chainKey ? 'active' : ''}" data-chain="${k}">
        ${BUTTERFLY_CHAINS[k].label.split('→')[0].trim()}
      </button>`).join('');
    selector.querySelectorAll('.butterfly-opt').forEach(btn => {
      btn.addEventListener('click', () => renderButterflySection(btn.dataset.chain));
    });
  }

  const chain = BUTTERFLY_CHAINS[chainKey];
  const container = $('butterfly-chain-container');
  if (!container || !chain) return;

  container.innerHTML = `
    <div class="butterfly-label" style="text-align:center;margin-bottom:32px;">
      <span class="badge badge-violet">🦋 Simulasi Efek Domino</span>
      <h3 style="margin-top:12px;font-size:1.1rem;">${chain.label}</h3>
    </div>
    <div class="butterfly-chain" id="chain-steps"></div>
    <div class="butterfly-stats" id="butterfly-stat-cards"></div>`;

  const stepsEl = $('chain-steps');
  chain.steps.forEach((step, i) => {
    if (i > 0) {
      const conn = document.createElement('div');
      conn.className = 'chain-connector';
      stepsEl.appendChild(conn);
    }
    const stepEl = document.createElement('div');
    stepEl.className = 'chain-step';
    stepEl.innerHTML = `
      <span class="chain-number">${i + 1}</span>
      <span class="chain-icon">${step.icon}</span>
      <span class="chain-text">${step.text}</span>`;
    stepsEl.appendChild(stepEl);

    setTimeout(() => stepEl.classList.add('visible'), (i + 1) * 220);
  });

  const statsEl = $('butterfly-stat-cards');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="butterfly-stat-card">
        <div class="butterfly-stat-val">🌱 ${chain.carbonSaved}</div>
        <div class="butterfly-stat-label">Penghematan karbon / tahun</div>
      </div>
      <div class="butterfly-stat-card">
        <div class="butterfly-stat-val">💚 ${chain.healthGain}</div>
        <div class="butterfly-stat-label">Dampak kesehatan</div>
      </div>`;
  }

  // Trigger ripple for visual effect
  setTimeout(() => rippleEngine?.emit('positive', '🦋'), 600);
}

// ── SECTION: GLOBAL RIPPLE ────────────────────────────────────
function initGlobalMap() {
  const canvas = $('global-ripple-canvas');
  if (!canvas || globalMap) return;
  globalMap = new GlobalRippleMap(canvas);
  globalMap.start();

  // Global stats (simulated)
  const statsEl = $('global-stats-fill');
  if (statsEl) {
    statsEl.innerHTML = `
      <div class="card global-stat-card stagger-item">
        <div class="val gradient-text">247.8K</div>
        <div class="lbl">Gelombang positif hari ini</div>
      </div>
      <div class="card global-stat-card stagger-item">
        <div class="val" style="color:var(--red)">89.3K</div>
        <div class="lbl">Gelombang negatif hari ini</div>
      </div>
      <div class="card global-stat-card stagger-item">
        <div class="val gradient-text-green">73%</div>
        <div class="lbl">Rasio positif pelajar Indonesia</div>
      </div>
      <div class="card global-stat-card stagger-item">
        <div class="val" style="color:var(--violet)">12.4M</div>
        <div class="lbl">Pelajar dalam jaringan RIPPLE</div>
      </div>`;
    setTimeout(() => statsEl.querySelectorAll('.stagger-item').forEach(el => el.classList.add('visible')), 100);
  }
}

// ── Keyboard Shortcuts ───────────────────────────────────────
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeAIBubble();
  }
});

// ── Toast ─────────────────────────────────────────────────────
function showToast(title, msg, type = 'neutral') {
  const container = $('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<div class="toast-title">${title}</div><div>${msg}</div>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('exit');
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// ── AI Bubble ─────────────────────────────────────────────────
function showAIBubble(title, text) {
  const bubble = $('ai-bubble');
  const titleEl = $('ai-bubble-title-text');
  const textEl = $('ai-bubble-text');
  if (!bubble || !textEl) return;
  if (titleEl) titleEl.textContent = title;
  textEl.innerHTML = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  bubble.classList.add('active');
  setTimeout(() => bubble.classList.remove('active'), 9000);
}

function closeAIBubble() {
  $('ai-bubble')?.classList.remove('active');
}

// ── State Persistence ─────────────────────────────────────────
function saveState() {
  try { localStorage.setItem('ripple_state', JSON.stringify(state)); } catch (_) { }
}

// ── Expose for HTML Events ────────────────────────────────────
window.RIPPLE = {
  nextOnboardingStep,
  prevOnboardingStep,
  saveState,
  showSection,
  renderDashboard,
  renderDailySection,
  renderButterflySection: (k) => renderButterflySection(k),
  initGlobalMap,
  renderMirrorSection,
  closeAIBubble,
  handleAIChat,
};

// ══════════════════════════════════════════════════════════════
// NEW FEATURES: Tickers, Earth Mirror 2-panel, AI Chat, Live Feed
// ══════════════════════════════════════════════════════════════

// ── OVERRIDDEN renderMirrorSection ─────────────────────────
// Replace the one defined above — this populates the new 2-panel UI
(function patchRenderMirrorSection() {
  const _orig = renderMirrorSection;
  renderMirrorSection = function () {
    populateEarthMirrorPanel();
  };
  window.RIPPLE.renderMirrorSection = renderMirrorSection;
})();

function populateEarthMirrorPanel() {
  // User name label
  const nameLabel = document.getElementById('em-user-name-label');
  if (nameLabel) nameLabel.textContent = `— BUMI VERSI ${(state.userName || 'KAMU').toUpperCase()}`;

  // Health %
  const h = state.globeHealth;
  const pctEl = document.getElementById('em-health-pct');
  if (pctEl) {
    pctEl.textContent = h + '%';
    pctEl.style.color = h > 70 ? '#22c55e' : h > 40 ? '#f97316' : '#ef4444';
    pctEl.style.textShadow = h > 70
      ? '0 0 20px rgba(34,197,94,0.7)'
      : h > 40 ? '0 0 20px rgba(249,115,22,0.7)'
        : '0 0 20px rgba(239,68,68,0.7)';
  }

  // Dimension cards
  const dimMap = { nature: 'dimval-nature', mind: 'dimval-mind', economic: 'dimval-economic', social: 'dimval-social' };
  Object.entries(dimMap).forEach(([layer, elId]) => {
    const el = document.getElementById(elId);
    const score = state.layerScores[layer] || 0;
    if (el) {
      const sign = score > 0 ? '+' : '';
      el.textContent = sign + score;
      el.style.color = score > 0 ? '#22c55e' : score < 0 ? '#ef4444' : 'var(--text-3)';
    }
  });

  // Collective impact counters (random-growth simulation)
  animateCounter('col-trees', 100000, 150000, state.globeHealth);
  animateCounter('col-students', 3000000, 5000000, state.globeHealth);

  // Start clock
  startEarthClock();

  // Start live feed
  startLiveFeed();

  // Fakta Bumi
  startFaktaBumi();

  // Habit chips
  initHabitChips();
}

// ── Counter Animation ──────────────────────────────────────
function animateCounter(elId, min, max, health) {
  const el = document.getElementById(elId);
  if (!el) return;
  const target = Math.round(min + (health / 100) * (max - min));
  let current = Math.round(target * 0.85);
  const step = Math.ceil((target - current) / 40);
  const timer = setInterval(() => {
    current = Math.min(target, current + step);
    el.textContent = current.toLocaleString('id-ID');
    if (current >= target) clearInterval(timer);
  }, 30);
}

// ── Live Clock ─────────────────────────────────────────────
let _clockTimer = null;
function startEarthClock() {
  const el = document.getElementById('em-clock');
  if (!el) return;
  if (_clockTimer) clearInterval(_clockTimer);
  const tick = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    el.textContent = `${hh}:${mm}:${ss}`;
  };
  tick();
  _clockTimer = setInterval(tick, 1000);
}

// ── Live Earth Pulse Feed ──────────────────────────────────
const LIVE_EVENTS = [
  { icon: '🌳', text: '3 pohon baru ditanam di Kalimantan', type: 'pos', time: 'baru tadi' },
  { icon: '♻️', text: '127 kg plastik berhasil didaur ulang', type: 'pos', time: '2 menit lalu' },
  { icon: '🚶', text: '1.240 pelajar memilih jalan kaki hari ini', type: 'pos', time: '5 menit lalu' },
  { icon: '💧', text: 'Kualitas air Sungai Citarum menurun 3%', type: 'neg', time: '8 menit lalu' },
  { icon: '🌡️', text: 'Suhu Jakarta hari ini +0.3°C dari rata-rata', type: 'neg', time: '10 menit lalu' },
  { icon: '🌊', text: '2,4 ton sampah dibersihkan dari Pantai Bali', type: 'pos', time: '12 menit lalu' },
  { icon: '🐟', text: 'Populasi ikan di Danau Toba naik 8% bulan ini', type: 'pos', time: '15 menit lalu' },
  { icon: '🏭', text: 'Emisi pabrik di Cikarang melebihi batas aman', type: 'neg', time: '18 menit lalu' },
  { icon: '☀️', text: '430 panel surya baru dipasang di Jawa Timur', type: 'pos', time: '20 menit lalu' },
  { icon: '🌾', text: 'Petani Sulawesi beralih ke metode organik', type: 'pos', time: '25 menit lalu' },
];

let _feedTimer = null;
let _feedIdx = 0;

function startLiveFeed() {
  const feed = document.getElementById('em-live-feed');
  if (!feed) return;
  feed.innerHTML = '';
  if (_feedTimer) clearInterval(_feedTimer);

  // Show first 5
  const show = (items) => {
    feed.innerHTML = items.slice(0, 5).map(ev => `
      <div class="em-feed-item">
        <span class="em-feed-icon">${ev.icon}</span>
        <span class="em-feed-text">${ev.text}</span>
        <span class="em-feed-time">${ev.time}</span>
      </div>`).join('');
  };

  show(LIVE_EVENTS);

  // Rotate every 5s
  _feedTimer = setInterval(() => {
    _feedIdx = (_feedIdx + 1) % LIVE_EVENTS.length;
    const rotated = [...LIVE_EVENTS.slice(_feedIdx), ...LIVE_EVENTS.slice(0, _feedIdx)];
    show(rotated);
    // Add ripple on new event
    const ev = LIVE_EVENTS[_feedIdx];
    rippleEngine?.emit(ev.type === 'pos' ? 'positive' : 'negative');
  }, 5000);
}

// ── Fakta Bumi Rotator ─────────────────────────────────────
const FAKTA_BUMI = [
  'Setiap menit, 36 lapangan sepak bola hutan tropis ditebang di seluruh dunia.',
  'Indonesia adalah rumah bagi 17% spesies tumbuhan dan hewan dunia.',
  '1 dari 3 pelajar Indonesia tidak memiliki akses ke internet yang layak.',
  'Jika semua pelajar Indonesia berjalan kaki 1 km per hari, CO₂ berkurang 2,3 juta ton/tahun.',
  'Makan satu burger membutuhkan 2.400 liter air — setara mandi 2 bulan.',
  'Setiap rupiah yang kamu belanjakan di UMKM lokal memutar 8× lebih banyak uang di ekonomi lokal.',
];
let _faktaIdx = 0;
let _faktaTimer = null;

function startFaktaBumi() {
  const textEl = document.getElementById('em-fact-text');
  const counterEl = document.getElementById('em-fact-counter');
  const dotsEl = document.getElementById('em-fact-dots');
  if (!textEl) return;

  // Build dots
  if (dotsEl) {
    dotsEl.innerHTML = FAKTA_BUMI.map((_, i) =>
      `<div class="em-fact-dot ${i === 0 ? 'active' : ''}" data-i="${i}"></div>`
    ).join('');
    dotsEl.querySelectorAll('.em-fact-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        _faktaIdx = +dot.dataset.i;
        showFakta();
      });
    });
  }

  showFakta();
  if (_faktaTimer) clearInterval(_faktaTimer);
  _faktaTimer = setInterval(() => {
    _faktaIdx = (_faktaIdx + 1) % FAKTA_BUMI.length;
    showFakta();
  }, 7000);

  function showFakta() {
    if (textEl) textEl.textContent = FAKTA_BUMI[_faktaIdx];
    if (counterEl) counterEl.textContent = `${_faktaIdx + 1}/${FAKTA_BUMI.length}`;
    if (dotsEl) dotsEl.querySelectorAll('.em-fact-dot').forEach((d, i) => {
      d.classList.toggle('active', i === _faktaIdx);
    });
  }
}

// ── RIPPLE.AI Chat ─────────────────────────────────────────
const AI_RESPONSES = {
  'jalan kaki': {
    icon: '🚶', score: '+8',
    timeline: [
      { t: "Langkah Awal", d: "Kamu memilih berjalan kaki alih-alih naik kendaraan bermotor." },
      { t: "Dampak Langsung", d: "Menghindari emisi <span class='ai-highlight'>0.21 kg CO₂</span> ke udara hari ini." },
      { t: "Efek Jangka Panjang", d: "Jika 1 juta orang melakukan ini, setara dengan menanam <span class='ai-highlight'>7.000 pohon dewasa</span> setiap harinya." }
    ]
  },
  'belajar ekstra': {
    icon: '📚', score: '+10',
    timeline: [
      { t: "Langkah Awal", d: "Menginvestasikan 1 jam ekstra untuk literasi dan belajar mandiri." },
      { t: "Dampak Langsung", d: "Meningkatkan kualitas SDM yang setara dengan investasi sosial minimal <span class='ai-highlight'>Rp 850.000</span>." },
      { t: "Efek Jangka Panjang", d: "Pengetahuanmu hari ini adalah kunci bagi inovasi teknologi hijau esok hari." }
    ]
  },
  'nabung harian': {
    icon: '💰', score: '+7',
    timeline: [
      { t: "Langkah Awal", d: "Menyisihkan uang jajan Rp 10.000 secara konsisten ke tabungan." },
      { t: "Dampak Langsung", d: "Meningkatkan kapasitas <span class='ai-highlight'>kedaulatan finansial</span> secara personal." },
      { t: "Efek Jangka Panjang", d: "Dapat dialokasikan menjadi modal hijau yang mendukung ekonomi sirkular lokal." }
    ]
  },
  'tanam pohon': {
    icon: '🌱', score: '+15',
    timeline: [
      { t: "Langkah Awal", d: "Menanam satu bibit pohon baru di lahan terbuka atau pekarangan." },
      { t: "Dampak Langsung", d: "Bibit mulai tumbuh dan akan menyerap rata-rata <span class='ai-highlight'>22 kg CO₂</span> per tahunnya." },
      { t: "Efek Jangka Panjang", d: "Menjadi penyedia oksigen abadi bagi 2 manusia dewasa hingga 100 tahun ke depan." }
    ]
  },
  'kurangi daging': {
    icon: '🥗', score: '+12',
    timeline: [
      { t: "Langkah Awal", d: "Memilih diet plant-based atau sayuran dalam porsi makan harian." },
      { t: "Dampak Langsung", d: "Menghemat penggunaan air bersih setidaknya <span class='ai-highlight'>2.500 liter</span> dalam rantai pasok pangannya." },
      { t: "Efek Jangka Panjang", d: "Pengurangan emisi gas metana secara masif yang krusial mencegah pendidihan global." }
    ]
  },
  'buang sampah': {
    icon: '🗑️', score: '+5',
    timeline: [
      { t: "Langkah Awal", d: "Memastikan sampah anorganik berakhir tepat di tempat penampungan yang benar." },
      { t: "Dampak Langsung", d: "Berhasil menghentikan laju polusi dan pencemaran <span class='ai-highlight'>mikroplastik</span> ke siklus air hujan." },
      { t: "Efek Jangka Panjang", d: "Menyelamatkan ribuan organisme mikroskopis dan satwa perairan lepas dari ancaman racun plastik limbah." }
    ]
  },
};

function initHabitChips() {
  const chips = document.querySelectorAll('.em-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const habit = chip.dataset.habit.toLowerCase();
      showAIResponse(habit);
    });
  });

  const input = document.getElementById('em-chat-input');
  input?.addEventListener('keydown', e => { if (e.key === 'Enter') handleAIChat(); });
}

function handleAIChat() {
  const input = document.getElementById('em-chat-input');
  if (!input) return;
  const val = input.value.trim().toLowerCase();
  if (!val) return;
  showAIResponse(val);
  input.value = '';
}

function showAIResponse(habit) {
  const responseEl = document.getElementById('em-ai-response');
  if (!responseEl) return;

  // Find matching
  let resp = Object.entries(AI_RESPONSES).find(([key]) => habit.includes(key));
  let content;
  if (resp) {
    const [, r] = resp;

    // Build Timeline HTML
    const tHtml = r.timeline.map((item, idx) => `
      ${idx > 0 ? `<div class="ai-timeline-connector"></div>` : ''}
      <div class="ai-timeline-card fade-in" style="animation-delay: ${idx * 0.15}s">
        <div class="ai-timeline-num">${idx + 1}</div>
        <div>
          <h4 style="margin-bottom: 4px; font-size: 0.95rem; color: #fff;">${item.t}</h4>
          <p style="color: var(--text-2); font-size: 0.85rem; line-height: 1.5;">${item.d}</p>
        </div>
      </div>
    `).join('');

    content = `
      <div class="ai-msg">
        <div style="display:flex; align-items:center; gap: 16px; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 1px solid rgba(249,115,22,0.15);">
          <div style="font-size: 2.5rem; background: rgba(255,255,255,0.05); padding: 12px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">${r.icon}</div>
          <div>
            <strong style="color:#f97316; font-size: 1.25rem; display:block;">${r.score} poin bumi</strong>
            <span style="font-size:0.75rem; color:var(--text-3); text-transform:uppercase; letter-spacing:0.08em; font-weight: 600;">Analisis RIPPLE EFFECT</span>
          </div>
        </div>
        <div class="ai-timeline-wrapper">
          ${tHtml}
        </div>
      </div>`;

    // Update score
    const scoreVal = parseInt(r.score);
    state.totalScore = clamp(state.totalScore + Math.round(scoreVal * 0.1), -100, 100);
    updateAllGlobes();
    rippleEngine?.emit(scoreVal > 0 ? 'positive' : 'negative', r.icon);
    updateEMHealthPct();
  } else {
    content = `<div class="ai-msg">🤔 Menarik! Setiap kebiasaan yang kamu ceritakan punya dampak tersembunyi. Coba pilih dari opsi <span class="ai-highlight" style="color:#f97316">kebiasaan cepat</span> di atas untuk melihat analisis detailnya dalam simulasi waktu!</div>`;
  }

  responseEl.innerHTML = content;
  showToast('🦋 RIPPLE.AI', 'Analisis efek waktu kebiasaanmu siap!', 'positive');
}

function updateEMHealthPct() {
  const h = scoreToHealth(state.totalScore);
  state.globeHealth = h;
  const pctEl = document.getElementById('em-health-pct');
  if (pctEl) {
    pctEl.textContent = h + '%';
    pctEl.style.color = h > 70 ? '#22c55e' : h > 40 ? '#f97316' : '#ef4444';
  }
}

// ── Bottom Activity Ticker ─────────────────────────────────
const FAKE_USERS = [
  { name: 'Rizky (Yogya)', action: 'baru saja milah sampah hari ini', score: '+3.3', type: 'pos' },
  { name: 'Rafi (Tangerang)', action: 'baru saja makan sayur tanpa daging', score: '+9.5', type: 'pos' },
  { name: 'Melinda (Bekasi)', action: 'baru saja ikut beach cleanup', score: '+1.7', type: 'pos' },
  { name: 'Rafi (Jakarta)', action: 'baru saja bersepeda ke kantor', score: '+9.1', type: 'pos' },
  { name: 'Dina (Bandung)', action: 'baru saja belajar coding 3 jam', score: '+7.2', type: 'pos' },
  { name: 'Ari (Surabaya)', action: 'baru saja beli di warung lokal', score: '+4.8', type: 'pos' },
  { name: 'Sari (Bali)', action: 'baru saja tanam bibit mangrove', score: '+11.0', type: 'pos' },
  { name: 'Budi (Medan)', action: 'baru saja tidur lebih cepat', score: '+2.5', type: 'pos' },
  { name: 'Putri (Makassar)', action: 'skip plastik di warung kopi', score: '+6.3', type: 'pos' },
  { name: 'Rio (Palembang)', action: 'naik angkot bukan ojol', score: '+5.1', type: 'pos' },
];

function initBottomTicker() {
  const track = document.getElementById('bottom-ticker-track');
  if (!track) return;

  const items = [...FAKE_USERS, ...FAKE_USERS].map(u => `
    <span class="bt-item">
      <span class="bt-dot ${u.type === 'pos' ? '' : 'red'}"></span>
      <span class="bt-name">${u.name}</span>
      <span style="color:var(--text-2)">${u.action}</span>
      <span class="${u.type === 'pos' ? 'bt-score-pos' : 'bt-score-neg'}">${u.score}</span>
    </span>`).join('');

  track.innerHTML = items;
}

// ── Init call ──────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initBottomTicker();
});

