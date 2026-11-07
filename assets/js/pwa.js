/**
 * QueueEase PWA Integration & Mobile Install Banner
 * assets/js/pwa.js
 */

import { showToast } from '/assets/js/ui.js';

let deferredInstallPrompt = null;

export function initPWA() {
  // 1. Register Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => {
          // Check for worker updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  showToast('New municipal dispatch engine version available. Refreshing...', 'info');
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn('[PWA] Service worker registration note:', err);
        });
    });
  }

  // 2. Connectivity Indicators (Online / Offline)
  window.addEventListener('online', () => {
    showToast('Network restored. Re-synchronized with Central Civic Hub.', 'success');
  });

  window.addEventListener('offline', () => {
    showToast('Offline Mode: Your active token pass remains cached and accessible.', 'warning', 6000);
  });

  // 3. In-App Install Prompt Banner on Mobile
  setupInstallBanner();
}

function setupInstallBanner() {
  // Check if already running in standalone mode (already installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator).standalone === true;
  if (isStandalone) return;

  // Check if user dismissed previously in this session
  if (sessionStorage.getItem('queueease_pwa_prompt_dismissed') === 'true') {
    return;
  }

  const isIOS = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

  // Capture Android / Chromium beforeinstallprompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    renderInstallBanner(false);
  });

  // For iOS Safari, show prompt once on mobile if visited from browser
  if (isIOS && window.innerWidth <= 768) {
    setTimeout(() => {
      renderInstallBanner(true);
    }, 2000);
  }
}

function renderInstallBanner(isIOS = false) {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.setAttribute('role', 'complementary');
  banner.setAttribute('aria-label', 'Install Application Notice');
  banner.style.cssText = `
    position: fixed;
    bottom: calc(72px + env(safe-area-inset-bottom, 0px));
    left: 12px;
    right: 12px;
    max-width: 420px;
    margin: 0 auto;
    background: #0F234A;
    color: #FFFFFF;
    border-radius: var(--radius-card, 12px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.15);
    padding: 12px 14px;
    z-index: var(--z-toast, 900);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  banner.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="width:38px; height:38px; border-radius:8px; background:#2563EB; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
        <span class="material-symbols-outlined" style="font-size:20px; color:#FFFFFF;">install_mobile</span>
      </div>
      <div>
        <div style="font-size:13px; font-weight:bold; line-height:1.2;">Install QueueEase Pass</div>
        <div style="font-size:11px; color:#93C5FD;">Add to home screen for lock-screen alerts & offline tokens</div>
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
      <button type="button" class="btn btn--primary" id="btn-pwa-install-action" style="padding:6px 12px; font-size:12px; height:32px; background:#2563EB;">
        ${isIOS ? 'Instructions' : 'Install'}
      </button>
      <button type="button" id="btn-pwa-dismiss" aria-label="Dismiss banner" style="background:none; border:none; color:#94A3B8; cursor:pointer; padding:4px; display:flex; align-items:center;">
        <span class="material-symbols-outlined" style="font-size:18px;">close</span>
      </button>
    </div>
  `;

  document.body.appendChild(banner);

  document.getElementById('btn-pwa-dismiss').addEventListener('click', () => {
    banner.remove();
    sessionStorage.setItem('queueease_pwa_prompt_dismissed', 'true');
  });

  document.getElementById('btn-pwa-install-action').addEventListener('click', async () => {
    if (isIOS) {
      alert("To install QueueEase on iOS:\n1. Tap the Share button at the bottom of Safari.\n2. Scroll down and tap 'Add to Home Screen'.");
      banner.remove();
      return;
    }

    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        showToast('Thank you! QueueEase has been added to your device.', 'success');
      }
      deferredInstallPrompt = null;
      banner.remove();
    }
  });
}

// Auto-run when imported in browser
if (typeof window !== 'undefined') {
  initPWA();
}
