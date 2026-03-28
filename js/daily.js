import { state } from './data.js';

// ── DAILY INPUT LOGIC ──

// State for the daily form (internal to this module, syncs to global state)
const S = {
    belajar: 0,
    paham: 5,
    tidur: 7,
    stress: 3,
    uang: 25000,
    mood: null,
    moodType: null,
    topik: [],
    belanja: [],
    transGreen: null,
};

let totalScore = 0;

// ── CANVAS ENGINES ──

// Galaxy Background Engine
const BG = {
    cv: null,
    ctx: null,
    stars: [],
    nebulae: [],
    dustClouds: [],
};

function initBgCanvas() {
    BG.cv = document.getElementById('rc-global');
    if (!BG.cv) return;
    const resize = () => {
        BG.cv.width = window.innerWidth;
        BG.cv.height = window.innerHeight;
        initStars();
        initNebulae();
        initDustClouds();
    };
    resize();
    window.addEventListener('resize', resize);
    BG.ctx = BG.cv.getContext('2d');
}

function initStars() {
    BG.stars = [];
    const w = BG.cv.width, h = BG.cv.height;
    for (let i = 0; i < 160; i++) {
        const layer = Math.floor(Math.random() * 3);
        BG.stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: layer === 0 ? Math.random() * 0.6 + 0.2 : layer === 1 ? Math.random() * 1.0 + 0.4 : Math.random() * 1.6 + 0.7,
            a: layer === 0 ? 0.15 + Math.random() * 0.2 : layer === 1 ? 0.25 + Math.random() * 0.3 : 0.4 + Math.random() * 0.4,
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.002 + Math.random() * (layer === 2 ? 0.008 : 0.004),
            col: ['255,240,200', '200,220,255', '255,200,180', '180,220,255', '255,255,240'][Math.floor(Math.random() * 5)],
            vx: (Math.random() - 0.5) * (layer + 1) * 0.008,
            vy: (Math.random() - 0.5) * (layer + 1) * 0.006,
        });
    }
}

function initNebulae() {
    BG.nebulae = [];
    const w = BG.cv.width, h = BG.cv.height;
    const configs = [
        { x: 0.15, y: 0.08, rx: 0.55, ry: 0.22, r: 60, g: 100, b: 180, a: 0.09, driftX: 0.008, driftY: 0.004, phase: 0 },
        { x: 0.75, y: 0.06, rx: 0.45, ry: 0.18, r: 100, g: 50, b: 180, a: 0.08, driftX: -0.006, driftY: 0.005, phase: 1.5 },
        { x: 0.4, y: 0.12, rx: 0.6, ry: 0.28, r: 50, g: 160, b: 120, a: 0.07, driftX: 0.005, driftY: -0.003, phase: 3.0 },
        { x: 0.85, y: 0.2, rx: 0.35, ry: 0.15, r: 180, g: 80, b: 60, a: 0.06, driftX: -0.007, driftY: 0.004, phase: 4.5 },
        { x: 0.05, y: 0.3, rx: 0.3, ry: 0.12, r: 80, g: 180, b: 200, a: 0.05, driftX: 0.009, driftY: -0.005, phase: 2.2 },
    ];
    configs.forEach(n => {
        BG.nebulae.push({ ...n, cx: n.x * w, cy: n.y * h, w, h });
    });
}

function initDustClouds() {
    BG.dustClouds = [];
    const w = BG.cv.width, h = BG.cv.height;
    for (let i = 0; i < 4; i++) {
        BG.dustClouds.push({
            x: Math.random() * w,
            y: Math.random() * h * 0.6,
            radius: 180 + Math.random() * 280,
            r: 120 + Math.floor(Math.random() * 80),
            g: 60 + Math.floor(Math.random() * 60),
            b: 160 + Math.floor(Math.random() * 80),
            a: 0.02 + Math.random() * 0.025,
            speed: 0.004 + Math.random() * 0.004,
            phase: Math.random() * Math.PI * 2,
        });
    }
}

function drawBgCanvas() {
    const { cv, ctx } = BG;
    if (!cv || !ctx) return;
    const now = Date.now();
    const t = now / 1000;
    const w = cv.width, h = cv.height;

    ctx.clearRect(0, 0, w, h);

    BG.nebulae.forEach(n => {
        const ox = Math.sin(t * n.driftX + n.phase) * w * 0.06;
        const oy = Math.cos(t * n.driftY + n.phase) * h * 0.04;
        const cx = n.cx + ox;
        const cy = n.cy + oy;
        const breathe = 1 + 0.04 * Math.sin(t * 0.05 + n.phase);
        const rx = n.rx * w * breathe;
        const ry = n.ry * h * breathe;
        const alpha = n.a * (0.85 + 0.15 * Math.sin(t * 0.08 + n.phase));

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1, ry / rx);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
        grad.addColorStop(0, `rgba(${n.r},${n.g},${n.b},${alpha})`);
        grad.addColorStop(0.35, `rgba(${n.r},${n.g},${n.b},${alpha * 0.55})`);
        grad.addColorStop(0.65, `rgba(${n.r},${n.g},${n.b},${alpha * 0.18})`);
        grad.addColorStop(1, `rgba(${n.r},${n.g},${n.b},0)`);
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
    });

    BG.dustClouds.forEach(dc => {
        const ox = Math.sin(t * dc.speed + dc.phase) * 80;
        const oy = Math.cos(t * dc.speed * 0.7 + dc.phase) * 40;
        const grad = ctx.createRadialGradient(dc.x + ox, dc.y + oy, 0, dc.x + ox, dc.y + oy, dc.radius);
        grad.addColorStop(0, `rgba(${dc.r},${dc.g},${dc.b},${dc.a})`);
        grad.addColorStop(0.5, `rgba(${dc.r},${dc.g},${dc.b},${dc.a * 0.4})`);
        grad.addColorStop(1, `rgba(${dc.r},${dc.g},${dc.b},0)`);
        ctx.beginPath();
        ctx.arc(dc.x + ox, dc.y + oy, dc.radius, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
    });

    BG.stars.forEach(s => {
        s.x += s.vx;
        s.y += s.vy;
        s.twinkle += s.twinkleSpeed;
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        if (s.y < 0) s.y = h;
        if (s.y > h) s.y = 0;
        const aa = s.a * (0.55 + 0.45 * Math.sin(s.twinkle));
        if (s.r > 1.1 && aa > 0.5) {
            ctx.globalAlpha = aa * 0.15;
            ctx.strokeStyle = `rgba(${s.col},1)`;
            ctx.lineWidth = 0.4;
            ctx.beginPath();
            ctx.moveTo(s.x - s.r * 3, s.y);
            ctx.lineTo(s.x + s.r * 3, s.y);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(s.x, s.y - s.r * 3);
            ctx.lineTo(s.x, s.y + s.r * 3);
            ctx.stroke();
            ctx.globalAlpha = 1;
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.col},${aa})`;
        ctx.fill();
    });

    requestAnimationFrame(drawBgCanvas);
}

// Panel Canvas Engine
const RC = {
    ripples: [],
    sparks: [],
    particles: [],
    waveLines: [],
    cv: null,
    ctx: null,
};

function initCanvas() {
    const box = document.getElementById('rippleBox');
    RC.cv = document.getElementById('rc');
    if (!RC.cv || !box) return;
    const resize = () => {
        RC.cv.width = box.offsetWidth;
        RC.cv.height = box.offsetHeight;
        initParticles();
        initWaveLines();
    };
    resize();
    new ResizeObserver(resize).observe(box);
    RC.ctx = RC.cv.getContext('2d');
}

function initParticles() {
    RC.particles = [];
    for (let i = 0; i < 30; i++) {
        RC.particles.push({
            x: Math.random() * RC.cv.width,
            y: Math.random() * RC.cv.height,
            vx: (Math.random() - 0.5) * 0.32,
            vy: (Math.random() - 0.5) * 0.32,
            r: Math.random() * 1.6 + 0.3,
            a: Math.random() * 0.45 + 0.06,
            col: ['232,184,120', '184,58,45', '243,112,30', '78,104,81', '75,96,127', '100,180,220'][Math.floor(Math.random() * 6)],
            twinkle: Math.random() * Math.PI * 2,
            twinkleSpeed: 0.012 + Math.random() * 0.022,
        });
    }
}

function initWaveLines() {
    RC.waveLines = [];
    const h = RC.cv.height;
    ['184,58,45', '243,112,30', '220,201,169', '78,104,81', '75,96,127'].forEach((col, i) => {
        RC.waveLines.push({
            y: h * (0.2 + i * 0.15),
            amp: 3 + Math.random() * 5,
            freq: 0.007 + Math.random() * 0.005,
            speed: 0.3 + Math.random() * 0.5,
            phase: Math.random() * Math.PI * 2,
            col,
            alpha: 0.07 + Math.random() * 0.06,
        });
    });
}

function spawnRipple(type, x, y) {
    const cv = RC.cv;
    if (!cv) return;
    const cx = x || cv.width / 2, cy = y || cv.height / 2;
    const configs = {
        pos: { col: '78,200,110', count: 5, maxR: 0.88, thick: 2.2, speed: 2200, glow: true },
        neg: { col: '184,58,45', count: 5, maxR: 0.88, thick: 2.2, speed: 2200, glow: true },
        neu: { col: '75,96,127', count: 3, maxR: 0.72, thick: 1.6, speed: 1900, glow: false },
        idle: { col: '220,201,169', count: 2, maxR: 0.52, thick: 1.2, speed: 1700, glow: false },
        burst: { col: '243,112,30', count: 8, maxR: 0.95, thick: 2.8, speed: 2500, glow: true }
    };
    const cfg = configs[type] || configs.idle;
    const maxR = Math.max(cv.width, cv.height) * cfg.maxR;
    const now = Date.now();
    for (let i = 0; i < cfg.count; i++) {
        RC.ripples.push({
            x: cx, y: cy, r: 0, maxR,
            col: cfg.col, born: now, delay: i * 130,
            thick: cfg.thick, speed: cfg.speed + i * 60,
            glow: cfg.glow, secondary: i > 2
        });
    }
}

function drawCanvas() {
    const { cv, ctx } = RC;
    if (!cv || !ctx) return;
    const now = Date.now();
    const cx = cv.width / 2, cy = cv.height / 2;
    ctx.clearRect(0, 0, cv.width, cv.height);

    // Background dots
    ctx.fillStyle = 'rgba(232,184,120,.055)';
    for (let x = 0; x < cv.width; x += 24)
        for (let y = 0; y < cv.height; y += 24) {
            ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill();
        }

    const t = now / 1000;
    [{ cy: cy * 0.3, ry: 60, r: 78, g: 200, b: 110, s: 0.07, p: 0 }, { cy: cy * 0.5, ry: 45, r: 100, g: 140, b: 220, s: 0.05, p: 2 }].forEach(b => {
        const bx = cx + Math.sin(t * b.s + b.p) * cx * 0.25;
        const a = 0.06 + 0.03 * Math.sin(t * 0.4 + b.p);
        const grad = ctx.createRadialGradient(bx, b.cy, 0, bx, b.cy, cv.width * 0.5);
        grad.addColorStop(0, `rgba(${b.r},${b.g},${b.b},${a})`);
        grad.addColorStop(1, `rgba(${b.r},${b.g},${b.b},0)`);
        ctx.beginPath(); ctx.ellipse(bx, b.cy, cv.width * 0.5, b.ry, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad; ctx.fill();
    });

    RC.waveLines.forEach(wl => {
        wl.phase += wl.speed * 0.016;
        ctx.beginPath();
        for (let x = 0; x <= cv.width; x += 2) {
            const yn = wl.y + Math.sin(x * wl.freq + wl.phase) * wl.amp;
            x === 0 ? ctx.moveTo(x, yn) : ctx.lineTo(x, yn);
        }
        ctx.strokeStyle = `rgba(${wl.col},${wl.alpha})`; ctx.lineWidth = 1; ctx.stroke();
    });

    RC.particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.twinkle += p.twinkleSpeed;
        if (p.x < 0) p.x = cv.width; if (p.x > cv.width) p.x = 0;
        if (p.y < 0) p.y = cv.height; if (p.y > cv.height) p.y = 0;
        const aa = p.a * (0.6 + 0.4 * Math.sin(p.twinkle));
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.col},${aa})`; ctx.fill();
    });

    RC.ripples = RC.ripples.filter(rp => {
        const age = now - rp.born - rp.delay;
        if (age < 0) return true;
        const prog = age / rp.speed;
        if (prog > 1) return false;
        rp.r = rp.maxR * (1 - Math.pow(1 - prog, 2.5));
        const fade = 1 - prog;
        const thick = rp.secondary ? rp.thick * 0.6 : rp.thick;
        ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${rp.col},${fade * (rp.secondary ? 0.4 : 0.85)})`;
        ctx.lineWidth = thick; ctx.stroke();
        return true;
    });

    requestAnimationFrame(drawCanvas);
}

// ── FORM HANDLERS ──

function toggleCard(id) {
    const el = document.getElementById('card-' + id);
    if (el) el.classList.toggle('open');
    recalc();
}

function rng(key, val) {
    S[key] = parseFloat(val);
    const ids = { belajar: 'vb', paham: 'vp', tidur: 'vt', stress: 'vs' };
    if (ids[key]) {
        const el = document.getElementById(ids[key]);
        if (el) el.textContent = val;
    }
    const type = key === 'stress' ? (+val <= 3 ? 'pos' : +val <= 6 ? 'neu' : 'neg') : (+val >= 6 ? 'pos' : +val >= 3 ? 'neu' : 'neg');
    spawnRipple(type);
    recalc();
}

function rngFmt(key, val) {
    S[key] = parseFloat(val);
    const el = document.getElementById('vu');
    if (el) el.textContent = parseInt(val).toLocaleString('id-ID');
    spawnRipple('neu');
    recalc();
}

function togglePill(el, group) {
    el.classList.toggle('sel');
    const cardId = group === 'topik' ? 'pikiran' : 'pilihan';
    const sel = document.querySelectorAll('#card-' + cardId + ' .pill.sel');
    S[group] = Array.from(sel).map(p => p.textContent.trim());
    spawnRipple('neu');
    recalc();
}

function setTrans(el, green) {
    document.querySelectorAll('#pills-trans .pill').forEach(p => p.classList.remove('sel'));
    el.classList.add('sel');
    S.transGreen = green;
    spawnRipple(green ? 'pos' : 'neg');
    recalc();
}

function setMood(btn, emoji, type) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('sel'));
    btn.classList.add('sel');
    S.mood = emoji;
    S.moodType = type;
    spawnRipple(type === 'pos' ? 'pos' : type === 'neg' ? 'neg' : 'neu');
    recalc();
}

function togCheck(el, isPos) {
    el.classList.toggle('chk');
    const box = el.querySelector('.tog-box');
    if (box) box.textContent = el.classList.contains('chk') ? '✓' : '';
    spawnRipple(el.classList.contains('chk') ? (isPos ? 'pos' : 'neg') : 'neu');
    recalc();
}

function recalc() {
    let pik = 0;
    pik += Math.min(S.belajar / 4, 1) * 40;
    pik += (S.paham / 10) * 40;
    if (S.topik.length && !S.topik.includes('Tidak ada')) pik += 20;
    pik = Math.round(pik);

    const mMap = { pos: 90, neu: 50, neg: 20 };
    let jiwa = (mMap[S.moodType] || 50) * 0.4 + (S.tidur >= 8 ? 100 : S.tidur >= 6 ? 70 : 40) * 0.4 + (100 - (S.stress - 1) * 11) * 0.2;
    jiwa = Math.round(jiwa);

    let hub = 50;
    document.querySelectorAll('#card-hub .tog').forEach(el => {
        if (!el.classList.contains('chk')) return;
        hub += el.querySelector('.tog-tag').classList.contains('neg') ? -15 : 15;
    });
    hub = Math.max(0, Math.min(100, Math.round(hub)));

    const good = ['Makanan lokal / warteg', 'Buku / alat belajar', 'Tabungan', 'Donasi / sedekah', 'Tidak keluar uang'];
    const bad = ['Belanja online', 'Game / top up'];
    let pil = 50;
    S.belanja.forEach(b => {
        if (good.includes(b)) pil += 15;
        if (bad.includes(b)) pil -= 10;
    });
    pil = Math.max(0, Math.min(100, Math.round(pil)));

    let tap = 50;
    if (S.transGreen === true) tap += 20;
    if (S.transGreen === false) tap -= 15;
    document.querySelectorAll('#card-tapak .tog').forEach(el => {
        if (!el.classList.contains('chk')) return;
        tap += el.querySelector('.tog-tag').classList.contains('neg') ? -15 : 10;
    });
    tap = Math.max(0, Math.min(100, Math.round(tap)));

    const scores = { pikiran: pik, jiwa, hub, pilihan: pil, tapak: tap };
    Object.entries(scores).forEach(([k, v]) => {
        const cv = document.getElementById('cv-' + k); if (cv) cv.textContent = v;
        const pp = document.getElementById('pp-' + k); if (pp) pp.textContent = v + '%';
        const pf = document.getElementById('pf-' + k); if (pf) pf.style.width = v + '%';
    });

    totalScore = Math.round((pik + jiwa + hub + pil + tap) / 5) - 50;
    const d = document.getElementById('scoreDisp');
    if (d) {
        const newVal = (totalScore >= 0 ? '+' : '') + totalScore;
        d.textContent = newVal;
        d.classList.remove('score-pop'); void d.offsetWidth; d.classList.add('score-pop');
    }

    const hint = document.getElementById('aiHintTxt');
    if (hint) {
        const filled = Object.values(scores).filter(v => v !== 50 && v !== 0).length;
        if (filled >= 4) {
            const city = totalScore > 15 ? 'kota hijau dengan udara bersih & taman luas' : totalScore > 0 ? 'kota berkembang dengan harapan besar' : 'kota yang berjuang menemukan arahnya';
            hint.innerHTML = `<span style="color:var(--orange)">Proyeksi 2050:</span> Peradaban yang sedang kamu bangun adalah <strong style="color:var(--txt)">${city}</strong>.`;
        } else {
            hint.textContent = `Isi ${5 - filled} lapisan lagi untuk melihat proyeksi bumi...`;
        }
    }

    if (pik > 0) markDone('pikiran');
    if (jiwa > 0 && S.moodType) markDone('jiwa');
    if (hub !== 50) markDone('hub');
    if (pil !== 50) markDone('pilihan');
    if (S.transGreen !== null) markDone('tapak');
}

function markDone(id) {
    const b = document.getElementById('db-' + id);
    if (b) { b.textContent = '✓ SELESAI'; b.classList.add('done'); }
    const c = document.getElementById('card-' + id);
    if (c) c.classList.add('filled');
}

function submitForm() {
    const modal = document.getElementById('modalBg');
    if (modal) modal.classList.add('show');

    // Update global state
    state.totalScore += totalScore;
    state.layerScores.mind += (Math.round((S.belajar / 12) * 20) || 0);
    state.layerScores.soul += (S.moodType === 'pos' ? 10 : S.moodType === 'neg' ? -10 : 0);
    state.layerScores.nature += (S.transGreen ? 15 : -10);
    state.globeHealth = Math.max(0, Math.min(100, state.globeHealth + (totalScore / 10)));

    // Save global state
    if (window.RIPPLE && window.RIPPLE.saveState) {
        window.RIPPLE.saveState();
    }

    // Toast feedback
    toast(totalScore >= 0 ? 'pos' : 'neg', '🌊 Gelombang Tersimpan', `Skor hari ini: ${totalScore >= 0 ? '+' : ''}${totalScore}.`);
}

function closeModal() {
    const modal = document.getElementById('modalBg');
    if (modal) modal.classList.remove('show');
}

function toast(type, title, msg) {
    const c = document.getElementById('toasts');
    if (!c) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.innerHTML = `<div class="toast-t">${title}</div><div class="toast-m">${msg}</div>`;
    c.appendChild(t);
    setTimeout(() => t.classList.add('show'), 40);
    setTimeout(() => {
        t.classList.remove('show');
        setTimeout(() => t.remove(), 450);
    }, 4500);
}

// ── INITIALIZATION ──

let initialized = false;
function init() {
    initBgCanvas();
    drawBgCanvas();
    initCanvas();
    if (!initialized) {
        drawCanvas();
        initialized = true;
    }

    // Attach functions to window for onclick handlers
    window.DAILY = {
        toggleCard,
        rng,
        rngFmt,
        togglePill,
        setTrans,
        setMood,
        togCheck,
        submitForm,
        closeModal,
        recalc,
        init // Expose init for SPA
    };

    // Map window functions to those expected by HTML onclicks
    window.toggleCard = toggleCard;
    window.rng = rng;
    window.rngFmt = rngFmt;
    window.togglePill = togglePill;
    window.setTrans = setTrans;
    window.setMood = setMood;
    window.togCheck = togCheck;
    window.submitForm = submitForm;
    window.closeModal = closeModal;
}

// Re-init when section changes (for SPA)
window.addEventListener('hashchange', () => {
    if (window.location.hash === '#daily') init();
});

// Initial load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
