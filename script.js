// ── AURO MAIN PAGE ───────────────────────────────────────────
'use strict';

// ── PRELOADER ─────────────────────────────────────────────────
if (!sessionStorage.getItem('auro_preloaded')) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            const p = document.getElementById('preloader');
            if (p) p.classList.add('hide');
            sessionStorage.setItem('auro_preloaded', 'true');
        }, 1600);
    });
} else {
    const p = document.getElementById('preloader');
    if (p) p.style.display = 'none';
}

// ── AMBIENT GOLD PARTICLES ─────────────────────────────────────
(function() {
    const canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const ctx = canvas.getContext('2d');
    let particles = [];
    let raf = null;
    const isMobile = window.innerWidth < 768;
    const COUNT = isMobile ? 22 : 45;
    const COLORS = ['rgba(197,160,89,', 'rgba(232,201,122,'];

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function makeParticle(randomY) {
        return {
            x: Math.random() * canvas.width,
            y: randomY ? Math.random() * canvas.height : canvas.height + 10,
            r: 1 + Math.random() * 2.2,
            speed: 0.15 + Math.random() * 0.35,
            drift: Math.random() * 0.6 - 0.3,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.15 + Math.random() * 0.45,
            color: COLORS[Math.floor(Math.random() * COLORS.length)]
        };
    }

    function init() {
        resize();
        particles = Array.from({ length: COUNT }, () => makeParticle(true));
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.y -= p.speed;
            p.phase += 0.01;
            p.x += Math.sin(p.phase) * p.drift * 0.3;
            if (p.y < -10) Object.assign(p, makeParticle(false));
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = p.color + p.alpha + ')';
            ctx.fill();
        });
        raf = requestAnimationFrame(draw);
    }

    function stop() { if (raf) { cancelAnimationFrame(raf); raf = null; } }
    function start() { if (!raf) draw(); }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stop(); else start();
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 200);
    });

    init();
    start();
})();

// ── NAV ──────────────────────────────────────────────────────
const nav = document.getElementById('mainNav');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

function updateNavScroll() {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    highlightNav();
}

function toggleMenu() {
    const isOpen = hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
    hamburger.setAttribute('aria-label', isOpen ? 'إغلاق القائمة' : 'فتح القائمة');
}
function closeMenu() {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-label', 'فتح القائمة');
}

// close mobile menu on outside click
mobileNav.addEventListener('click', e => { if (e.target === mobileNav) closeMenu(); });

function highlightNav() {
    const sections = ['hero', 'packages', 'gallery', 'faq', 'policies', 'contact'];
    let current = '';
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 200) current = id;
    });
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
}

// smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
        e.preventDefault();
        const t = document.querySelector(a.getAttribute('href'));
        if (t) { closeMenu(); t.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
});

// ── REVEAL ANIMATIONS ────────────────────────────────────────
const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ── HOW IT WORKS ANIMATION ───────────────────────────────────
const hiwLine = document.getElementById('hiw-line');
if (hiwLine) {
    const hiwObs = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) hiwLine.classList.add('animate'); });
    }, { threshold: 0.3 });
    hiwObs.observe(hiwLine);
}

// ── PARTICLES ────────────────────────────────────────────────
function spawnParticles(x, y, count = 6) {
    for (let i = 0; i < count; i++) {
        setTimeout(() => {
            const p = document.createElement('div');
            p.className = 'particle';
            p.style.cssText = `left:${x}px;top:${y}px;width:${2 + Math.random() * 4}px;height:${2 + Math.random() * 4}px;`;
            document.body.appendChild(p);
            const angle = Math.random() * Math.PI * 2;
            const dist = 40 + Math.random() * 80;
            const anim = p.animate([
                { opacity: 1, transform: 'translate(0,0) scale(1)' },
                { opacity: 0, transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(0)` }
            ], { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.4,1)' });
            anim.onfinish = () => p.remove();
        }, i * 40);
    }
}
document.addEventListener('click', e => {
    if (e.target.closest('.btn-primary,.btn-outline,.pkg-card,.social-btn')) spawnParticles(e.clientX, e.clientY);
});

// ── TOAST ────────────────────────────────────────────────────
let toastTimer;
function toast(msg, type = 'success') {
    const t = document.getElementById('toast');
    t.className = `toast ${type}`;
    document.getElementById('toast-icon').textContent = type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️';
    document.getElementById('toast-msg').textContent = msg;
    t.classList.add('visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('visible'), 3500);
}

// ── LIGHTBOX ─────────────────────────────────────────────────
const lbImages = ['aurobg1.webp', 'aurobg2.webp', 'aurobg3.webp', 'aurobg4.webp', 'aurobg5.webp', 'aurobg6.webp'];
let lbIdx = 0;

function lbOpen(i) {
    lbIdx = i;
    document.getElementById('lb-img').src = lbImages[i];
    document.getElementById('lightbox').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function lbClose(e) {
    if (!e || e.target === document.getElementById('lightbox') || e.target.classList.contains('lb-close')) {
        document.getElementById('lightbox').classList.remove('open');
        document.body.style.overflow = '';
    }
}
function lbNav(dir) {
    lbIdx = (lbIdx + dir + lbImages.length) % lbImages.length;
    const img = document.getElementById('lb-img');
    img.style.opacity = '0';
    setTimeout(() => { img.src = lbImages[lbIdx]; img.style.opacity = '1'; }, 200);
}
document.getElementById('lb-img').style.transition = 'opacity .25s';

document.addEventListener('keydown', e => {
    if (!document.getElementById('lightbox').classList.contains('open')) return;
    if (e.key === 'Escape') lbClose();
    if (e.key === 'ArrowLeft') lbNav(-1);
    if (e.key === 'ArrowRight') lbNav(1);
});

// touch swipe for lightbox
let tsX = 0;
document.getElementById('lightbox').addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
document.getElementById('lightbox').addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - tsX;
    if (Math.abs(dx) > 50) lbNav(dx > 0 ? -1 : 1);
});

// ── FAQ ───────────────────────────────────────────────────────
function toggleFAQ(trigger) {
    const item = trigger.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        const a = i.querySelector('.faq-a');
        if (a) a.style.maxHeight = '0';
        const q = i.querySelector('.faq-q');
        if (q) q.setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
        item.classList.add('open');
        const a = item.querySelector('.faq-a');
        if (a) a.style.maxHeight = a.scrollHeight + 'px';
        trigger.setAttribute('aria-expanded', 'true');
    }
}

// ── WHATSAPP FLOAT ────────────────────────────────────────────
const waFloat = document.getElementById('wa-float');
function updateWaFloat() {
    if (waFloat) waFloat.classList.toggle('visible', window.scrollY > 300);
}

// ── CINEMATIC TRANSITIONS & SOUNDS ────────────────────────────
const audioToggle = document.getElementById('audio-toggle');
const audioOnIcon = document.getElementById('audio-on');
const audioOffIcon = document.getElementById('audio-off');
const transitionOverlay = document.getElementById('page-transition');

let isMuted = localStorage.getItem('auro_muted') === 'true';

// ATMOSPHERIC AUDIO SYSTEM (Web Audio API)
let audioCtx = null;
let filterNode = null;
let gainNode = null;

const soundUrls = {
    pouring: 'https://cdn.pixabay.com/audio/2022/03/15/audio_7392657e0f.mp3' // Coffee Pour
};

const audioBuffers = {};

async function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    // Low-pass filter for "muffled/calm" effect
    filterNode = audioCtx.createBiquadFilter();
    filterNode.type = 'lowpass';
    filterNode.frequency.value = 1000; // Muffle high frequencies
    filterNode.Q.value = 1;

    gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.15; // Keep it very subtle

    filterNode.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    // Pre-load sounds
    for (const [name, url] of Object.entries(soundUrls)) {
        const resp = await fetch(url);
        const arrayBuf = await resp.arrayBuffer();
        audioBuffers[name] = await audioCtx.decodeAudioData(arrayBuf);
    }
}

function playAtmosphericSound(name) {
    if (isMuted || !audioCtx || !audioBuffers[name]) return;

    if (audioCtx.state === 'suspended') audioCtx.resume();

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffers[name];
    source.connect(filterNode);
    source.play();
}

// Update Audio UI
function updateAudioUI() {
    audioOnIcon.style.display = isMuted ? 'none' : 'block';
    audioOffIcon.style.display = isMuted ? 'block' : 'none';
    localStorage.setItem('auro_muted', isMuted);
}
updateAudioUI();

audioToggle.addEventListener('click', async () => {
    if (!audioCtx) await initAudio();
    isMuted = !isMuted;
    updateAudioUI();
});

// Page Transition Logic
function startTransition(url) {
    transitionOverlay.classList.add('active');
    playAtmosphericSound('pouring');
    setTimeout(() => {
        window.location.href = url;
    }, 500);
}

// Intercept Links
document.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', e => {
        if (!audioCtx) initAudio();
        const href = a.getAttribute('href');
        if (href && !href.startsWith('#') && !a.target && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('https://wa.me')) {
            e.preventDefault();
            startTransition(href);
        }
    });
});

// Entry Transition
window.addEventListener('load', () => {
    transitionOverlay.classList.add('active');
    setTimeout(() => {
        transitionOverlay.classList.remove('active');
        transitionOverlay.classList.add('exit');
        setTimeout(() => {
            transitionOverlay.classList.remove('exit');
        }, 800);
    }, 500);
});

window.addEventListener('pageshow', (e) => {
    if (e.persisted) {
        transitionOverlay.classList.remove('active');
        transitionOverlay.classList.remove('exit');
    }
});

console.log('%c AURO ✨ AURO COFFEE CORNER ', 'background:#C5A059;color:#000;font-size:14px;font-weight:bold;padding:8px 16px;border-radius:4px;');

// ── SCROLL BLUR & FADE EFFECT ────────────────────────────────
function updateBgFilter() {
    const bgEl = document.getElementById('bg-slideshow');
    if (!bgEl) return;
    const maxScroll = window.innerHeight * 1.2;
    const progress = Math.min(window.scrollY / maxScroll, 1);

    const blurVal = progress * 24;
    const opacityVal = 1 - progress;
    const brightnessVal = 0.8 - (progress * 0.4);

    bgEl.style.filter = `blur(${blurVal}px) brightness(${brightnessVal}) saturate(1.2)`;
    bgEl.style.opacity = opacityVal.toString();
}

// ── SCROLL TO TOP ────────────────────────────────────────────
const scrollTopBtn = document.getElementById('scrollTop');
function updateScrollTopBtn() {
    if (!scrollTopBtn) return;
    if (window.scrollY > 300) scrollTopBtn.classList.add('visible');
    else scrollTopBtn.classList.remove('visible');
}
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ── SCROLL DEPTH TRACKING ──────────────────────────────────
const updateScrollDepth = (function() {
    let maxScrollPct = 0;
    let reported = 0;
    return function() {
        const scrolled = window.scrollY + window.innerHeight;
        const total = document.documentElement.scrollHeight;
        const pct = Math.round((scrolled / total) * 100);
        if (pct > maxScrollPct) {
            maxScrollPct = pct;
            // Report every 25% milestone to avoid thrashing localStorage
            if (maxScrollPct - reported >= 25) {
                reported = maxScrollPct;
                if (typeof FeedbackService !== 'undefined') {
                    FeedbackService.logVisitor('الرئيسية', maxScrollPct);
                }
            }
        }
    };
})();

// ── UNIFIED SCROLL DISPATCHER (rAF-throttled) ─────────────────
let scrollTicking = false;
function onScrollFrame() {
    updateNavScroll();
    updateWaFloat();
    updateBgFilter();
    updateScrollTopBtn();
    updateScrollDepth();
    scrollTicking = false;
}
window.addEventListener('scroll', () => {
    if (!scrollTicking) {
        requestAnimationFrame(onScrollFrame);
        scrollTicking = true;
    }
}, { passive: true });

// ── REVIEWS COVERFLOW (center card + peeking sides; click/dots/arrows/keyboard) ──
function loadReviewsTicker() {
    const stage = document.getElementById('reviews-track');
    if (!stage) return;

    if (typeof FeedbackService === 'undefined') { setTimeout(loadReviewsTicker, 150); return; }
    FeedbackService.init();

    if (window._reviewTimer)      { clearInterval(window._reviewTimer); window._reviewTimer = null; }
    if (window._reviewKeyHandler) { document.removeEventListener('keydown', window._reviewKeyHandler); window._reviewKeyHandler = null; }

    function escHtml(s) {
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    const approved  = FeedbackService.getReviews('approved');
    const emptyWrap = document.getElementById('reviews-empty-wrap');
    const carousel  = document.getElementById('rv-carousel');
    const dotsEl    = document.getElementById('rv-dots');

    stage.innerHTML = '';
    if (dotsEl) dotsEl.innerHTML = '';

    if (!approved || !approved.length) {
        if (emptyWrap) emptyWrap.style.display = '';
        if (carousel)  carousel.style.display = 'none';
        if (dotsEl)    dotsEl.style.display = 'none';
        return;
    }
    if (emptyWrap) emptyWrap.style.display = 'none';
    if (carousel)  carousel.style.display = '';
    if (dotsEl)    dotsEl.style.display = '';

    const cards = approved.map(r => {
        const rating = Math.min(5, Math.max(0, parseInt(r.rating) || 5));
        const starsHtml = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        const name = r.name || 'عميل مميز';
        const initial = escHtml(name.trim().charAt(0) || 'ع');
        const card = document.createElement('div');
        card.className = 'rv-card';
        card.innerHTML = `
            <div class="rv-card__blob"></div>
            <div class="rv-card__quote">"</div>
            <div class="rv-card__stars">${starsHtml}</div>
            <p class="rv-card__comment">${escHtml(r.comment || 'تجربة رائعة مع أورو ✦')}</p>
            <div class="rv-card__footer">
                <div class="rv-card__avatar">${initial}</div>
                <div>
                    <div class="rv-card__name">${escHtml(name)}</div>
                    <span class="rv-card__badge">عميل موثّق</span>
                </div>
            </div>`;
        stage.appendChild(card);
        return card;
    });

    const n = cards.length;
    let active = 0;

    function mod(a, m) { return ((a % m) + m) % m; }

    // RTL layout: visually-right side shows "next" content (i+1), visually-left shows "prev" (i-1)
    function render() {
        cards.forEach((card, i) => {
            const diff = mod(i - active + Math.floor(n / 2), n) - Math.floor(n / 2);
            let pos, tx, scale;
            if (diff === 0)       { pos = 'center'; tx = 0;   scale = 1; }
            else if (diff === -1) { pos = 'right';  tx = 58;  scale = .84; }
            else if (diff === 1)  { pos = 'left';   tx = -58; scale = .84; }
            else if (diff === -2) { pos = 'hidden'; tx = 108; scale = .7; }
            else                  { pos = 'hidden'; tx = -108; scale = .7; }
            card.dataset.pos = pos;
            card.style.transform = `translate3d(calc(50% + ${tx}%), -50%, 0) scale(${scale})`;
        });
        if (dotsEl) Array.from(dotsEl.children).forEach((d, i) => d.classList.toggle('active', i === active));
    }

    function setActive(i) { active = mod(i, n); render(); restartAutoplay(); }
    function go(delta) { setActive(active + delta); }

    cards.forEach(card => {
        card.addEventListener('click', () => {
            if (card.dataset.pos === 'left') go(1);
            else if (card.dataset.pos === 'right') go(-1);
        });
    });

    if (dotsEl && n > 1) {
        cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'rv-dot';
            dot.setAttribute('aria-label', `التقييم ${i + 1}`);
            dot.onclick = () => setActive(i);
            dotsEl.appendChild(dot);
        });
    }

    function restartAutoplay() {
        clearInterval(window._reviewTimer);
        if (n > 1) {
            window._reviewTimer = setInterval(() => {
                if (n === 2) { go(1); return; }
                let next;
                do { next = Math.floor(Math.random() * n); } while (next === active);
                setActive(next);
            }, 4000);
        }
    }

    // Deliberately no hover-pause: a resting cursor over the section (very likely
    // while someone is just watching it) must never be able to freeze autoplay.
    const section = stage.closest('#reviews');

    window._reviewKeyHandler = (e) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (!(rect.top < window.innerHeight && rect.bottom > 0)) return;
        if (e.key === 'ArrowRight') go(-1);
        if (e.key === 'ArrowLeft') go(1);
    };
    document.addEventListener('keydown', window._reviewKeyHandler);

    render();
    restartAutoplay();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadReviewsTicker);
} else {
    loadReviewsTicker();
}

// ── 3D COVER FLOW GALLERY ────────────────────────────────
function initCoverFlow() {
    const stack = document.getElementById('cards-stack');
    if (!stack) return;
    const cards = Array.from(stack.querySelectorAll('.stack-card'));
    const total = cards.length;
    if (!total) return;

    let currentIndex = 0;

    function updateGallery() {
        cards.forEach((card, i) => {
            let dist = i - currentIndex;
            if (dist > total / 2) dist -= total;
            if (dist < -total / 2) dist += total;
            
            card.className = 'stack-card'; // reset classes
            if (dist === 0) card.classList.add('is-center');
            else if (dist === 1) card.classList.add('is-right-1');
            else if (dist === -1) card.classList.add('is-left-1');
            else if (dist === 2) card.classList.add('is-right-2');
            else if (dist === -2) card.classList.add('is-left-2');
            else card.classList.add('is-hidden');
        });
    }

    function nextCard() { currentIndex = (currentIndex + 1) % total; updateGallery(); }
    function prevCard() { currentIndex = (currentIndex - 1 + total) % total; updateGallery(); }

    const btnNext = document.getElementById('stack-next');
    const btnPrev = document.getElementById('stack-prev');
    if (btnNext) btnNext.onclick = nextCard;
    if (btnPrev) btnPrev.onclick = prevCard;

    cards.forEach((c, i) => {
        c.addEventListener('click', () => {
            if (!c.classList.contains('is-center')) {
                currentIndex = i;
                updateGallery();
            } else {
                lbOpen(i);
            }
        });
    });

    let tsX = 0;
    stack.addEventListener('touchstart', e => { tsX = e.touches[0].clientX; }, { passive: true });
    stack.addEventListener('touchend', e => {
        const dx = tsX - e.changedTouches[0].clientX;
        if (Math.abs(dx) > 40) dx > 0 ? nextCard() : prevCard();
    });

    updateGallery();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoverFlow);
} else {
    initCoverFlow();
}


