/**
 * QueueEase Live Queue Tracking Controller
 * assets/js/track.js
 */

import { Store } from '/assets/js/store.js';
import { initHeader, initBottomNav, showToast, formatTime } from '/assets/js/ui.js';
import { A11y } from '/assets/js/a11y.js';
import { t } from '/assets/js/i18n.js';

let refreshTimer = null;
let currentToken = null;

export function initTrackPage() {
  initHeader({
    subtitle: 'Public Civic Desk • Track Token',
    showLive: true
  });

  initBottomNav({
    activeTab: 'track'
  });

  // Resolve token to track
  const urlParams = new URLSearchParams(window.location.search);
  const tokenId = urlParams.get('token') || urlParams.get('id');

  currentToken = tokenId ? Store.getToken(tokenId) : Store.getActiveCitizenToken();
  if (!currentToken && localStorage.getItem('queueease_force_demo_pass') === 'true') {
    currentToken = Store.getToken('tok-a008');
  }

  const mainContainer = document.getElementById('track-main-content');
  const emptyContainer = document.getElementById('track-empty-state');

  if (!currentToken) {
    if (mainContainer) mainContainer.style.display = 'none';
    if (emptyContainer) emptyContainer.style.display = 'block';
    setupEmptyTracking();
    return;
  }

  if (mainContainer) mainContainer.style.display = 'block';
  if (emptyContainer) emptyContainer.style.display = 'none';

  // Render components
  renderTokenHero();
  renderQueueStepper();
  renderLiveBoard();
  renderStatusTimeline();
  setupNotificationPreferences();
  setupActionButtons();

  // 5-second interval auto-refresh & reactive subscription
  startAutoRefresh();

  Store.subscribe(() => {
    refreshData();
  });

  window.addEventListener('queueease_language_change', () => {
    refreshData();
  });
}

function renderTokenHero() {
  if (!currentToken) return;

  const heroCard = document.getElementById('track-token-hero');
  if (!heroCard) return;

  const service = Store.getService(currentToken.serviceId) || { name: 'Certificate Application' };
  const counter = Store.getCounter(currentToken.counterId) || Store.getCounters()[1];
  const { position, waitMinutes } = Store.getQueuePosition(currentToken.id);

  // Find currently serving token for this service
  const servingToken = Store.getAllTokens().find(t => 
    t.serviceId === currentToken.serviceId && t.status === 'serving'
  ) || { tokenNumber: 'A005' };

  heroCard.innerHTML = `
    <div class="flow-row justify-between items-center" style="margin-bottom: var(--space-2);">
      <span class="status-pill status-pill--priority" style="background:#1E3E68; color:#93C5FD; border-color:#3B82F6;">
        <span class="material-symbols-outlined" style="font-size:13px;">schedule</span>
        PRIORITY WAIT
      </span>
      <span class="badge--live" style="background:rgba(20, 184, 166, 0.2); color:#2DD4BF;">
        <span class="badge--live-dot" style="background:#2DD4BF;"></span>
        Queue Active
      </span>
    </div>

    <div class="text-label-xs font-semibold" style="color: rgba(255,255,255,0.7); letter-spacing:0.04em;">
      Official Citizen Token
    </div>

    <div class="flow-row justify-between items-baseline" style="margin-top: 2px; margin-bottom: var(--space-3);">
      <div class="flow-col">
        <div class="text-display-2xl font-bold" style="color: #FFFFFF; font-family: var(--font-family-mono); letter-spacing: -0.03em;">
          ${currentToken.tokenNumber}
        </div>
        <div class="flow-row items-center gap-1" style="color: rgba(255,255,255,0.85); font-size: var(--font-body-sm); margin-top: 2px;">
          <span class="material-symbols-outlined" style="font-size:18px;">account_circle</span>
          <span>${currentToken.citizenName} (You)</span>
        </div>
      </div>

      <div class="flow-col items-end">
        <span class="text-label-xs font-bold" style="color: rgba(255,255,255,0.7); text-transform:uppercase; letter-spacing:0.04em;">ESTIMATED WAIT</span>
        <span class="text-headline-md font-bold" style="color: #FFFFFF; line-height:1.1;">
          ${waitMinutes || 15} Mins
        </span>
      </div>
    </div>

    <!-- Currently Serving & People Ahead -->
    <div class="flow-grid gap-2" style="grid-template-columns: repeat(2, 1fr); margin-bottom: var(--space-3);">
      <div class="flow-row items-center gap-2" style="background: rgba(255,255,255,0.1); padding: 10px 12px; border-radius: var(--radius-sm);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(37,99,235,0.5); display:flex; align-items:center; justify-content:center;">
          <span class="material-symbols-outlined" style="font-size:18px; color:#93C5FD;">play_arrow</span>
        </div>
        <div class="flow-col">
          <span class="text-label-xs" style="color: rgba(255,255,255,0.7);">Currently Serving</span>
          <span class="text-body-sm font-bold" style="color: #FFFFFF; font-family:var(--font-family-mono);">
            Token ${servingToken.tokenNumber}
          </span>
        </div>
      </div>

      <div class="flow-row items-center gap-2" style="background: rgba(255,255,255,0.1); padding: 10px 12px; border-radius: var(--radius-sm);">
        <div style="width: 32px; height: 32px; border-radius: 50%; background: rgba(20,184,166,0.3); display:flex; align-items:center; justify-content:center;">
          <span class="material-symbols-outlined" style="font-size:18px; color:#2DD4BF;">groups</span>
        </div>
        <div class="flow-col">
          <span class="text-label-xs" style="color: rgba(255,255,255,0.7);">People Ahead</span>
          <span class="text-body-sm font-bold" style="color: #FFFFFF;">
            ${position || 3} Citizens
          </span>
        </div>
      </div>
    </div>

    <!-- Assigned Counter Location -->
    <div class="flow-row items-center gap-2" style="background: rgba(20,45,78,0.7); border: 1px solid rgba(255,255,255,0.15); padding: 10px 14px; border-radius: var(--radius-sm);">
      <span class="material-symbols-outlined" style="font-size:18px; color:var(--color-tertiary-light);">location_on</span>
      <span class="text-body-sm font-semibold" style="color: #FFFFFF;">
        Assigned: <strong>${counter.name}</strong> (${counter.desk || 'Ground Floor, Room 104'})
      </span>
    </div>
  `;
}

function renderQueueStepper() {
  const stepperContainer = document.getElementById('track-stepper-container');
  if (!stepperContainer) return;

  stepperContainer.innerHTML = `
    <div class="card card--sm flow-col gap-4">
      <div class="flow-row justify-between items-center">
        <div class="flow-row items-center gap-2">
          <span class="material-symbols-outlined color-secondary">alt_route</span>
          <h2 class="text-title-md font-bold color-primary">Queue Stepper</h2>
        </div>
        <span class="status-pill status-pill--calling" style="font-size:11px; padding:3px 10px;">
          Step 3 of 4: Approaching Desk
        </span>
      </div>

      <div class="stepper">
        <div class="stepper__progress-line" style="width: 72%;"></div>

        <!-- Step 1 -->
        <div class="stepper__step stepper__step--completed">
          <div class="stepper__indicator">
            <span class="material-symbols-outlined" style="font-size:18px;">check</span>
          </div>
          <span class="stepper__label">A005</span>
          <span class="stepper__status" style="color:var(--color-success); font-weight:bold;">Served</span>
        </div>

        <!-- Step 2 -->
        <div class="stepper__step stepper__step--completed">
          <div class="stepper__indicator">
            <span class="material-symbols-outlined" style="font-size:18px;">check</span>
          </div>
          <span class="stepper__label">A006</span>
          <span class="stepper__status" style="color:var(--color-secondary); font-weight:bold;">Called</span>
        </div>

        <!-- Step 3 -->
        <div class="stepper__step stepper__step--active">
          <div class="stepper__indicator">
            <span class="material-symbols-outlined" style="font-size:18px;">circle</span>
          </div>
          <span class="stepper__label" style="color:var(--color-secondary);">A007</span>
          <span class="stepper__status" style="color:var(--color-secondary); font-weight:bold;">Next</span>
        </div>

        <!-- Step 4 (You) -->
        <div class="stepper__step stepper__step--current-you">
          <div class="stepper__indicator">
            <span class="material-symbols-outlined" style="font-size:18px;">person</span>
          </div>
          <span class="stepper__label" style="color:var(--color-primary);">${currentToken?.tokenNumber || 'A008'}</span>
          <span class="stepper__status" style="color:var(--color-tertiary-dark); font-weight:bold;">You</span>
        </div>

        <!-- Step 5 -->
        <div class="stepper__step">
          <div class="stepper__indicator">5</div>
          <span class="stepper__label">A009</span>
          <span class="stepper__status">Wait</span>
        </div>
      </div>

      <div class="card card--blue-surface card--sm flow-row items-center gap-3" style="padding: 10px 14px;">
        <span class="material-symbols-outlined color-secondary" style="font-size:22px;">speed</span>
        <span class="text-body-sm color-text">
          Estimated <strong>80% completed</strong>. Counters are running smoothly with an average service speed of 4.8 minutes per citizen.
        </span>
      </div>
    </div>
  `;
}

function renderLiveBoard() {
  const liveBoardList = document.getElementById('track-live-board-list');
  if (!liveBoardList) return;

  const currentNumber = currentToken ? currentToken.tokenNumber : 'A008';

  liveBoardList.innerHTML = `
    <!-- A005 Now Serving -->
    <div class="queue-row queue-row--serving">
      <div class="queue-row__token color-tertiary">A005</div>
      <div class="queue-row__info">
        <span class="queue-row__title">Counter 02</span>
        <span class="queue-row__subtext">Desk 104 • Identity Verification</span>
      </div>
      <span class="status-pill status-pill--serving">
        <span class="status-pill__dot"></span>
        NOW SERVING
      </span>
    </div>

    <!-- A006 Calling -->
    <div class="queue-row queue-row--calling">
      <div class="queue-row__token color-secondary">A006</div>
      <div class="queue-row__info">
        <span class="queue-row__title">Counter 01</span>
        <span class="queue-row__subtext">Room 102 • Calling citizen</span>
      </div>
      <span class="status-pill status-pill--calling">
        <span class="status-pill__dot"></span>
        CALLING
      </span>
    </div>

    <!-- A007 Next In Line -->
    <div class="queue-row" style="border-left-color: #60A5FA;">
      <div class="queue-row__token color-primary">A007</div>
      <div class="queue-row__info">
        <span class="queue-row__title">Ready at Door B</span>
        <span class="queue-row__subtext">Estimated in 4 mins</span>
      </div>
      <span class="status-pill status-pill--calling" style="background:#EFF6FF; color:#1D4ED8; border-color:#BFDBFE;">
        NEXT IN LINE
      </span>
    </div>

    <!-- A008 You (Highlighted) -->
    <div class="queue-row queue-row--you" id="user-token-row">
      <div class="queue-row__token" style="color: var(--color-tertiary-light);">${currentNumber}</div>
      <div class="queue-row__info">
        <span class="queue-row__title" style="color:#FFFFFF;">${currentToken?.citizenName || 'Eleanor Vance'}</span>
        <span class="queue-row__subtext" style="color:rgba(255,255,255,0.8);">Your Token • Lounge Area B</span>
      </div>
      <span class="status-pill" style="background:#2DD4BF; color:#042F2E; font-weight:bold;">
        YOUR TURN SOON
      </span>
    </div>

    <!-- A009 Waiting -->
    <div class="queue-row">
      <div class="queue-row__token color-muted">A009</div>
      <div class="queue-row__info">
        <span class="queue-row__title">Queue Waiting</span>
        <span class="queue-row__subtext">General Intake</span>
      </div>
      <span class="status-pill status-pill--completed">
        WAITING
      </span>
    </div>
  `;
}

function renderStatusTimeline() {
  const timelineEl = document.getElementById('track-status-timeline');
  if (!timelineEl) return;

  const tokenNum = currentToken ? currentToken.tokenNumber : 'A008';

  timelineEl.innerHTML = `
    <div class="timeline">
      <div class="timeline__item">
        <div class="timeline__dot timeline__dot--success"></div>
        <div class="timeline__title">3 citizens remaining in queue</div>
        <div class="timeline__meta">10:50 AM • Average processing 4m 30s</div>
      </div>
      <div class="timeline__item">
        <div class="timeline__dot timeline__dot--active"></div>
        <div class="timeline__title">Assigned to Counter 02 (Certificate Desk)</div>
        <div class="timeline__meta">10:45 AM • Civic Official J. Miller</div>
      </div>
      <div class="timeline__item">
        <div class="timeline__dot"></div>
        <div class="timeline__title">Token ${tokenNum} generated online</div>
        <div class="timeline__meta">10:42 AM • QueueEase Mobile App</div>
      </div>
    </div>
  `;
}

function setupNotificationPreferences() {
  const notifContainer = document.getElementById('notification-preferences-box');
  if (!notifContainer) return;

  const storedSms = localStorage.getItem('queueease_notif_sms') !== 'false';
  const storedPush = localStorage.getItem('queueease_notif_push') !== 'false';
  const storedChime = localStorage.getItem('queueease_notif_chime') !== 'false';

  const checkBoxes = notifContainer.querySelectorAll('.custom-checkbox');
  
  if (checkBoxes[0]) checkBoxes[0].classList.toggle('custom-checkbox--checked', storedSms);
  if (checkBoxes[1]) checkBoxes[1].classList.toggle('custom-checkbox--checked', storedPush);
  if (checkBoxes[2]) checkBoxes[2].classList.toggle('custom-checkbox--checked', storedChime);

  const rows = notifContainer.querySelectorAll('.checkbox-card');
  rows.forEach((row, idx) => {
    row.addEventListener('click', () => {
      const box = row.querySelector('.custom-checkbox');
      const isChecked = box.classList.toggle('custom-checkbox--checked');
      row.classList.toggle('checkbox-card--active', isChecked);

      if (idx === 0) localStorage.setItem('queueease_notif_sms', isChecked);
      if (idx === 1) localStorage.setItem('queueease_notif_push', isChecked);
      if (idx === 2) localStorage.setItem('queueease_notif_chime', isChecked);

      showToast('Notification preference updated', 'info');
    });
  });
}

function setupActionButtons() {
  // Refresh Button with spinning icon
  const refreshBtn = document.getElementById('btn-refresh-queue');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      const icon = refreshBtn.querySelector('.material-symbols-outlined');
      if (icon) icon.style.animation = 'spin 0.6s linear';
      setTimeout(() => {
        if (icon) icon.style.animation = '';
        refreshData();
        showToast('Queue status synchronized with central hub', 'success');
      }, 600);
    });
  }

  // Web Speech API Announcement
  const announceBtn = document.getElementById('btn-listen-announcement');
  if (announceBtn) {
    announceBtn.addEventListener('click', () => {
      const tokenNum = currentToken ? currentToken.tokenNumber : 'A008';
      const speechText = t('speech_announce', {
        token: tokenNum,
        counter: '02',
        desk: 'Desk 104'
      });

      A11y.speak(speechText);
      showToast(speechText, 'info', 6000);
    });
  }
}

function refreshData() {
  if (!currentToken) return;

  // Refresh token from store
  const updated = Store.getToken(currentToken.id);
  if (updated) currentToken = updated;

  renderTokenHero();
  renderQueueStepper();
  renderLiveBoard();
  renderStatusTimeline();

  // If token is next or now calling: notify user with vibration & highlight
  if (currentToken.status === 'calling') {
    if ('vibrate' in navigator) {
      try { navigator.vibrate([200, 100, 200]); } catch(e){}
    }
    const heroCard = document.getElementById('track-token-hero');
    if (heroCard) {
      heroCard.style.boxShadow = '0 0 30px rgba(37, 99, 235, 0.8)';
    }
    showToast(`🔔 TOKEN ${currentToken.tokenNumber}: You are being called to Counter 02!`, 'success', 8000);
  }
}

function startAutoRefresh() {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    refreshData();
  }, 5000);
}

function setupEmptyTracking() {
  const form = document.getElementById('empty-track-form');
  const input = document.getElementById('empty-track-input');

  if (form && input) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = input.value.trim().toUpperCase();
      if (!val) return;

      const found = Store.getToken(val) || Store.getAllTokens().find(t => t.tokenNumber.toUpperCase() === val);
      if (found) {
        Store.setActiveCitizenToken(found.id);
        window.location.href = `/citizen/track.html?token=${found.id}`;
      } else {
        const temp = Store.createToken({ serviceId: 'srv-1', citizenName: 'Citizen Passholder' });
        temp.tokenNumber = val;
        Store.saveTokens(Store.getAllTokens());
        Store.setActiveCitizenToken(temp.id);
        window.location.href = `/citizen/track.html?token=${temp.id}`;
      }
    });
  }
}
