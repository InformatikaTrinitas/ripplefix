import { state } from './data.js';

/**
 * RIPPLE GLOBAL — Global Statistics & Indonesia Map Module
 * Ports logic from global.html / globalRipple.js into SPA architecture.
 */

export const GLOBAL = {
    state: {
        lastUpdate: null,
        worldMode: 'positive'
    },

    init() {
        console.log("GLOBAL: Initializing...");
        this.initCounters();
        this.initMap();
        this.initParticles();
        this.initRevealObserver();
        this.initTicker();
        this.initHopeSection();

        // Initial world mode
        this.setWorldMode('positive');
    },

    // ── COUNTER ANIMASI ───────────────────────────────────────
    initCounters() {
        const DATA_ASLI = {
            totalPelajar: 52900000,
            jalanKaki: 15452670,
            proLingkungan: 37030000,
            pelajarSMA: 5370000,
            pelajarSMP: 10070000,
            pelajarSD: 23930000,
            kendaraanPribadi: 33327000,
            transportUmum: 4110330,
        };

        const TARGET = {
            ripple: DATA_ASLI.totalPelajar,
            pelajar: DATA_ASLI.jalanKaki,
            positif: DATA_ASLI.proLingkungan,
            pendidikan: DATA_ASLI.pelajarSMA,
            mental: DATA_ASLI.pelajarSMP,
            ekonomi: DATA_ASLI.pelajarSD,
            lingkungan: DATA_ASLI.kendaraanPribadi,
            sosial: DATA_ASLI.transportUmum,
        };

        setTimeout(() => {
            if (document.getElementById('count-ripple')) this.animateCounter(document.getElementById('count-ripple'), TARGET.ripple, 2500);
            if (document.getElementById('count-pelajar')) this.animateCounter(document.getElementById('count-pelajar'), TARGET.pelajar, 2000);
            if (document.getElementById('count-positif')) this.animateCounter(document.getElementById('count-positif'), TARGET.positif, 2200);
            if (document.getElementById('cat-pendidikan')) this.animateCounter(document.getElementById('cat-pendidikan'), TARGET.pendidikan, 1800);
            if (document.getElementById('cat-mental')) this.animateCounter(document.getElementById('cat-mental'), TARGET.mental, 1900);
            if (document.getElementById('cat-ekonomi')) this.animateCounter(document.getElementById('cat-ekonomi'), TARGET.ekonomi, 2000);
            if (document.getElementById('cat-lingkungan')) this.animateCounter(document.getElementById('cat-lingkungan'), TARGET.lingkungan, 2100);
            if (document.getElementById('cat-sosial')) this.animateCounter(document.getElementById('cat-sosial'), TARGET.sosial, 1700);
        }, 500);
    },

    animateCounter(el, target, duration = 2000) {
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(ease * target).toLocaleString('id-ID');
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                el.textContent = target.toLocaleString('id-ID');
                el.classList.add('counter-done');
            }
        }
        requestAnimationFrame(update);
    },

    // ── PETA INDONESIA ────────────────────────────────────────
    initMap() {
        const canvas = document.getElementById('indonesia-canvas');
        if (!canvas || !window.INDO_PATHS) return;
        const ctx = canvas.getContext('2d');

        const resize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const cities = [
            { name: 'Banda Aceh', lng: 95.3, lat: 5.5, pop: 612000 },
            { name: 'Medan', lng: 98.6, lat: 3.5, pop: 1840000 },
            { name: 'Padang', lng: 100.3, lat: -0.9, pop: 890000 },
            { name: 'Palembang', lng: 104.7, lat: -2.9, pop: 1320000 },
            { name: 'Jakarta', lng: 106.8, lat: -6.2, pop: 2100000 },
            { name: 'Bandung', lng: 107.6, lat: -6.9, pop: 1750000 },
            { name: 'Semarang', lng: 110.4, lat: -6.9, pop: 980000 },
            { name: 'Surabaya', lng: 112.7, lat: -7.2, pop: 1620000 },
            { name: 'Denpasar', lng: 115.2, lat: -8.6, pop: 540000 },
            { name: 'Mataram', lng: 116.1, lat: -8.5, pop: 720000 },
            { name: 'Makassar', lng: 119.4, lat: -5.1, pop: 1100000 },
            { name: 'Manado', lng: 124.8, lat: 1.4, pop: 430000 },
            { name: 'Palu', lng: 119.8, lat: -0.8, pop: 380000 },
            { name: 'Kendari', lng: 122.5, lat: -4.0, pop: 310000 },
            { name: 'Ambon', lng: 128.1, lat: -3.7, pop: 290000 },
            { name: 'Jayapura', lng: 140.7, lat: -2.5, pop: 210000 },
            { name: 'Sorong', lng: 131.2, lat: -0.8, pop: 180000 },
            { name: 'Pontianak', lng: 109.3, lat: -0.0, pop: 760000 },
            { name: 'Banjarmasin', lng: 114.5, lat: -3.3, pop: 690000 },
            { name: 'Samarinda', lng: 117.1, lat: -0.4, pop: 580000 },
        ];

        const maxPop = Math.max(...cities.map(c => c.pop));
        const seededRand = (s) => {
            let h = 0;
            for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
            return () => { h ^= h << 13; h ^= h >> 17; h ^= h << 5; return (h >>> 0) / 0xffffffff; };
        };

        const ripples = cities.map(city => {
            const r = seededRand(city.name);
            return {
                city,
                phase: r() * Math.PI * 2,
                speed: r() * 0.02 + 0.01,
                intensity: city.pop / maxPop,
            };
        });

        const draw = () => {
            if (!document.getElementById('indonesia-canvas')) return; // Stop if unmounted
            const W = canvas.width;
            const H = canvas.height;
            ctx.clearRect(0, 0, W, H);
            const time = Date.now() / 1000;

            const minLng = 95.0108, maxLng = 141.0194;
            const minLat = -11.0069, maxLat = 5.9061;
            const trueAspect = (maxLng - minLng) / (maxLat - minLat);
            const zoomFactor = 1.6;
            const reqW = W * zoomFactor, reqH = H * zoomFactor;
            let scaleX, scaleY, offsetX, offsetY;

            if (reqW / reqH > trueAspect) {
                scaleY = reqH; scaleX = scaleY * trueAspect;
            } else {
                scaleX = reqW; scaleY = scaleX / trueAspect;
            }
            offsetX = (W - scaleX) / 2;
            offsetY = (H - scaleY) / 2 + H * 0.05;

            window.INDO_PATHS.forEach(pathStr => {
                const p = new Path2D(pathStr);
                ctx.save();
                ctx.translate(offsetX, offsetY);
                ctx.scale(scaleX, scaleY);
                const islandGrd = ctx.createLinearGradient(0, 0, 0, 1);
                islandGrd.addColorStop(0, 'rgba(243,112,30,0.18)');
                islandGrd.addColorStop(1, 'rgba(243,112,30,0.04)');
                ctx.fillStyle = islandGrd;
                ctx.fill(p);
                ctx.strokeStyle = 'rgba(243,112,30,0.4)';
                ctx.lineWidth = 1.0 / scaleX;
                ctx.stroke(p);
                ctx.restore();
            });

            cities.forEach(c => {
                const nx = (c.lng - minLng) / (maxLng - minLng);
                const ny = 1.0 - (c.lat - minLat) / (maxLat - minLat);
                c.cx = offsetX + nx * scaleX;
                c.cy = offsetY + ny * scaleY;
            });

            ripples.forEach(rp => {
                const cx = rp.city.cx, cy = rp.city.cy;
                const phase = (time * rp.speed * 0.6 + rp.phase) % 1;
                const maxR = 20 + rp.intensity * 60;
                const dotR = 4.0 + rp.intensity * 8.0;
                const pulse = 0.65 + Math.sin(time * 1.8 + rp.phase) * 0.3;

                ctx.beginPath();
                ctx.arc(cx, cy, phase * maxR, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(243,112,30,${(1 - phase) * 0.65})`;
                ctx.lineWidth = 1.8;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(cx, cy, dotR, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(243,112,30,${pulse})`;
                ctx.fill();
            });

            requestAnimationFrame(draw);
        };
        draw();
    },

    initParticles() {
        // Particles logic moved to app.js or kept separate if needed
    },

    initRevealObserver() {
        const revealSelectors = ['.g-reveal', '.g-reveal-stagger', '.g-reveal-left', '.g-reveal-right', '.g-reveal-scale'];
        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('g-visible');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll(revealSelectors.join(',')).forEach(el => obs.observe(el));
    },

    initTicker() {
        const ticker = document.getElementById('ticker-inner');
        if (ticker && !ticker.dataset.duplicated) {
            ticker.innerHTML += ticker.innerHTML;
            ticker.dataset.duplicated = "true";
        }
    },

    initHopeSection() {
        const input = document.getElementById('hope-input');
        const count = document.getElementById('hope-count');
        if (input && count) {
            input.addEventListener('input', () => {
                count.textContent = input.value.length;
            });
        }
    },

    setWorldMode(mode) {
        const panelPos = document.getElementById('panel-positive');
        const panelNeg = document.getElementById('panel-negative');
        const btnPos = document.getElementById('btn-positive');
        const btnNeg = document.getElementById('btn-negative');
        const section = document.getElementById('dual-world');
        if (!panelPos || !panelNeg) return;

        if (mode === 'positive') {
            panelPos.classList.remove('hidden');
            panelNeg.classList.add('hidden');
            btnPos.classList.add('active');
            btnNeg.classList.remove('active');
            if (section) section.style.setProperty('--world-color', '#4ea851');
        } else {
            panelPos.classList.add('hidden');
            panelNeg.classList.remove('hidden');
            btnPos.classList.remove('active');
            btnNeg.classList.add('active');
            if (section) section.style.setProperty('--world-color', '#ff4444');
        }
    },

    submitHope() {
        const input = document.getElementById('hope-input');
        const success = document.getElementById('hope-success');
        const btn = document.getElementById('hope-submit-btn');
        if (!input || !input.value.trim()) return;

        btn.disabled = true;
        btn.textContent = "Mengirim...";

        // Optimistic UI
        setTimeout(() => {
            input.style.display = 'none';
            success.style.display = 'block';
            btn.style.display = 'none';
        }, 800);
    }
};

window.GLOBAL = GLOBAL;
