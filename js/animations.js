// ============================================================
//  RIPPLE — animations.js
//  1. Wave Morphing Divider
//  2. Odometer Number Counter
//  3. Magnetic Cards
//  4. Text Scramble Hero
//
//  Tambahkan di <head>:
//    <link rel="stylesheet" href="css/animations.css">
//  Tambahkan di akhir <body> (setelah semua script lain):
//    <script src="js/animations.js"></script>
// ============================================================

(function () {

    // ══════════════════════════════════════════════════════
    //  UTIL
    // ══════════════════════════════════════════════════════
    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn);
        } else {
            fn();
        }
    }

    // ══════════════════════════════════════════════════════
    //  1. WAVE MORPHING DIVIDER
    //  Ganti setiap .section-divider dengan SVG wave hidup
    // ══════════════════════════════════════════════════════
    function initWaveDividers() {
        document.querySelectorAll('.section-divider').forEach((div, i) => {
            const delay  = (i % 3) * 1.5;
            const delay2 = delay + 0.8;
            const delay3 = delay + 1.4;

            // Particle x positions — acak tapi seeded per divider
            const particles = [0.1, 0.28, 0.45, 0.62, 0.78, 0.91].map((frac, pi) => {
                const px  = frac * 100;
                const dur = 2.5 + (pi % 3) * 0.8;
                const pdl = (pi * 0.4) % 2;
                return `<circle class="wave-particle" cx="${px}%" cy="28"
                    r="1.8" style="--dur:${dur}s;--delay:${pdl}s"/>`;
            }).join('');

            div.innerHTML = `
                <svg viewBox="0 0 1800 48" preserveAspectRatio="none"
                     xmlns="http://www.w3.org/2000/svg">
                    <path class="wave-path-1"
                        d="M0,24 C200,8 400,40 600,24 C800,8 1000,40 1200,24 C1400,8 1600,40 1800,24 L1800,48 L0,48 Z"
                        style="animation-delay:${delay}s"/>
                    <path class="wave-path-2"
                        d="M0,28 C250,12 500,44 750,28 C1000,12 1250,44 1500,28 C1650,20 1750,32 1800,28"
                        style="animation-delay:${delay2}s"/>
                    <path class="wave-path-3"
                        d="M0,24 C200,8 400,40 600,24 C800,8 1000,40 1200,24 C1400,8 1600,40 1800,24 L1800,48 L0,48 Z"
                        style="animation-delay:${delay3}s"/>
                    ${particles}
                </svg>`;
        });
    }

    // ══════════════════════════════════════════════════════
    //  2. ODOMETER NUMBER COUNTER
    //  Bungkus setiap .fact-number dengan odometer digit slots
    // ══════════════════════════════════════════════════════
    const DIGITS = '0123456789';

    function buildOdometer(el) {
        const target  = parseInt(el.getAttribute('data-target')) || 0;
        const suffix  = el.getAttribute('data-suffix') || '';
        const display = target.toLocaleString('id-ID') + suffix;

        // Pisahkan karakter — digit vs separator/suffix
        const chars = display.split('');
        el.innerHTML = '';
        el.classList.add('odometer-wrap');

        const slots = chars.map(ch => {
            if (!DIGITS.includes(ch)) {
                // Separator atau suffix — tampilkan statis
                const span = document.createElement('span');
                span.className = 'odometer-suffix';
                span.textContent = ch;
                el.appendChild(span);
                return null;
            }

            const digit = document.createElement('span');
            digit.className = 'odometer-digit';
            digit.style.width = '0.62em';

            const inner = document.createElement('div');
            inner.className = 'odometer-digit-inner';

            // Stack 0–9 dari atas
            for (let d = 0; d <= 9; d++) {
                const s = document.createElement('span');
                s.textContent = d;
                inner.appendChild(s);
            }
            // Start dari 0
            inner.style.transform = 'translateY(0)';
            digit.appendChild(inner);
            el.appendChild(digit);
            return { inner, target: parseInt(ch) };
        }).filter(Boolean);

        return slots;
    }

    function rollOdometer(slots, duration = 2000) {
        const start = performance.now();
        // Jumlah digit setiap slot perlu roll ke angka akhirnya
        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);

            slots.forEach(({ inner, target }) => {
                // Roll dari 0 ke target, dengan sedikit overshoot lalu settle
                let current;
                if (progress < 0.85) {
                    // Fase acak: spin cepat
                    current = Math.floor(ease * (target + (10 * Math.floor(progress * 3)))) % 10;
                } else {
                    current = target;
                }
                inner.style.transform = `translateY(-${current * 1.1}em)`;
            });

            if (progress < 1) {
                requestAnimationFrame(tick);
            } else {
                // Pastikan angka final tepat
                slots.forEach(({ inner, target }) => {
                    inner.style.transform = `translateY(-${target * 1.1}em)`;
                });
            }
        }
        requestAnimationFrame(tick);
    }

    function initOdometers() {
        const factNumbers = document.querySelectorAll('.fact-number[data-target]');
        if (!factNumbers.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (el.dataset.rolled) return;
                el.dataset.rolled = '1';

                const slots = buildOdometer(el);
                // Delay kecil biar visible dulu
                setTimeout(() => rollOdometer(slots, 1800), 100);
                observer.unobserve(el);
            });
        }, { threshold: 0.5 });

        factNumbers.forEach(el => observer.observe(el));
    }

    // ══════════════════════════════════════════════════════
    //  3. MAGNETIC CARDS
    //  Kartu tertarik ke arah cursor — tilt + glow
    // ══════════════════════════════════════════════════════
    function initMagneticCards() { /* handled by neon.js with throttling */ }

    // ══════════════════════════════════════════════════════
    //  4. TEXT SCRAMBLE HERO
    //  Teks hero scramble sebelum reveal — Matrix effect
    // ══════════════════════════════════════════════════════
    const SCRAMBLE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*?!';

    function scrambleText(el, finalText, duration = 1800, startDelay = 0) {
        el.classList.add('scramble-target');
        el.innerHTML = '';

        // Bungkus setiap karakter
        const charEls = finalText.split('').map(ch => {
            const span = document.createElement('span');
            span.className = 'scramble-char';
            span.textContent = ch === ' ' ? '\u00A0' : '?';
            span.dataset.final = ch;
            el.appendChild(span);
            return span;
        });

        const totalChars = charEls.filter(s => s.dataset.final !== ' ').length;
        let settled = 0;

        charEls.forEach((span, i) => {
            if (span.dataset.final === ' ') {
                span.textContent = '\u00A0';
                return;
            }

            const charDelay = startDelay + (i / finalText.length) * (duration * 0.6);
            const scrambleDur = duration * 0.4;
            const intervalMs  = 40;
            let elapsed = 0;

            span.classList.add('scrambling');

            setTimeout(() => {
                const interval = setInterval(() => {
                    elapsed += intervalMs;
                    const progress = elapsed / scrambleDur;

                    if (progress >= 1) {
                        clearInterval(interval);
                        span.textContent = span.dataset.final;
                        span.classList.remove('scrambling');
                        span.classList.add('settled');
                        settled++;
                    } else {
                        // Makin dekat settle, makin sering muncul huruf benar
                        const showReal = Math.random() < progress * 0.6;
                        span.textContent = showReal
                            ? span.dataset.final
                            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
                    }
                }, intervalMs);
            }, charDelay);
        });
    }

    function initTextScramble() {
        // ── Override landing.js typeText ──────────────────
        // landing.js langsung run typeText() — kita neutralize dengan
        // mengganti fungsi global sebelum sempat berjalan lagi,
        // lalu bersihkan hasilnya sebelum scramble
        if (typeof window.typeText === 'function') {
            window.typeText = function() {}; // neutralize
        }

        // Hero title "RIPPLE"
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const original = heroTitle.textContent.trim();
            heroTitle.textContent = '';
            setTimeout(() => scrambleText(heroTitle, original, 1600, 0), 900);
        }

        // Typing text — ambil alih dari landing.js
        const typingEl = document.querySelector('.typing-text');
        if (typingEl) {
            const phrase = "Every Choice You Make, The World Feels It.";
            typingEl.textContent = '';
            typingEl.style.minHeight = '1.4em';
            setTimeout(() => scrambleText(typingEl, phrase, 2200, 0), 2600);
        }

        // Section headings — scramble saat scroll masuk viewport
        const headings = document.querySelectorAll('.section-heading');
        const headObs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) return;
                const el = entry.target;
                if (el.dataset.scrambled) return;
                el.dataset.scrambled = '1';

                // Ambil teks murni (tanpa <span> warna)
                const raw = el.innerText.trim();
                // Simpan HTML asli untuk restore warna span
                const originalHTML = el.innerHTML;

                // Scramble dulu plain text
                el.innerHTML = '';
                scrambleText(el, raw, 1200, 0);

                // Setelah scramble selesai, restore HTML asli (dengan span warna)
                setTimeout(() => {
                    el.innerHTML = originalHTML;
                }, 1400);

                headObs.unobserve(el);
            });
        }, { threshold: 0.6 });

        headings.forEach(h => headObs.observe(h));
    }

    // ══════════════════════════════════════════════════════
    //  JALANKAN SEMUA
    // ══════════════════════════════════════════════════════
    onReady(() => {
        // initWaveDividers(); // disabled — SVG morph terlalu berat
        // initMagneticCards(); // disabled
        // initOdometers(); // disabled — RAF loop
        initSimpleCounter();
    });

    // initTextScramble(); // disabled — setInterval per karakter terlalu berat


    // Simple counter — tidak pakai RAF loop, cukup setTimeout 1x
    function initSimpleCounter() {
        const nums = document.querySelectorAll('.fact-number[data-target]');
        if (!nums.length) return;
        const OBS = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (!e.isIntersecting) return;
                const el     = e.target;
                const target = +el.dataset.target;
                const suffix = el.dataset.suffix || '';
                const dur    = 1800;
                const start  = Date.now();
                OBS.unobserve(el);
                (function count() {
                    const prog = Math.min((Date.now() - start) / dur, 1);
                    const ease = 1 - Math.pow(1 - prog, 3);
                    const val  = Math.floor(ease * target);
                    el.textContent = val.toLocaleString('id-ID') + suffix;
                    if (prog < 1) setTimeout(count, 16);
                })();
            });
        }, { threshold: 0.3 });
        nums.forEach(el => OBS.observe(el));
    }

})();