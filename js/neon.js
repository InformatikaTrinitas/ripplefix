// ============================================================
//  RIPPLE — neon.js  (LITE — optimized untuk laptop low-end)
//  Semua efek berat dihapus/dikurangi drastis
//  Tidak ada: canvas particles, blur filter, mix-blend-mode
//  Yang tersisa: pulse rings (CSS only), scan line, orb CSS
// ============================================================

(function () {

    // ── Detect low-end: skip canvas sama sekali jika < 4 CPU cores
    const isLowEnd = navigator.hardwareConcurrency <= 4;

    // ══════════════════════════════════════════════════════
    //  1. PARTIKEL — hanya jika hardware cukup, titik sangat sedikit
    // ══════════════════════════════════════════════════════
    function initParticles() {
        return; // disabled total — paling berat

        const canvas = document.createElement('canvas');
        canvas.id = 'neon-particles';
        canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
        document.body.insertBefore(canvas, document.body.firstChild);

        const ctx = canvas.getContext('2d');
        let W = window.innerWidth, H = window.innerHeight;
        canvas.width = W; canvas.height = H;

        window.addEventListener('resize', () => {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }, { passive: true });

        // Hanya 15 titik — sangat ringan
        const pts = Array.from({ length: 15 }, () => ({
            x:  Math.random() * W,
            y:  Math.random() * H,
            vx: (Math.random() - 0.5) * 0.25,
            vy: (Math.random() - 0.5) * 0.25,
            r:  Math.random() * 1.2 + 0.5,
            a:  Math.random() * 0.35 + 0.1,
        }));

        const MAX_D2 = 100 * 100; // kurangi jarak koneksi
        let last = 0;

        function draw(t) {
            requestAnimationFrame(draw);
            if (t - last < 1000 / 24) return; // 24fps — sangat ringan
            last = t;

            ctx.clearRect(0, 0, W, H);

            pts.forEach(p => {
                p.x = (p.x + p.vx + W) % W;
                p.y = (p.y + p.vy + H) % H;
            });

            // Koneksi — tanpa shadow/glow
            ctx.lineWidth = 0.4;
            for (let i = 0; i < pts.length; i++) {
                for (let j = i + 1; j < pts.length; j++) {
                    const dx = pts[i].x - pts[j].x;
                    const dy = pts[i].y - pts[j].y;
                    if (dx*dx + dy*dy < MAX_D2) {
                        ctx.strokeStyle = `rgba(243,112,30,0.08)`;
                        ctx.beginPath();
                        ctx.moveTo(pts[i].x, pts[i].y);
                        ctx.lineTo(pts[j].x, pts[j].y);
                        ctx.stroke();
                    }
                }
            }

            // Titik — tanpa shadowBlur (shadowBlur sangat berat!)
            pts.forEach(p => {
                ctx.fillStyle = `rgba(243,112,30,${p.a})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
                ctx.fill();
            });
        }
        requestAnimationFrame(draw);
    }

    // ══════════════════════════════════════════════════════
    //  2. ORB — CSS only, TANPA blur filter di JS
    //  Blur di CSS tapi hanya satu orb, ukuran kecil
    // ══════════════════════════════════════════════════════
    function initNeonOrbs() { return; // disabled — float animation boros
        if (document.getElementById('neon-orbs')) return;
        const wrap = document.createElement('div');
        wrap.id = 'neon-orbs';
        wrap.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;';
        document.body.insertBefore(wrap, document.body.firstChild);

        // Hanya 2 orb kecil, blur lebih kecil, TANPA mix-blend-mode
        [
            ['380px','300px','-5%','5%',  'rgba(243,112,30,0.06)', 22, 0],
            ['300px','240px','40%','65%', 'rgba(184,58,45,0.045)', 28, 6],
        ].forEach(([w,h,top,left,color,dur,delay]) => {
            const o = document.createElement('div');
            o.style.cssText = `
                position:absolute;
                width:${w};height:${h};top:${top};left:${left};
                border-radius:50%;
                /* blur disabled */
                background:radial-gradient(ellipse,${color} 0%,transparent 70%);
                animation:neonOrbFloat ${dur}s ease-in-out ${delay}s infinite;
                will-change:transform;
            `;
            // TIDAK pakai mix-blend-mode — itu yang paling berat
            wrap.appendChild(o);
        });
    }

    // ══════════════════════════════════════════════════════
    //  3. PULSE RINGS — CSS only, ringan
    // ══════════════════════════════════════════════════════
    function initPulseRings() {
        const hero = document.querySelector('.hero');
        if (!hero) return;
        hero.style.position = 'relative';
        [0, 1.6].forEach((delay, i) => { // hanya 2 ring
            const r = document.createElement('div');
            r.className = 'neon-pulse-ring';
            const sz = 300 + i * 100;
            r.style.cssText = `width:${sz}px;height:${sz}px;top:50%;left:50%;
                margin-top:-${sz/2}px;margin-left:-${sz/2}px;
                animation-delay:${delay}s;
                border-color:rgba(243,112,30,${0.1 - i*0.03});`;
            hero.appendChild(r);
        });
    }

    // ══════════════════════════════════════════════════════
    //  4. SCAN LINE — CSS keyframe inject, sangat ringan
    // ══════════════════════════════════════════════════════
    function initScanLine() {
        if (document.getElementById('neonScanKF')) return;
        const s = document.createElement('style');
        s.id = 'neonScanKF';
        s.textContent = `
            @keyframes heroScanV{0%{top:-2px;opacity:0}4%{opacity:1}96%{opacity:0.4}100%{top:100%;opacity:0}}
        `;
        document.head.appendChild(s);

        const hero = document.querySelector('.hero, .global-hero');
        if (!hero) return;
        const scan = document.createElement('div');
        scan.style.cssText = `position:absolute;top:0;left:0;width:100%;height:1px;
            pointer-events:none;z-index:1;
            background:linear-gradient(90deg,transparent,rgba(243,112,30,0.4) 50%,transparent);
            animation:heroScanV 12s linear infinite;`; // 12s bukan 8s — lebih jarang
        hero.appendChild(scan);
    }

    // ══════════════════════════════════════════════════════
    //  5. MAGNETIC CARDS — DIMATIKAN TOTAL
    //  Ini yang bikin lag saat mouse gerak, tidak worth it
    // ══════════════════════════════════════════════════════
    // function initMagneticCards() {} // disabled

    // ══════════════════════════════════════════════════════
    //  6. FIX globalRipple card reset
    // ══════════════════════════════════════════════════════
    function fixGlobalRippleConflict() {
        if (!document.getElementById('live-feed')) return;
        const BASE = '0 0 0 1px rgba(243,112,30,0.07), 0 4px 24px rgba(0,0,0,0.4)';
        const BORDER = 'rgba(243,112,30,0.22)';
        let ticking = false;
        document.addEventListener('mousemove', () => {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(() => {
                document.querySelectorAll('.stat-card,.ripple-type').forEach(c => {
                    if (!c.style.boxShadow || c.style.boxShadow === '') {
                        c.style.boxShadow   = BASE;
                        c.style.borderColor = BORDER;
                    }
                });
                ticking = false;
            });
        }, { passive: true });
    }

    // ══════════════════════════════════════════════════════
    //  RUN
    // ══════════════════════════════════════════════════════
    function run() {
        initNeonOrbs();
        initPulseRings();
        initScanLine();
        initParticles();     // skip otomatis jika low-end
        fixGlobalRippleConflict();
        // magnetic cards dimatikan — terlalu berat
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', run);
    } else {
        run();
    }

})();