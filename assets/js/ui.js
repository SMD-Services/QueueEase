/**
 * QueueEase Shared UI System & Component Utilities
 * assets/js/ui.js
 */

import './theme-audit.js';
import { t, getLanguage, setLanguage, LANG_NAMES } from './i18n.js';

let lastHeaderConfig = null;
let lastBottomNavConfig = null;

// Re-render navigation components when language changes
if (typeof window !== 'undefined') {
  window.addEventListener('queueease_language_change', () => {
    if (lastHeaderConfig) initHeader(lastHeaderConfig);
    if (lastBottomNavConfig) initBottomNav(lastBottomNavConfig);
  });
}

/* --------------------------------------------------------------------------
   1. Shared App Header Injection
   -------------------------------------------------------------------------- */
export function initHeader({
  targetSelector = '#app-header',
  subtitle = null,
  showLive = true,
  showActions = true,
  onProfileClick = null,
  onAccessibilityClick = null
} = {}) {
  lastHeaderConfig = { targetSelector, subtitle, showLive, showActions, onProfileClick, onAccessibilityClick };
  const container = document.querySelector(targetSelector);
  if (!container) return;

  const resolvedSubtitle = subtitle || t('header_subtitle_home');

  container.className = 'app-header';
  container.innerHTML = `
    <div class="container">
      <div class="app-header__inner">
        <div class="app-header__branding">
          <a href="/index.html" class="app-header__logo-icon" aria-label="${t('app_name')}">
            <span class="material-symbols-outlined" style="font-size:24px;">confirmation_number</span>
          </a>
          <div class="app-header__titles">
            <div class="app-header__title-row">
              <span class="app-header__title">${t('app_name')}</span>
              ${showLive ? `
                <span class="badge--live" aria-label="${t('live_badge')}">
                  <span class="badge--live-dot"></span>
                  ${t('live_badge')}
                </span>
              ` : ''}
            </div>
            <span class="app-header__subtitle">${resolvedSubtitle}</span>
          </div>
        </div>

        ${showActions ? `
          <div class="app-header__actions">
            <button type="button" class="app-header__btn" id="header-accessibility-btn" aria-label="${t('header_accessibility_btn')}" title="${t('header_accessibility_btn')}">
              <span class="material-symbols-outlined" style="font-size:20px;">verified</span>
            </button>
            <button type="button" class="app-header__btn" id="header-profile-btn" aria-label="${t('header_profile_btn')}" title="${t('header_profile_btn')}">
              <span class="material-symbols-outlined" style="font-size:20px;">account_circle</span>
            </button>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Attach actions if provided
  const accBtn = container.querySelector('#header-accessibility-btn');
  if (accBtn) {
    accBtn.addEventListener('click', () => {
      if (onAccessibilityClick) onAccessibilityClick();
      else window.location.href = '/citizen/assist.html';
    });
  }

  const profBtn = container.querySelector('#header-profile-btn');
  if (profBtn) {
    profBtn.addEventListener('click', () => {
      if (onProfileClick) onProfileClick();
      else {
        const curLang = getLanguage();
        openSheet(`
          <div class="flow-col gap-4">
            <div class="flow-row items-center gap-3">
              <div class="avatar" style="width: 56px; height: 56px; font-size: 20px;">EV</div>
              <div class="flow-col">
                <span class="text-title-md font-bold">Eleanor Vance</span>
                <span class="text-body-sm color-muted">${t('profile_verified')} • (555) 019-2834</span>
              </div>
            </div>

            <!-- Language Switcher Shortcut -->
            <div class="card card--sm flow-col gap-2" style="background:var(--surface-tint); border:1px solid var(--border-subtle);">
              <div class="flow-row items-center justify-between">
                <span class="text-label-sm font-bold color-primary" style="display:flex; align-items:center; gap:4px;">
                  <span class="material-symbols-outlined" style="font-size:16px;">translate</span>
                  <span>${t('header_language_select')}</span>
                </span>
                <span class="status-pill status-pill--calling" style="font-size:10px;">${LANG_NAMES[curLang]}</span>
              </div>
              <div class="flow-grid gap-2" style="grid-template-columns: repeat(3, 1fr);" id="header-lang-switch-group">
                <button type="button" class="btn ${curLang === 'en' ? 'btn--primary' : 'btn--ghost'} btn--sm justify-center" data-switch-lang="en">English</button>
                <button type="button" class="btn ${curLang === 'hi' ? 'btn--primary' : 'btn--ghost'} btn--sm justify-center" data-switch-lang="hi">हिन्दी</button>
                <button type="button" class="btn ${curLang === 'mr' ? 'btn--primary' : 'btn--ghost'} btn--sm justify-center" data-switch-lang="mr">मराठी</button>
              </div>
            </div>

            <div class="card card--sm flow-col gap-2">
              <span class="text-label-sm color-muted">${t('nav_quick_navigation') || 'QUICK PORTAL NAVIGATION'}</span>
              <div class="flow-row flex-wrap gap-2">
                <a href="/index.html" class="btn btn--secondary btn--sm">${t('nav_home')}</a>
                <a href="/citizen/services.html" class="btn btn--ghost btn--sm">${t('nav_services')}</a>
                <a href="/citizen/track.html" class="btn btn--ghost btn--sm">${t('nav_track')}</a>
                <a href="/citizen/assist.html" class="btn btn--ghost btn--sm">${t('nav_assistance')}</a>
                <a href="/staff/" class="btn btn--ghost btn--sm">${t('nav_staff_hub')}</a>
                <a href="/display/" class="btn btn--ghost btn--sm">${t('nav_tv_signage')}</a>
                <a href="/admin/" class="btn btn--ghost btn--sm">${t('nav_admin_ops')}</a>
              </div>
            </div>
            <button type="button" class="btn btn--primary btn--full" onclick="window.closeSheet()">${t('btn_close')}</button>
          </div>
        `, `${t('profile_heading')} & ${t('header_language_select')}`);

        setTimeout(() => {
          document.querySelectorAll('#header-lang-switch-group [data-switch-lang]').forEach(btn => {
            btn.onclick = () => {
              const selected = btn.getAttribute('data-switch-lang');
              setLanguage(selected);
              showToast(t('toast_lang_changed', { lang: LANG_NAMES[selected] }), 'success');
              closeSheet();
            };
          });
        }, 50);
      }
    });
  }
}

/* --------------------------------------------------------------------------
   2. Shared Bottom Navigation Injection
   -------------------------------------------------------------------------- */
export function initBottomNav({
  targetSelector = '#app-bottom-nav',
  activeTab = 'home'
} = {}) {
  lastBottomNavConfig = { targetSelector, activeTab };
  const container = document.querySelector(targetSelector);
  if (!container) return;

  const tabs = [
    { id: 'home', key: 'nav_home', defaultLabel: 'Home', icon: 'grid_view', href: '/citizen/home.html' },
    { id: 'services', key: 'nav_services', defaultLabel: 'Services', icon: 'account_balance', href: '/citizen/services.html' },
    { id: 'track', key: 'nav_track', defaultLabel: 'Track', icon: 'radar', href: '/citizen/track.html' },
    { id: 'assistance', key: 'nav_assistance', defaultLabel: 'Assistance', icon: 'accessibility_new', href: '/citizen/assist.html' },
    { id: 'profile', key: 'nav_profile', defaultLabel: 'Profile', icon: 'badge', href: '/citizen/profile.html' }
  ];

  container.className = 'bottom-nav';
  container.innerHTML = `
    <nav class="bottom-nav__inner" aria-label="Primary mobile navigation">
      ${tabs.map(tab => {
        const isActive = tab.id === activeTab;
        const label = t(tab.key) || tab.defaultLabel;
        return `
          <a href="${tab.href}" 
             class="bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}" 
             ${isActive ? 'aria-current="page"' : ''}>
            <span class="material-symbols-outlined">${tab.icon}</span>
            <span data-i18n="${tab.key}">${label}</span>
          </a>
        `;
      }).join('')}
    </nav>
  `;
}

/* --------------------------------------------------------------------------
   3. Toast Notification System
   -------------------------------------------------------------------------- */
export function showToast(message, type = 'info', duration = 3200) {
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    toastContainer.setAttribute('aria-live', 'polite');
    toastContainer.setAttribute('aria-atomic', 'true');
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  let icon = 'info';
  if (type === 'success') icon = 'check_circle';
  if (type === 'danger') icon = 'error';
  if (type === 'warning') icon = 'warning';

  toast.innerHTML = `
    <div class="toast__content">
      <span class="material-symbols-outlined" style="font-size:20px;">${icon}</span>
      <span>${message}</span>
    </div>
    <button type="button" class="toast__close" aria-label="Close notification">
      <span class="material-symbols-outlined" style="font-size:18px;">close</span>
    </button>
  `;

  const closeBtn = toast.querySelector('.toast__close');
  const removeToast = () => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-10px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  };

  closeBtn.addEventListener('click', removeToast);
  toastContainer.appendChild(toast);

  if (duration > 0) {
    setTimeout(removeToast, duration);
  }
}

/* --------------------------------------------------------------------------
   4. Modal & Bottom Sheet (with Focus Trap & Escape support)
   -------------------------------------------------------------------------- */
let previousActiveElement = null;
let sheetEscListener = null;

export function openSheet(contentHtml, title = '') {
  previousActiveElement = document.activeElement;

  let backdrop = document.querySelector('.sheet-backdrop');
  let sheet = document.querySelector('.sheet-modal');

  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'sheet-backdrop';
    document.body.appendChild(backdrop);
  }

  if (!sheet) {
    sheet = document.createElement('div');
    sheet.className = 'sheet-modal';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    document.body.appendChild(sheet);
  }

  sheet.innerHTML = `
    <div class="sheet-modal__handle" aria-hidden="true"></div>
    <div class="sheet-modal__header">
      <h3 class="sheet-modal__title">${title}</h3>
      <button type="button" class="sheet-modal__close-btn" aria-label="Close modal" id="sheet-close-btn">
        <span class="material-symbols-outlined" style="font-size:20px;">close</span>
      </button>
    </div>
    <div class="sheet-modal__body">
      ${contentHtml}
    </div>
  `;

  // Open classes
  requestAnimationFrame(() => {
    backdrop.classList.add('sheet-backdrop--open');
    sheet.classList.add('sheet-modal--open');
  });

  // Event handlers
  const closeBtn = sheet.querySelector('#sheet-close-btn');
  closeBtn.addEventListener('click', closeSheet);
  backdrop.onclick = closeSheet;

  // Escape key handler
  if (sheetEscListener) window.removeEventListener('keydown', sheetEscListener);
  sheetEscListener = (e) => {
    if (e.key === 'Escape') closeSheet();
  };
  window.addEventListener('keydown', sheetEscListener);

  // Focus trap: set focus to close button or first input
  setTimeout(() => {
    const focusable = sheet.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (focusable) focusable.focus();
  }, 100);
}

export function closeSheet() {
  const backdrop = document.querySelector('.sheet-backdrop');
  const sheet = document.querySelector('.sheet-modal');

  if (backdrop) backdrop.classList.remove('sheet-backdrop--open');
  if (sheet) sheet.classList.remove('sheet-modal--open');

  if (sheetEscListener) {
    window.removeEventListener('keydown', sheetEscListener);
    sheetEscListener = null;
  }

  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
}

// Universal openModal and closeModal with Focus Trap
const modalFocusStack = new Map();

export function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const backdrop = document.getElementById(`${modalId}-backdrop`) || 
                   document.querySelector(`.modal-backdrop[data-modal="${modalId}"]`) ||
                   document.querySelector('.modal-backdrop') ||
                   document.querySelector('.sheet-backdrop');

  modal.classList.add('active', 'modal-container--open', 'bottom-sheet--open');
  modal.setAttribute('aria-hidden', 'false');
  modal.setAttribute('aria-modal', 'true');

  if (backdrop) {
    backdrop.classList.add('active', 'modal-backdrop--open', 'sheet-backdrop--open');
    backdrop.setAttribute('aria-hidden', 'false');
    backdrop.onclick = () => closeModal(modalId);
  }

  // Save current focus
  modalFocusStack.set(modalId, document.activeElement);

  // Trap focus
  const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  setTimeout(() => {
    const focusable = modal.querySelectorAll(focusableSelectors);
    if (focusable.length) {
      focusable[0].focus();
    }
  }, 60);

  const keyHandler = (e) => {
    if (e.key === 'Escape') {
      closeModal(modalId);
      return;
    }
    if (e.key === 'Tab') {
      const focusable = Array.from(modal.querySelectorAll(focusableSelectors)).filter(el => !el.disabled && el.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  modal._keyHandler = keyHandler;
  window.addEventListener('keydown', keyHandler);
}

export function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (!modal) return;

  const backdrop = document.getElementById(`${modalId}-backdrop`) || 
                   document.querySelector(`.modal-backdrop[data-modal="${modalId}"]`) ||
                   document.querySelector('.modal-backdrop') ||
                   document.querySelector('.sheet-backdrop');

  modal.classList.remove('active', 'modal-container--open', 'bottom-sheet--open');
  modal.setAttribute('aria-hidden', 'true');

  if (backdrop) {
    backdrop.classList.remove('active', 'modal-backdrop--open', 'sheet-backdrop--open');
    backdrop.setAttribute('aria-hidden', 'true');
  }

  if (modal._keyHandler) {
    window.removeEventListener('keydown', modal._keyHandler);
    modal._keyHandler = null;
  }

  const prev = modalFocusStack.get(modalId);
  if (prev && typeof prev.focus === 'function') {
    prev.focus();
    modalFocusStack.delete(modalId);
  }
}

// Make accessible to inline onclicks
window.closeSheet = closeSheet;
window.openSheet = openSheet;
window.openModal = openModal;
window.closeModal = closeModal;

/* --------------------------------------------------------------------------
   5. Time Formatting Helper
   -------------------------------------------------------------------------- */
export function formatTime(timestamp) {
  if (!timestamp) return '--:--';
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDurationMinutes(ms) {
  if (!ms || ms < 0) return '0 mins';
  const mins = Math.round(ms / 60000);
  return `${mins} mins`;
}

/* --------------------------------------------------------------------------
   6. Animated Counter (Smooth RequestAnimationFrame)
   -------------------------------------------------------------------------- */
export function animateCounter(element, targetNumber, duration = 800) {
  if (!element) return;
  const start = 0;
  const startTime = performance.now();
  const target = parseInt(targetNumber, 10) || 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease-out cubic
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * ease);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}
