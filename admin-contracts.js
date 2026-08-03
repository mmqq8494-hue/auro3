// ── ADMIN CONTRACTS JS ──
// Handles Electronic Contracts Logic

const AdminContracts = {
  collection: 'contracts',

  init() {
    document.addEventListener('AdminDBReady', () => {
      this.loadContracts();
    });
    
    document.addEventListener('TabChanged', (e) => {
      if(e.detail.tab === 'tab-contracts') {
        this.loadContracts();
      }
    });

    this.setupEventListeners();
  },

  setupEventListeners() {
    const btnNew = document.getElementById('btn-new-contract');
    if (btnNew) {
      btnNew.addEventListener('click', () => this.openModal());
    }

    const form = document.getElementById('form-contract');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.saveContract();
      });
    }
  },

  async loadContracts() {
    const list = document.getElementById('contracts-list');
    if(!list) return;

    const contracts = await AdminApp.getDocuments(this.collection);
    
    list.innerHTML = '';
    if(contracts.length === 0) {
      list.innerHTML = '<div class="empty-state">لا توجد عقود حتى الآن.</div>';
      return;
    }

    let html = `<table class="data-table">
      <thead>
        <tr>
          <th>رقم العقد</th>
          <th>العميل</th>
          <th>تاريخ الإنشاء</th>
          <th>القيمة</th>
          <th>الحالة</th>
          <th>إجراءات</th>
        </tr>
      </thead>
      <tbody>`;

    contracts.forEach(c => {
      const badgeCls = c.status === 'signed' ? 'badge-signed' : (c.status === 'sent' ? 'badge-sent' : 'badge-draft');
      const badgeTxt = c.status === 'signed' ? 'موقّع' : (c.status === 'sent' ? 'مُرسل' : 'مسودة');
      
      html += `<tr>
        <td>#${c.contractNumber}</td>
        <td>${c.clientName}</td>
        <td>${new Date(c.createdAt).toLocaleDateString('ar-SA')}</td>
        <td>${c.totalValue} ريال</td>
        <td><span class="badge ${badgeCls}">${badgeTxt}</span></td>
        <td>
          <div class="action-links">
            <button class="view" title="عرض" onclick="AdminContracts.viewContract('${c.id}')">👁️</button>
            <button class="download" title="تحميل / طباعة" onclick="AdminContracts.printContract('${c.id}')">📥</button>
            <button class="copy" title="نسخ الرابط" onclick="AdminContracts.copyLink('${c.id}')">🔗</button>
            <button class="edit" title="تعديل" onclick="AdminContracts.editContract('${c.id}')">✏️</button>
            <button class="delete" title="حذف" onclick="AdminContracts.deleteContract('${c.id}')">🗑</button>
          </div>
        </td>
      </tr>`;
    });

    html += `</tbody></table>`;
    list.innerHTML = html;
  },

  openModal(data = null) {
    const modal = document.getElementById('modal-contract');
    if(!modal) return;

    const form = document.getElementById('form-contract');
    form.reset();
    document.getElementById('contract-id').value = '';
    document.getElementById('contract-corner-custom-wrap').classList.add('hidden');

    if (data) {
      document.getElementById('contract-id').value = data.id;
      document.getElementById('contract-client').value = data.clientName || '';
      document.getElementById('contract-phone').value = data.phone || '';
      document.getElementById('contract-city').value = data.city || '';
      document.getElementById('contract-status').value = data.status || 'draft';
      document.getElementById('contract-event-type').value = data.eventType || '';
      document.getElementById('contract-event-date').value = data.eventDate || '';
      document.getElementById('contract-event-time').value = data.eventTime || '';
      document.getElementById('contract-event-loc').value = data.eventLoc || '';

      const knownPkg = AdminApp.PRICING.packages.some(p => p.name === data.cornerType);
      if (data.packageName) {
        document.getElementById('contract-corner').value = data.packageName;
        if (data.packageName === 'custom') {
          document.getElementById('contract-corner-custom-wrap').classList.remove('hidden');
          document.getElementById('contract-corner-custom').value = data.cornerType || '';
        }
      } else if (knownPkg) {
        document.getElementById('contract-corner').value = data.cornerType;
      } else if (data.cornerType) {
        document.getElementById('contract-corner').value = 'custom';
        document.getElementById('contract-corner-custom-wrap').classList.remove('hidden');
        document.getElementById('contract-corner-custom').value = data.cornerType;
      }
      document.getElementById('contract-add-deco').checked = !!data.addDeco;
      document.getElementById('contract-add-host').checked = !!data.addHost;

      document.getElementById('contract-guests').value = data.guests || '';
      document.getElementById('contract-duration').value = data.duration || '';
      document.getElementById('contract-additions').value = (data.extraNotes != null) ? data.extraNotes : (data.additions || '');
      document.getElementById('contract-service-val').value = data.serviceVal || 0;
      document.getElementById('contract-deposit-val').value = data.depositVal || 500;
    } else {
      document.getElementById('contract-status').value = 'draft';
      document.getElementById('contract-service-val').value = 0;
      document.getElementById('contract-deposit-val').value = 500;
    }

    modal.classList.add('active');
    this.calculateTotal();
  },

  closeModal() {
    document.getElementById('modal-contract').classList.remove('active');
  },

  // Auto-fills "service value" from the selected package + optional additions.
  applyPricing() {
    const sel = document.getElementById('contract-corner').value;
    document.getElementById('contract-corner-custom-wrap').classList.toggle('hidden', sel !== 'custom');

    const pkg = AdminApp.PRICING.packages.find(p => p.name === sel);
    const base = pkg ? pkg.price : 0;

    let addTotal = 0;
    if (document.getElementById('contract-add-deco').checked) addTotal += AdminApp.PRICING.additions.find(a => a.key === 'deco').price;
    if (document.getElementById('contract-add-host').checked) addTotal += AdminApp.PRICING.additions.find(a => a.key === 'host').price;

    document.getElementById('contract-service-val').value = base + addTotal;
    this.calculateTotal();
  },

  buildAdditionsText() {
    const parts = [];
    if (document.getElementById('contract-add-deco').checked) parts.push(AdminApp.PRICING.additions.find(a => a.key === 'deco').label + ' (+100 ريال)');
    if (document.getElementById('contract-add-host').checked) parts.push(AdminApp.PRICING.additions.find(a => a.key === 'host').label + ' (+200 ريال)');
    const notes = document.getElementById('contract-additions').value.trim();
    if (notes) parts.push(notes);
    return parts.join('\n');
  },

  calculateTotal() {
    const serviceVal = parseFloat(document.getElementById('contract-service-val').value) || 0;
    const depositVal = parseFloat(document.getElementById('contract-deposit-val').value) || 0;
    const total = serviceVal + depositVal;

    const display = document.getElementById('contract-total-display');
    if(display) display.textContent = total.toFixed(2) + ' ريال';
    return total;
  },

  async saveContract() {
    const id = document.getElementById('contract-id').value;
    const serviceVal = parseFloat(document.getElementById('contract-service-val').value) || 0;
    const depositVal = parseFloat(document.getElementById('contract-deposit-val').value) || 0;
    const totalValue = serviceVal + depositVal;

    const packageName = document.getElementById('contract-corner').value;
    const cornerType = packageName === 'custom'
      ? (document.getElementById('contract-corner-custom').value || 'باقة مخصصة')
      : packageName;
    const addDeco = document.getElementById('contract-add-deco').checked;
    const addHost = document.getElementById('contract-add-host').checked;
    const extraNotes = document.getElementById('contract-additions').value;

    const data = {
      id: id || undefined,
      clientName: document.getElementById('contract-client').value,
      phone: document.getElementById('contract-phone').value,
      city: document.getElementById('contract-city').value,
      status: document.getElementById('contract-status').value,
      eventType: document.getElementById('contract-event-type').value,
      eventDate: document.getElementById('contract-event-date').value,
      eventTime: document.getElementById('contract-event-time').value,
      eventLoc: document.getElementById('contract-event-loc').value,
      cornerType,
      packageName,
      addDeco,
      addHost,
      extraNotes,
      guests: document.getElementById('contract-guests').value,
      duration: document.getElementById('contract-duration').value,
      additions: this.buildAdditionsText(),
      serviceVal,
      depositVal,
      totalValue,
      contractNumber: id ? undefined : Math.floor(100000 + Math.random() * 900000).toString(),
      createdAt: id ? undefined : Date.now(),
      updatedAt: Date.now()
    };

    await AdminApp.saveDocument(this.collection, data);
    AdminApp.showToast('تم حفظ العقد بنجاح');
    this.closeModal();
    this.loadContracts();
  },

  async editContract(id) {
    const docs = await AdminApp.getDocuments(this.collection);
    const doc = docs.find(d => d.id === id);
    if(doc) this.openModal(doc);
  },

  async deleteContract(id) {
    if(confirm('هل أنت متأكد من حذف هذا العقد؟')) {
      await AdminApp.deleteDocument(this.collection, id);
      AdminApp.showToast('تم الحذف بنجاح');
      this.loadContracts();
    }
  },

  viewContract(id) {
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const link = baseUrl + '/contract.html?id=' + id + '&admin=1';
    window.open(link, '_blank');
  },

  printContract(id) {
    const baseUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'));
    const link = baseUrl + '/contract.html?id=' + id + '&print=1&admin=1';
    window.open(link, '_blank');
  },

  copyLink(id) {
    const cleanUrl = window.location.href.split('?')[0].split('#')[0];
    const baseUrl = cleanUrl.substring(0, cleanUrl.lastIndexOf('/'));
    const link = baseUrl + '/contract.html?id=' + id;
    navigator.clipboard.writeText(link).then(() => {
      AdminApp.showToast('تم نسخ رابط العقد: ' + link);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  AdminContracts.init();
});
