// ============================================================
// crazy.js
// Cleaned up - Only keeping Cursor & Glowing features
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Custom Cursor disabled by user request
    // initCursor();
    
    // Neon Borders disabled by user request
    // initNeonBorders();
});

// ── 1. Custom Cursor (lite — no stardust particles) ────────────────────
function initCursor() {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const dot = document.createElement('div');
    dot.id = 'custom-cursor-dot';
    const ring = document.createElement('div');
    ring.id = 'custom-cursor-ring';
    
    document.body.appendChild(dot);
    document.body.appendChild(ring);

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX, ringY = mouseY;
    const easing = 0.15;
    
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.left = `${mouseX}px`;
        dot.style.top  = `${mouseY}px`;
        // Particles disabled — too heavy on mousemove
    });

    const renderRing = () => {
        ringX += (mouseX - ringX) * easing;
        ringY += (mouseY - ringY) * easing;
        ring.style.left = `${ringX}px`;
        ring.style.top  = `${ringY}px`;
        requestAnimationFrame(renderRing);
    };
    renderRing();
    
    const clickables = document.querySelectorAll('a, button, input, .card, .em-card, .layer-card');
    clickables.forEach(el => {
        el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
        el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });

    document.addEventListener('mousedown', () => { ring.style.transform = 'translate(-50%, -50%) scale(0.8)'; });
    document.addEventListener('mouseup',   () => { ring.style.transform = 'translate(-50%, -50%) scale(1)'; });
}

function spawnParticle(x, y) {
    const p = document.createElement('div');
    p.className = 'cursor-particle';
    
    const offsetX = (Math.random() - 0.5) * 10;
    const offsetY = (Math.random() - 0.5) * 10;
    
    p.style.left = `${x + offsetX}px`;
    p.style.top = `${y + offsetY}px`;
    
    document.body.appendChild(p);
    
    setTimeout(() => {
        p.remove();
    }, 600);
}

// ── 9. Neon Tracing Borders ────────────────────────────────
function initNeonBorders() {
    const cards = document.querySelectorAll('.card, .em-card, .layer-card, .about-card');
    cards.forEach(card => card.classList.add('neon-border'));
}
