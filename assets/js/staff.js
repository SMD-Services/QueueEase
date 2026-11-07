/**
 * QueueEase Staff Operations Controller
 * assets/js/staff.js
 */

import { Store } from './store.js';
import { playChime, speakAnnouncement } from './signage.js';
import { showToast, openSheet, closeSheet, formatTime } from './ui.js';

const STAFF_SESSION_KEY = 'queueease_staff_session';

/* --------------------------------------------------------------------------
   1. Authentication & Session Management
   -------------------------------------------------------------------------- */
export function getStaffSession() {
  try {
    const raw = localStorage.getItem(STAFF_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function requireStaffAuth() {
  const session = getStaffSession();
  if (!session) {
    window.location.replace('../staff/index.html');
    return null;
  }
  return session;
}

export function staffLogin(username, password, deskId) {
  // Demo valid credentials: STF-4409 / civic123 or officer.jenkins / civic123
  const validUsernames = ['stf-4409', 'officer.jenkins', 'mark.jenkins', 'admin'];
  const isMatch = validUsernames.includes(username.trim().toLowerCase()) && password === 'civic123';

  if (!isMatch) {
    throw new Error('Invalid credentials. Use demo: STF-4409 / civic123');
  }

  const session = {
    staffId: 'STF-4409',
    name: 'Officer Mark Jenkins',
    role: 'Senior Registrar',
    deskId: deskId || 'cnt-2',
    counterNum: '02',
    room: 'Room 104',
    serviceId: 'srv-1',
    serviceName: 'Certificate Application',
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem(STAFF_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function staffLogout() {
  localStorage.removeItem(STAFF_SESSION_KEY);
  window.location.replace('../staff/index.html');
}

/* --------------------------------------------------------------------------
   2. Dashboard Shell Initialization (Sidebar Drawer & Profile)
   -------------------------------------------------------------------------- */
export function initDashboardShell(activePage = 'overview') {
  const session = requireStaffAuth();
  if (!session) return;

  // Active menu link auto-sync matching file name
  try {
    const currentFile = window.location.pathname.split('/').pop() || 'dashboard.html';
    const links = document.querySelectorAll('.dashboard-sidebar__nav .dashboard-nav-link');
    links.forEach(link => {
      const href = link.getAttribute('href') || '';
      const linkFile = href.split('/').pop();
      if (linkFile && linkFile === currentFile) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('dashboard-nav-link--active');
      } else if (linkFile) {
        link.removeAttribute('aria-current');
        link.classList.remove('dashboard-nav-link--active');
      }
    });
  } catch (e) {
    console.warn('Nav sync error:', e);
  }

  // Mobile hamburger drawer toggle
  const hamburgerBtn = document.getElementById('dashboard-hamburger-btn');
  const sidebar = document.getElementById('dashboard-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');

  function openSidebar() {
    if (sidebar) {
      sidebar.classList.add('dashboard-sidebar--open', 'is-open');
      sidebar.setAttribute('aria-hidden', 'false');
    }
    if (backdrop) {
      backdrop.classList.add('sidebar-backdrop--visible', 'is-open');
      backdrop.setAttribute('aria-hidden', 'false');
    }
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'true');
    document.documentElement.style.overflow = 'hidden';
  }

  function closeSidebar() {
    if (sidebar) {
      sidebar.classList.remove('dashboard-sidebar--open', 'is-open');
      sidebar.setAttribute('aria-hidden', 'true');
    }
    if (backdrop) {
      backdrop.classList.remove('sidebar-backdrop--visible', 'is-open');
      backdrop.setAttribute('aria-hidden', 'true');
    }
    if (hamburgerBtn) hamburgerBtn.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Close when tapping links on mobile
  if (sidebar) {
    sidebar.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 1024) closeSidebar();
      });
    });
  }

  // Auto-close on resize >= 1024px
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024 && sidebar && sidebar.classList.contains('dashboard-sidebar--open')) {
      closeSidebar();
    }
  });

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sidebar && sidebar.classList.contains('dashboard-sidebar--open')) {
      closeSidebar();
    }
  });

  // Logout buttons
  document.querySelectorAll('.btn-staff-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      staffLogout();
    });
  });

  // Top search bar interactive feedback
  const searchInput = document.querySelector('.dashboard-topbar__search-input');
  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          showToast(`Searching records for "${query}"...`);
        }
      }
    });
  }
}

/* --------------------------------------------------------------------------
   3. Real-Time Elapsed Session Timer
   -------------------------------------------------------------------------- */
let timerInterval = null;
let elapsedSeconds = 255; // 04:15 starting demo point

export function startSessionTimer(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (timerInterval) clearInterval(timerInterval);

  timerInterval = setInterval(() => {
    elapsedSeconds++;
    const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(elapsedSeconds % 60).padStart(2, '0');
    el.textContent = `${mins}:${secs}`;
  }, 1000);
}

export function resetSessionTimer() {
  elapsedSeconds = 0;
}

/* --------------------------------------------------------------------------
   4. CSV Real Blob Export (Audit Table S10)
   -------------------------------------------------------------------------- */
export function exportTokensCSV() {
  const tokens = Store.getAllTokens();
  
  const headers = ['Token Number', 'Citizen Name', 'Service', 'Counter', 'Status', 'Priority', 'Estimated Wait (min)', 'Issued At'];
  const rows = tokens.map(t => [
    t.tokenNumber,
    `"${t.citizenName}"`,
    `"${t.serviceName || 'Certificate Application'}"`,
    t.counterId || 'Desk 02',
    t.status,
    t.priority ? 'Yes' : 'No',
    t.estimatedWaitMins || 10,
    `"${new Date(t.createdAt).toLocaleTimeString()}"`
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `QueueEase_Audit_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showToast('Audit CSV Report successfully downloaded', 'success');
}

/* --------------------------------------------------------------------------
   5. Interactive Modals Helpers
   -------------------------------------------------------------------------- */
export function openModal(id) {
  openSheet(id);
}

export function closeModal(id) {
  closeSheet(id);
}

window.staffLogout = staffLogout;
window.exportTokensCSV = exportTokensCSV;
window.openModal = openModal;
window.closeModal = closeModal;
