// ── ADMIN APP JS ──
// Handles general Admin dashboard logic, routing, and Supabase Auth/DB access.

const AdminApp = {
  useAuth: false,
  session: null,

  // ── PRICING (single source of truth for quotes/contracts/invoices) ──
  PRICING: {
    packages: [
      { name: 'الذهبية',    price: 450, cups: '20-35' },
      { name: 'البلاتينية', price: 650, cups: '40-70' },
      { name: 'الملكية',    price: 850, cups: '60-100' }
    ],
    additions: [
      { key: 'deco', label: 'زينة تخرج / عيد / مناسبة', price: 100 },
      { key: 'host', label: 'عاملة ضيافة',               price: 200 }
    ],
    deposit: 500
  },

  async init() {
    await this.checkAuth();
    this.setupNavigation();
  },

  async checkAuth() {
    if (!window.sb) {
      console.warn("⚠️ AdminApp: Supabase client not loaded.");
      document.dispatchEvent(new Event('AdminDBReady'));
      return;
    }

    const { data } = await window.sb.auth.getSession();
    this.session = data.session;
    this.useAuth = !!data.session;

    window.sb.auth.onAuthStateChange((_event, session) => {
      this.session = session;
      this.useAuth = !!session;
      document.dispatchEvent(new CustomEvent('AdminAuthChanged', { detail: { loggedIn: this.useAuth } }));
    });

    document.dispatchEvent(new Event('AdminDBReady'));
  },

  setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item[data-tab]');
    const tabs = document.querySelectorAll('.admin-tab-content');

    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();

        // Hide all tabs
        tabs.forEach(t => t.classList.add('hidden'));
        navItems.forEach(n => n.classList.remove('active'));

        // Show selected tab
        const tabId = item.getAttribute('data-tab');
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
          targetTab.classList.remove('hidden');
          item.classList.add('active');

          // Trigger tab specific load event
          document.dispatchEvent(new CustomEvent('TabChanged', { detail: { tab: tabId } }));
        }
      });
    });
  },

  // Generic DB wrapper — callers keep using camelCase objects; conversion to/from
  // Postgres snake_case columns happens transparently here.
  async saveDocument(collection, data) {
    if (!this.useAuth) {
      alert("تعذر الحفظ: لازم تسجّل دخول أولاً.");
      throw new Error("Not authenticated");
    }
    try {
      if (data.id) {
        const id = data.id;
        const payload = window.camelToSnake(data);
        delete payload.id;
        const { error } = await window.sb.from(collection).update(payload).eq('id', id);
        if (error) throw error;
        this.logAudit('UPDATE', collection, id);
      } else {
        data.id = collection.slice(0, 3) + '_' + Date.now();
        const { error } = await window.sb.from(collection).insert(window.camelToSnake(data));
        if (error) throw error;
        this.logAudit('CREATE', collection, data.id);
      }
      return data;
    } catch (e) {
      console.error("Supabase save error:", e);
      alert("فشل الحفظ في قاعدة البيانات. تحقق من الصلاحيات والاتصال.");
      throw e;
    }
  },

  async getDocuments(collection) {
    if (!this.useAuth) return [];
    try {
      const { data, error } = await window.sb.from(collection).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(window.snakeToCamel);
    } catch (e) {
      console.error("Supabase get error:", e);
      alert("خطأ في جلب البيانات من السحابة. تأكد من صحة صلاحيات RLS في Supabase.");
      return [];
    }
  },

  async deleteDocument(collection, id) {
    if (!this.useAuth) return false;
    try {
      const { error } = await window.sb.from(collection).delete().eq('id', id);
      if (error) throw error;
      this.logAudit('DELETE', collection, id);
      return true;
    } catch (e) {
      console.error("Supabase delete error:", e);
      return false;
    }
  },

  showToast(msg, type='success') {
    // using existing toast logic or create new
    if(window.showToast) {
       window.showToast(msg);
    } else {
       alert(msg);
    }
  },

  async logAudit(action, collection, docId) {
    const log = {
       action,
       collection,
       docId,
       timestamp: Date.now(),
       adminUser: this.session?.user?.email || 'admin'
    };
    if (this.useAuth) {
       try { await window.sb.from('audit_logs').insert(window.camelToSnake(log)); } catch(e){}
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminApp.init();
});
