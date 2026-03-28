// ============================================================
//  RIPPLE — loader.js
//  Loading Screen + Custom Cursor + Scroll Progress
//  Tambahkan <script src="js/loader.js"></script> di akhir <body>
//  (sebelum landing.js / sidebar.js)
// ============================================================

(function () {

    // ── 1. BUILD LOADER HTML ─────────────────────────────────
    const loaderHTML = `
    <div id="ripple-loader">
        <!-- Corner brackets -->
        <div class="loader-corner loader-corner-tl"></div>
        <div class="loader-corner loader-corner-tr"></div>
        <div class="loader-corner loader-corner-bl"></div>
        <div class="loader-corner loader-corner-br"></div>

        <!-- Ripple SVG -->
        <svg class="loader-svg" width="200" height="200" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <!-- Dashed orbit ring -->
            <circle class="loader-orbit" cx="100" cy="100" r="70"/>
            <!-- Orbit travelling dot -->
            <circle class="loader-orbit-dot" cx="100" cy="30" r="2.5"/>

            <!-- Expanding ripple rings (animated via CSS) -->
            <circle class="loader-ring loader-ring-4" cx="100" cy="100" r="8"/>
            <circle class="loader-ring loader-ring-3" cx="100" cy="100" r="8"/>
            <circle class="loader-ring loader-ring-2" cx="100" cy="100" r="8"/>
            <circle class="loader-ring loader-ring-1" cx="100" cy="100" r="8"/>

            <!-- Static faint reference circles -->
            <circle cx="100" cy="100" r="40"  fill="none" stroke="rgba(243,112,30,0.06)" stroke-width="0.5"/>
            <circle cx="100" cy="100" r="65"  fill="none" stroke="rgba(243,112,30,0.04)" stroke-width="0.5"/>

            <!-- Center dot -->
            <circle class="loader-center-dot" cx="100" cy="100" r="5"/>
            <!-- White core -->
            <circle cx="100" cy="100" r="2.5" fill="rgba(255,255,255,0.9)"/>
        </svg>

        <!-- Wordmark -->
        <div class="loader-wordmark">RIPPLE</div>
        <div class="loader-tagline">Every Choice You Make, The World Feels It</div>

        <!-- Progress bar -->
        <div class="loader-progress-wrap">
            <div class="loader-progress-bar">
                <div class="loader-progress-fill" id="loader-fill"></div>
            </div>
            <div class="loader-progress-pct" id="loader-pct">0%</div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('afterbegin', loaderHTML);

    // ── 2. PROGRESS ANIMATION ────────────────────────────────
    const fill    = document.getElementById('loader-fill');
    const pctEl   = document.getElementById('loader-pct');
    const loader  = document.getElementById('ripple-loader');
    let progress  = 0;
    let rafId;

    // Ease-in-out speed: fast start, slows before 95, jumps to 100 on load
    const speeds = [
        { until: 30,  rate: 1.8 },
        { until: 60,  rate: 1.0 },
        { until: 80,  rate: 0.5 },
        { until: 95,  rate: 0.2 },
        { until: 100, rate: 0   }, // holds until window load
    ];

    function getRate(p) {
        for (const s of speeds) {
            if (p < s.until) return s.rate;
        }
        return 0;
    }

    function tick() {
        const rate = getRate(progress);
        if (rate > 0) {
            progress = Math.min(progress + rate, 95);
            fill.style.width  = progress + '%';
            pctEl.textContent = Math.floor(progress) + '%';
        }
        rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);

    function finishLoader() {
        cancelAnimationFrame(rafId);
        progress = 100;
        fill.style.width  = '100%';
        pctEl.textContent = '100%';

        setTimeout(() => {
            loader.classList.add('fade-out');
            // Remove from DOM after fade
            setTimeout(() => loader.remove(), 750);
        }, 300);
    }

    // Fire on window load, or after 3.5s max (safety net)
    window.addEventListener('load', finishLoader);
    setTimeout(finishLoader, 3500);


    // ── 3. BUILD CURSOR ELEMENTS ─────────────────────────────
    const cursorDot    = document.createElement('div');
    const cursorRing   = document.createElement('div');
    const cursorRipple = document.createElement('div');
    cursorDot.className    = 'cursor-dot';
    cursorRing.className   = 'cursor-ring';
    cursorRipple.className = 'cursor-ripple';
    document.body.append(cursorDot, cursorRing, cursorRipple);

    // ── 4. CURSOR TRACKING ───────────────────────────────────
    let mouseX = -200, mouseY = -200;
    let dotX = -200, dotY = -200;
    let ringX = -200, ringY = -200;
    let rippleX = -200, rippleY = -200;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    // Smooth lag for ring and ripple layers
    // Cursor via CSS transform — jauh lebih ringan dari RAF loop
    // Langsung set di mousemove, tidak perlu RAF loop terus-menerus
    let cursorRAF = false;
    function animateCursor() {} // no-op, kept for compatibility

    document.addEventListener('mousemove', (e) => {
        if (cursorRAF) return;
        cursorRAF = true;
        requestAnimationFrame(() => {
            cursorRAF = false;
            const x = e.clientX, y = e.clientY;
            cursorDot.style.left    = x + 'px';
            cursorDot.style.top     = y + 'px';
            cursorRing.style.left   = x + 'px';
            cursorRing.style.top    = y + 'px';
            cursorRipple.style.left = x + 'px';
            cursorRipple.style.top  = y + 'px';
        });
    }, { passive: true });

    // ── 5. HOVER STATE (links, buttons) ──────────────────────
    const hoverTargets = 'a, button, [role="button"], input[type="range"], .concept-card, .step-card, .fact-card, .world-card, .opinion-card, .nav-item, .start-button, .cta-btn-primary, .cta-btn-secondary, #submit-btn';

    // Use event delegation on document
    document.addEventListener('mouseover', (e) => {
        if (e.target.closest(hoverTargets)) {
            document.body.classList.add('cursor-hover');
        }
    });
    document.addEventListener('mouseout', (e) => {
        if (e.target.closest(hoverTargets)) {
            document.body.classList.remove('cursor-hover');
        }
    });

    // ── 6. CLICK BURST EFFECT ────────────────────────────────
    document.addEventListener('mousedown', () => {
        document.body.classList.add('cursor-click');
    });
    document.addEventListener('mouseup', () => {
        document.body.classList.remove('cursor-click');
    });

    document.addEventListener('click', (e) => { return; // burst disabled
        // SVG burst on click
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '80');
        svg.setAttribute('height', '80');
        svg.setAttribute('viewBox', '0 0 80 80');
        svg.classList.add('cursor-burst');
        svg.style.left = e.clientX + 'px';
        svg.style.top  = e.clientY + 'px';

        const colors = ['#f3701e', '#B83A2D', 'rgba(243,112,30,0.5)'];
        colors.forEach((color, i) => {
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', '40');
            circle.setAttribute('cy', '40');
            circle.setAttribute('r', '4');
            circle.setAttribute('fill', 'none');
            circle.setAttribute('stroke', color);
            circle.setAttribute('stroke-width', i === 0 ? '1.5' : '0.8');
            circle.style.animationDelay = (i * 0.08) + 's';
            svg.appendChild(circle);
        });

        document.body.appendChild(svg);
        setTimeout(() => svg.remove(), 700);
    });

    // ── 7. SCROLL PROGRESS BAR ───────────────────────────────
    const scrollBar = document.createElement('div');
    scrollBar.id = 'scroll-progress';
    document.body.insertAdjacentElement('afterbegin', scrollBar);

    window.addEventListener('scroll', () => {
        const scrollTop    = window.scrollY;
        const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled     = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        scrollBar.style.width = scrolled + '%';
    }, { passive: true });

    // ── 8. HIDE CURSOR ON LEAVE / SHOW ON ENTER ──────────────
    document.addEventListener('mouseleave', () => {
        cursorDot.style.opacity    = '0';
        cursorRing.style.opacity   = '0';
        cursorRipple.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => {
        cursorDot.style.opacity    = '1';
        cursorRing.style.opacity   = '1';
        cursorRipple.style.opacity = '1';
    });

})();