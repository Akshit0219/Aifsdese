// ═══════════════════════════════════════════════════════════════
//  Smart Complaint Management System – Frontend App Logic
// ═══════════════════════════════════════════════════════════════

const API = '/api';

function getStoredUser() {
  try {
    const data = localStorage.getItem('sg_user');
    return data && data !== 'undefined' ? JSON.parse(data) : null;
  } catch (e) {
    return null;
  }
}

// ── State ──────────────────────────────────────────────────────
let state = {
  token: localStorage.getItem('sg_token'),
  user: getStoredUser(),
  complaints: [],
  currentView: 'home',
  activeFilter: 'all',
  searchQuery: '',
  editingId: null
};

// ── Icons (Lucide) Initialization ──────────────────────────────
function renderIcons() {
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ── Init ───────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  setupListeners();
  
  if (state.token && state.user) {
    showApp();
    loadView('home');
  } else {
    showAuth('login');
  }
  
  renderIcons();
});

// ═══════════════════════════════════════════════════════════════
//  EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════
function setupListeners() {
  // Auth navigation
  $('go-to-register').addEventListener('click', () => showAuth('register'));
  $('go-to-login').addEventListener('click', () => showAuth('login'));

  // Auth forms
  $('login-form').addEventListener('submit', handleLogin);
  $('register-form').addEventListener('submit', handleRegister);

  // User menu
  $('user-menu-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('user-dropdown').classList.toggle('hidden');
  });
  document.addEventListener('click', () => {
    $('user-dropdown').classList.add('hidden');
  });
  $('logout-btn').addEventListener('click', logout);

  // Navigation
  $('nav-logo').addEventListener('click', (e) => { e.preventDefault(); loadView('home'); });
  $('nav-home').addEventListener('click', () => loadView('home'));
  $('nav-search').addEventListener('click', () => loadView('search'));
  $('nav-my-complaints').addEventListener('click', () => loadView('my-complaints'));
  $('nav-admin-dashboard').addEventListener('click', () => loadView('admin'));
  $('nav-new-complaint').addEventListener('click', openComplaintModal);

  // Search
  let searchTimeout;
  $('global-search').addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    state.searchQuery = e.target.value.trim();
    searchTimeout = setTimeout(() => {
      if (state.currentView === 'search') {
        renderSearchContent();
      } else if (state.searchQuery) {
        loadView('search');
      }
    }, 300);
  });

  // Modal
  $('close-complaint-modal').addEventListener('click', closeModal);
  $('cancel-complaint').addEventListener('click', closeModal);
  $('complaint-form').addEventListener('submit', handleComplaintSubmit);
}

// ═══════════════════════════════════════════════════════════════
//  AUTH HANDLERS
// ═══════════════════════════════════════════════════════════════
async function handleLogin(e) {
  e.preventDefault();
  const btn = $('login-btn');
  const email = $('login-email').value;
  const password = $('login-password').value;

  setLoading(btn, true, 'LOGGING IN...');
  try {
    const res = await apiFetch('/login', 'POST', { email, password });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');

    saveSession(data);
    showApp();
    loadView('home');
    toast('Welcome back!', 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading(btn, false, 'LOG IN');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const btn = $('register-btn');
  const name = $('reg-name').value;
  const email = $('reg-email').value;
  const password = $('reg-password').value;

  setLoading(btn, true, 'SIGNING UP...');
  try {
    const res = await apiFetch('/register', 'POST', { name, email, password });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');

    saveSession(data);
    showApp();
    loadView('home');
    toast('Account created!', 'success');
  } catch (err) {
    toast(err.message, 'error');
  } finally {
    setLoading(btn, false, 'SIGN UP');
  }
}

function logout() {
  state.token = null;
  state.user = null;
  localStorage.removeItem('sg_token');
  localStorage.removeItem('sg_user');
  showAuth('login');
}

// ═══════════════════════════════════════════════════════════════
//  DATA FETCHING
// ═══════════════════════════════════════════════════════════════
async function fetchComplaints(query = '') {
  try {
    const endpoint = query ? `/complaints/search?q=${encodeURIComponent(query)}` : '/complaints';
    const res = await apiFetch(endpoint, 'GET');
    if (res.status === 401) { logout(); return []; }
    const data = await res.json();
    return data.complaints || [];
  } catch (err) {
    toast('Failed to load data', 'error');
    return [];
  }
}

async function fetchComplaintDetails(id) {
  try {
    const res = await apiFetch(`/complaints/${id}`, 'GET');
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || data.message || 'Complaint not found');
    return data.complaint;
  } catch (err) {
    toast(err.message, 'error');
    return null;
  }
}

async function runAIAnalysis(id) {
  try {
    const res = await apiFetch(`/complaints/${id}/analyze`, 'POST');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message);
    toast('AI Analysis Complete', 'success');
    return data.analysis;
  } catch (err) {
    toast('AI Analysis failed', 'error');
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
//  VIEW ROUTER
// ═══════════════════════════════════════════════════════════════
async function loadView(viewName, params = null) {
  state.currentView = viewName;
  updateNavState(viewName);
  const container = $('view-container');
  container.innerHTML = '<div style="display:flex;justify-content:center;padding:100px;"><i data-lucide="loader-2" class="lucide-spin" style="width:48px;height:48px;color:var(--text-sub);"></i></div>';
  renderIcons();

  // Keep search bar always visible
  $('topbar-search').classList.remove('hidden');

  try {
    switch (viewName) {
      case 'home':
        await renderHomeView(container);
        break;
      case 'search':
        await renderSearchContent(container);
        break;
      case 'my-complaints':
        await renderMyComplaintsView(container);
        break;
      case 'admin':
        if (state.user.role !== 'admin') { loadView('home'); return; }
        await renderAdminView(container);
        break;
      case 'detail':
        await renderDetailView(container, params.id);
        break;
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = '<div class="empty-state"><i data-lucide="alert-triangle" class="empty-icon"></i><div class="empty-title">Error loading view</div></div>';
  }
  renderIcons();
}

// ═══════════════════════════════════════════════════════════════
//  VIEW RENDERERS
// ═══════════════════════════════════════════════════════════════

// ── Home View ──────────────────────────────────────────────────
async function renderHomeView(container) {
  const allComplaints = await fetchComplaints();
  const displayComplaints = allComplaints;
  
  const greeting = getGreeting();
  const hour = new Date().getHours();
  const greetEmoji = hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙';

  const pending   = allComplaints.filter(c => c.status === 'Pending').length;
  const progress  = allComplaints.filter(c => c.status === 'In Progress').length;
  const resolved  = allComplaints.filter(c => c.status === 'Resolved').length;
  const critical  = allComplaints.filter(c => c.aiAnalysis?.urgency === 'Critical').length;

  let html = `
    <div class="hero-gradient" style="padding: 32px 24px 28px;">
      <div class="hero-info">
        <span class="hero-type">Dashboard</span>
        <h1 class="hero-title" style="font-size:48px;">${greetEmoji} ${greeting}, ${escapeHtml(state.user.name.split(' ')[0])}!</h1>
        <div class="hero-meta">Smart Complaint Management System &nbsp;•&nbsp; ${new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
      </div>
    </div>

    <div style="padding: 0 24px;">
      <div class="stats-grid" style="margin-top:28px;">
        <div class="stat-card accent-green">
          <div class="stat-card-label">Total Complaints</div>
          <div class="stat-card-value">${allComplaints.length}</div>
        </div>
        <div class="stat-card accent-yellow">
          <div class="stat-card-label">Pending</div>
          <div class="stat-card-value" style="color:var(--status-pending);">${pending}</div>
        </div>
        <div class="stat-card accent-blue">
          <div class="stat-card-label">In Progress</div>
          <div class="stat-card-value" style="color:var(--status-progress);">${progress}</div>
        </div>
        <div class="stat-card accent-green">
          <div class="stat-card-label">Resolved</div>
          <div class="stat-card-value" style="color:var(--primary);">${resolved}</div>
        </div>
        ${critical > 0 ? `<div class="stat-card accent-red">
          <div class="stat-card-label">AI Critical</div>
          <div class="stat-card-value" style="color:var(--urgency-critical);">${critical}</div>
        </div>` : ''}
      </div>

      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;">
        <h2 class="section-title" style="margin-bottom:0;">Recent Activity</h2>
        <button class="btn btn-outline btn-small" onclick="openComplaintModal()">+ File Complaint</button>
      </div>
      ${renderTrackList(displayComplaints.slice(0, 10))}
    </div>
  `;

  container.innerHTML = html;
  attachListListeners(container);
}

// ── Search View ────────────────────────────────────────────────
async function renderSearchContent(container = $('view-container')) {
  if (!state.searchQuery) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search" class="empty-icon"></i>
        <div class="empty-title">Search Complaints</div>
        <div class="empty-desc">Type in the search bar above to find complaints by title, location, or description.</div>
      </div>
    `;
    renderIcons();
    setTimeout(() => { const s = $('global-search'); if(s) s.focus(); }, 50);
    return;
  }

  container.innerHTML = '<div style="display:flex;justify-content:center;padding:40px;"><i data-lucide="loader-2" class="lucide-spin" style="width:32px;height:32px;color:var(--text-sub);"></i></div>';
  renderIcons();

  const results = await fetchComplaints(state.searchQuery);

  if (results.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i data-lucide="search-x" class="empty-icon"></i>
        <div class="empty-title">No results for "${escapeHtml(state.searchQuery)}"</div>
        <div class="empty-desc">Try different keywords — search by title, location, or description.</div>
      </div>
    `;
    renderIcons();
    return;
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <h2 class="section-title" style="margin-bottom:0;">
        Results for <span style="color:var(--primary);">"${escapeHtml(state.searchQuery)}"</span>
      </h2>
      <span style="color:var(--text-sub);font-size:14px;">${results.length} found</span>
    </div>
    ${renderTrackList(results)}
  `;
  attachListListeners(container);
  renderIcons();
}


// ── My Complaints ──────────────────────────────────────────────
async function renderMyComplaintsView(container) {
  const allComplaints = await fetchComplaints();
  // Show complaints filed by this user OR unassigned complaints
  const myComplaints = allComplaints.filter(c => !c.user || (c.user && c.user._id === state.user.id));

  let html = `
    <div class="hero-gradient" style="background: linear-gradient(180deg, rgba(29, 185, 84, 0.4) 0%, var(--bg-elevated) 100%); margin-bottom:0;">
      <div class="hero-icon" style="background: linear-gradient(135deg, #1db954, #1ed760);">
        <i data-lucide="folder-user" style="width:80px; height:80px; color:black;"></i>
      </div>
      <div class="hero-info">
        <span class="hero-type">Collection</span>
        <h1 class="hero-title">My Complaints</h1>
        <div class="hero-meta">${state.user.name} • ${myComplaints.length} issues filed</div>
      </div>
    </div>
    
    <div class="action-row">
      <button class="play-btn-large" id="page-new-complaint-btn" title="File New">
        <i data-lucide="plus" style="width:32px; height:32px;"></i>
      </button>
    </div>
  `;

  if (myComplaints.length === 0) {
    html += `
      <div class="empty-state">
        <div class="empty-title">You haven't filed any complaints</div>
        <div class="empty-desc">When you file a complaint, it will appear here so you can track its status.</div>
      </div>
    `;
  } else {
    html += renderTrackList(myComplaints);
  }

  container.innerHTML = html;
  attachListListeners(container);
  if ($('page-new-complaint-btn')) {
    $('page-new-complaint-btn').addEventListener('click', openComplaintModal);
  }
}

// ── Admin Dashboard ────────────────────────────────────────────
async function renderAdminView(container) {
  const allComplaints = await fetchComplaints();

  const pending  = allComplaints.filter(c => c.status === 'Pending').length;
  const progress = allComplaints.filter(c => c.status === 'In Progress').length;
  const resolved = allComplaints.filter(c => c.status === 'Resolved').length;
  const rejected = allComplaints.filter(c => c.status === 'Rejected').length;
  const critical = allComplaints.filter(c => c.aiAnalysis?.urgency === 'Critical').length;

  let html = `
    <h1 class="view-title" style="padding:0 0 4px;">⚙️ Admin Dashboard</h1>

    <div class="stats-grid">
      <div class="stat-card accent-green">
        <div class="stat-card-label">Total</div>
        <div class="stat-card-value">${allComplaints.length}</div>
      </div>
      <div class="stat-card accent-yellow">
        <div class="stat-card-label">Pending</div>
        <div class="stat-card-value" style="color:var(--status-pending);">${pending}</div>
      </div>
      <div class="stat-card accent-blue">
        <div class="stat-card-label">In Progress</div>
        <div class="stat-card-value" style="color:var(--status-progress);">${progress}</div>
      </div>
      <div class="stat-card accent-green">
        <div class="stat-card-label">Resolved</div>
        <div class="stat-card-value" style="color:var(--primary);">${resolved}</div>
      </div>
      <div class="stat-card accent-red">
        <div class="stat-card-label">Rejected</div>
        <div class="stat-card-value" style="color:var(--urgency-critical);">${rejected}</div>
      </div>
      ${critical ? `<div class="stat-card accent-red">
        <div class="stat-card-label">🔴 AI Critical</div>
        <div class="stat-card-value" style="color:var(--urgency-critical);">${critical}</div>
      </div>` : ''}
    </div>

    <div class="filter-row" id="admin-filters">
      <button class="filter-chip active" data-filter="all">All (${allComplaints.length})</button>
      <button class="filter-chip" data-filter="Pending">Pending (${pending})</button>
      <button class="filter-chip" data-filter="In Progress">In Progress (${progress})</button>
      <button class="filter-chip" data-filter="Resolved">Resolved (${resolved})</button>
      <button class="filter-chip" data-filter="Rejected">Rejected (${rejected})</button>
      ${critical ? `<button class="filter-chip" data-filter="critical">🔴 Critical (${critical})</button>` : ''}
    </div>
    <div id="admin-list-container">
      ${renderTrackList(allComplaints)}
    </div>
  `;

  container.innerHTML = html;

  const listContainer = $('admin-list-container');
  container.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      container.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const f = e.target.dataset.filter;
      let filtered = allComplaints;
      if (f === 'critical') filtered = allComplaints.filter(c => c.aiAnalysis?.urgency === 'Critical');
      else if (f !== 'all') filtered = allComplaints.filter(c => c.status === f);
      listContainer.innerHTML = renderTrackList(filtered);
      attachListListeners(listContainer);
      renderIcons();
    });
  });

  attachListListeners(listContainer);
}

// ── Detail View ────────────────────────────────────────────────
async function renderDetailView(container, id) {
  const c = await fetchComplaintDetails(id);
  if (!c) { loadView('home'); return; }

  const isOwner = c.user && state.user.id === c.user._id;
  const isAdmin = state.user.role === 'admin';
  const canEdit = isOwner || isAdmin;
  
  const dateStr = new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const statusClass = `status-${c.status.toLowerCase().replace(' ', '-')}`;

  let html = `
    <div class="hero-gradient" style="margin-bottom:0;">
      <div class="hero-icon">
        <i data-lucide="file-text" style="width:64px; height:64px; color:var(--text-sub);"></i>
      </div>
      <div class="hero-info">
        <span class="hero-type">Complaint</span>
        <h1 class="hero-title line-clamp-2" style="font-size:48px; max-width:800px;">${escapeHtml(c.title)}</h1>
        <div class="hero-meta" style="display:flex; align-items:center; gap:12px;">
          <span style="color:white; font-weight:700;">${escapeHtml(c.user ? c.user.name : c.name || 'Unknown')}</span>
          <span>•</span>
          <span>${dateStr}</span>
          <span>•</span>
          <span class="status-badge ${statusClass}">${c.status}</span>
        </div>
      </div>
    </div>
    
    <div class="action-row">
      ${canEdit ? `
        <button class="btn btn-outline" style="border-radius:500px;" id="detail-edit-btn">Edit</button>
      ` : ''}
      ${isAdmin ? `
        <button class="btn btn-primary" style="border-radius:500px; margin-left:16px;" id="detail-analyze-btn">
          <i data-lucide="cpu" style="width:16px;height:16px;"></i> Run AI Analysis
        </button>
        <button class="btn btn-outline" style="border-radius:500px; margin-left:16px;" id="detail-delete-btn">Delete</button>
      ` : ''}
    </div>

    <div class="detail-grid" style="padding: 0 24px;">
      <div class="detail-main">
        <div class="info-card">
          <h3 class="info-card-title">Description</h3>
          <p style="white-space:pre-wrap; color:var(--text-sub);">${escapeHtml(c.description)}</p>
        </div>
        
        <div id="ai-results-container">
          ${c.aiAnalysis && c.aiAnalysis.analyzedAt ? renderAICard(c.aiAnalysis) : ''}
        </div>
      </div>
      
      <div class="detail-sidebar">
        <div class="info-card">
          <h3 class="info-card-title">Details</h3>
          
          <div style="margin-bottom:16px;">
            <div style="font-size:12px; color:var(--text-sub); margin-bottom:4px;">Category</div>
            <div style="font-weight:500;">${c.category}</div>
          </div>
          
          <div style="margin-bottom:16px;">
            <div style="font-size:12px; color:var(--text-sub); margin-bottom:4px;">Location</div>
            <div style="font-weight:500;">${escapeHtml(c.location)}</div>
          </div>
          
          <div>
            <div style="font-size:12px; color:var(--text-sub); margin-bottom:4px;">Contact</div>
            <div style="font-weight:500;">${escapeHtml(c.email)}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  container.innerHTML = html;

  // Listeners
  if ($('detail-edit-btn')) {
    $('detail-edit-btn').addEventListener('click', () => openComplaintModal(c));
  }
  if ($('detail-analyze-btn')) {
    $('detail-analyze-btn').addEventListener('click', async () => {
      const btn = $('detail-analyze-btn');
      setLoading(btn, true, 'Analyzing...');
      const analysis = await runAIAnalysis(c._id);
      if (analysis) {
        $('ai-results-container').innerHTML = renderAICard(analysis);
        renderIcons();
      }
      setLoading(btn, false, '<i data-lucide="cpu" style="width:16px;height:16px;"></i> Run AI Analysis');
      renderIcons();
    });
  }
  if ($('detail-delete-btn')) {
    $('detail-delete-btn').addEventListener('click', async () => {
      if(confirm('Are you sure you want to delete this complaint?')) {
        try {
          const res = await apiFetch(`/complaints/${c._id}`, 'DELETE');
          if(res.ok) {
            toast('Deleted successfully', 'success');
            loadView('home');
          }
        } catch(e) { toast('Delete failed', 'error'); }
      }
    });
  }
}

// ── Components ─────────────────────────────────────────────────
function renderTrackList(list) {
  if (list.length === 0) return `<div style="color:var(--text-sub); padding:16px;">No items found.</div>`;

  let html = `
    <div class="list-header">
      <div class="item-col" style="align-items:center;">#</div>
      <div class="item-col">Title</div>
      <div class="item-col">Category</div>
      <div class="item-col">Date</div>
      <div class="item-col">Status</div>
      <div class="item-col">Urgency</div>
    </div>
  `;

  list.forEach((c, i) => {
    const date = new Date(c.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const statusClass = `status-${c.status.toLowerCase().replace(' ', '-')}`;
    
    let urgencyBadge = '<span style="color:var(--text-sub);font-size:12px;">Unanalyzed</span>';
    if (c.aiAnalysis && c.aiAnalysis.urgency) {
      urgencyBadge = `<span class="urgency-badge urgency-${c.aiAnalysis.urgency}">${c.aiAnalysis.urgency}</span>`;
    }

    html += `
      <div class="list-item" data-id="${c._id}">
        <div class="item-col item-index-wrap">
          <span class="item-index">${i + 1}</span>
          <i data-lucide="play" class="item-play"></i>
        </div>
        <div class="item-col truncate">
          <div class="item-title truncate">${escapeHtml(c.title)}</div>
          <div class="item-desc truncate">${escapeHtml(c.user ? c.user.name : (c.name || 'Unknown'))} • ${escapeHtml(c.location)}</div>
        </div>
        <div class="item-col item-category truncate">${c.category}</div>
        <div class="item-col item-date truncate">${date}</div>
        <div class="item-col">
          <span class="status-badge ${statusClass}">${c.status}</span>
        </div>
        <div class="item-col">
          ${urgencyBadge}
        </div>
      </div>
    `;
  });

  return html;
}

function renderAICard(ai) {
  return `
    <div class="ai-card">
      <div class="ai-card-header">
        <i data-lucide="sparkles" style="width:20px;height:20px;"></i> AI Analysis Results
      </div>
      
      <div class="ai-stat-grid">
        <div class="ai-stat">
          <div class="ai-stat-label">Detected Urgency</div>
          <div class="ai-stat-value"><span class="urgency-badge urgency-${ai.urgency}">${ai.urgency}</span></div>
        </div>
        <div class="ai-stat">
          <div class="ai-stat-label">Suggested Department</div>
          <div class="ai-stat-value">${ai.suggestedDepartment || 'N/A'}</div>
        </div>
      </div>

      <div class="ai-text-block">
        <div class="ai-text-title">AI Summary</div>
        <div class="ai-text-content">${ai.summary}</div>
      </div>

      <div class="ai-text-block">
        <div class="ai-text-title">Auto-Generated Response</div>
        <div class="ai-text-content" style="font-style:italic;">"${ai.autoResponse}"</div>
      </div>
    </div>
  `;
}

function attachListListeners(container) {
  container.querySelectorAll('.list-item').forEach(el => {
    el.addEventListener('click', () => {
      loadView('detail', { id: el.dataset.id });
    });
  });
}

// ═══════════════════════════════════════════════════════════════
//  MODALS & FORMS
// ═══════════════════════════════════════════════════════════════
function openComplaintModal(data = null) {
  // If event object passed instead of data
  if (data && data.target) data = null; 
  
  state.editingId = data ? data._id : null;
  const isEdit = !!state.editingId;
  const isAdmin = state.user.role === 'admin';

  $('complaint-modal-title').textContent = isEdit ? 'Edit Complaint' : 'File a Complaint';
  $('c-title').value = data ? data.title : '';
  $('c-category').value = data ? data.category : '';
  $('c-location').value = data ? data.location : '';
  $('c-desc').value = data ? data.description : '';

  // Only admin can change status directly from edit modal
  if (isEdit && isAdmin) {
    $('c-status-group').classList.remove('hidden');
    $('c-status').value = data.status;
  } else {
    $('c-status-group').classList.add('hidden');
  }

  $('complaint-modal').classList.remove('hidden');
}

function closeModal() {
  $('complaint-modal').classList.add('hidden');
  $('complaint-form').reset();
  state.editingId = null;
}

async function handleComplaintSubmit(e) {
  e.preventDefault();
  const btn = $('save-complaint-btn');
  const isEdit = !!state.editingId;
  
  const payload = {
    title: $('c-title').value.trim(),
    category: $('c-category').value,
    location: $('c-location').value.trim(),
    description: $('c-desc').value.trim(),
    // Fallback info since we don't ask for it in the UI anymore but API expects it
    name: state.user.name,
    email: state.user.email
  };

  if (isEdit && state.user.role === 'admin') {
    payload.status = $('c-status').value;
  }

  setLoading(btn, true, 'Saving...');
  try {
    const endpoint = isEdit ? `/complaints/${state.editingId}` : '/complaints';
    const method = isEdit ? 'PUT' : 'POST';
    
    const res = await apiFetch(endpoint, method, payload);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to save');

    closeModal();
    toast(isEdit ? 'Updated successfully' : 'Complaint filed', 'success');
    
    // Refresh current view
    if (state.currentView === 'detail') loadView('detail', { id: state.editingId });
    else loadView(state.currentView);
    
  } catch(err) {
    toast(err.message, 'error');
  } finally {
    setLoading(btn, false, 'Save');
  }
}

// ═══════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════
function $(id) { return document.getElementById(id); }

function showAuth(view) {
  $('app-section').classList.add('hidden');
  $('auth-section').classList.remove('hidden');
  
  if (view === 'login') {
    $('auth-title').textContent = 'Log in to continue.';
    $('login-form').classList.remove('hidden');
    $('register-form').classList.add('hidden');
    $('login-switch-wrap').classList.remove('hidden');
    $('register-switch-wrap').classList.add('hidden');
  } else {
    $('auth-title').textContent = 'Sign up to start.';
    $('login-form').classList.add('hidden');
    $('register-form').classList.remove('hidden');
    $('login-switch-wrap').classList.add('hidden');
    $('register-switch-wrap').classList.remove('hidden');
  }
}

function showApp() {
  $('auth-section').classList.add('hidden');
  $('app-section').classList.remove('hidden');
  
  $('user-name').textContent = state.user.name;
  $('user-avatar').textContent = state.user.name.charAt(0).toUpperCase();
  
  if (state.user.role === 'admin') {
    $('topbar-admin-badge').classList.remove('hidden');
    $('nav-admin-dashboard').classList.remove('hidden');
  }
}

function updateNavState(viewName) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  const map = {
    'home': 'nav-home',
    'search': 'nav-search',
    'my-complaints': 'nav-my-complaints',
    'admin': 'nav-admin-dashboard'
  };
  if (map[viewName]) {
    $(map[viewName]).classList.add('active');
  }
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function apiFetch(path, method, body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (state.token) opts.headers.Authorization = `Bearer ${state.token}`;
  if (body) opts.body = JSON.stringify(body);
  return fetch(API + path, opts);
}

function saveSession(data) {
  state.token = data.token;
  state.user = data.user;
  localStorage.setItem('sg_token', state.token);
  localStorage.setItem('sg_user', JSON.stringify(state.user));
}

function setLoading(btn, loading, text) {
  btn.disabled = loading;
  btn.innerHTML = loading ? `<i data-lucide="loader-2" class="lucide-spin" style="width:20px;height:20px;"></i> ${text}` : text;
  if(loading) renderIcons();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function toast(msg, type = 'info') {
  const root = $('toast-root');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  
  let icon = 'info';
  if(type === 'success') icon = 'check-circle';
  if(type === 'error') icon = 'alert-circle';
  
  el.innerHTML = `<i data-lucide="${icon}"></i> <span>${msg}</span>`;
  root.appendChild(el);
  renderIcons();
  
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

// Add simple CSS animation for spin locally
const style = document.createElement('style');
style.textContent = `
  @keyframes lucide-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  .lucide-spin { animation: lucide-spin 1s linear infinite; }
`;
document.head.appendChild(style);
