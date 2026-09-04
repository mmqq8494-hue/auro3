// ── SUPABASE CLIENT (single source of truth for the whole site) ──
// Requires the Supabase JS SDK <script> tag to be loaded first:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

const SUPABASE_URL = 'https://pnlpbxyeoyndyhubybxx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Dbbm4ti7Kpycq3AFPIelKQ_zJbPc-9T';

window.sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── camelCase (JS) <-> snake_case (Postgres) helpers ──
// Lets every file keep using the same camelCase field names as before.
window.snakeToCamel = function (row) {
  if (!row) return row;
  const out = {};
  for (const k in row) {
    const camel = k.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase());
    out[camel] = row[k];
  }
  return out;
};

window.camelToSnake = function (obj) {
  const out = {};
  for (const k in obj) {
    if (obj[k] === undefined) continue; // Postgres/PostgREST rejects undefined; just omit it
    const snake = k.replace(/[A-Z]/g, c => '_' + c.toLowerCase());
    out[snake] = obj[k];
  }
  return out;
};

// ── AURO RELAY (Apps Script) ──────────────────────────────────────
// كل الإشعارات تمر من هنا بدل ما تنادي Discord مباشرة من المتصفح،
// عشان رابط الـ webhook ما يكون مكشوف في كود الموقع.
// رابط الـ Web app حق Apps Script (Deploy > Web app). لو أعدت النشر بنسخة جديدة يبقى نفسه.
window.AURO_RELAY = 'https://script.google.com/macros/s/AKfycbz8pFm7NIYpEZ3qE3wVVtQZaaajpTIIAEA2xXMaP5qwQ_fZ9A5PKFhApaLi1CfXCBT2/exec';

// إرسال بأفضل جهد — ما يوقف ولا يعطّل أي شي لو فشل أو لو الرابط ما انحط.
window.auroNotify = function (type, data) {
  try {
    if (!window.AURO_RELAY || window.AURO_RELAY.indexOf('http') !== 0) return Promise.resolve();
    return fetch(window.AURO_RELAY, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(Object.assign({ kind: type }, data || {}))
    }).catch(() => {});
  } catch (e) { return Promise.resolve(); }
};
