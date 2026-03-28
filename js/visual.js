// ============================================================
//  RIPPLE — visual.js  (ringan, scroll reveal headings)
// ============================================================
(function(){
    const OBS = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (!e.isIntersecting) return;
            // Heading
            if (e.target.classList.contains('section-heading')) {
                e.target.classList.add('section-heading-visible');
            }
            if (e.target.classList.contains('section-label')) {
                e.target.classList.add('section-label-visible');
            }
            OBS.unobserve(e.target);
        });
    }, { threshold: 0.3 });

    function init() {
        document.querySelectorAll('.section-heading, .section-label').forEach(el => OBS.observe(el));
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else { init(); }
})();