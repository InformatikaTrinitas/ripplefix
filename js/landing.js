// ============================================================
//  RIPPLE — landing.js
//  Semua logika JS untuk halaman index.html (Landing Page)
// ============================================================

// ── TYPING TEXT ───────────────────────────────────────────
const text = "Every Choice You Make, The World Feels It.";
const typingElement = document.querySelector(".typing-text");
let index = 0;
let typingActive = true;

window.stopTyping = function() { typingActive = false; };

function typeText() {
    if (!typingActive) return;
    if (index < text.length) {
        typingElement.innerHTML += text.charAt(index);
        index++;
        setTimeout(typeText, 80);
    }
}

// Ekspose ke global supaya bisa di-stop dari wow.js
window.typeText = typeText;
window.typingIndex = function() { return index; };

typeText();

// ── RIPPLE RING ANIMATION — DISABLED (reduces lag) ───────
// const rings = [...]; requestAnimationFrame animateRing — disabled

// ── GLOBAL RIPPLE CLICK EFFECT — DISABLED (creates DOM on every click) ──
// document.body.addEventListener('click', ...) — disabled

// ── NEON CURSOR TRAIL — DISABLED (creates DOM elements on every mousemove) ──
// let lastTrailTime = 0;


// ── SCROLL REVEAL ─────────────────────────────────────────
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.15 });

document.querySelectorAll(
    '.step-card, .layer-card, .fact-card, .world-card, .opinion-card'
).forEach(el => revealObserver.observe(el));

// ── FACT COUNTER (trigger saat scroll) ───────────────────
const factObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const el     = entry.target;
        const target = parseInt(el.getAttribute('data-target'));
        const suffix = el.getAttribute('data-suffix') || '';
        const start  = performance.now();

        function update(now) {
            const progress = Math.min((now - start) / 2000, 1);
            const ease     = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(ease * target).toLocaleString('id-ID') + suffix;
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target.toLocaleString('id-ID') + suffix;
        }
        requestAnimationFrame(update);
        factObserver.unobserve(el);
    });
}, { threshold: 0.5 });

document.querySelectorAll('.fact-number[data-target]').forEach(el => factObserver.observe(el));

// ── SLIDER PENDAPAT (DASHBOARD MODE) ───────────────────────
const sliders = document.querySelectorAll('.opinion-slider');
const impactEl = document.getElementById('avg-impact');

function calculateGlobalImpact() {
    if (!impactEl) return;
    let total = 0;
    sliders.forEach(s => total += parseInt(s.value));
    const avg = Math.round((total / (sliders.length * 10)) * 100);
    impactEl.textContent = avg;
}

sliders.forEach(slider => {
    const wrapper = slider.closest('.slider-wrapper');
    const valueEl = wrapper.querySelector('.slider-value');
    
    function updateSliderUI() {
        const val = parseInt(slider.value);
        const pct = ((val - 1) / 9) * 100;
        const color = '#f3701e';

        valueEl.textContent = val;
        slider.style.background = `linear-gradient(to right, ${color} ${pct}%, rgba(255,255,255,0.1) ${pct}%)`;
        
        calculateGlobalImpact();
    }

    slider.addEventListener('input', updateSliderUI);
    updateSliderUI();
});

// ── SUBMIT PENDAPAT → DASHBOARD GRID ─────────────────────
const SHEET_URL = 'https://script.google.com/macros/s/AKfycbyNv-W51XfjnZsjmZP5VPNTiQIxoLQ2ijoByPUrnDKWBMQ86RiG6qBI9zZqb9izUqx-/exec';

const opinionForm = document.getElementById('opinion-form');
if (opinionForm) {
    opinionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        const btn     = document.getElementById('submit-btn');
        const success = document.getElementById('submit-success');

        const q1 = sliders[0].value;
        const q2 = sliders[1].value;
        const q3 = sliders[2].value;

        btn.textContent = 'SYNCING TO GRID...';
        btn.disabled    = true;

        try {
            await fetch(SHEET_URL, {
                method: 'POST',
                mode:   'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ q1, q2, q3 }),
            });

            btn.textContent = 'DATA TRANSMITTED ✓';
            btn.style.background = '#4CAF50';
            btn.style.borderColor = '#4CAF50';
            btn.style.color = '#fff';
            
            if (success) success.style.display = 'flex';

            setTimeout(() => {
                btn.textContent = 'SEND TO GRID ⚡';
                btn.disabled = false;
                btn.style.background = 'transparent';
                btn.style.borderColor = '#f3701e';
                btn.style.color = '#f3701e';
                if (success) success.style.display = 'none';

                sliders.forEach(s => {
                    s.value = 5;
                    s.dispatchEvent(new Event('input'));
                });
            }, 4000);

        } catch (err) {
            btn.textContent = 'TRANSMISSION FAILED';
            btn.disabled = false;
            setTimeout(() => {
                btn.textContent = 'SEND TO GRID ⚡';
            }, 3000);
        }
    });
}

// ── NEWS TICKER (duplikasi biar seamless loop) ────────────
const tickerInner = document.getElementById('ticker-inner');
if (tickerInner) {
    tickerInner.innerHTML += tickerInner.innerHTML;
}