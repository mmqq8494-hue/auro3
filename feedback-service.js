/**
 * AURO Feedback System — Data Service v2.0
 * Full visitor intelligence: IP geolocation, referrer, UTM, device, browser.
 */
const FeedbackService = {

  // ── INIT ──────────────────────────────────────────────────
  init() {
    if (!localStorage.getItem('auro_reviews'))  localStorage.setItem('auro_reviews',  JSON.stringify([]));
    if (!localStorage.getItem('auro_visitors')) localStorage.setItem('auro_visitors', JSON.stringify([]));
  },

  // ── DEVICE & BROWSER DETECTION ────────────────────────────
  _getDeviceInfo() {
    const ua = navigator.userAgent;
    let device = 'desktop';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) device = 'mobile';
    if (/iPad|Tablet/i.test(ua)) device = 'tablet';

    let browser = 'other';
    if (/Chrome\/[0-9]/.test(ua) && !/Edge|OPR/.test(ua)) browser = 'Chrome';
    else if (/Firefox\/[0-9]/.test(ua)) browser = 'Firefox';
    else if (/Safari\/[0-9]/.test(ua) && !/Chrome/.test(ua)) browser = 'Safari';
    else if (/Edge\/[0-9]|Edg\/[0-9]/.test(ua)) browser = 'Edge';
    else if (/OPR|Opera/.test(ua)) browser = 'Opera';

    let os = 'other';
    if (/Windows/.test(ua)) os = 'Windows';
    else if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) os = 'macOS';
    else if (/Android/.test(ua)) os = 'Android';
    else if (/iPhone|iPad|iPod/.test(ua)) os = 'iOS';
    else if (/Linux/.test(ua)) os = 'Linux';

    return { device, browser, os };
  },

  // ── HARDWARE & ENVIRONMENT INFO ────────────────────────────
  _getHardwareInfo() {
    const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    const darkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const tz = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch(e) { return '—'; } })();

    return {
      screenRes:      `${screen.width}×${screen.height}`,
      screenDepth:    `${screen.colorDepth}-bit`,
      pixelRatio:     window.devicePixelRatio ? `${window.devicePixelRatio}x` : '—',
      windowSize:     `${window.innerWidth}×${window.innerHeight}`,
      cpuCores:       navigator.hardwareConcurrency || '—',
      ramGB:          navigator.deviceMemory       || '—',
      language:       navigator.language           || '—',
      darkMode:       darkMode ? 'داكن 🌙' : 'فاتح ☀️',
      connectionType: conn.effectiveType           || conn.type || '—',
      online:         navigator.onLine ? 'متصل ✅' : 'غير متصل ❌',
      timezone:       tz,
    };
  },

  // ── REFERRER & UTM PARSING ────────────────────────────────
  _getTrafficSource() {
    const ref = document.referrer || '';
    const params = new URLSearchParams(window.location.search);

    // UTM parameters (from your WhatsApp/Instagram links etc.)
    const utm = {
      source:   params.get('utm_source')   || null,
      medium:   params.get('utm_medium')   || null,
      campaign: params.get('utm_campaign') || null,
      content:  params.get('utm_content')  || null,
    };

    // Parse referrer into a friendly source name
    let refLabel = 'مباشر';
    if (ref) {
      try {
        const refHost = new URL(ref).hostname.replace('www.','');
        if (refHost.includes('instagram.com')) refLabel = 'Instagram';
        else if (refHost.includes('twitter.com') || refHost.includes('x.com')) refLabel = 'Twitter / X';
        else if (refHost.includes('tiktok.com')) refLabel = 'TikTok';
        else if (refHost.includes('facebook.com') || refHost.includes('fb.com')) refLabel = 'Facebook';
        else if (refHost.includes('whatsapp.com') || refHost.includes('wa.me')) refLabel = 'WhatsApp';
        else if (refHost.includes('google.')) refLabel = 'Google';
        else if (refHost.includes('snapchat.com')) refLabel = 'Snapchat';
        else if (refHost.includes('youtube.com')) refLabel = 'YouTube';
        else refLabel = refHost;
      } catch(e) {
        refLabel = ref.substring(0, 50);
      }
    }

    // utm_source overrides parsed referrer if present
    if (utm.source) refLabel = utm.source;

    return { referrer: ref, referrerLabel: refLabel, utm };
  },

  // ── LOG VISITOR ───────────────────────────────────────────
  async logVisitor(pageName, scrollDepth = 0) {
    let loc = { city: '—', country: 'السعودية', ip: '—', timezone: '—' };

    try {
      if (!sessionStorage.getItem('auro_geo')) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://ipapi.co/json/', { signal: controller.signal });
        if (res.ok) {
          const d = await res.json();
          loc = {
            city:     d.city     || '—',
            country:  d.country_code === 'SA' ? 'السعودية' : (d.country_name || '—'),
            region:   d.region   || '—',
            ip:       d.ip       || '—',
            timezone: d.timezone || '—',
            isp:      d.org      || '—',
          };
          sessionStorage.setItem('auro_geo', JSON.stringify(loc));
        }
      } else {
        loc = JSON.parse(sessionStorage.getItem('auro_geo'));
      }
    } catch(e) { /* silent fail */ }

    const visitors  = JSON.parse(localStorage.getItem('auro_visitors') || '[]');
    const sessionId = sessionStorage.getItem('auro_session_id') || ('sess_' + Date.now());
    sessionStorage.setItem('auro_session_id', sessionId);

    const deviceInfo  = this._getDeviceInfo();
    const trafficSrc  = this._getTrafficSource();
    const hardwareInfo = this._getHardwareInfo();
    const locLabel    = `${loc.city}، ${loc.country}`;

    let existing = visitors.find(v => v.sessionId === sessionId);
    if (existing) {
      // Update mutable fields on revisit
      existing.lastPage   = pageName;
      existing.lastActive = new Date().toISOString();
      if (scrollDepth > (existing.maxScroll || 0)) existing.maxScroll = scrollDepth;
      // Track all pages visited in order
      if (!existing.pagesVisited) existing.pagesVisited = [];
      if (!existing.pagesVisited.includes(pageName)) existing.pagesVisited.push(pageName);
    } else {
      visitors.push({
        sessionId,
        // Location
        location:    locLabel,
        city:        loc.city,
        country:     loc.country,
        region:      loc.region || '—',
        ip:          loc.ip,
        timezone:    loc.timezone,
        isp:         loc.isp || '—',
        // Traffic source
        referrer:     trafficSrc.referrer,
        referrerLabel:trafficSrc.referrerLabel,
        utm:          trafficSrc.utm,
        // Device
        device:   deviceInfo.device,
        browser:  deviceInfo.browser,
        os:       deviceInfo.os,
        // Hardware & Environment
        screenRes:      hardwareInfo.screenRes,
        screenDepth:    hardwareInfo.screenDepth,
        pixelRatio:     hardwareInfo.pixelRatio,
        windowSize:     hardwareInfo.windowSize,
        cpuCores:       hardwareInfo.cpuCores,
        ramGB:          hardwareInfo.ramGB,
        language:       hardwareInfo.language,
        darkMode:       hardwareInfo.darkMode,
        connectionType: hardwareInfo.connectionType,
        online:         hardwareInfo.online,
        // Session
        firstVisit:    new Date().toISOString(),
        lastActive:    new Date().toISOString(),
        lastPage:      pageName,
        pagesVisited: [pageName],
        maxScroll:     scrollDepth,
      });
    }

    // Prune visitors older than 60 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    const cleaned = visitors.filter(v => new Date(v.lastActive) > cutoff);
    localStorage.setItem('auro_visitors', JSON.stringify(cleaned));
    return locLabel;
  },

  // ── REVIEWS CRUD ──────────────────────────────────────────
  async addReview(reviewData) {
    const reviews = JSON.parse(localStorage.getItem('auro_reviews') || '[]');
    await new Promise(r => setTimeout(r, 700));

    // Attach visitor geo to the review automatically
    let geo = null;
    try { geo = JSON.parse(sessionStorage.getItem('auro_geo')); } catch(e) {}

    const newReview = {
      id:       'rev_' + Date.now().toString(),
      date:     new Date().toISOString(),
      status:   'pending',
      name:     reviewData.name    || 'عميل مميز',
      rating:   reviewData.rating,
      comment:  reviewData.comment || '',
      location: geo ? `${geo.city}، ${geo.country}` : '—',
      device:   this._getDeviceInfo().device,
      referrer: this._getTrafficSource().referrerLabel,
    };

    reviews.push(newReview);
    localStorage.setItem('auro_reviews', JSON.stringify(reviews));
    return newReview;
  },

  getReviews(status = 'all') {
    const reviews = JSON.parse(localStorage.getItem('auro_reviews') || '[]');
    const filtered = status === 'all' ? reviews : reviews.filter(r => r.status === status);
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  updateReviewStatus(id, newStatus) {
    const reviews = JSON.parse(localStorage.getItem('auro_reviews') || '[]');
    const i = reviews.findIndex(r => r.id === id);
    if (i !== -1) { reviews[i].status = newStatus; localStorage.setItem('auro_reviews', JSON.stringify(reviews)); return true; }
    return false;
  },

  deleteReview(id) {
    let reviews = JSON.parse(localStorage.getItem('auro_reviews') || '[]');
    reviews = reviews.filter(r => r.id !== id);
    localStorage.setItem('auro_reviews', JSON.stringify(reviews));
  },

  // ── STATS ─────────────────────────────────────────────────
  getVisitorStats() {
    const visitors = JSON.parse(localStorage.getItem('auro_visitors') || '[]');
    const now = new Date();

    const cut24h  = new Date(now - 24 * 3600 * 1000);
    const cut7d   = new Date(now - 7  * 24 * 3600 * 1000);
    const cut30d  = new Date(now - 30 * 24 * 3600 * 1000);

    const recent24h = visitors.filter(v => new Date(v.lastActive) > cut24h);
    const recent7d  = visitors.filter(v => new Date(v.lastActive) > cut7d);

    // Average scroll
    const avgScroll = visitors.length
      ? Math.round(visitors.reduce((a, v) => a + (v.maxScroll || 0), 0) / visitors.length)
      : 0;

    // Devices breakdown
    const devices = { mobile: 0, desktop: 0, tablet: 0 };
    visitors.forEach(v => { if (devices[v.device] !== undefined) devices[v.device]++; });

    // Top referrers
    const refMap = {};
    visitors.forEach(v => {
      const r = v.referrerLabel || 'مباشر';
      refMap[r] = (refMap[r] || 0) + 1;
    });
    const topReferrers = Object.entries(refMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count]) => ({ label, count }));

    // Top cities
    const cityMap = {};
    visitors.forEach(v => {
      const c = v.city && v.city !== '—' ? v.city : 'غير معروف';
      cityMap[c] = (cityMap[c] || 0) + 1;
    });
    const topCities = Object.entries(cityMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }));

    return {
      totalAllTime: visitors.length,
      active24h:    recent24h.length,
      active7d:     recent7d.length,
      averageScroll: avgScroll,
      devices,
      topReferrers,
      topCities,
      recent: [...visitors].sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive)).slice(0, 100),
    };
  },

  // ── EXPORT CSV ────────────────────────────────────────────
  exportVisitorsCSV() {
    const visitors = JSON.parse(localStorage.getItem('auro_visitors') || '[]');
    const headers  = ['التاريخ','المدينة','الدولة','المنطقة','IP','المتصفح','الجهاز','نظام التشغيل','المصدر','UTM Campaign','آخر صفحة','أقصى تصفح%'];
    const rows = visitors.map(v => [
      new Date(v.lastActive).toLocaleString('ar-SA'),
      v.city || '—', v.country || '—', v.region || '—', v.ip || '—',
      v.browser || '—', v.device || '—', v.os || '—',
      v.referrerLabel || 'مباشر',
      v.utm?.campaign || '—',
      v.lastPage || '—',
      (v.maxScroll || 0) + '%',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `auro_visitors_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  },

  exportReviewsCSV() {
    const reviews = JSON.parse(localStorage.getItem('auro_reviews') || '[]');
    const headers = ['التاريخ','الاسم','التقييم','التعليق','الحالة','الموقع','الجهاز','المصدر'];
    const rows = reviews.map(r => [
      new Date(r.date).toLocaleString('ar-SA'),
      r.name, r.rating, r.comment, r.status, r.location || '—', r.device || '—', r.referrer || '—',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `auro_reviews_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  },
};

FeedbackService.init();
