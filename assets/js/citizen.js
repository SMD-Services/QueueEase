/**
 * QueueEase Citizen Portal Logic
 * assets/js/citizen.js
 */

import { Store } from '/assets/js/store.js';
import { initHeader, initBottomNav, showToast, openSheet, closeSheet, animateCounter, formatTime } from '/assets/js/ui.js';
import { t } from '/assets/js/i18n.js';

/* --------------------------------------------------------------------------
   1. Citizen Home Page Controller (S1)
   -------------------------------------------------------------------------- */
export function initCitizenHome() {
  // Shared Header & Bottom Navigation
  initHeader({
    subtitle: 'Public Civic Desk • Dashboard Home',
    showLive: true
  });

  initBottomNav({
    activeTab: 'home'
  });

  // Render dynamic elements
  renderHomeStats();
  renderActivePassSection();
  setupTrackTokenForm();
  setupDepartmentActions();
  setupAccessibilityButtons();

  // Cross-tab reactive updates & language switch updates
  Store.subscribe(() => {
    renderHomeStats();
    renderActivePassSection();
  });

  window.addEventListener('queueease_language_change', () => {
    renderHomeStats();
    renderActivePassSection();
  });
}

function renderHomeStats() {
  const counters = Store.getCounters();
  const tokens = Store.getAllTokens();
  const services = Store.getServices();

  // Active / Total Counters
  const activeCounters = counters.filter(c => c.status !== 'recess');
  const recessCounters = counters.filter(c => c.status === 'recess');

  const countersValEl = document.getElementById('stat-counters-val');
  const countersSubEl = document.getElementById('stat-counters-sub');
  if (countersValEl) countersValEl.textContent = `${activeCounters.length}/${counters.length}`;
  if (countersSubEl) countersSubEl.textContent = `${recessCounters.length} on recess`;

  // Average Wait calculation
  const totalAvg = Math.round(services.reduce((acc, s) => acc + (s.avgWaitMins || 10), 0) / services.length);
  const avgWaitValEl = document.getElementById('stat-avg-wait-val');
  if (avgWaitValEl) avgWaitValEl.textContent = `${totalAvg}m`;

  // Served tokens today
  const completedTokens = tokens.filter(t => t.status === 'completed');
  const servedValEl = document.getElementById('stat-served-val');
  if (servedValEl) servedValEl.textContent = `${400 + completedTokens.length}+`;
}

function renderActivePassSection() {
  const activePassContainer = document.getElementById('active-pass-container');
  if (!activePassContainer) return;

  const activeToken = Store.getActiveCitizenToken();
  const isDemoActive = localStorage.getItem('queueease_force_demo_pass') === 'true';

  if (!activeToken && !isDemoActive) {
    // Empty state
    activePassContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">
          <span class="material-symbols-outlined">receipt_long</span>
        </div>
        <h3 class="empty-state__title">${t('home_no_tokens')}</h3>
        <p class="empty-state__desc">
          ${t('home_generate_now')}
        </p>
        <a href="/citizen/services.html" class="btn btn--secondary">
          <span class="material-symbols-outlined">add_circle</span>
          <span>${t('home_btn_generate')}</span>
        </a>
      </div>
    `;
  } else {
    // Active Pass Card
    const token = activeToken || Store.getToken('tok-a008') || {
      id: 'tok-a008',
      tokenNumber: 'A008',
      serviceId: 'srv-1',
      citizenName: 'Eleanor Vance',
      status: 'serving',
      counterId: 'cnt-2'
    };

    const service = Store.getService(token.serviceId) || { name: 'Certificate Application' };
    const counter = Store.getCounter(token.counterId) || { name: 'Counter 02', desk: 'Desk 104' };
    const { position, waitMinutes } = Store.getQueuePosition(token.id);

    activePassContainer.innerHTML = `
      <div class="active-pass-card flow-col gap-3">
        <div class="flow-row justify-between items-start">
          <div class="flow-col">
            <span class="text-label-xs color-muted font-bold" style="letter-spacing:0.04em;">${t('profile_active_passes_heading')}</span>
            <span class="text-display-xl font-bold color-primary">${token.tokenNumber}</span>
            <span class="text-body-sm font-semibold">${service.name}</span>
          </div>
          <span class="status-pill ${token.status === 'serving' ? 'status-pill--serving' : 'status-pill--waiting'}">
            <span class="status-pill__dot"></span>
            ${token.status === 'serving' ? t('status_calling') : t('status_waiting')}
          </span>
        </div>

        <div class="flow-grid gap-2" style="grid-template-columns: repeat(2, 1fr); background: var(--surface-subtle); padding: 12px; border-radius: var(--radius-sm);">
          <div>
            <div class="text-label-xs color-muted">${t('token_counter_label')}</div>
            <div class="text-body-sm font-bold color-primary">${counter.name} (${counter.desk})</div>
          </div>
          <div>
            <div class="text-label-xs color-muted">${t('token_wait_label')}</div>
            <div class="text-body-sm font-bold color-primary">~${waitMinutes || 15} Mins</div>
          </div>
        </div>

        <div class="flow-row gap-2" style="margin-top: 4px;">
          <a href="/citizen/track.html?token=${token.id}" class="btn btn--primary flex-1 btn--sm">
            <span class="material-symbols-outlined" style="font-size:18px;">radar</span>
            <span>${t('token_btn_track')}</span>
          </a>
          <button type="button" class="btn btn--ghost btn--sm" id="btn-dismiss-pass" title="Clear Pass from Device">
            <span class="material-symbols-outlined" style="font-size:18px;">close</span>
          </button>
        </div>
      </div>
    `;

    const dismissBtn = activePassContainer.querySelector('#btn-dismiss-pass');
    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        Store.clearActiveCitizenToken();
        localStorage.removeItem('queueease_force_demo_pass');
        showToast('Active pass cleared from session', 'info');
        renderActivePassSection();
      });
    }
  }

  // Bind Demo Toggle
  const toggleBtn = document.getElementById('toggle-demo-pass-btn');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      const current = localStorage.getItem('queueease_force_demo_pass') === 'true';
      if (current) {
        localStorage.removeItem('queueease_force_demo_pass');
        Store.clearActiveCitizenToken();
        showToast('Active Pass: Empty State active', 'info');
      } else {
        localStorage.setItem('queueease_force_demo_pass', 'true');
        Store.setActiveCitizenToken('tok-a008');
        showToast('Active Pass: Demo Token A008 loaded', 'success');
      }
      renderActivePassSection();
    };
  }
}

function setupTrackTokenForm() {
  const form = document.getElementById('track-token-form');
  const input = document.getElementById('track-token-input');
  const feedback = document.getElementById('track-feedback');

  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = input.value.trim().toUpperCase();

    if (!query) {
      showFeedback('Please enter a token number (e.g. A008, C-104, or T-209)', 'error');
      return;
    }

    // Try finding in store
    const normalized = query.replace('-', '');
    const tokens = Store.getAllTokens();
    const found = tokens.find(t => 
      t.tokenNumber.toUpperCase() === query || 
      t.tokenNumber.replace('-', '').toUpperCase() === normalized ||
      t.id.toUpperCase() === query
    );

    if (found) {
      showFeedback(`Token ${found.tokenNumber} verified! Redirecting...`, 'success');
      Store.setActiveCitizenToken(found.id);
      setTimeout(() => {
        window.location.href = `/citizen/track.html?token=${found.id}`;
      }, 600);
    } else {
      // Create friendly fallback tracking for unseeded code
      showFeedback(`Token ${query} located at Civic Gate intake. Loading live track...`, 'success');
      const tempToken = Store.createToken({
        serviceId: 'srv-1',
        citizenName: 'Citizen Passholder',
        phone: ''
      });
      tempToken.tokenNumber = query;
      Store.saveTokens(Store.getAllTokens());
      Store.setActiveCitizenToken(tempToken.id);
      setTimeout(() => {
        window.location.href = `/citizen/track.html?token=${tempToken.id}`;
      }, 700);
    }
  });

  function showFeedback(msg, type) {
    if (!feedback) return;
    feedback.className = `track-feedback track-feedback--${type}`;
    feedback.innerHTML = `
      <span class="material-symbols-outlined" style="font-size:16px;">${type === 'error' ? 'error' : 'check_circle'}</span>
      <span>${msg}</span>
    `;
    feedback.style.display = 'flex';
  }
}

function setupDepartmentActions() {
  // Plus buttons and card links
  const deptCards = document.querySelectorAll('.dept-card');
  deptCards.forEach(card => {
    card.addEventListener('click', (e) => {
      const srvId = card.getAttribute('data-service-id');
      if (srvId) {
        window.location.href = `/citizen/issue.html?service=${srvId}`;
      }
    });
  });
}

function setupAccessibilityButtons() {
  const staffBtn = document.getElementById('btn-call-staff');
  if (staffBtn) {
    staffBtn.addEventListener('click', () => {
      openSheet(`
        <div class="flow-col gap-4">
          <div class="flow-row items-center gap-3">
            <div class="avatar" style="background:#042F2E; color:#2DD4BF;">
              <span class="material-symbols-outlined">support_agent</span>
            </div>
            <div class="flow-col">
              <span class="text-title-md font-bold">Hall B On-Site Escort</span>
              <span class="text-body-sm color-muted">Floor Relief Officer On Duty</span>
            </div>
          </div>
          <p class="text-body-sm color-text-secondary">
            Request an on-site civic officer to assist with step-free wheelchair escort, sign-language assistance, or physical paperwork navigation.
          </p>
          <div class="card card--sm flow-col gap-2" style="background:#F8FAFC;">
            <div class="flow-row justify-between text-body-sm">
              <span class="color-muted">Current Location:</span>
              <span class="font-bold">Hall B Central Lounge</span>
            </div>
            <div class="flow-row justify-between text-body-sm">
              <span class="color-muted">Est. Response Time:</span>
              <span class="font-bold color-success">Under 2 minutes</span>
            </div>
          </div>
          <button type="button" class="btn btn--primary btn--full" id="btn-confirm-escort">
            <span class="material-symbols-outlined">ring_volume</span>
            <span>Dispatch Floor Staff Now</span>
          </button>
        </div>
      `, 'Call On-Site Staff');

      setTimeout(() => {
        const confirmBtn = document.getElementById('btn-confirm-escort');
        if (confirmBtn) {
          confirmBtn.onclick = () => {
            closeSheet();
            showToast('Staff member Officer Miller is on the way to Hall B Lounge.', 'success', 5000);
          };
        }
      }, 100);
    });
  }

  const fastTrackBtn = document.getElementById('btn-fast-track');
  if (fastTrackBtn) {
    fastTrackBtn.addEventListener('click', () => {
      window.location.href = '/citizen/issue.html?priority=senior_disabled';
    });
  }
}

/* --------------------------------------------------------------------------
   2. Citizen Services Page Controller (S2)
   -------------------------------------------------------------------------- */
export function initCitizenServices() {
  initHeader({
    subtitle: 'Public Civic Desk • Civic Services',
    showLive: true
  });

  initBottomNav({
    activeTab: 'services'
  });

  const services = Store.getServices();
  let currentCategory = 'all';
  let currentQuery = '';

  const searchInput = document.getElementById('services-search-input');
  const chipsContainer = document.getElementById('services-filter-chips');
  const cardsList = document.getElementById('services-cards-list');
  const emptyState = document.getElementById('services-empty-state');

  // Search box listener
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentQuery = e.target.value.toLowerCase().trim();
      renderServiceCards();
    });
  }

  // Filter chips listener
  if (chipsContainer) {
    chipsContainer.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      chipsContainer.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
      chip.classList.add('chip--active');
      currentCategory = chip.getAttribute('data-category') || 'all';
      renderServiceCards();
    });
  }

  function renderServiceCards() {
    if (!cardsList) return;

    const tokens = Store.getAllTokens();
    const filtered = services.filter(service => {
      const matchCat = currentCategory === 'all' || service.category.toLowerCase().includes(currentCategory.toLowerCase()) || (currentCategory === 'public' && service.category.toLowerCase().includes('general'));
      const matchQuery = !currentQuery || 
        service.name.toLowerCase().includes(currentQuery) ||
        service.description.toLowerCase().includes(currentQuery) ||
        service.tags.some(t => t.toLowerCase().includes(currentQuery));
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      cardsList.innerHTML = '';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    cardsList.innerHTML = filtered.map(service => {
      // Calculate citizens ahead in waiting status
      const aheadCount = tokens.filter(t => t.serviceId === service.id && t.status === 'waiting').length;
      const isFastMoving = service.code === 'C';

      return `
        <article class="service-card" data-service-id="${service.id}">
          <div class="service-card__top">
            <div class="service-card__icon-box">
              <span class="material-symbols-outlined">${service.icon || 'badge'}</span>
            </div>
            <span class="service-card__queue-badge">
              <span class="status-pill__dot" style="background:${isFastMoving ? 'var(--color-tertiary)' : 'var(--color-success)'}"></span>
              ${isFastMoving ? `${t('status_serving')} • ${t('optimal_flow')}` : `${aheadCount} ${t('status_waiting')}`}
            </span>
          </div>

          <h3 class="service-card__title">${service.name}</h3>
          <p class="service-card__desc">${service.description}</p>

          <div class="service-card__meta-chips">
            ${service.tags.map((tag, idx) => {
              let icon = 'schedule';
              if (idx === 1) icon = 'meeting_room';
              if (idx === 2) icon = 'assignment';
              return `
                <span class="service-meta-chip">
                  <span class="material-symbols-outlined">${icon}</span>
                  <span>${tag}</span>
                </span>
              `;
            }).join('')}
          </div>

          <a href="/citizen/issue.html?service=${service.id}" class="btn btn--primary btn--full" style="margin-top: 4px;">
            <span>${t('services_btn_issue')}</span>
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
        </article>
      `;
    }).join('');
  }

  // Initial render
  renderServiceCards();

  // Pulse Telemetry
  renderProcessingPulse();

  // Accessibility support link
  const supportLink = document.getElementById('services-accessibility-link');
  if (supportLink) {
    supportLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.location.href = '/citizen/issue.html?priority=senior_disabled';
    });
  }

  // Cross-tab reactive updates & language switch updates
  Store.subscribe(() => {
    renderServiceCards();
    renderProcessingPulse();
  });

  window.addEventListener('queueease_language_change', () => {
    renderServiceCards();
    renderProcessingPulse();
  });
}

function renderProcessingPulse() {
  const pulseGrid = document.getElementById('processing-pulse-grid');
  if (!pulseGrid) return;

  const counters = Store.getCounters();
  const callingCounter = counters.find(c => c.status === 'calling') || counters[0];
  const servingCounter = counters.find(c => c.status === 'serving') || counters[1];

  const callingToken = callingCounter && callingCounter.currentTokenId ? Store.getToken(callingCounter.currentTokenId) : { tokenNumber: 'A-142' };
  const servingToken = servingCounter && servingCounter.currentTokenId ? Store.getToken(servingCounter.currentTokenId) : { tokenNumber: 'A-143' };

  pulseGrid.innerHTML = `
    <div class="pulse-card">
      <span class="pulse-card__label">${t('status_calling')}</span>
      <span class="pulse-card__token pulse-card__token--calling">${callingToken.tokenNumber}</span>
      <span class="pulse-card__desk">${callingCounter ? callingCounter.desk : 'Desk 02'} • Registry</span>
    </div>
    <div class="pulse-card">
      <span class="pulse-card__label">${t('track_your_turn')}</span>
      <span class="pulse-card__token pulse-card__token--next">${servingToken.tokenNumber}</span>
      <span class="pulse-card__desk">${servingCounter ? servingCounter.desk : 'Desk 04'} • Attestation</span>
    </div>
  `;
}
