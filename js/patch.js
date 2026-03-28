// ============================================================
//  RIPPLE — patch.js  (v3)
//  1. News Ticker  → horizontal, isi info tentang RIPPLE web
//  2. Live Feed    → conveyor belt vertikal, semua info sekaligus
//  3. Hero Map SVG → city dots & grid (index.html only)
//  4. Aurora background
//  5. Noise grain texture
// ============================================================

(function () {

    const isIndexPage = !!document.getElementById('world-svg');

    // ══════════════════════════════════════════════════════
    //  1. NEWS TICKER HORIZONTAL
    //  Ganti konten dengan info tentang RIPPLE, duplikasi 2x
    // ══════════════════════════════════════════════════════
    function initTicker() {
        const inner = document.getElementById('ticker-inner');
        if (!inner) return;

        // Info tentang RIPPLE web (bukan data Indonesia)
        const rippleInfo = [
            'RIPPLE adalah platform kesadaran kolektif pelajar Indonesia',
            'Setiap pilihan harianmu dicatat dan divisualisasikan sebagai gelombang nyata',
            'Gunakan Daily Input untuk mencatat keputusan harianmu hari ini',
            'Earth Mirror menampilkan bumi yang terbentuk dari pilihanmu selama ini',
            'Global Ripple menunjukkan dampak kolektif 52,9 juta pelajar Indonesia',
            'RIPPLE dibangun oleh pelajar SMA Trinitas untuk pelajar Indonesia',
            'Satu pilihan kecil hari ini bisa menciptakan gelombang perubahan besok',
            'Catat transportasimu, uang jajanmu, dan kebiasaan belajarmu di Daily Input',
            'Lihat posisi Indonesia di mata dunia — dan apa yang bisa kita ubah bersama',
            'RIPPLE 2026 — Karena setiap pilihan kamu, dunia merasakannya',
        ];

        // Duplikasi 2x untuk loop seamless
        const all = [...rippleInfo, ...rippleInfo];
        inner.innerHTML = all.map(t => `<span>${t}</span>`).join('');
    }

    // ══════════════════════════════════════════════════════
    //  2. LIVE FEED BELT — conveyor vertikal terus-menerus
    //  Buat #feed-belt di dalam .feed-container
    // ══════════════════════════════════════════════════════
    const feedData = [
        { text: '<span>52,9 juta pelajar</span> Indonesia aktif bersekolah tahun ini — Kemendikbud 2024', dot: 'green', badge: 'Pendidikan' },
        { text: '<span>5,37 juta pelajar SMA</span> Indonesia sedang menempuh pendidikan menengah atas', dot: 'green', badge: 'SMA' },
        { text: '<span>23,93 juta pelajar SD</span> Indonesia sedang membangun fondasi literasi bangsa 📖', dot: 'blue', badge: 'SD' },
        { text: '<span>10,07 juta pelajar SMP</span> Indonesia berada di fase pembentukan karakter', dot: 'green', badge: 'SMP' },
        { text: '<span>5,05 juta pelajar SMK</span> Indonesia belajar keterampilan untuk dunia kerja 🔧', dot: 'blue', badge: 'SMK' },
        { text: '<span>15,4 juta pelajar</span> jalan kaki ke sekolah setiap hari — 29,23% dari total (BPS 2024) 🚶', dot: 'green', badge: 'Transportasi' },
        { text: '<span>33,3 juta pelajar</span> masih pakai kendaraan pribadi ke sekolah — 63% total (BPS 2024)', dot: 'red', badge: 'Transportasi' },
        { text: '<span>4,1 juta pelajar</span> naik transportasi umum ke sekolah — 7,77% total (BPS 2024) 🚌', dot: 'blue', badge: 'Transportasi' },
        { text: 'Indonesia hasilkan <span>10 juta ton</span> sampah plastik per tahun — 18% total sampah (KLHK 2023) 🌱', dot: 'red', badge: 'Lingkungan' },
        { text: '<span>37 juta pelajar</span> Indonesia sudah terlibat perilaku pro-lingkungan — 70% total (West Science 2023)', dot: 'green', badge: 'Lingkungan' },
        { text: 'Hanya <span>39%</span> sampah Indonesia yang dikelola dengan layak — KLHK SIPSN 2023 ♻️', dot: 'red', badge: 'Lingkungan' },
        { text: 'Rata-rata uang jajan pelajar SMA Indonesia <span>Rp20.000–30.000</span> per hari — Survei 2024 💰', dot: 'blue', badge: 'Ekonomi' },
        { text: 'Jika 5,37 juta pelajar SMA belanja lokal, <span>UMKM Indonesia</span> bisa terima miliaran rupiah/hari 🏪', dot: 'green', badge: 'Ekonomi' },
        { text: 'Jika 15 juta pelajar beralih ke transportasi umum, emisi karbon turun <span>signifikan</span> 🌍', dot: 'green', badge: 'Lingkungan' },
        { text: 'Indonesia penyumbang sampah plastik ke laut terbesar <span>ke-2 di dunia</span> — Jambeck 2015 🌊', dot: 'red', badge: 'Global' },
        { text: 'Pelajar yang jalan kaki hemat rata-rata <span>Rp500.000/bulan</span> biaya transportasi 🚶', dot: 'green', badge: 'Ekonomi' },
        { text: 'Indonesia peringkat <span>#71</span> dari 77 negara dalam literasi global — PISA OECD 2022', dot: 'red', badge: 'Pendidikan' },
        { text: 'Dengan <span>52,9 juta pelajar</span> bergerak bersama, Indonesia bisa memimpin perubahan dunia', dot: 'green', badge: 'Kolektif' },
    ];

    function buildFeedBelt() {
        const container = document.getElementById('live-feed');
        if (!container) return;

        // Bersihkan konten lama yang di-inject globalRipple.js
        container.innerHTML = '';

        // Buat belt element
        const belt = document.createElement('div');
        belt.id = 'feed-belt';

        // Duplikasi 2x untuk loop seamless
        const allItems = [...feedData, ...feedData];

        allItems.forEach(item => {
            const div = document.createElement('div');
            div.className = 'feed-belt-item';
            div.innerHTML = `
                <div class="feed-belt-dot ${item.dot}"></div>
                <div class="feed-belt-text">${item.text}</div>
                <span class="feed-belt-badge ${item.dot === 'red' ? 'red' : item.dot === 'blue' ? 'blue' : ''}">${item.badge}</span>
            `;
            belt.appendChild(div);
        });

        container.appendChild(belt);

        // Hitung offset setelah DOM rendered
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const totalH    = belt.scrollHeight;
                const halfH     = totalH / 2;
                const duration  = feedData.length * 3.5; // ~3.5 detik per item

                belt.style.setProperty('--feed-offset', `-${halfH}px`);
                belt.style.setProperty('--feed-duration', `${duration}s`);
            });
        });
    }

    // ══════════════════════════════════════════════════════
    //  3. HERO MAP SVG ENHANCEMENTS (index.html only)
    // ══════════════════════════════════════════════════════
    function enhanceHeroMap() {
        if (!isIndexPage) return;
        const svg = document.getElementById('world-svg');
        if (!svg) return;

        const NS = 'http://www.w3.org/2000/svg';

        // Grid
        const gridG = document.createElementNS(NS, 'g');
        for (let y = 50; y < 500; y += 50) {
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('x1','0'); l.setAttribute('y1',y);
            l.setAttribute('x2','1000'); l.setAttribute('y2',y);
            l.setAttribute('stroke','rgba(75,96,127,0.07)');
            l.setAttribute('stroke-width','0.5');
            gridG.appendChild(l);
        }
        for (let x = 100; x < 1000; x += 100) {
            const l = document.createElementNS(NS, 'line');
            l.setAttribute('x1',x); l.setAttribute('y1','0');
            l.setAttribute('x2',x); l.setAttribute('y2','500');
            l.setAttribute('stroke','rgba(75,96,127,0.07)');
            l.setAttribute('stroke-width','0.5');
            gridG.appendChild(l);
        }
        svg.insertBefore(gridG, svg.firstChild);

        // City dots
        const cities = [
            [840,110,false,0.1],[830,125,false,0.7],[790,120,true,0.3],
            [760,100,true,0.8],[730,160,true,0.2],[700,130,true,1.0],
            [640,120,true,0.3],[560,160,true,0.4],[480,80,true,0.2],
            [490,90,true,0.7],[200,150,true,0.4],[250,300,false,0.6],
            [850,320,true,0.5],[490,250,true,0.3],[860,150,true,0.5],
        ];
        const dotsG  = document.createElementNS(NS, 'g');
        const linesG = document.createElementNS(NS, 'g');

        cities.forEach(([cx,cy,blue,delay]) => {
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx',cx); c.setAttribute('cy',cy); c.setAttribute('r','2.2');
            c.setAttribute('fill', blue ? 'rgba(75,96,127,0.65)' : 'rgba(243,112,30,0.55)');
            // filter drop-shadow disabled — terlalu berat
            c.style.animation = `cityPulse 3s ease-in-out ${delay}s infinite`;
            dotsG.appendChild(c);
        });

        [[840,110],[760,100],[640,120],[480,80],[200,150],[250,300],[850,320],[490,250]
        ].forEach(([x2,y2],i) => {
            const p = document.createElementNS(NS, 'path');
            const mx=(800+x2)/2, my=Math.min(200,y2)-40;
            p.setAttribute('d',`M800,200 Q${mx},${my} ${x2},${y2}`);
            p.setAttribute('fill','none');
            p.setAttribute('stroke','rgba(243,112,30,0.10)');
            p.setAttribute('stroke-width','0.6');
            p.setAttribute('stroke-dasharray','4 6');
            p.style.animation = `cityLineFade 4s ease-in-out ${i*0.3}s infinite`;
            linesG.appendChild(p);
        });

        const staticG = document.createElementNS(NS, 'g');
        [40,70,110].forEach(r => {
            const c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx','800'); c.setAttribute('cy','200'); c.setAttribute('r',r);
            c.setAttribute('fill','none');
            c.setAttribute('stroke','rgba(243,112,30,0.07)');
            c.setAttribute('stroke-width','0.8');
            c.setAttribute('stroke-dasharray','3 5');
            staticG.appendChild(c);
        });

        const ref = gridG.nextSibling;
        svg.insertBefore(linesG, ref);
        svg.insertBefore(dotsG, ref);
        svg.insertBefore(staticG, ref);

        if (!document.getElementById('patchMapKF')) {
            const s = document.createElement('style');
            s.id = 'patchMapKF';
            s.textContent = `
                @keyframes cityPulse{0%,100%{opacity:.55}50%{opacity:1}}
                @keyframes cityLineFade{0%,100%{opacity:.25}50%{opacity:.65}}
            `;
            document.head.appendChild(s);
        }
    }

    // ══════════════════════════════════════════════════════
    //  4. AURORA BACKGROUND
    // ══════════════════════════════════════════════════════
    function initAurora() { return; // disabled — blur+animation berat
        if (document.getElementById('ripple-aurora')) return;
        const div = document.createElement('div');
        div.id = 'ripple-aurora';
        div.innerHTML = `
            <div class="aurora-blob aurora-b1"></div>
            <div class="aurora-blob aurora-b2"></div>
            <div class="aurora-blob aurora-b3"></div>`;
        document.body.insertBefore(div, document.body.firstChild);

        const s = document.createElement('style');
        s.textContent = `
            #ripple-aurora{position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden}
            .aurora-blob{position:absolute;border-radius:50%;opacity:0.7}
            .aurora-b1{width:400px;height:320px;top:-8%;left:8%;
                background:radial-gradient(ellipse,rgba(243,112,30,0.048) 0%,transparent 70%);
                animation:auroraF1 22s ease-in-out infinite}
            .aurora-b2{width:360px;height:280px;top:35%;right:-8%;
                background:radial-gradient(ellipse,rgba(75,96,127,0.042) 0%,transparent 70%);
                animation:auroraF2 28s ease-in-out infinite}
            .aurora-b3{width:300px;height:240px;bottom:5%;left:20%;
                background:radial-gradient(ellipse,rgba(184,58,45,0.032) 0%,transparent 70%);
                animation:auroraF3 18s ease-in-out infinite}
            @keyframes auroraF1{0%,100%{transform:translate(0,0) scale(1)}
                33%{transform:translate(60px,-80px) scale(1.1)}
                66%{transform:translate(-40px,50px) scale(0.95)}}
            @keyframes auroraF2{0%,100%{transform:translate(0,0) scale(1)}
                40%{transform:translate(-80px,60px) scale(1.15)}
                70%{transform:translate(40px,-40px) scale(0.9)}}
            @keyframes auroraF3{0%,100%{transform:translate(0,0) scale(1)}
                50%{transform:translate(50px,-60px) scale(1.05)}}
        `;
        document.head.appendChild(s);
    }

    // ══════════════════════════════════════════════════════
    //  5. NOISE GRAIN
    // ══════════════════════════════════════════════════════
    function initNoise() { return; // disabled
        if (document.getElementById('ripple-noise-style')) return;
        const noiseSVG = `<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/></filter><rect width='200' height='200' filter='url(#n)' opacity='1'/></svg>`;
        const s = document.createElement('style');
        s.id = 'ripple-noise-style';
        s.textContent = `body::after{content:"";position:fixed;inset:0;pointer-events:none;z-index:2;opacity:0.022;background-image:url("data:image/svg+xml;base64,${btoa(noiseSVG)}");background-size:200px 200px}`;
        document.head.appendChild(s);
    }

    // ══════════════════════════════════════════════════════
    //  RUN
    // ══════════════════════════════════════════════════════
    initTicker();
    initAurora();
    initNoise();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            enhanceHeroMap();
            buildFeedBelt();
        });
    } else {
        enhanceHeroMap();
        buildFeedBelt();
    }

})();