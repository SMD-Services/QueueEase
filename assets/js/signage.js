/**
 * QueueEase TV Lounge Signage Controller
 * assets/js/signage.js
 */

import { Store } from '/assets/js/store.js';
import { speakVoice, t, initI18n, getLanguage, setLanguage } from './i18n.js';
import './theme-audit.js';

let currentState = 'live';
let lastCalledTokenId = null;

export function initSignage() {
  initI18n();
  updateClock();
  setInterval(updateClock, 1000);

  // Initial load
  renderSignageData();

  // Subscribe to real-time store changes
  Store.subscribe(() => {
    if (currentState === 'live') {
      renderSignageData(true);
    }
  });

  // Wire up state switch buttons and language pills
  setupStateButtons();
  setupSignageLanguagePills();

  window.addEventListener('queueease_language_change', () => {
    renderSignageData();
    syncSignageLangPills();
  });
}

/* --------------------------------------------------------------------------
   1. Live Clock & Date
   -------------------------------------------------------------------------- */
function updateClock() {
  const now = new Date();
  const timeEl = document.getElementById('signage-time');
  const dateEl = document.getElementById('signage-date');

  if (timeEl) {
    const hours = String(now.getHours()).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    timeEl.textContent = `${hours}:${mins}:${secs}`;
  }

  if (dateEl) {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options).toUpperCase();
  }
}

/* --------------------------------------------------------------------------
   2. Web Audio API Dual-Tone Chime (Zero External Files)
   -------------------------------------------------------------------------- */
export function playChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const now = ctx.currentTime;

    // Tone 1: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.4);

    // Tone 2: E5 (659.25 Hz) after 0.2s
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.2);
    gain2.gain.setValueAtTime(0.35, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.7);
  } catch (err) {
    console.warn('Audio chime playback error:', err);
  }
}

/* --------------------------------------------------------------------------
   3. Speech Synthesis Announcement (Multilingual via i18n.js)
   -------------------------------------------------------------------------- */
export function speakAnnouncement(tokenNumber, counterName, serviceName, roomDesk) {
  speakVoice('speech_announce', {
    token: tokenNumber,
    counter: counterName,
    desk: roomDesk || serviceName || ''
  });
}

/* --------------------------------------------------------------------------
   4. Render Live Signage Board
   -------------------------------------------------------------------------- */
function renderSignageData(checkSummon = false) {
  if (currentState !== 'live') return;

  const tokens = Store.getAllTokens();
  const counters = Store.getCounters();

  // Find active serving/calling token
  const activeToken = tokens.find(t => t.status === 'serving' || t.status === 'calling') || tokens[0] || {
    id: 'tok-a005',
    tokenNumber: 'A005',
    serviceId: 'srv-1',
    counterId: 'cnt-2'
  };

  const service = Store.getService(activeToken.serviceId) || { name: 'Certificate Application' };
  const counter = Store.getCounter(activeToken.counterId) || Store.getCounters()[1];

  // Update Hero Elements
  const heroTokenEl = document.getElementById('hero-token-number');
  const heroCounterNumEl = document.getElementById('hero-counter-num');
  const heroStationNameEl = document.getElementById('hero-station-name');
  const heroStationRoomEl = document.getElementById('hero-station-room');
  const heroOfficerEl = document.getElementById('hero-station-officer');

  if (heroTokenEl) heroTokenEl.textContent = activeToken.tokenNumber;
  if (heroCounterNumEl) heroCounterNumEl.textContent = counter.number || '02';
  if (heroStationNameEl) heroStationNameEl.textContent = `COUNTER ${counter.number || '02'} — ${service.name.toUpperCase()}`;
  if (heroStationRoomEl) heroStationRoomEl.textContent = `${counter.desk || 'Room 104'} • Ground Floor West Wing`;
  if (heroOfficerEl) heroOfficerEl.textContent = `Officer ${counter.staffName || 'Mark Jenkins'}`;

  // If a new summon occurred
  if (checkSummon && activeToken.id !== lastCalledTokenId) {
    lastCalledTokenId = activeToken.id;
    triggerSummonEffects(activeToken.tokenNumber, counter.name, service.name, counter.desk);
  } else {
    lastCalledTokenId = activeToken.id;
  }

  // Render Up Next Grid
  renderUpNextGrid(tokens);

  // Render Counters Fleet
  renderCountersFleet(counters, tokens);
}

function triggerSummonEffects(tokenNumber, counterName, serviceName, roomDesk) {
  playChime();

  const heroPanel = document.getElementById('now-serving-hero-panel');
  if (heroPanel) {
    heroPanel.classList.remove('now-serving-hero-panel--flash');
    void heroPanel.offsetWidth; // Force reflow
    heroPanel.classList.add('now-serving-hero-panel--flash');
  }

  speakAnnouncement(tokenNumber, counterName, serviceName, roomDesk);
}

function renderUpNextGrid(tokens) {
  const container = document.getElementById('up-next-grid');
  if (!container) return;

  const waitingTokens = tokens.filter(t => t.status === 'waiting');
  const sampleFallback = [
    { num: 'A006', desk: 'Counter 01', srv: 'Civil Registry', status: 'Preparing', time: 'Est: ~1m' },
    { num: 'A007', desk: 'Counter 03', srv: 'ID Verify', status: 'Door B Area', time: 'Est: ~3m' },
    { num: 'A008', desk: 'Counter 02', srv: 'Certificates', status: 'In 4 mins', time: 'Est: ~5m' },
    { num: 'P001', desk: 'Counter 04', srv: 'Special Care', status: 'Expedited Lane', time: 'Next Direct', isPriority: true }
  ];

  container.innerHTML = sampleFallback.map((item, idx) => {
    const isPriority = item.isPriority;
    return `
      <div class="up-next-card ${isPriority ? 'up-next-card--priority' : ''}">
        <div class="up-next-card__top">
          <span>${isPriority ? 'PRIORITY PASS' : (idx === 0 ? 'NEXT IN LINE' : `ESTIMATED #${idx + 1}`)}</span>
          <span>${item.desk}</span>
        </div>
        <div class="up-next-card__num">${item.num}</div>
        <div class="up-next-card__bottom">
          <span>${item.srv}</span>
          <span>${item.time}</span>
        </div>
      </div>
    `;
  }).join('');
}

function renderCountersFleet(counters, tokens) {
  const container = document.getElementById('counters-fleet-grid');
  if (!container) return;

  container.innerHTML = counters.map(cnt => {
    const isRecess = cnt.status === 'recess';
    const isAvailable = cnt.status === 'available';
    const isServing = cnt.status === 'serving' || cnt.status === 'calling';

    let tokenText = cnt.status === 'recess' ? 'RECESS' : (isAvailable ? 'READY' : 'A-005');
    if (cnt.currentTokenId) {
      const tok = tokens.find(t => t.id === cnt.currentTokenId);
      if (tok) tokenText = tok.tokenNumber;
    }

    let statusColor = isRecess ? '#F59E0B' : (isServing ? '#3B82F6' : '#10B981');

    return `
      <div class="counter-fleet-card ${isServing ? 'counter-fleet-card--active' : ''}">
        <div class="counter-fleet-card__header">
          <span>DESK ${cnt.number}</span>
          <span style="width:6px; height:6px; border-radius:50%; background:${statusColor};"></span>
        </div>
        <div class="counter-fleet-card__token">${tokenText}</div>
        <div class="counter-fleet-card__sub">${cnt.serviceType || 'General Intake'}</div>
      </div>
    `;
  }).join('');
}

/* --------------------------------------------------------------------------
   5. Signage State Modes (Live, No Serving, Cleared, Closed)
   -------------------------------------------------------------------------- */
export function setSignageState(state) {
  currentState = state;

  const heroPanel = document.getElementById('now-serving-hero-panel');
  const heroTokenEl = document.getElementById('hero-token-number');
  const heroStationNameEl = document.getElementById('hero-station-name');
  const heroSubEl = document.getElementById('hero-status-subtitle');

  // Update button highlights
  document.querySelectorAll('.signage-tool-btn').forEach(btn => {
    const btnState = btn.getAttribute('data-state');
    btn.classList.toggle('signage-tool-btn--active', btnState === state);
  });

  if (state === 'live') {
    if (heroSubEl) heroSubEl.textContent = 'AUDIO SUMMON ACTIVE • CHIME BROADCASTED';
    renderSignageData();
  } else if (state === 'no_serving') {
    if (heroTokenEl) heroTokenEl.textContent = '----';
    if (heroStationNameEl) heroStationNameEl.textContent = 'ALL COUNTERS IDLE • STAND BY';
    if (heroSubEl) heroSubEl.textContent = 'SYSTEM ACTIVE • NO ACTIVE CITIZEN SUMMON';
  } else if (state === 'cleared') {
    if (heroTokenEl) heroTokenEl.textContent = 'CLEAR';
    if (heroStationNameEl) heroStationNameEl.textContent = 'QUEUE IS CURRENTLY EMPTY';
    if (heroSubEl) heroSubEl.textContent = 'ALL REGISTERED TICKETS HAVE BEEN SERVED';
  } else if (state === 'closed') {
    if (heroTokenEl) heroTokenEl.textContent = 'CLOSED';
    if (heroStationNameEl) heroStationNameEl.textContent = 'CIVIC RECEPTION CLOSED FOR THE DAY';
    if (heroSubEl) heroSubEl.textContent = 'REOPENS TOMORROW AT 08:00 AM';
  }
}

function setupStateButtons() {
  document.querySelectorAll('.signage-tool-btn[data-state]').forEach(btn => {
    btn.addEventListener('click', () => {
      const state = btn.getAttribute('data-state');
      setSignageState(state);
    });
  });

  // Manual Chime trigger test
  const chimeBtn = document.getElementById('btn-signage-chime');
  if (chimeBtn) {
    chimeBtn.addEventListener('click', () => {
      playChime();
      speakAnnouncement('A-005', 'Counter 02', 'Certificate Application', 'Room 104');
    });
  }
}

function syncSignageLangPills() {
  const currentLang = getLanguage();
  document.querySelectorAll('#signage-lang-pills button[data-lang]').forEach(btn => {
    const isMatch = btn.getAttribute('data-lang') === currentLang;
    btn.classList.toggle('signage-tool-btn--active', isMatch);
  });
}

function setupSignageLanguagePills() {
  syncSignageLangPills();
  document.querySelectorAll('#signage-lang-pills button[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
      syncSignageLangPills();
    });
  });
}

window.setSignageState = setSignageState;
window.playChime = playChime;
