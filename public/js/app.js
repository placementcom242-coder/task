/**
 * AquaVenta - Main Frontend Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    user: API.getUser(),
    bottles: [],
    vendors: [],
    reports: null,
    activeView: 'dashboard',
    reportFilter: {
      period: 'all',
      date: '',
      month: '10',
      year: '2026',
      page: 1,
      limit: 10
    },
    deleteAction: null
  };

  // DOM Elements
  const navBtnDashboard = document.getElementById('navBtnDashboard');
  const navBtnBottles = document.getElementById('navBtnBottles');
  const navBtnVendors = document.getElementById('navBtnVendors');
  const navBtnApiExplorer = document.getElementById('navBtnApiExplorer');
  const authNavContainer = document.getElementById('authNavContainer');

  const viewDashboard = document.getElementById('view-dashboard');
  const viewBottles = document.getElementById('view-bottles');
  const viewVendors = document.getElementById('view-vendors');
  const viewApiExplorer = document.getElementById('view-apiExplorer');

  // Modals
  const authModal = document.getElementById('authModal');
  const bottleModal = document.getElementById('bottleModal');
  const vendorModal = document.getElementById('vendorModal');
  const invoiceModal = document.getElementById('invoiceModal');
  const confirmDeleteModal = document.getElementById('confirmDeleteModal');

  // API Drawer
  const apiDrawer = document.getElementById('apiActivityDrawer');
  const toggleApiDrawerBtn = document.getElementById('toggleApiDrawerBtn');
  const minimizeDrawerBtn = document.getElementById('minimizeDrawerBtn');
  const clearApiLogsBtn = document.getElementById('clearApiLogsBtn');
  const apiDrawerBody = document.getElementById('apiDrawerBody');
  const apiLogCountBadge = document.getElementById('apiLogCountBadge');

  // =========================================================================
  // TOAST NOTIFICATIONS
  // =========================================================================
  function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let iconSvg = '';
    if (type === 'success') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>';
    } else if (type === 'error') {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f43f5e" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>';
    } else {
      iconSvg = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6366f1" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
    }

    toast.innerHTML = `
      ${iconSvg}
      <div style="font-size: 0.85rem; color: #fff; font-weight: 500;">${message}</div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  // =========================================================================
  // FORMATTING HELPERS
  // =========================================================================
  function formatCurrency(amount) {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  // =========================================================================
  // NAVIGATION & ROUTING
  // =========================================================================
  function switchView(viewName) {
    state.activeView = viewName;

    // Update buttons
    [navBtnDashboard, navBtnBottles, navBtnVendors, navBtnApiExplorer].forEach(btn => {
      if (btn) btn.classList.toggle('active', btn.dataset.view === viewName);
    });

    // Update sections
    [viewDashboard, viewBottles, viewVendors, viewApiExplorer].forEach(sec => {
      if (sec) sec.classList.remove('active');
    });

    if (viewName === 'dashboard' && viewDashboard) viewDashboard.classList.add('active');
    if (viewName === 'bottles' && viewBottles) viewBottles.classList.add('active');
    if (viewName === 'vendors' && viewVendors) viewVendors.classList.add('active');
    if (viewName === 'apiExplorer' && viewApiExplorer) viewApiExplorer.classList.add('active');

    // Trigger load if user authenticated
    if (state.user) {
      if (viewName === 'dashboard') loadReports();
      if (viewName === 'bottles') loadBottles();
      if (viewName === 'vendors') loadVendors();
    }
  }

  [navBtnDashboard, navBtnBottles, navBtnVendors, navBtnApiExplorer].forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  document.getElementById('brandLogoBtn').addEventListener('click', (e) => {
    e.preventDefault();
    switchView('dashboard');
  });

  // =========================================================================
  // AUTHENTICATION LOGIC
  // =========================================================================
  function renderAuthNavbar() {
    if (state.user) {
      const initials = (state.user.name || 'U').substring(0, 2).toUpperCase();
      authNavContainer.innerHTML = `
        <div class="user-profile-badge">
          <div class="user-avatar">${initials}</div>
          <div class="user-meta">
            <span class="user-name">${state.user.name}</span>
            <span class="user-email">${state.user.email}</span>
          </div>
          <button class="btn btn-secondary btn-sm" id="logoutBtn" title="Logout" style="padding: 0.3rem 0.6rem; margin-left: 0.25rem;">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      `;
      document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    } else {
      authNavContainer.innerHTML = `
        <button class="btn btn-primary btn-sm" id="openAuthModalBtn">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
          Sign In
        </button>
      `;
      document.getElementById('openAuthModalBtn').addEventListener('click', () => {
        loadDatabaseUsers();
        openModal(authModal);
      });
    }
  }

  function handleLogout() {
    API.logout();
    state.user = null;
    state.bottles = [];
    state.vendors = [];
    state.reports = null;
    renderAuthNavbar();
    renderBottles();
    renderVendors();
    renderReports();
    showToast('Logged out successfully', 'info');
    loadDatabaseUsers();
    openModal(authModal);
  }

  // Auth Tabs (Login vs Signup)
  const tabAuthLogin = document.getElementById('tabAuthLogin');
  const tabAuthSignup = document.getElementById('tabAuthSignup');
  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const authModalTitle = document.getElementById('authModalTitle');

  tabAuthLogin.addEventListener('click', () => {
    tabAuthLogin.classList.add('active');
    tabAuthSignup.classList.remove('active');
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    authModalTitle.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg> Sign In to AquaVenta`;
  });

  tabAuthSignup.addEventListener('click', () => {
    tabAuthSignup.classList.add('active');
    tabAuthLogin.classList.remove('active');
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    authModalTitle.innerHTML = `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg> Register New Account`;
  });

  // Dynamic Database Users List (Fetches real registered users from MongoDB)
  async function loadDatabaseUsers() {
    const container = document.getElementById('dbUsersChipContainer');
    const badge = document.getElementById('dbUsersCountBadge');
    if (!container) return;

    try {
      const res = await API.getUsers();
      const users = res.users || [];
      if (badge) badge.textContent = `${users.length} in MongoDB`;

      if (users.length === 0) {
        container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-dim);">No users found in database. Create an account below.</span>';
        return;
      }

      container.innerHTML = users.map(u => `
        <button class="btn btn-secondary btn-sm db-user-chip" data-email="${u.email}" type="button" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.65rem;">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <strong style="color: #fff;">${u.email}</strong>
          <span style="color: var(--text-dim); font-size: 0.75rem;">(${u.name})</span>
        </button>
      `).join('');

      container.querySelectorAll('.db-user-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          tabAuthLogin.click();
          const email = chip.dataset.email;
          document.getElementById('loginEmail').value = email;
          if (email === 'test@gmail.com') {
            document.getElementById('loginPassword').value = '123456';
          } else {
            document.getElementById('loginPassword').value = '';
            document.getElementById('loginPassword').focus();
          }
          showToast(`Selected database user: ${email}`, 'info');
        });
      });
    } catch (err) {
      if (badge) badge.textContent = 'Offline';
      container.innerHTML = '<span style="font-size: 0.8rem; color: var(--accent-rose);">Could not load users from database</span>';
    }
  }

  // Login Submit
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await API.login({ email, password });
      state.user = res.user;
      renderAuthNavbar();
      closeModal(authModal);
      showToast(`Welcome back, ${res.user.name}!`);
      loadInitialData();
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    }
  });

  // Signup Submit
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const mobileNo = document.getElementById('signupMobile').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;

    if (password !== confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    try {
      await API.signup({ name, email, mobileNo, password, confirmPassword });
      showToast('Account created! Logging in now...');
      // Automatic login
      const res = await API.login({ email, password });
      state.user = res.user;
      renderAuthNavbar();
      closeModal(authModal);
      loadInitialData();
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    }
  });

  document.getElementById('closeAuthModalBtn').addEventListener('click', () => closeModal(authModal));

  // =========================================================================
  // MODAL UTILITIES
  // =========================================================================
  function openModal(modalEl) {
    modalEl.classList.add('active');
  }

  function closeModal(modalEl) {
    modalEl.classList.remove('active');
  }

  // Backdrop click to close
  [authModal, bottleModal, vendorModal, invoiceModal, confirmDeleteModal].forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) closeModal(m);
    });
  });

  // =========================================================================
  // BOTTLES MANAGEMENT
  // =========================================================================
  async function loadBottles() {
    if (!state.user) return;
    try {
      const res = await API.getBottles();
      state.bottles = res.bottles || [];
      renderBottles();
    } catch (err) {
      showToast(err.message || 'Error loading bottles', 'error');
    }
  }

  function renderBottles() {
    const container = document.getElementById('bottlesGridContainer');
    const searchVal = (document.getElementById('searchBottleInput').value || '').toLowerCase();

    const filtered = state.bottles.filter(b => 
      (b.name && b.name.toLowerCase().includes(searchVal)) ||
      (b.size && b.size.toLowerCase().includes(searchVal))
    );

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v3m4-3v3M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"/></svg>
          <h3>No Bottles Found</h3>
          <p>Add bottle sizes to your inventory to start taking orders.</p>
          <button class="btn btn-primary btn-sm" id="emptyAddBottleBtn" style="margin-top: 1rem;">+ Add First Bottle</button>
        </div>
      `;
      const btn = document.getElementById('emptyAddBottleBtn');
      if (btn) btn.addEventListener('click', openAddBottleModal);
      return;
    }

    container.innerHTML = filtered.map(b => `
      <div class="bottle-card" data-id="${b._id}">
        <div>
          <div class="bottle-card-top">
            <div class="bottle-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v3m4-3v3M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"/></svg>
            </div>
            <span class="bottle-size-tag">${b.size}</span>
          </div>
          <div class="bottle-title">${b.name}</div>
          <div class="bottle-price">${formatCurrency(b.price)}</div>
        </div>
        <div class="bottle-card-actions">
          <button class="btn btn-secondary btn-sm edit-bottle-btn" data-id="${b._id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit
          </button>
          <button class="btn btn-danger btn-sm delete-bottle-btn" data-id="${b._id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
        </div>
      </div>
    `).join('');

    // Attach actions
    container.querySelectorAll('.edit-bottle-btn').forEach(b => {
      b.addEventListener('click', () => openEditBottleModal(b.dataset.id));
    });
    container.querySelectorAll('.delete-bottle-btn').forEach(b => {
      b.addEventListener('click', () => promptDeleteBottle(b.dataset.id));
    });
  }

  document.getElementById('searchBottleInput').addEventListener('input', renderBottles);
  document.getElementById('openAddBottleModalBtn').addEventListener('click', openAddBottleModal);

  function openAddBottleModal() {
    document.getElementById('bottleModalTitle').innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v3m4-3v3M7 7h10v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V7z"/></svg>
      Add New Bottle
    `;
    document.getElementById('bottleFormId').value = '';
    document.getElementById('bottleNameInput').value = '';
    document.getElementById('bottleSizeInput').value = '';
    document.getElementById('bottlePriceInput').value = '';
    updateBottlePreview();
    openModal(bottleModal);
  }

  function openEditBottleModal(id) {
    const bottle = state.bottles.find(b => b._id === id);
    if (!bottle) return;
    document.getElementById('bottleModalTitle').innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg>
      Edit Bottle: ${bottle.name}
    `;
    document.getElementById('bottleFormId').value = bottle._id;
    document.getElementById('bottleNameInput').value = bottle.name;
    document.getElementById('bottleSizeInput').value = bottle.size;
    document.getElementById('bottlePriceInput').value = bottle.price;
    updateBottlePreview();
    openModal(bottleModal);
  }

  function updateBottlePreview() {
    const name = document.getElementById('bottleNameInput').value || 'Sample Bottle';
    const size = document.getElementById('bottleSizeInput').value || '1L';
    const price = document.getElementById('bottlePriceInput').value || 0;

    document.getElementById('previewBottleName').textContent = name;
    document.getElementById('previewBottleSize').textContent = size.toUpperCase();
    document.getElementById('previewBottlePrice').textContent = formatCurrency(price);
  }

  ['bottleNameInput', 'bottleSizeInput', 'bottlePriceInput'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateBottlePreview);
  });

  // Size chips
  document.querySelectorAll('.size-chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('bottleSizeInput').value = chip.dataset.size;
      updateBottlePreview();
    });
  });

  // Save Bottle (Add or Update)
  document.getElementById('bottleForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('bottleFormId').value;
    const name = document.getElementById('bottleNameInput').value.trim();
    const size = document.getElementById('bottleSizeInput').value.trim();
    const price = Number(document.getElementById('bottlePriceInput').value);

    try {
      if (id) {
        await API.updateBottle(id, { name, size, price });
        showToast('Bottle updated successfully');
      } else {
        await API.addBottle({ name, size, price });
        showToast('Bottle added to catalog');
      }
      closeModal(bottleModal);
      await loadBottles();
    } catch (err) {
      showToast(err.message || 'Error saving bottle', 'error');
    }
  });

  document.getElementById('closeBottleModalBtn').addEventListener('click', () => closeModal(bottleModal));
  document.getElementById('cancelBottleModalBtn').addEventListener('click', () => closeModal(bottleModal));

  function promptDeleteBottle(id) {
    const bottle = state.bottles.find(b => b._id === id);
    if (!bottle) return;
    document.getElementById('confirmDeleteMessage').textContent = `Are you sure you want to delete "${bottle.name} (${bottle.size})"?`;
    state.deleteAction = async () => {
      try {
        await API.deleteBottle(id);
        showToast('Bottle deleted');
        closeModal(confirmDeleteModal);
        loadBottles();
      } catch (err) {
        showToast(err.message || 'Error deleting bottle', 'error');
      }
    };
    openModal(confirmDeleteModal);
  }

  // =========================================================================
  // VENDORS & BILLING MANAGEMENT
  // =========================================================================
  async function loadVendors() {
    if (!state.user) return;
    try {
      const res = await API.getVendors();
      state.vendors = res.vendors || [];
      renderVendors();
    } catch (err) {
      showToast(err.message || 'Error loading vendors', 'error');
    }
  }

  function renderVendors() {
    const tbody = document.getElementById('vendorsTableBody');
    const badge = document.getElementById('totalVendorsBadge');
    const searchVal = (document.getElementById('searchVendorInput').value || '').toLowerCase();

    const filtered = state.vendors.filter(v =>
      (v.name && v.name.toLowerCase().includes(searchVal)) ||
      (v.gstNumber && v.gstNumber.toLowerCase().includes(searchVal)) ||
      (v.mobileNo && v.mobileNo.includes(searchVal))
    );

    badge.textContent = filtered.length;

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
            <h3>No Vendors or Bills Found</h3>
            <p>Create a vendor order with bottle items and GST calculation.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = filtered.map(v => {
      const bottleBadges = (v.bottles || []).map(b => `
        <span class="badge badge-bottle" style="margin: 0.15rem;">
          ${b.quantity}x ${b.bottleSize || (b.bottleId && b.bottleId.size) || b.bottleName || 'Bottle'}
        </span>
      `).join('') || '<span style="color: var(--text-dim);">-</span>';

      return `
        <tr data-id="${v._id}">
          <td>
            <div style="font-weight: 700; color: #fff;">${v.name}</div>
            <div style="font-size: 0.75rem; color: var(--text-dim);">${formatDate(v.createdAt)}</div>
          </td>
          <td>
            <div style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--accent-amber); font-weight: 600;">${v.gstNumber}</div>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${v.mobileNo} • ${v.email}</div>
          </td>
          <td style="max-width: 220px; font-size: 0.85rem; color: var(--text-muted);">${v.address}</td>
          <td style="max-width: 200px;">${bottleBadges}</td>
          <td><strong style="color: var(--text-main);">${formatCurrency(v.subTotal)}</strong></td>
          <td><span class="badge badge-gst">+${formatCurrency(v.gstAmount)} (${v.gstPercentage || 18}%)</span></td>
          <td><strong style="color: var(--accent-emerald); font-size: 1.05rem;">${formatCurrency(v.grandTotal)}</strong></td>
          <td>
            <div style="display: flex; gap: 0.35rem;">
              <button class="btn btn-secondary btn-sm view-invoice-btn" data-id="${v._id}" title="View Tax Invoice">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                Bill
              </button>
              <button class="btn btn-secondary btn-sm edit-vendor-btn" data-id="${v._id}" title="Edit Vendor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-danger btn-sm delete-vendor-btn" data-id="${v._id}" title="Delete Vendor">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach row events
    tbody.querySelectorAll('.view-invoice-btn').forEach(b => {
      b.addEventListener('click', () => openInvoiceModal(b.dataset.id));
    });
    tbody.querySelectorAll('.edit-vendor-btn').forEach(b => {
      b.addEventListener('click', () => openEditVendorModal(b.dataset.id));
    });
    tbody.querySelectorAll('.delete-vendor-btn').forEach(b => {
      b.addEventListener('click', () => promptDeleteVendor(b.dataset.id));
    });
  }

  document.getElementById('searchVendorInput').addEventListener('input', renderVendors);
  document.getElementById('refreshVendorsBtn').addEventListener('click', loadVendors);
  document.getElementById('openAddVendorModalBtn').addEventListener('click', openAddVendorModal);

  // Dynamic Bottle Item Rows inside Vendor Form
  const vendorBottleRowsContainer = document.getElementById('vendorBottleRowsContainer');
  const addBottleRowBtn = document.getElementById('addBottleRowBtn');

  function createBottleRow(bottleId = '', quantity = 10) {
    const row = document.createElement('div');
    row.className = 'line-item-row';

    const bottleOptions = state.bottles.map(b => `
      <option value="${b._id}" ${b._id === bottleId ? 'selected' : ''} data-price="${b.price}" data-size="${b.size}">
        ${b.name} (${b.size}) - ₹${b.price}
      </option>
    `).join('');

    const initialBottle = state.bottles.find(b => b._id === bottleId) || state.bottles[0];
    const initialPrice = initialBottle ? initialBottle.price : 0;

    row.innerHTML = `
      <select class="form-control item-bottle-select" required>
        <option value="" disabled ${!bottleId ? 'selected' : ''}>-- Select Bottle --</option>
        ${bottleOptions}
      </select>
      <input type="text" class="form-control item-price-display" value="₹${initialPrice}" readonly style="background: rgba(0,0,0,0.3); color: var(--accent-emerald); font-weight: 700;">
      <input type="number" min="1" class="form-control item-qty-input" value="${quantity}" required>
      <button type="button" class="btn btn-danger btn-sm remove-row-btn" style="padding: 0.4rem 0.6rem;">&times;</button>
    `;

    // Listeners
    const select = row.querySelector('.item-bottle-select');
    const priceDisplay = row.querySelector('.item-price-display');
    const qtyInput = row.querySelector('.item-qty-input');
    const removeBtn = row.querySelector('.remove-row-btn');

    select.addEventListener('change', () => {
      const selectedOpt = select.options[select.selectedIndex];
      const p = selectedOpt ? selectedOpt.dataset.price : 0;
      priceDisplay.value = `₹${p}`;
      recalculateVendorOrder();
    });

    qtyInput.addEventListener('input', recalculateVendorOrder);

    removeBtn.addEventListener('click', () => {
      row.remove();
      recalculateVendorOrder();
    });

    return row;
  }

  addBottleRowBtn.addEventListener('click', () => {
    if (state.bottles.length === 0) {
      showToast('Please add bottles to inventory first', 'error');
      return;
    }
    const newRow = createBottleRow();
    vendorBottleRowsContainer.appendChild(newRow);
    recalculateVendorOrder();
  });

  function recalculateVendorOrder() {
    let subTotal = 0;
    const rows = vendorBottleRowsContainer.querySelectorAll('.line-item-row');

    rows.forEach(row => {
      const select = row.querySelector('.item-bottle-select');
      const qtyInput = row.querySelector('.item-qty-input');
      const selectedOpt = select ? select.options[select.selectedIndex] : null;

      if (selectedOpt && selectedOpt.value) {
        const price = Number(selectedOpt.dataset.price) || 0;
        const qty = Number(qtyInput.value) || 0;
        subTotal += (price * qty);
      }
    });

    const gstPercent = Number(document.getElementById('vendorGstPercentInput').value) || 18;
    const gstAmount = (subTotal * gstPercent) / 100;
    const grandTotal = subTotal + gstAmount;

    document.getElementById('calcGstRate').textContent = gstPercent;
    document.getElementById('calcSubTotal').textContent = formatCurrency(subTotal);
    document.getElementById('calcGstAmount').textContent = formatCurrency(gstAmount);
    document.getElementById('calcGrandTotal').textContent = formatCurrency(grandTotal);
  }

  document.getElementById('vendorGstPercentInput').addEventListener('input', recalculateVendorOrder);

  async function openAddVendorModal() {
    if (state.bottles.length === 0) {
      await loadBottles();
      if (state.bottles.length === 0) {
        showToast('Please create at least one Bottle in inventory first!', 'info');
        switchView('bottles');
        openAddBottleModal();
        return;
      }
    }

    document.getElementById('vendorModalTitle').innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      Create Vendor & Generate Bill
    `;
    document.getElementById('vendorFormId').value = '';
    document.getElementById('vendorNameInput').value = '';
    document.getElementById('vendorGstInput').value = '';
    document.getElementById('vendorEmailInput').value = '';
    document.getElementById('vendorMobileInput').value = '';
    document.getElementById('vendorAddressInput').value = '';
    document.getElementById('vendorGstPercentInput').value = '18';

    vendorBottleRowsContainer.innerHTML = '';
    // Append default 1 row
    vendorBottleRowsContainer.appendChild(createBottleRow(state.bottles[0]._id, 10));
    recalculateVendorOrder();

    openModal(vendorModal);
  }

  function openEditVendorModal(id) {
    const v = state.vendors.find(item => item._id === id);
    if (!v) return;

    document.getElementById('vendorModalTitle').innerHTML = `
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/></svg>
      Edit Vendor: ${v.name}
    `;
    document.getElementById('vendorFormId').value = v._id;
    document.getElementById('vendorNameInput').value = v.name;
    document.getElementById('vendorGstInput').value = v.gstNumber;
    document.getElementById('vendorEmailInput').value = v.email;
    document.getElementById('vendorMobileInput').value = v.mobileNo;
    document.getElementById('vendorAddressInput').value = v.address;
    document.getElementById('vendorGstPercentInput').value = v.gstPercentage || 18;

    vendorBottleRowsContainer.innerHTML = '';
    if (v.bottles && v.bottles.length > 0) {
      v.bottles.forEach(b => {
        const bottleId = (b.bottleId && b.bottleId._id) || b.bottleId;
        vendorBottleRowsContainer.appendChild(createBottleRow(bottleId, b.quantity));
      });
    } else {
      vendorBottleRowsContainer.appendChild(createBottleRow());
    }

    recalculateVendorOrder();
    openModal(vendorModal);
  }

  // Save Vendor Submit
  document.getElementById('vendorForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('vendorFormId').value;
    const name = document.getElementById('vendorNameInput').value.trim();
    const gstNumber = document.getElementById('vendorGstInput').value.trim();
    const email = document.getElementById('vendorEmailInput').value.trim();
    const mobileNo = document.getElementById('vendorMobileInput').value.trim();
    const address = document.getElementById('vendorAddressInput').value.trim();
    const gstPercentage = Number(document.getElementById('vendorGstPercentInput').value) || 18;

    // Collect bottles
    const bottles = [];
    const rows = vendorBottleRowsContainer.querySelectorAll('.line-item-row');
    rows.forEach(row => {
      const select = row.querySelector('.item-bottle-select');
      const qty = Number(row.querySelector('.item-qty-input').value) || 1;
      if (select && select.value) {
        bottles.push({
          bottleId: select.value,
          quantity: qty
        });
      }
    });

    if (bottles.length === 0) {
      showToast('Please add at least one bottle to the order', 'error');
      return;
    }

    const payload = {
      name,
      gstNumber,
      email,
      mobileNo,
      address,
      bottles,
      gstPercentage
    };

    try {
      if (id) {
        await API.updateVendor(id, payload);
        showToast('Vendor updated successfully');
      } else {
        await API.addVendor(payload);
        showToast('Vendor created and invoice generated');
      }
      closeModal(vendorModal);
      await loadVendors();
      if (state.activeView === 'dashboard') loadReports();
    } catch (err) {
      showToast(err.message || 'Error saving vendor', 'error');
    }
  });

  document.getElementById('closeVendorModalBtn').addEventListener('click', () => closeModal(vendorModal));
  document.getElementById('cancelVendorModalBtn').addEventListener('click', () => closeModal(vendorModal));

  function promptDeleteVendor(id) {
    const v = state.vendors.find(item => item._id === id);
    if (!v) return;
    document.getElementById('confirmDeleteMessage').textContent = `Are you sure you want to delete vendor "${v.name}" and their billing history?`;
    state.deleteAction = async () => {
      try {
        await API.deleteVendor(id);
        showToast('Vendor deleted');
        closeModal(confirmDeleteModal);
        loadVendors();
        if (state.activeView === 'dashboard') loadReports();
      } catch (err) {
        showToast(err.message || 'Error deleting vendor', 'error');
      }
    };
    openModal(confirmDeleteModal);
  }

  // Confirm delete modal buttons
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => closeModal(confirmDeleteModal));
  document.getElementById('closeConfirmDeleteModalBtn').addEventListener('click', () => closeModal(confirmDeleteModal));
  document.getElementById('confirmDeleteSubmitBtn').addEventListener('click', () => {
    if (state.deleteAction) state.deleteAction();
  });

  // =========================================================================
  // PRINTABLE TAX INVOICE MODAL
  // =========================================================================
  function openInvoiceModal(vendorOrId) {
    let vendor = (typeof vendorOrId === 'object' && vendorOrId !== null)
      ? vendorOrId
      : state.vendors.find(v => v._id === vendorOrId);

    if (!vendor && state.reports && state.reports.vendors) {
      vendor = state.reports.vendors.find(v => v._id === vendorOrId);
    }
    if (!vendor) return;

    const sheet = document.getElementById('invoiceSheetContent');
    const invoiceNumber = `INV-${vendor._id.slice(-6).toUpperCase()}`;

    const itemsRows = (vendor.bottles || []).map((b, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>
          <strong>${b.bottleName || (b.bottleId && b.bottleId.name) || 'Water Bottle'}</strong>
          <div style="font-size: 0.75rem; color: #64748b;">Volume: ${b.bottleSize || (b.bottleId && b.bottleId.size) || 'Standard'}</div>
        </td>
        <td>${b.quantity}</td>
        <td>₹${Number(b.price || (b.bottleId && b.bottleId.price) || 0).toFixed(2)}</td>
        <td style="text-align: right;"><strong>₹${Number(b.totalAmount || 0).toFixed(2)}</strong></td>
      </tr>
    `).join('');

    sheet.innerHTML = `
      <div class="invoice-header-row">
        <div>
          <div class="invoice-logo-title">AquaVenta Beverage Corp.</div>
          <p style="color: #64748b; font-size: 0.85rem; margin-top: 0.25rem;">
            Commercial Bottle Distribution & Water Solutions<br>
            GSTIN: <strong>24AABCA0000A1Z5</strong> | Support: support@aquaventa.com
          </p>
        </div>
        <div style="text-align: right;">
          <h2 style="font-size: 1.5rem; color: #0f172a; margin-bottom: 0.25rem;">TAX INVOICE</h2>
          <div style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: #4338ca;">${invoiceNumber}</div>
          <div style="font-size: 0.8rem; color: #64748b;">Date: ${formatDate(vendor.createdAt)}</div>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 1.5rem; padding: 1rem; background: #f8fafc; border-radius: 8px;">
        <div>
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Billed To / Buyer:</div>
          <div style="font-size: 1.1rem; font-weight: 800; color: #0f172a; margin-top: 0.25rem;">${vendor.name}</div>
          <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">${vendor.address}</div>
        </div>
        <div style="text-align: right;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Tax Details:</div>
          <div style="font-size: 0.9rem; font-weight: 700; color: #0f172a; margin-top: 0.25rem;">Buyer GSTIN: ${vendor.gstNumber}</div>
          <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">Phone: ${vendor.mobileNo} | Email: ${vendor.email}</div>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Item & Size</th>
            <th>Qty</th>
            <th>Rate</th>
            <th style="text-align: right;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="invoice-summary-box">
        <div class="inv-row">
          <span>Subtotal:</span>
          <strong>₹${Number(vendor.subTotal || 0).toFixed(2)}</strong>
        </div>
        <div class="inv-row">
          <span>GST (${vendor.gstPercentage || 18}%):</span>
          <strong>₹${Number(vendor.gstAmount || 0).toFixed(2)}</strong>
        </div>
        <div class="inv-row total">
          <span>Grand Total:</span>
          <span style="color: #4338ca;">₹${Number(vendor.grandTotal || 0).toFixed(2)}</span>
        </div>
      </div>

      <div style="margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 0.8rem; color: #94a3b8;">
        <div>Thank you for your business! This is a system-generated electronic invoice.</div>
        <div style="font-weight: 700; color: #475569;">Authorized Signatory</div>
      </div>
    `;

    openModal(invoiceModal);
  }

  document.getElementById('closeInvoiceModalBtn').addEventListener('click', () => closeModal(invoiceModal));
  document.getElementById('printInvoiceBtn').addEventListener('click', () => {
    window.print();
  });

  // =========================================================================
  // DASHBOARD & SALES REPORTS
  // =========================================================================
  const reportPeriodPills = document.getElementById('reportPeriodPills');
  const reportDateInput = document.getElementById('reportDateInput');
  const reportMonthSelect = document.getElementById('reportMonthSelect');
  const reportYearInput = document.getElementById('reportYearInput');
  const refreshReportBtn = document.getElementById('refreshReportBtn');

  reportPeriodPills.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      reportPeriodPills.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.reportFilter.period = btn.dataset.period;
      state.reportFilter.page = 1;

      // Toggle dynamic inputs
      reportDateInput.style.display = state.reportFilter.period === 'daily' ? 'inline-block' : 'none';
      reportMonthSelect.style.display = state.reportFilter.period === 'monthly' ? 'inline-block' : 'none';
      reportYearInput.style.display = (state.reportFilter.period === 'monthly' || state.reportFilter.period === 'yearly') ? 'inline-block' : 'none';

      loadReports();
    });
  });

  reportDateInput.addEventListener('change', (e) => {
    state.reportFilter.date = e.target.value;
    loadReports();
  });

  reportMonthSelect.addEventListener('change', (e) => {
    state.reportFilter.month = e.target.value;
    loadReports();
  });

  reportYearInput.addEventListener('change', (e) => {
    state.reportFilter.year = e.target.value;
    loadReports();
  });

  refreshReportBtn.addEventListener('click', loadReports);

  // Pagination buttons
  document.getElementById('reportPrevPageBtn').addEventListener('click', () => {
    if (state.reportFilter.page > 1) {
      state.reportFilter.page--;
      loadReports();
    }
  });

  document.getElementById('reportNextPageBtn').addEventListener('click', () => {
    state.reportFilter.page++;
    loadReports();
  });

  async function loadReports() {
    if (!state.user) return;
    try {
      const params = {
        period: state.reportFilter.period,
        page: state.reportFilter.page,
        limit: state.reportFilter.limit
      };

      if (state.reportFilter.period === 'daily' && state.reportFilter.date) {
        params.date = state.reportFilter.date;
      }
      if (state.reportFilter.period === 'monthly') {
        params.month = state.reportFilter.month;
        params.year = state.reportFilter.year;
      }
      if (state.reportFilter.period === 'yearly') {
        params.year = state.reportFilter.year;
      }

      const res = await API.getSalesReport(params);
      state.reports = res;
      renderReports();
    } catch (err) {
      showToast(err.message || 'Error generating sales report', 'error');
    }
  }

  function renderReports() {
    const summary = (state.reports && state.reports.summary) || {};
    const pagination = (state.reports && state.reports.pagination) || {};
    const vendors = (state.reports && state.reports.vendors) || [];

    // KPI Cards
    document.getElementById('kpiTotalRevenue').textContent = formatCurrency(summary.totalRevenue || 0);
    document.getElementById('kpiBottlesSold').textContent = (summary.totalBottlesSold || 0).toLocaleString();
    document.getElementById('kpiSubTotal').textContent = formatCurrency(summary.totalSubTotal || 0);
    document.getElementById('kpiGstAmount').textContent = formatCurrency(summary.totalGstAmount || 0);

    // 1. Bottle-wise Breakdown
    const bottleBreakdownContainer = document.getElementById('bottleBreakdownContainer');
    const bottleWise = summary.bottleWiseSales || [];
    document.getElementById('bottleBreakdownCount').textContent = `${bottleWise.length} items`;

    if (bottleWise.length === 0) {
      bottleBreakdownContainer.innerHTML = '<div class="empty-state">No bottle sales in this period.</div>';
    } else {
      const maxQty = Math.max(...bottleWise.map(b => b.quantitySold), 1);
      bottleBreakdownContainer.innerHTML = bottleWise.map(b => {
        const pct = Math.round((b.quantitySold / maxQty) * 100);
        return `
          <div style="margin-bottom: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
              <div>
                <span class="bottle-size-tag" style="margin-right: 0.5rem;">${b.bottleSize || 'STD'}</span>
                <strong style="color: #fff; font-size: 0.95rem;">${b.bottleName || 'Bottle'}</strong>
              </div>
              <div style="text-align: right;">
                <span style="font-weight: 700; color: var(--accent-emerald);">${formatCurrency(b.revenue)}</span>
                <span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 0.5rem;">(${b.quantitySold} units)</span>
              </div>
            </div>
            <div style="height: 8px; background: rgba(255, 255, 255, 0.05); border-radius: 4px; overflow: hidden;">
              <div style="height: 100%; width: ${pct}%; background: linear-gradient(90deg, #6366f1, #06b6d4); border-radius: 4px; transition: width 0.4s ease;"></div>
            </div>
          </div>
        `;
      }).join('');
    }

    // 2. Date-wise Activity
    const dateBreakdownContainer = document.getElementById('dateBreakdownContainer');
    const dateWise = summary.dateWiseSales || [];
    document.getElementById('dateBreakdownCount').textContent = `${dateWise.length} days`;

    if (dateWise.length === 0) {
      dateBreakdownContainer.innerHTML = '<div class="empty-state">No date-wise records in this period.</div>';
    } else {
      dateBreakdownContainer.innerHTML = dateWise.map(d => {
        const chips = (d.bottles || []).map(b => `
          <span class="badge badge-bottle" style="font-size: 0.7rem;">
            ${b.bottleSize || b.bottleName}: ${b.quantitySold}u (₹${b.revenue})
          </span>
        `).join(' ');

        return `
          <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
              <div style="font-family: var(--font-mono); font-size: 0.85rem; font-weight: 700; color: var(--accent-cyan);">${d.date}</div>
              <div>
                <strong style="color: var(--accent-emerald); font-size: 0.95rem;">${formatCurrency(d.totalRevenue)}</strong>
                <span style="font-size: 0.75rem; color: var(--text-dim); margin-left: 0.35rem;">(${d.totalBottlesSold} bottles)</span>
              </div>
            </div>
            <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">${chips}</div>
          </div>
        `;
      }).join('');
    }

    // 3. Vendor Orders Table in Report
    const rTableBody = document.getElementById('reportVendorsTableBody');
    if (vendors.length === 0) {
      rTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No vendor orders found for selected period.</td></tr>';
    } else {
      rTableBody.innerHTML = vendors.map(v => {
        const bottleBadges = (v.bottles || []).map(b => `
          <span class="badge badge-bottle">${b.quantity}x ${b.bottleSize || 'Bottle'}</span>
        `).join(' ') || '-';

        return `
          <tr>
            <td style="font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-muted);">${formatDate(v.createdAt)}</td>
            <td><strong style="color: #fff;">${v.name}</strong></td>
            <td>${bottleBadges}</td>
            <td>${formatCurrency(v.subTotal)}</td>
            <td><span class="badge badge-gst">+${formatCurrency(v.gstAmount)}</span></td>
            <td><strong style="color: var(--accent-emerald);">${formatCurrency(v.grandTotal)}</strong></td>
            <td>
              <button class="btn btn-secondary btn-sm report-view-bill-btn" data-id="${v._id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                Bill
              </button>
            </td>
          </tr>
        `;
      }).join('');

      rTableBody.querySelectorAll('.report-view-bill-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          let vendor = state.vendors.find(v => v._id === btn.dataset.id);
          if (!vendor && vendors) vendor = vendors.find(v => v._id === btn.dataset.id);
          if (vendor) {
            openInvoiceModal(vendor);
          }
        });
      });
    }

    // Pagination
    const totalPages = pagination.totalPages || 1;
    const curPage = pagination.currentPage || 1;
    document.getElementById('reportPageIndicator').textContent = `Page ${curPage} of ${totalPages} (${pagination.totalVendors || 0} orders)`;
    document.getElementById('reportPrevPageBtn').disabled = curPage <= 1;
    document.getElementById('reportNextPageBtn').disabled = curPage >= totalPages;
  }

  // =========================================================================
  // API EXPLORER & LIVE SHOWCASE TAB
  // =========================================================================
  const ENDPOINT_SPECS = [
    // Auth Group
    {
      group: 'auth',
      method: 'GET',
      path: '/api/auth/users',
      desc: 'List all registered user accounts from MongoDB database.',
      authRequired: false,
      sampleBody: null
    },
    {
      group: 'auth',
      method: 'POST',
      path: '/api/auth/signup',
      desc: 'Register a new user account with secure password hashing.',
      authRequired: false,
      sampleBody: {
        name: "New Account",
        email: "newuser@example.com",
        mobileNo: "9876543210",
        password: "password123",
        confirmPassword: "password123"
      }
    },
    {
      group: 'auth',
      method: 'POST',
      path: '/api/auth/login',
      desc: 'Authenticate user credentials & retrieve JWT Bearer token.',
      authRequired: false,
      sampleBody: {
        email: "test@gmail.com",
        password: "123456"
      }
    },

    // Bottle Catalog Group
    {
      group: 'bottle',
      method: 'GET',
      path: '/api/bottle/all',
      desc: 'Fetch all bottle sizes and pricing belonging to the authenticated user.',
      authRequired: true,
      sampleBody: null
    },
    {
      group: 'bottle',
      method: 'POST',
      path: '/api/bottle/add',
      desc: 'Create a new bottle product (e.g. 200ML, 1L, 20L).',
      authRequired: true,
      sampleBody: {
        name: "Eco Pure Bottle",
        size: "1000ML",
        price: 35
      }
    },
    {
      group: 'bottle',
      method: 'GET',
      path: '/api/bottle/:id',
      desc: 'Retrieve single bottle details by MongoDB ID.',
      authRequired: true,
      hasIdParam: true,
      sampleId: '6ac8bce0b875b474873ae3fc'
    },
    {
      group: 'bottle',
      method: 'PUT',
      path: '/api/bottle/update/:id',
      desc: 'Update bottle specifications or unit price.',
      authRequired: true,
      hasIdParam: true,
      sampleId: '6ac8bce0b875b474873ae3fc',
      sampleBody: {
        name: "Eco Pure Bottle Premium",
        size: "1000ML",
        price: 40
      }
    },
    {
      group: 'bottle',
      method: 'DELETE',
      path: '/api/bottle/delete/:id',
      desc: 'Delete bottle from user inventory.',
      authRequired: true,
      hasIdParam: true,
      sampleId: '6ac8bce0b875b474873ae3fc'
    },

    // Vendors Group
    {
      group: 'vendor',
      method: 'GET',
      path: '/api/vendor/all',
      desc: 'Fetch all commercial vendors with populated bottle line items and order totals.',
      authRequired: true,
      sampleBody: null
    },
    {
      group: 'vendor',
      method: 'POST',
      path: '/api/vendor/add',
      desc: 'Create vendor, automatically resolve bottle IDs to fetch price/size, and calculate GST.',
      authRequired: true,
      sampleBody: {
        name: "Sunrise Mart",
        email: "sunrise@mart.com",
        mobileNo: "9876501234",
        address: "42 Market Street, Gandhinagar",
        gstNumber: "24AAACS1122D1Z8",
        gstPercentage: 18,
        bottles: [
          { bottleId: "6ac8bce0b875b474873ae3fc", quantity: 50 },
          { bottleId: "6ac8bf2e6505905cf972792f", quantity: 5 }
        ]
      }
    },
    {
      group: 'vendor',
      method: 'GET',
      path: '/api/vendor/:id',
      desc: 'Get vendor details and tax bill by MongoDB ID.',
      authRequired: true,
      hasIdParam: true,
      sampleId: '6ac8c05c6505905cf9727933'
    },
    {
      group: 'vendor',
      method: 'PUT',
      path: '/api/vendor/update/:id',
      desc: 'Update vendor information and recalculate bottle totals and GST automatically.',
      authRequired: true,
      hasIdParam: true,
      sampleId: '6ac8c05c6505905cf9727933',
      sampleBody: {
        name: "Shree General Store (Updated)",
        gstPercentage: 18,
        bottles: [
          { bottleId: "6ac8bce0b875b474873ae3fc", quantity: 30 }
        ]
      }
    },
    {
      group: 'vendor',
      method: 'DELETE',
      path: '/api/vendor/delete/:id',
      desc: 'Delete vendor and associated transaction records.',
      authRequired: true,
      hasIdParam: true,
      sampleId: '6ac8c05c6505905cf9727933'
    },

    // Reports Group
    {
      group: 'report',
      method: 'GET',
      path: '/api/report/sales?period=daily',
      desc: 'Sales Analytics engine with date-wise & bottle-wise breakdown, subtotal, and GST metrics.',
      authRequired: true,
      sampleBody: null
    }
  ];

  function renderApiShowcase() {
    const container = document.getElementById('apiEndpointsShowcaseContainer');
    const activeFilter = document.querySelector('#apiRouteFilterGroup .period-btn.active').dataset.filter;

    const filtered = ENDPOINT_SPECS.filter(spec => activeFilter === 'all' || spec.group === activeFilter);

    container.innerHTML = filtered.map((spec, idx) => {
      const methodLower = spec.method.toLowerCase();
      const cardId = `apiCard_${idx}`;

      return `
        <div class="api-card" id="${cardId}">
          <div class="api-card-header" onclick="document.getElementById('${cardId}').classList.toggle('open')">
            <div class="api-route-meta">
              <span class="badge-method ${methodLower}">${spec.method}</span>
              <span class="api-path">${spec.path}</span>
              <span class="api-desc">• ${spec.desc}</span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center;">
              ${spec.authRequired ? '<span class="badge" style="background: rgba(99,102,241,0.15); color: #818cf8;">🔒 Bearer JWT</span>' : '<span class="badge" style="background: rgba(16,185,129,0.15); color: #10b981;">Public</span>'}
              <button class="btn btn-secondary btn-sm" style="pointer-events: none;">Expand &#9662;</button>
            </div>
          </div>

          <div class="api-card-body">
            <div style="margin-bottom: 1rem;">
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">${spec.desc}</p>
            </div>

            ${spec.hasIdParam ? `
              <div class="form-group">
                <label class="form-label" style="font-size: 0.75rem;">URL ID Parameter (:id)</label>
                <input type="text" class="form-control" id="${cardId}_idParam" value="${spec.sampleId || (state.bottles[0] && state.bottles[0]._id) || ''}" style="font-family: var(--font-mono); font-size: 0.85rem;">
              </div>
            ` : ''}

            ${spec.sampleBody ? `
              <div class="form-group">
                <label class="form-label" style="font-size: 0.75rem;">Request Body JSON</label>
                <textarea class="form-control" id="${cardId}_body" rows="6" style="font-family: var(--font-mono); font-size: 0.8rem; background: #080c14;">${JSON.stringify(spec.sampleBody, null, 2)}</textarea>
              </div>
            ` : ''}

            <div style="display: flex; gap: 0.75rem; align-items: center; margin: 1rem 0;">
              <button class="btn btn-primary btn-sm run-api-btn" data-index="${idx}" id="${cardId}_runBtn">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                Send API Request
              </button>
              <div id="${cardId}_statusBadge"></div>
            </div>

            <!-- Response Panel -->
            <div id="${cardId}_responseWrap" style="display: none;">
              <div style="font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; margin-bottom: 0.35rem;">
                Live HTTP Response
              </div>
              <pre class="code-viewer" id="${cardId}_responsePre"></pre>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach run triggers
    container.querySelectorAll('.run-api-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const idx = Number(btn.dataset.index);
        const spec = filtered[idx];
        const cardId = `apiCard_${idx}`;
        await executeApiShowcaseCall(spec, cardId);
      });
    });
  }

  async function executeApiShowcaseCall(spec, cardId) {
    const runBtn = document.getElementById(`${cardId}_runBtn`);
    const statusBadge = document.getElementById(`${cardId}_statusBadge`);
    const respWrap = document.getElementById(`${cardId}_responseWrap`);
    const respPre = document.getElementById(`${cardId}_responsePre`);

    runBtn.disabled = true;
    runBtn.textContent = 'Executing...';
    statusBadge.innerHTML = '<span class="badge badge-gst">Sending...</span>';

    let endpoint = spec.path;
    if (spec.hasIdParam) {
      const idVal = document.getElementById(`${cardId}_idParam`).value.trim();
      endpoint = endpoint.replace(':id', idVal);
    }

    let body = null;
    if (spec.sampleBody) {
      try {
        const rawBody = document.getElementById(`${cardId}_body`).value;
        body = JSON.parse(rawBody);
      } catch (e) {
        showToast('Invalid JSON in request body', 'error');
        runBtn.disabled = false;
        runBtn.textContent = 'Send API Request';
        return;
      }
    }

    try {
      const startTime = performance.now();
      const res = await API.rawRequest(endpoint, {
        method: spec.method,
        body
      });
      const ms = Math.round(performance.now() - startTime);

      statusBadge.innerHTML = `<span class="badge badge-success">✓ 200 OK (${ms}ms)</span>`;
      respWrap.style.display = 'block';
      respPre.textContent = JSON.stringify(res, null, 2);
      showToast(`API ${spec.method} ${spec.path} succeeded!`);

      // If login or signup was called through API tester, update user state
      if (spec.path === '/api/auth/login' && res.token) {
        state.user = res.user;
        renderAuthNavbar();
        loadInitialData();
      }
    } catch (err) {
      statusBadge.innerHTML = `<span class="badge badge-method delete">✗ ${err.status || 'ERR'}</span>`;
      respWrap.style.display = 'block';
      respPre.textContent = JSON.stringify(err.data || { error: err.message }, null, 2);
      showToast(`API call returned error: ${err.message}`, 'error');
    } finally {
      runBtn.disabled = false;
      runBtn.textContent = 'Send API Request';
    }
  }

  document.querySelectorAll('#apiRouteFilterGroup .period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#apiRouteFilterGroup .period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderApiShowcase();
    });
  });

  // =========================================================================
  // LIVE API NETWORK DRAWER
  // =========================================================================
  toggleApiDrawerBtn.addEventListener('click', () => {
    apiDrawer.classList.toggle('open');
  });

  minimizeDrawerBtn.addEventListener('click', () => {
    apiDrawer.classList.remove('open');
  });

  clearApiLogsBtn.addEventListener('click', () => {
    apiDrawerBody.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 2rem;">No network activity.</div>';
    apiLogCountBadge.textContent = '0';
  });

  // Intercept and display all network calls in real time
  API.onActivity((latest, allLogs) => {
    apiLogCountBadge.textContent = allLogs.length;

    if (allLogs.length === 0) {
      apiDrawerBody.innerHTML = '<div style="color: var(--text-dim); text-align: center; padding: 2rem;">No network activity yet.</div>';
      return;
    }

    apiDrawerBody.innerHTML = allLogs.map(log => {
      const statusClass = typeof log.status === 'number' && log.status < 300 ? 's2xx' : (log.status < 500 ? 's4xx' : 's5xx');
      const methodClass = (log.method || 'GET').toLowerCase();

      return `
        <div class="log-item">
          <div class="log-header">
            <div>
              <span class="badge-method ${methodClass}" style="font-size: 0.65rem; padding: 0.1rem 0.35rem;">${log.method}</span>
              <strong style="color: #fff; margin-left: 0.35rem;">${log.endpoint}</strong>
            </div>
            <div>
              <span class="log-status ${statusClass}">${log.status}</span>
              <span class="log-time" style="margin-left: 0.5rem;">${log.durationMs}ms</span>
            </div>
          </div>
          <div style="font-size: 0.7rem; color: var(--text-dim);">${log.timestamp}</div>
        </div>
      `;
    }).join('');
  });

  // =========================================================================
  // INITIALIZATION
  // =========================================================================
  async function loadInitialData() {
    if (state.user) {
      await Promise.allSettled([
        loadBottles(),
        loadVendors(),
        loadReports()
      ]);
    }
  }

  // Set today's date in report filter
  const todayStr = new Date().toISOString().split('T')[0];
  reportDateInput.value = todayStr;
  state.reportFilter.date = todayStr;

  renderAuthNavbar();
  renderApiShowcase();
  loadDatabaseUsers();

  if (state.user) {
    loadInitialData();
  } else {
    // Open auth modal if not authenticated
    openModal(authModal);
  }
});
