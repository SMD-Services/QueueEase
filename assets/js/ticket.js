/**
 * QueueEase Ticket & Issue Form Controller
 * assets/js/ticket.js
 */

import { Store } from '/assets/js/store.js';
import { showToast, formatTime } from '/assets/js/ui.js';
import { t } from '/assets/js/i18n.js';
import '/assets/js/a11y.js';

/* --------------------------------------------------------------------------
   1. Issue Token Form Controller (Screen 3)
   -------------------------------------------------------------------------- */
export function initIssueForm() {
  const urlParams = new URLSearchParams(window.location.search);
  const serviceId = urlParams.get('service') || 'srv-1';
  const requestedPriority = urlParams.get('priority') || 'regular';

  const service = Store.getService(serviceId) || Store.getServices()[0];

  // Populate Service Hub Card
  const serviceTitleEl = document.getElementById('hub-service-title');
  const serviceLocEl = document.getElementById('hub-service-location');
  const serviceWaitEl = document.getElementById('hub-service-wait');
  const categoryFieldEl = document.getElementById('designated-category-field');

  if (serviceTitleEl) serviceTitleEl.textContent = service.name;
  if (serviceLocEl) serviceLocEl.textContent = service.counterRange ? `Counter Hall ${service.counterRange.match(/\d+/)?.[0] || '02'}` : 'Counter Hall 02';
  if (serviceWaitEl) serviceWaitEl.textContent = `~${service.avgWaitMins || 15} mins`;
  if (categoryFieldEl) categoryFieldEl.textContent = `${service.name} (${service.category || 'Civil Registry'})`;

  // Priority selector
  let selectedPriority = requestedPriority === 'senior_disabled' ? 'senior' : 'standard';
  const priorityCards = document.querySelectorAll('.radio-card');

  function updatePrioritySelection(val) {
    selectedPriority = val;
    priorityCards.forEach(card => {
      const isSelected = card.getAttribute('data-val') === val;
      card.classList.toggle('radio-card--selected', isSelected);
      
      const checkIcon = card.querySelector('.radio-card__check-icon');
      if (checkIcon) {
        checkIcon.style.display = isSelected ? 'inline-block' : 'none';
      }
    });
  }

  priorityCards.forEach(card => {
    card.addEventListener('click', () => {
      const val = card.getAttribute('data-val');
      updatePrioritySelection(val);
    });
  });

  // Set initial priority based on query param
  updatePrioritySelection(selectedPriority);

  // Checkbox toggle
  const smsCard = document.getElementById('sms-checkbox-card');
  const smsCheckbox = document.getElementById('sms-checkbox');
  if (smsCard && smsCheckbox) {
    smsCard.addEventListener('click', () => {
      const checked = smsCheckbox.classList.toggle('custom-checkbox--checked');
      smsCard.classList.toggle('checkbox-card--active', checked);
    });
  }

  // Form Submission & Validation
  const form = document.getElementById('issue-token-form');
  const nameInput = document.getElementById('citizen-legal-name');
  const phoneInput = document.getElementById('citizen-phone');
  const submitBtn = document.getElementById('btn-generate-token');
  const nameError = document.getElementById('name-error');
  const phoneError = document.getElementById('phone-error');

  if (form && submitBtn) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let isValid = true;
      const nameVal = (nameInput?.value || '').trim();
      const phoneVal = (phoneInput?.value || '').trim();

      // Validate Name (min 2 chars)
      if (nameVal.length < 2) {
        isValid = false;
        if (nameInput) {
          nameInput.classList.add('input-field--error');
          nameInput.setAttribute('aria-invalid', 'true');
        }
        if (nameError) {
          nameError.textContent = t('error_required_field');
          nameError.style.display = 'block';
        }
      } else {
        if (nameInput) {
          nameInput.classList.remove('input-field--error');
          nameInput.setAttribute('aria-invalid', 'false');
        }
        if (nameError) nameError.style.display = 'none';
      }

      // Validate Phone if provided
      if (phoneVal && phoneVal.replace(/\D/g, '').length < 7) {
        isValid = false;
        if (phoneError) {
          phoneError.textContent = t('error_invalid_phone');
          phoneError.style.display = 'block';
        }
      } else {
        if (phoneError) phoneError.style.display = 'none';
      }

      if (!isValid) {
        showToast(t('error_required_field'), 'danger');
        return;
      }

      // Button loading state for 1 second
      submitBtn.disabled = true;
      const originalHtml = submitBtn.innerHTML;
      submitBtn.innerHTML = `
        <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span>
        <span>Securing Place in Queue...</span>
      `;

      setTimeout(() => {
        // Map priority value
        let mappedPriority = 'regular';
        if (selectedPriority === 'senior') mappedPriority = 'senior_disabled';
        else if (selectedPriority === 'mobility') mappedPriority = 'mobility';
        else if (selectedPriority === 'expectant') mappedPriority = 'expectant';

        const countryCode = document.getElementById('country-code-select')?.value || '+1';
        const formattedPhone = phoneVal ? `${countryCode} ${phoneVal}` : '';

        const newToken = Store.createToken({
          serviceId: service.id,
          citizenName: nameVal,
          phone: formattedPhone,
          priority: mappedPriority
        });

        // Set as active session token
        Store.setActiveCitizenToken(newToken.id);
        localStorage.setItem('queueease_force_demo_pass', 'true');

        // Redirect to token page
        window.location.href = `/citizen/token.html?id=${newToken.id}`;
      }, 1000);
    });
  }
}

/* --------------------------------------------------------------------------
   2. Token Generated Page Controller (Screen 4)
   -------------------------------------------------------------------------- */
export function initTokenPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const tokenId = urlParams.get('id');

  let token = Store.getToken(tokenId);
  if (!token) {
    token = Store.getActiveCitizenToken() || Store.getToken('tok-a008');
  }

  if (!token) {
    showToast('Token not found. Loading active queue pass...', 'warning');
    token = Store.getAllTokens()[0];
  }

  // Ensure active token is saved in localStorage so Home shows it under Your Active Passes
  Store.setActiveCitizenToken(token.id);
  localStorage.setItem('queueease_force_demo_pass', 'true');

  const service = Store.getService(token.serviceId) || Store.getServices()[0];
  const counter = Store.getCounter(token.counterId) || Store.getCounters()[1];
  const { position, waitMinutes } = Store.getQueuePosition(token.id);

  // Populate UI
  const serviceNameEl = document.getElementById('ticket-service-name');
  const tokenNumberEl = document.getElementById('ticket-token-number');
  const counterBadgeEl = document.getElementById('ticket-counter-badge');
  const waitMinutesEl = document.getElementById('ticket-wait-minutes');
  const queuePosEl = document.getElementById('ticket-queue-position');
  const issuedTimeEl = document.getElementById('ticket-issued-time');
  const smsNoticeEl = document.getElementById('ticket-sms-text');
  const refIdEl = document.getElementById('ticket-ref-id');

  if (serviceNameEl) serviceNameEl.textContent = service.name;
  if (tokenNumberEl) tokenNumberEl.textContent = token.tokenNumber;
  if (counterBadgeEl) counterBadgeEl.innerHTML = `
    <span class="material-symbols-outlined" style="font-size:18px;">desktop_windows</span>
    <span>${counter ? counter.name : 'Counter 02'} • Desk Assigned</span>
  `;
  if (waitMinutesEl) waitMinutesEl.textContent = `${waitMinutes || service.avgWaitMins || 15} Minutes`;
  if (queuePosEl) queuePosEl.textContent = `${position || 3} Ahead`;
  if (issuedTimeEl) issuedTimeEl.textContent = `Issued: Today, ${formatTime(token.createdAt || Date.now())} • Hall B Desk`;

  if (smsNoticeEl) {
    const maskedPhone = token.phone ? token.phone.replace(/(\d{3})\d{3}(\d{4})/, '$1-***-$2') : '(555) ***-2834';
    smsNoticeEl.innerHTML = `Alerts are linked to <strong>${maskedPhone}</strong>. Feel free to explore the civic lounge or cafeteria while you wait.`;
  }

  if (refIdEl) {
    refIdEl.textContent = `QueueEase Reference ID: #QE-${token.id.slice(-5).toUpperCase()}-B2`;
  }

  // Draw Deterministic QR Code on Canvas
  const qrCanvas = document.getElementById('ticket-qr-canvas');
  if (qrCanvas) {
    drawQRCode(qrCanvas, `QUEUEEASE:${token.tokenNumber}:${token.id}`);
  }

  // Track My Token Button
  const trackBtn = document.getElementById('btn-track-token');
  if (trackBtn) {
    trackBtn.addEventListener('click', () => {
      window.location.href = `/citizen/track.html?token=${token.id}`;
    });
  }

  // Download Token as PNG
  const downloadBtn = document.getElementById('btn-download-token');
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      exportTicketToPng(token, service, counter, waitMinutes, position);
    });
  }

  // Print Token
  const printBtn = document.getElementById('btn-print-token');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

/* --------------------------------------------------------------------------
   3. Deterministic QR Matrix Generator (No External Libraries)
   -------------------------------------------------------------------------- */
export function drawQRCode(canvas, dataString) {
  const ctx = canvas.getContext('2d');
  const size = 25; // 25x25 matrix (Version 2 QR)
  canvas.width = 200;
  canvas.height = 200;
  const cellSize = canvas.width / size;

  // Background
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Initialize grid (0 = light, 1 = dark)
  const grid = Array.from({ length: size }, () => Array(size).fill(0));

  // Helper: Draw Finder Pattern (7x7)
  function drawFinder(startX, startY) {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 || r === 6 || c === 0 || c === 6 || // Outer ring
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)      // Inner solid
        ) {
          grid[startY + r][startX + c] = 1;
        } else {
          grid[startY + r][startX + c] = 0;
        }
      }
    }
  }

  // Place 3 Finder Patterns
  drawFinder(0, 0);                 // Top-Left
  drawFinder(size - 7, 0);          // Top-Right
  drawFinder(0, size - 7);          // Bottom-Left

  // Timing patterns
  for (let i = 8; i < size - 8; i++) {
    grid[6][i] = i % 2 === 0 ? 1 : 0;
    grid[i][6] = i % 2 === 0 ? 1 : 0;
  }

  // Simple alignment pattern at (16, 16)
  for (let r = 16; r <= 20; r++) {
    for (let c = 16; c <= 20; c++) {
      if (r === 16 || r === 20 || c === 16 || c === 20 || (r === 18 && c === 18)) {
        grid[r][c] = 1;
      }
    }
  }

  // Deterministic data seeding from dataString hash
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    hash = (hash * 31 + dataString.charCodeAt(i)) & 0xffffffff;
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Skip finder zones
      const isFinderTL = r < 8 && c < 8;
      const isFinderTR = r < 8 && c >= size - 8;
      const isFinderBL = r >= size - 8 && c < 8;
      const isTiming = r === 6 || c === 6;
      const isAlign = r >= 16 && r <= 20 && c >= 16 && c <= 20;

      if (!isFinderTL && !isFinderTR && !isFinderBL && !isTiming && !isAlign) {
        const bit = ((hash ^ (r * 13 + c * 37)) % 7) === 0 || ((hash + r * c) % 3 === 0);
        grid[r][c] = bit ? 1 : 0;
      }
    }
  }

  // Render grid to canvas
  ctx.fillStyle = '#0B1C30'; // Navy dark modules
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (grid[r][c] === 1) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }
  }
}

/* --------------------------------------------------------------------------
   4. Export Ticket to PNG Canvas
   -------------------------------------------------------------------------- */
function exportTicketToPng(token, service, counter, waitMinutes, position) {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 840;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#F8FAFC';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Card Background
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 40, 40, 520, 760, 24);
  ctx.fill();

  // Top blue bar
  ctx.fillStyle = '#2563EB';
  ctx.fillRect(40, 40, 520, 8);

  // Service Name
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 14px "Hanken Grotesk", sans-serif';
  ctx.fillText('SERVICE CATEGORY', 70, 90);

  ctx.fillStyle = '#0B1C30';
  ctx.font = 'bold 24px "Hanken Grotesk", sans-serif';
  ctx.fillText(service.name, 70, 125);

  // Waiting Tag
  ctx.fillStyle = '#FEF3C7';
  roundRect(ctx, 430, 95, 100, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#B45309';
  ctx.font = 'bold 12px "Hanken Grotesk", sans-serif';
  ctx.fillText('WAITING', 455, 115);

  // Number Box
  ctx.fillStyle = '#F0F7FF';
  roundRect(ctx, 70, 155, 460, 160, 20);
  ctx.fill();

  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 14px "Hanken Grotesk", sans-serif';
  ctx.fillText('YOUR TOKEN NUMBER', 220, 195);

  ctx.fillStyle = '#0B1C30';
  ctx.font = 'bold 64px "Hanken Grotesk", monospace';
  ctx.fillText(token.tokenNumber, 215, 260);

  // Counter Assigned Pill
  ctx.fillStyle = '#2563EB';
  roundRect(ctx, 170, 275, 260, 32, 16);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 14px "Hanken Grotesk", sans-serif';
  ctx.fillText(`${counter ? counter.name : 'Counter 02'} • Desk Assigned`, 205, 296);

  // Stat Tiles
  ctx.fillStyle = '#F8FAFC';
  roundRect(ctx, 70, 335, 220, 80, 16);
  ctx.fill();
  ctx.fillStyle = '#64748B';
  ctx.font = '12px "Hanken Grotesk", sans-serif';
  ctx.fillText('EST. WAIT TIME', 90, 365);
  ctx.fillStyle = '#0B1C30';
  ctx.font = 'bold 22px "Hanken Grotesk", sans-serif';
  ctx.fillText(`${waitMinutes || 15} Minutes`, 90, 395);

  ctx.fillStyle = '#F8FAFC';
  roundRect(ctx, 310, 335, 220, 80, 16);
  ctx.fill();
  ctx.fillStyle = '#64748B';
  ctx.font = '12px "Hanken Grotesk", sans-serif';
  ctx.fillText('QUEUE POSITION', 330, 365);
  ctx.fillStyle = '#0B1C30';
  ctx.font = 'bold 22px "Hanken Grotesk", sans-serif';
  ctx.fillText(`${position || 3} Ahead`, 330, 395);

  // Dashed Line
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.moveTo(80, 445);
  ctx.lineTo(520, 445);
  ctx.stroke();
  ctx.setLineDash([]);

  // Cut-out circles on edges
  ctx.fillStyle = '#F8FAFC';
  ctx.beginPath();
  ctx.arc(40, 445, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(560, 445, 14, 0, Math.PI * 2);
  ctx.fill();

  // QR Code
  const tempQrCanvas = document.createElement('canvas');
  drawQRCode(tempQrCanvas, `QUEUEEASE:${token.tokenNumber}:${token.id}`);
  ctx.drawImage(tempQrCanvas, 220, 480, 160, 160);

  ctx.fillStyle = '#64748B';
  ctx.font = '13px "Hanken Grotesk", sans-serif';
  ctx.fillText('Scan at desk scanner upon arrival', 195, 670);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px "Hanken Grotesk", sans-serif';
  ctx.fillText(`Issued: Today, ${formatTime(token.createdAt || Date.now())} • Hall B Desk`, 165, 710);
  ctx.fillText(`Ref: #QE-${token.id.slice(-5).toUpperCase()}-B2`, 235, 735);

  // Trigger Download
  const link = document.createElement('a');
  link.download = `QueueEase-Pass-${token.tokenNumber}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  showToast('Digital Token Pass downloaded to device', 'success');
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}
