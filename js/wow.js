// ============================================================
//  RIPPLE — wow.js
//  1. Hero title RIPPLE 3D mouse tracking
//  2. Dekorasi kiri-kanan + scroll progress
//  3. PPT-style card transitions
//  4. Floating stats di hero
// ============================================================
(function(){

    // ══════════════════════════════════════════════════════
    //  1. RIPPLE 3D MOUSE TRACKING
    // ══════════════════════════════════════════════════════
    function init3DTitle() {
        const title = document.querySelector('.hero-title');
        if (!title) return;

        if (typeof window.stopTyping === 'function') window.stopTyping();

        // Set RIPPLE with letter wrap (no 3D tracking — reduces lag)
        const text = 'RIPPLE';
        title.innerHTML = text.split('').map((ch, i) =>
            `<span class="ripple-letter" style="transition-delay:${i*0.02}s">${ch}</span>`
        ).join('');

        // Re-run typing text for subtitle
        const typingEl = document.querySelector('.typing-text');
        if (typingEl) {
            typingEl.innerHTML = '';
            const phrase = "Every Choice You Make, The World Feels It.";
            let idx = 0;
            function reType() {
                if (idx < phrase.length) {
                    typingEl.innerHTML += phrase.charAt(idx);
                    idx++;
                    setTimeout(reType, 75);
                }
            }
            reType();
        }

        // 3D mouse tracking disabled — caused lag on mousemove
        // hero.addEventListener('mousemove', ...) — removed
    }

    // ══════════════════════════════════════════════════════
    //  2. DEKORASI KIRI-KANAN
    // ══════════════════════════════════════════════════════
    function initDeco() {
        // Left bar
        const left = document.createElement('div');
        left.className = 'deco-left';
        left.innerHTML = `
            <div class="deco-dot"></div>
            <div class="deco-dot"></div>
            <div class="deco-dot"></div>
            <div class="deco-dot"></div>`;
        document.body.appendChild(left);

        // Right scroll progress
        const prog = document.createElement('div');
        prog.className = 'deco-scroll-progress';
        prog.id = 'deco-prog';
        document.body.appendChild(prog);

        // Section pips
        const pips = document.createElement('div');
        pips.className = 'deco-section-num';
        pips.id = 'deco-pips';
        const sections = ['hero','concept','how-section','layers-section','facts-section','world-section'];
        pips.innerHTML = sections.map((s,i) =>
            `<div class="deco-pip" data-sec="${s}" id="pip-${i}"></div>`
        ).join('');
        document.body.appendChild(pips);

        // Scroll progress
        window.addEventListener('scroll', () => {
            const scrolled = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            const p = document.getElementById('deco-prog');
            if (p) p.style.height = (scrolled * 100) + '%';

            // Active pip
            sections.forEach((sel, i) => {
                const el = document.querySelector(`.${sel}, section.${sel}`);
                if (!el) return;
                const rect = el.getBoundingClientRect();
                const pip  = document.getElementById(`pip-${i}`);
                if (!pip) return;
                if (rect.top <= window.innerHeight/2 && rect.bottom >= window.innerHeight/2) {
                    document.querySelectorAll('.deco-pip').forEach(p => p.classList.remove('active'));
                    pip.classList.add('active');
                }
            });
        }, { passive: true });
    }

    // ══════════════════════════════════════════════════════
    //  3. PPT-STYLE TRANSITIONS — SEMUA ELEMEN INDEX
    // ══════════════════════════════════════════════════════
    function initPPTTransitions() {
        // --- WORD BY WORD REVEAL FOR HEADINGS ---
        document.querySelectorAll('.section-heading').forEach(heading => {
            const words = heading.innerText.split(' ');
            heading.innerHTML = words.map((word, i) => 
                `<span class="reveal-word" style="transition-delay: ${i * 0.1}s">${word}</span>`
            ).join(' ');
        });

        const delays = ['ppt-d1','ppt-d2','ppt-d3','ppt-d4','ppt-d5','ppt-d6'];

        const configs = [
            ['.concept-card',   'ppt-flip',  true],
            ['.step-card',      'ppt-left',  true],
            ['.layer-card',     'ppt-zoom',  true],
            ['.fact-card',      'ppt-right', true],
            ['.world-card',     'ppt-card',  true],
            ['.opinion-card',   'ppt-zoom',  false],
            ['.cta-section',    'ppt-card',  false],
            ['.cta-quote',      'ppt-flip',  false],
            ['.cta-buttons',    'ppt-zoom',  false],
            ['.cta-sub',        'ppt-card',  false],
            ['.section-divider','ppt-zoom',  false],
        ];

        // Apply class + stagger
        const applied = new Set();
        configs.forEach(([sel, anim, stagger]) => {
            document.querySelectorAll(sel).forEach((el, i) => {
                if (applied.has(el)) return;
                applied.add(el);
                el.classList.add(anim);
                if (stagger) el.classList.add(delays[i % delays.length]);
            });
        });

        // Headings
        document.querySelectorAll('.section-heading, .section-label').forEach(el => {
            el.classList.add('ppt-heading-base');
            applied.add(el);
        });

        // TRUE BIDIRECTIONAL — reset SELALU saat keluar dari bawah
        // dan dari atas juga (scroll ke atas = animasi ulang)
        const OBS = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                const el   = e.target;
                const rect = e.boundingClientRect;

                if (e.isIntersecting) {
                    // Masuk — show
                    el.classList.add('ppt-visible', 'ppt-heading-show');
                } else {
                    // Keluar dari BAWAH (belum sampai) → hide, siap animasi lagi
                    if (rect.top > 0) {
                        el.classList.remove('ppt-visible', 'ppt-heading-show');
                    }
                    // Keluar dari ATAS (scroll balik ke atas) → juga hide
                    if (rect.bottom < 0) {
                        el.classList.remove('ppt-visible', 'ppt-heading-show');
                    }
                }
            });
        }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

        applied.forEach(el => OBS.observe(el));
    }

    // ══════════════════════════════════════════════════════
    //  4. FLOATING STATS DI HERO
    // ══════════════════════════════════════════════════════
    function initHeroStats() {
        const hero = document.querySelector('.hero');
        if (!hero) return;

        const stats = [
            { num: '52.9 JUTA', label: 'Pelajar Indonesia' },
            { num: '70%',       label: 'Pro-Lingkungan' },
            { num: '#4',        label: 'Populasi Pelajar Dunia' },
        ];

        const positions = [
            'bottom:18%;left:3%',
            'top:22%;right:3%',
            'bottom:28%;right:3%'
        ];
        stats.forEach((s, i) => {
            const el = document.createElement('div');
            el.className = 'hero-stat-float';
            el.style.cssText = positions[i] + ';animation-delay:' + (i*1.3) + 's';
            el.innerHTML = `
                <div class="hero-stat-dot"></div>
                <div>
                    <span class="hero-stat-num">${s.num}</span>
                    <span class="hero-stat-text">${s.label}</span>
                </div>`;
            hero.appendChild(el);
        });
    }

    // ══════════════════════════════════════════════════════
    //  INIT
    // ══════════════════════════════════════════════════════
    function run() {
        // Matikan typeText dari landing.js supaya tidak override hero-title
        if (typeof window.typeText === 'function') {
            window.typeText = function(){};
        }
        init3DTitle();
        initDeco();
        initPPTTransitions();
        initHeroStats();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(run, 1200));
    } else {
        setTimeout(run, 1200);
    }
})();