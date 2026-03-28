// ============================================================
// RIPPLE — focus_logic.js
// Focus Mode interactive JS (extracted from focus.html)
// ============================================================

(function () {
    let selectedIntent = { emoji: '🔥', name: 'Dalam', duration: '50 menit' };
    let timerInterval = null;
    let secondsLeft = 50 * 60;

    window.focusSelectIntent = function (el, emoji, name, duration) {
        const section = document.getElementById('section-focus');
        if (!section) return;
        section.querySelectorAll('.fd-choice').forEach(c => c.classList.remove('selected'));
        el.classList.add('selected');
        selectedIntent = { emoji, name, duration };
        setTimeout(() => focusGoStep(1), 400);
    };

    window.focusStartBreak = function () {
        selectedIntent = { emoji: '🌿', name: 'Break', duration: '5 menit' };
        focusGoStep(1);
    };

    window.focusGoStep = function (n) {
        const section = document.getElementById('section-focus');
        if (!section) return;
        section.querySelectorAll('.fd-step').forEach(s => s.classList.remove('active'));
        const target = section.getElementById ? section.getElementById('fd-s' + n) : document.getElementById('focus-fd-s' + n);
        if (target) target.classList.add('active');

        if (n === 1) {
            focusStartTimer();
            const lbl = document.getElementById('focus-fd-intent-label');
            if (lbl) lbl.textContent = selectedIntent.emoji + ' ' + selectedIntent.name + ' · ' + selectedIntent.duration;
            const mins = parseInt(selectedIntent.duration);
            secondsLeft = (isNaN(mins) ? 50 : mins) * 60;
            focusUpdateClock();
        } else {
            clearInterval(timerInterval);
        }
    };

    function focusStartTimer() {
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            secondsLeft--;
            if (secondsLeft <= 0) {
                clearInterval(timerInterval);
                window.focusFinish();
                return;
            }
            focusUpdateClock();
        }, 1000);
    }

    function focusUpdateClock() {
        const m = Math.floor(secondsLeft / 60);
        const s = secondsLeft % 60;
        const el = document.getElementById('focus-fd-clock');
        if (el) el.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    window.focusFinish = function () {
        clearInterval(timerInterval);
        focusGoStep(2);
    };

    const feelingMessages = {
        '🔥 Terbakar': 'Ini yang dibutuhkan dunia. Tekanan penuh, ripple terasa jauh.',
        '🌊 Mengalir': 'Pikiran yang jernih adalah bentuk gelombang paling stabil.',
        '💡 Terang': 'Koneksi baru terbentuk. Lapisan atmosfermu sedikit lebih terang.',
        '😤 Berjuang': 'Perjuangan juga meninggalkan jejak. Bumi mencatatnya.',
        '😶 Kosong': 'Tidak apa-apa. Tidak semua sesi harus terasa besar.',
        '⚡ Tajam': 'Tekanan intens meninggalkan gelombang yang tajam. Rare.'
    };

    window.focusSelectFeeling = function (el) {
        document.querySelectorAll('#section-focus .feeling-btn').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
        const feeling = el.dataset.feeling;
        const msg = feelingMessages[feeling] || '';
        const lblOut = document.getElementById('focus-feeling-label-out');
        const msgOut = document.getElementById('focus-feeling-msg-out');
        const res = document.getElementById('focus-feeling-result');
        if (lblOut) lblOut.textContent = feeling;
        if (msgOut) msgOut.textContent = '"' + msg + '"';
        if (res) { res.style.display = 'block'; res.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
    };

    // Bar animation observer
    function initFocusObserver() {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    e.target.querySelectorAll('.debt-bar-fill').forEach(b => {
                        b.style.animation = 'none';
                        b.offsetHeight;
                        b.style.animation = '';
                    });
                }
            });
        }, { threshold: 0.3 });
        document.querySelectorAll('#section-focus .debt-split').forEach(el => observer.observe(el));
    }

    // Tap ripple micro-interaction
    function initFocusTapRipples() {
        const targets = document.querySelectorAll(
            '#section-focus .fd-btn, #section-focus .fd-choice, #section-focus .fd-rp, #section-focus .feeling-btn, #section-focus .intent-card'
        );
        function createRipple(el, clientX, clientY) {
            const rect = el.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'tap-ripple';
            ripple.style.left = (clientX - rect.left) + 'px';
            ripple.style.top = (clientY - rect.top) + 'px';
            el.appendChild(ripple);
            ripple.addEventListener('animationend', () => ripple.remove());
        }
        targets.forEach(el => {
            el.addEventListener('pointerdown', e => createRipple(el, e.clientX, e.clientY));
        });
    }

    // Called by app.js when focus section is activated
    window.FOCUS = {
        init: function () {
            initFocusObserver();
            initFocusTapRipples();
        }
    };
})();
