// ── AURO SCRIPT ──────────────────────────────────────────────
'use strict';

// ── SLIDESHOW ────────────────────────────────────────────────
const bgImages = ['bg1.png', 'bg2.png', 'bg3.png', 'bg4.png'];
let bgIdx = 0;
const bgEl = document.getElementById('bg-slideshow');

function cycleBg() {
    bgEl.style.backgroundImage = `url('${bgImages[bgIdx]}')`;
    bgIdx = (bgIdx + 1) % bgImages.length;
}
bgImages.forEach(s => { const i = new Image(); i.src = s; });
cycleBg();
setInterval(cycleBg, 7000);

// ── CUSTOM CURSOR ────────────────────────────────────────────
const cur = document.getElementById('cursor');
const curR = document.getElementById('cursor-ring');
let mx = -100, my = -100, rx = -100, ry = -100;

document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });

function animateCursor() {
    cur.style.left = mx + 'px';
    cur.style.top = my + 'px';
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    curR.style.left = rx + 'px';
    curR.style.top = ry + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();

document.querySelectorAll('a,button,.pkg-card,.drink-card,.social-btn,.gallery-item,.faq-q,.lb-nav,.lb-close').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ── NAV ──────────────────────────────────────────────────────
const nav = document.getElementById('mainNav');
const hamburger = document.getElementById('hamburger');
const mobileNav = document.getElementById('mobileNav');

window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
    document.getElementById('scrollTop').classList.toggle('visible', window.scrollY > 500);
    highlightNav();
});

function toggleMenu() {
    hamburger.classList.toggle('open');
    mobileNav.classList.toggle('open');
}
function closeMenu() {
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
}

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

// smooth scroll for all anchor links
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
    if (e.target.closest('.btn-primary,.btn-outline,.pkg-card,.drink-card'))
        spawnParticles(e.clientX, e.clientY);
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

// ── BOOKING STATE ─────────────────────────────────────────────
let booking = { pkg: '', cups: 0, limit: 0, drinks: [] };

// ── PACKAGES ─────────────────────────────────────────────────
function selectPkg(card, name, cups, limit) {
    document.querySelectorAll('.pkg-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    booking.pkg = name;
    booking.cups = cups;
    booking.limit = limit;
    booking.drinks = [];

    document.querySelectorAll('.drink-card').forEach(c => c.classList.remove('active'));
    buildProgress();

    const info = document.getElementById('drinks-info-text');
    info.textContent = `باقة ${name} – اختر ${limit} ${limit === 1 ? 'مشروب' : 'مشروبات'} من القائمة:`;

    showSection('drinks-section');
    toast(`تم اختيار باقة ${name} ✨`, 'success');
}

function buildProgress() {
    const wrap = document.getElementById('drinks-progress');
    wrap.innerHTML = '';
    for (let i = 0; i < booking.limit; i++) {
        const d = document.createElement('div');
        d.className = 'dp' + (i < booking.drinks.length ? ' filled' : '');
        wrap.appendChild(d);
    }
}

// ── DRINKS ───────────────────────────────────────────────────
function toggleDrink(card, name) {
    const active = card.classList.contains('active');
    if (active) {
        card.classList.remove('active');
        booking.drinks = booking.drinks.filter(d => d !== name);
        buildProgress();
        return;
    }
    if (booking.drinks.length >= booking.limit) {
        toast(`الحد الأقصى ${booking.limit} مشروبات لهذه الباقة`, 'error');
        return;
    }
    card.classList.add('active');
    booking.drinks.push(name);
    buildProgress();

    if (booking.drinks.length === booking.limit) {
        setTimeout(() => {
            updateSummary();
            showSection('form-section');
            toast('ممتاز! أكمل بياناتك لتأكيد الحجز 📝', 'success');
        }, 600);
    }
}

function showSection(id) {
    const sec = document.getElementById(id);
    if (!sec) return;
    sec.style.display = 'flex';
    setTimeout(() => {
        sec.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

// ── FORM SUMMARY ─────────────────────────────────────────────
function updateSummary() {
    document.getElementById('sum-pkg').textContent = booking.pkg || '—';
    document.getElementById('sum-cups').textContent = booking.cups ? booking.cups + ' كوب' : '—';
    document.getElementById('sum-drinks').textContent = booking.drinks.length ? booking.drinks.join(' · ') : '—';
}

// ── FORM VALIDATION ──────────────────────────────────────────
function validateField(fieldId, inputId, check) {
    const inp = document.getElementById(inputId);
    const wrap = document.getElementById(fieldId);
    const ok = check(inp.value.trim());
    inp.classList.toggle('err', !ok);
    wrap.classList.toggle('has-error', !ok);
    return ok;
}

function validateAll() {
    const nameOk = validateField('f-name', 'inp-name', v => v.length >= 3);
    const phoneOk = validateField('f-phone', 'inp-phone', v => /^(05|5)[0-9]{8}$/.test(v));
    const cityOk = validateField('f-city', 'inp-city', v => v !== '');
    const eventOk = validateField('f-event', 'inp-event', v => v.length >= 3);
    const today = new Date(); today.setDate(today.getDate() + 1);
    const dateOk = validateField('f-date', 'inp-date',
        v => { if (!v) return false; return new Date(v) >= today; });
    const timeOk = validateField('f-time', 'inp-time', v => v !== '');
    return nameOk && phoneOk && cityOk && eventOk && dateOk && timeOk;
}

// live validation
document.querySelectorAll('.glass-input').forEach(inp => {
    inp.addEventListener('focus', () => {
        inp.classList.remove('err');
        const wrap = inp.closest('.field');
        if (wrap) wrap.classList.remove('has-error');
    });
    if (inp.id === 'inp-phone') {
        inp.addEventListener('input', () => {
            inp.value = inp.value.replace(/[^0-9]/g, '').slice(0, 10);
        });
    }
});

// set min date
(() => {
    const di = document.getElementById('inp-date');
    if (!di) return;
    const t = new Date(); t.setDate(t.getDate() + 1);
    di.min = t.toISOString().split('T')[0];
    const max = new Date(); max.setFullYear(max.getFullYear() + 1);
    di.max = max.toISOString().split('T')[0];
})();

// ── FORM SUBMIT ───────────────────────────────────────────────
document.getElementById('auroForm').addEventListener('submit', async e => {
    e.preventDefault();
    if (!validateAll()) {
        toast('الرجاء تعبئة جميع الحقول بشكل صحيح ⚠️', 'error');
        document.querySelector('.glass-input.err')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const btn = document.getElementById('submitBtn');
    const text = document.getElementById('submitText');
    btn.disabled = true;
    text.innerHTML = 'جاري الإرسال... <span style="display:inline-block;width:18px;height:18px;border:2.5px solid rgba(0,0,0,.3);border-top-color:#000;border-radius:50%;animation:spin .7s linear infinite;vertical-align:middle;margin-right:8px"></span>';

    const d = {
        name: document.getElementById('inp-name').value.trim(),
        phone: document.getElementById('inp-phone').value.trim(),
        city: document.getElementById('inp-city').value,
        event: document.getElementById('inp-event').value.trim(),
        date: document.getElementById('inp-date').value,
        time: document.getElementById('inp-time').value,
        notes: document.getElementById('inp-notes').value.trim()
    };

    const WEBHOOK = 'https://discord.com/api/webhooks/1466534582286291117/aVV9y5qUHQ3eCAi9hC52bfTNC4csvz-1mPJ7D_IVcJtYZIphv94GJOZBRs2ZvtuOt3BG';

    try {
        await fetch(WEBHOOK, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                embeds: [{
                    title: '🛎️ طلب حجز AURO جديد',
                    color: 12951641,
                    fields: [
                        { name: '👤 العميل', value: d.name, inline: true },
                        { name: '📱 الجوال', value: d.phone, inline: true },
                        { name: '📦 الباقة', value: `${booking.pkg} – ${booking.cups} كوب`, inline: true },
                        { name: '☕ المشروبات', value: booking.drinks.join(' + ') || 'لم تُحدد' },
                        { name: '📍 المدينة', value: d.city, inline: true },
                        { name: '🎉 المناسبة', value: d.event, inline: true },
                        { name: '📅 الموعد', value: `${d.date} | ${d.time}` },
                        { name: '📝 ملاحظات', value: d.notes || 'لا توجد' }
                    ],
                    timestamp: new Date().toISOString()
                }]
            })
        });

        toast('تم إرسال طلبك بنجاح! سيتواصل معك فريقنا 🎉', 'success');

        const wa = `أهلاً AURO ✨%0A%0Aطلب حجز جديد:%0A👤 ${d.name}%0A📱 ${d.phone}%0A📦 ${booking.pkg} (${booking.cups} كوب)%0A☕ ${booking.drinks.join(' + ')}%0A📍 ${d.city}%0A🎉 ${d.event}%0A📅 ${d.date} %7C ${d.time}${d.notes ? '%0A📝 ' + d.notes : ''}`;
        setTimeout(() => window.open(`https://wa.me/966579383960?text=${wa}`, '_blank'), 1000);

    } catch (err) {
        console.error(err);
        toast('حدث خطأ في الإرسال، يرجى المحاولة مجدداً', 'error');
    } finally {
        btn.disabled = false;
        text.textContent = 'تأكيد الطلب وإرسال ✨';
    }
});

// ── LIGHTBOX ─────────────────────────────────────────────────
const lbImages = ['bg1.png', 'bg2.png', 'bg3.png', 'bg4.png'];
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
    });
    if (!isOpen) {
        item.classList.add('open');
        const a = item.querySelector('.faq-a');
        if (a) a.style.maxHeight = a.scrollHeight + 'px';
    }
}

// ── SPIN KEYFRAME ─────────────────────────────────────────────
const styleEl = document.createElement('style');
styleEl.textContent = '@keyframes spin { to { transform: rotate(360deg); } }';
document.head.appendChild(styleEl);

console.log('%c AURO ✨ Quiet Luxury Experience ', 'background:#C5A059;color:#000;font-size:14px;font-weight:bold;padding:8px 16px;border-radius:4px;');
