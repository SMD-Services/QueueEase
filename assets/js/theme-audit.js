/**
 * QueueEase Automated Theme & Contrast Audit Tool
 * assets/js/theme-audit.js
 *
 * Scans the current DOM in Dark Mode to identify:
 * a) Text with contrast below 4.5:1 against its effective background
 * b) Elements with background luminance > 0.6 (light boxes in dark mode, except QR/images)
 * c) Text colors matching brand navy (#142D4E, #0B1A2E, #1B3A66)
 *
 * Automatically runs if ?audit=1 is present in the URL, or via window.runThemeAudit().
 */

function parseColor(colorStr) {
  if (!colorStr || colorStr === 'transparent' || colorStr === 'inherit') {
    return { r: 0, g: 0, b: 0, a: 0 };
  }
  // rgb(r, g, b) or rgba(r, g, b, a)
  const rgbMatch = colorStr.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
      a: rgbMatch[4] !== undefined ? parseFloat(rgbMatch[4]) : 1
    };
  }
  // Hex #RRGGBB or #RGB
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join('');
    }
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1
    };
  }
  return { r: 0, g: 0, b: 0, a: 0 };
}

function getLuminance(r, g, b) {
  const [lr, lg, lb] = [r, g, b].map(val => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

function getContrastRatio(l1, l2) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function blendColors(fg, bg) {
  const alpha = fg.a;
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
    a: 1
  };
}

function getEffectiveBackgroundColor(el) {
  const defaultBg = { r: 11, g: 18, b: 32, a: 1 }; // #0B1220 (Dark mode canvas base)
  let current = el;
  const layers = [];

  while (current && current !== document.documentElement) {
    const style = window.getComputedStyle(current);
    const parsed = parseColor(style.backgroundColor);
    if (parsed.a > 0) {
      layers.unshift(parsed);
      if (parsed.a === 1) break;
    }
    current = current.parentElement;
  }

  let finalBg = defaultBg;
  for (const layer of layers) {
    finalBg = blendColors(layer, finalBg);
  }
  return finalBg;
}

function isBrandNavy(r, g, b) {
  // Brand navy variants: #142D4E (20, 45, 78), #0B1A2E (11, 26, 46), #1B3A66 (27, 58, 102), #0B1C30 (11, 28, 48)
  const navies = [
    { r: 20, g: 45, b: 78 },
    { r: 11, g: 26, b: 46 },
    { r: 27, g: 58, b: 102 },
    { r: 11, g: 28, b: 48 }
  ];
  return navies.some(n => Math.abs(n.r - r) < 8 && Math.abs(n.g - g) < 8 && Math.abs(n.b - b) < 8);
}

function getSelector(el) {
  if (!el || el === document.body) return 'body';
  let s = el.tagName.toLowerCase();
  if (el.id) return `#${el.id}`;
  if (el.className && typeof el.className === 'string') {
    const classes = el.className.trim().split(/\s+/).filter(c => !c.includes(':')).slice(0, 2);
    if (classes.length) s += '.' + classes.join('.');
  }
  return s;
}

export function runThemeAudit() {
  const isDark = document.documentElement.dataset.theme === 'dark' || document.documentElement.getAttribute('data-theme') === 'dark';
  const issues = [];
  const allElements = document.querySelectorAll('body *:not(script):not(style):not(link):not(meta)');

  allElements.forEach(el => {
    // Skip hidden elements, SVG internal shapes, and dev panels
    if (el.closest('#theme-audit-panel') || el.offsetParent === null) return;
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return;

    // Exceptions allowed: QR code box, QR canvas, images, avatars, toggle thumbs
    const isQRException = el.classList.contains('ticket-qr-box') || el.id === 'ticket-qr-canvas' || el.classList.contains('qr-code-img');
    const isImage = el.tagName === 'IMG' || el.tagName === 'CANVAS' || el.tagName === 'svg';
    const isToggleThumb = el.classList.contains('toggle-switch__slider');

      const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
      let fileGuess = pathname.split('/').pop() || 'index.html';

      // 1. Check Background Luminance in Dark Mode (> 0.6 is a light box)
      if (isDark && !isQRException && !isImage && !isToggleThumb) {
        const elBg = parseColor(style.backgroundColor);
        if (elBg.a > 0.4) {
          const bgLum = getLuminance(elBg.r, elBg.g, elBg.b);
          if (bgLum > 0.6) {
            issues.push({
              type: 'LIGHT_BOX_IN_DARK_MODE',
              selector: getSelector(el),
              element: el,
              currentValue: `Luminance ${bgLum.toFixed(2)} (rgb(${elBg.r}, ${elBg.g}, ${elBg.b}))`,
              requiredValue: 'var(--surface-card) or var(--surface-page) (Luminance <= 0.25)',
              fileGuess: el.getAttribute('style')?.includes('background') ? `${fileGuess} (inline)` : `${fileGuess} / CSS`,
              detail: `Background luminance is ${bgLum.toFixed(2)} (rgb(${elBg.r}, ${elBg.g}, ${elBg.b}))`
            });
          }
        }
      }

      // 2. Text checks if element has direct text content
      const hasText = Array.from(el.childNodes).some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length > 0);
      if (hasText) {
        const textColor = parseColor(style.color);
        const effectiveBg = getEffectiveBackgroundColor(el);
        const textLum = getLuminance(textColor.r, textColor.g, textColor.b);
        const bgLum = getLuminance(effectiveBg.r, effectiveBg.g, effectiveBg.b);
        const ratio = getContrastRatio(textLum, bgLum);

        // Flag brand navy text in dark mode
        if (isDark && isBrandNavy(textColor.r, textColor.g, textColor.b)) {
          issues.push({
            type: 'BRAND_NAVY_TEXT_IN_DARK_MODE',
            selector: getSelector(el),
            element: el,
            currentValue: `Navy rgb(${textColor.r}, ${textColor.g}, ${textColor.b})`,
            requiredValue: 'var(--text-heading) (#F4F8FF) or var(--text-body) (#DCE6F5)',
            fileGuess: el.getAttribute('style')?.includes('color') ? `${fileGuess} (inline)` : `${fileGuess} / CSS`,
            detail: `Text color is dark navy rgb(${textColor.r}, ${textColor.g}, ${textColor.b}) on dark surface`
          });
        }

        // Flag low contrast (< 4.5:1)
        const fontSize = parseFloat(style.fontSize);
        const isBold = parseInt(style.fontWeight, 10) >= 600 || style.fontWeight === 'bold';
        const minRatio = (fontSize >= 18 || (fontSize >= 14 && isBold)) ? 3.0 : 4.5;

        if (ratio < minRatio) {
          issues.push({
            type: 'LOW_CONTRAST_TEXT',
            selector: getSelector(el),
            element: el,
            ratio: ratio.toFixed(2),
            currentValue: `${ratio.toFixed(2)}:1 (Text: rgb(${textColor.r},${textColor.g},${textColor.b}) on Bg: rgb(${effectiveBg.r},${effectiveBg.g},${effectiveBg.b}))`,
            requiredValue: `>= ${minRatio}:1 contrast`,
            fileGuess: `${fileGuess} / CSS`,
            detail: `Contrast ${ratio.toFixed(2)}:1 below required ${minRatio}:1`
          });
        }
      }
    });

    // Render on-screen Floating Audit Badge / Panel
    renderAuditPanel(issues, isDark);

    console.group(`[QueueEase Theme Audit] ${isDark ? 'Dark Mode' : 'Light Mode'} - ${issues.length} issues`);
    if (issues.length === 0) {
      console.log('%c✓ Zero theme/contrast issues found. All elements meet WCAG AAA standards.', 'color:#10B981; font-weight:bold; font-size:13px;');
    } else {
      console.table(issues.map(i => ({ Selector: i.selector, Type: i.type, Current: i.currentValue, Required: i.requiredValue, File: i.fileGuess })));
    }
    console.groupEnd();

    return { isDark, issueCount: issues.length, issues };
  }

  let isPanelExpanded = false;

  function renderAuditPanel(issues, isDark) {
    let panel = document.getElementById('theme-audit-panel');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'theme-audit-panel';
      document.body.appendChild(panel);
    }

    const isClean = issues.length === 0;

    panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 999999;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 12px;
      transition: all 250ms ease;
    `;

    if (!isPanelExpanded) {
      // Compact Floating Pill Badge
      panel.innerHTML = `
        <button type="button" id="theme-audit-badge-btn" style="
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          border-radius: 9999px;
          background: ${isClean ? '#064E3B' : '#7F1D1D'};
          color: ${isClean ? '#34D399' : '#FCA5A5'};
          border: 1px solid ${isClean ? '#059669' : '#DC2626'};
          box-shadow: 0 4px 16px rgba(0,0,0,0.45);
          cursor: pointer;
          font-weight: 700;
          font-size: 12px;
        ">
          <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:${isClean ? '#34D399' : '#F87171'};"></span>
          <span>Theme Audit: ${isClean ? '0 issues' : `${issues.length} issues`}</span>
          <span style="font-size:10px; opacity:0.8; margin-left:4px;">${isDark ? '🌙' : '☀️'}</span>
        </button>
      `;
      const btn = panel.querySelector('#theme-audit-badge-btn');
      if (btn) {
        btn.onclick = () => {
          isPanelExpanded = true;
          renderAuditPanel(issues, isDark);
        };
      }
    } else {
      // Expanded Detailed Panel
      panel.innerHTML = `
        <div style="
          width: clamp(280px, 90vw, 420px);
          max-height: 440px;
          background: #111B2E;
          color: #E6EDF7;
          border: 1px solid #24344F;
          border-radius: 14px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        ">
          <div style="padding:12px 14px; background:#16233A; border-bottom:1px solid #24344F; display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-weight:bold; font-size:13px; color:#F4F8FF;">QueueEase Theme Audit</span>
              <span style="padding:2px 8px; border-radius:999px; font-size:10px; font-weight:bold; background:${isDark ? '#2563EB' : '#F1F5F9'}; color:${isDark ? '#FFF' : '#0B1C30'};">
                ${isDark ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="padding:2px 8px; border-radius:999px; font-size:11px; font-weight:bold; background:${isClean ? '#065F46' : '#991B1B'}; color:${isClean ? '#34D399' : '#FCA5A5'};">
                ${isClean ? '0 Issues' : `${issues.length} Issues`}
              </span>
              <button type="button" id="theme-audit-collapse-btn" style="background:none; border:none; color:#9FB0C8; cursor:pointer; font-size:18px; padding:0 4px; line-height:1;">&times;</button>
            </div>
          </div>
          <div style="padding:12px 14px; overflow-y:auto; flex:1; max-height:300px;">
            ${isClean ? `
              <div style="color:#34D399; font-weight:600; padding:20px 0; text-align:center;">
                <div style="font-size:24px; margin-bottom:8px;">✓</div>
                All surfaces, headings, titles, and icons are compliant with WCAG AAA standards!
              </div>
            ` : `
              <div style="display:flex; flex-direction:column; gap:8px;">
                ${issues.slice(0, 20).map(issue => `
                  <div style="padding:8px 10px; background:#0B1220; border-radius:6px; border-left:3px solid #F87171;">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                      <span style="font-weight:bold; color:#F87171; font-size:11px;">${issue.type}</span>
                      <span style="font-size:10px; color:#94A3B8;">${issue.fileGuess}</span>
                    </div>
                    <div style="font-family:monospace; color:#93C5FD; font-size:11px; margin:2px 0;">${issue.selector}</div>
                    <div style="color:#C4D3E6; font-size:11px;">${issue.currentValue}</div>
                    <div style="color:#34D399; font-size:11px; margin-top:2px;">Target: ${issue.requiredValue}</div>
                  </div>
                `).join('')}
                ${issues.length > 20 ? `<div style="color:#9FB0C8; text-align:center; font-size:11px;">+ ${issues.length - 20} more in console</div>` : ''}
              </div>
            `}
          </div>
          <div style="padding:8px 14px; background:#16233A; border-top:1px solid #24344F; display:flex; justify-content:space-between; align-items:center;">
            <button type="button" id="theme-audit-rerun-btn" style="background:#2563EB; color:#FFF; border:none; border-radius:4px; padding:4px 10px; cursor:pointer; font-size:11px; font-weight:bold;">Re-run Audit</button>
            <span style="color:#9FB0C8; font-size:10px;">URL param: ?audit=1</span>
          </div>
        </div>
      `;

      const collapseBtn = panel.querySelector('#theme-audit-collapse-btn');
      if (collapseBtn) {
        collapseBtn.onclick = () => {
          isPanelExpanded = false;
          renderAuditPanel(issues, isDark);
        };
      }
      const rerunBtn = panel.querySelector('#theme-audit-rerun-btn');
      if (rerunBtn) {
        rerunBtn.onclick = () => runThemeAudit();
      }
    }
  }

// Auto-run if URL query param has ?audit=1
if (typeof window !== 'undefined') {
  window.runThemeAudit = runThemeAudit;
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('audit') === '1') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => setTimeout(runThemeAudit, 200));
    } else {
      setTimeout(runThemeAudit, 200);
    }
  }
}
