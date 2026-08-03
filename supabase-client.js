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
