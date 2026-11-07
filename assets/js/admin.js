/**
 * QueueEase Admin Operations Controller
 * assets/js/admin.js
 */

import { Store } from './store.js';
import { showToast, openSheet, closeSheet } from './ui.js';
import { playChime, speakAnnouncement } from './signage.js';

const ADMIN_SESSION_KEY = 'queueease_admin_session';

/* --------------------------------------------------------------------------
   1. Admin Authentication & Session
   -------------------------------------------------------------------------- */
export function getAdminSession() {
  try {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function requireAdminAuth() {
  const session = getAdminSession();
  if (!session) {
    window.location.replace('../admin/index.html');
    return null;
  }
  return session;
}

export function adminLogin(identifier, password, totp) {
  const validIds = ['stf-adm-01', 'm.vance@civic.gov', 'admin', 'marcus.vance'];
  const isValid = validIds.includes(identifier.trim().toLowerCase()) &&
                  password === 'admin123' &&
                  (totp === '123456' || totp.length === 6);

  if (!isValid) {
    throw new Error('Invalid administrative credentials. Use demo: STF-ADM-01 / admin123 / TOTP 123456');
  }

  const session = {
    adminId: 'STF-ADM-01',
    name: 'Marcus Vance',
    role: 'Regional Director',
    tier: 'Tier-4 Super Admin',
    cluster: 'US-EAST-CIVIC-04',
    sessionRef: 'AUD-2025-9941',
    loggedInAt: new Date().toISOString()
  };

  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(session));
  return session;
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  window.location.replace('../admin/index.html');
}

/* --------------------------------------------------------------------------
   2. Shared Admin Shell Initialization
   -------------------------------------------------------------------------- */
export function initAdminShell(activePage = 'overview') {
  const session = requireAdminAuth();
  if (!session) return;

  // Active menu link auto-sync matching file name
  try {
    const currentFile = window.location.pathname.split('/').pop() || 'overview.html';
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

  // Hamburger drawer
  const hamburgerBtn = document.getElementById('admin-hamburger-btn');
  const sidebar = document.getElementById('admin-sidebar');
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
  document.querySelectorAll('.btn-admin-logout').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      adminLogout();
    });
  });
}

window.adminLogout = adminLogout;
