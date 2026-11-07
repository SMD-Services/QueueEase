/**
 * QueueEase Global Accessibility & Localization System
 * assets/js/a11y.js
 * 
 * Manages:
 * 1. Comfortable Civic Navy Theme (Dark / Light / Auto)
 * 2. Text-size scaling (90% to 130%)
 * 3. Auditory speech synthesis guidance (English / Hindi / Marathi)
 * 4. Multi-language dictionary delegation to assets/js/i18n.js
 */

import './theme-audit.js';
import { t, getLanguage as getI18nLang, setLanguage as setI18nLang, speakVoice, applyTranslations, DICTIONARIES } from './i18n.js';

export { t, DICTIONARIES as I18N };

const A11Y_KEYS = {
  THEME_MODE: 'queueease_theme_mode', // 'auto' | 'dark' | 'light'
  TEXT_SIZE: 'queueease_a11y_text_size',
  SPEECH: 'queueease_a11y_speech',
  FAST_TRACK: 'queueease_a11y_senior_fast_track'
};

export const A11y = {
  // Theme Management: 'auto' | 'dark' | 'light' (Comfortable Civic Navy)
  getThemeMode() {
    return localStorage.getItem(A11Y_KEYS.THEME_MODE) || 'auto';
  },
  setThemeMode(mode) {
    const validMode = ['auto', 'dark', 'light'].includes(mode) ? mode : 'auto';
    localStorage.setItem(A11Y_KEYS.THEME_MODE, validMode);
    this.applyTheme();
  },
  isDarkMode() {
    const mode = this.getThemeMode();
    if (mode === 'dark') return true;
    if (mode === 'light') return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  },
  applyTheme() {
    const isDark = this.isDarkMode();
    const mode = this.getThemeMode();

    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');

    // Update <meta name="theme-color"> for mobile chrome
    let themeMeta = document.querySelector('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.setAttribute('name', 'theme-color');
      document.head.appendChild(themeMeta);
    }
    themeMeta.setAttribute('content', isDark ? '#0B1220' : '#F8FAFC');

    // Keep any dark-mode toggles in sync
    const toggles = document.querySelectorAll('#toggle-dark-mode, #toggle-high-contrast, [data-a11y-toggle="dark"]');
    toggles.forEach(t => {
      t.checked = isDark;
      t.setAttribute('aria-checked', isDark ? 'true' : 'false');
    });

    // Keep segmented theme controls in sync
    const choiceButtons = document.querySelectorAll('[data-theme-choice]');
    choiceButtons.forEach(btn => {
      const choice = btn.getAttribute('data-theme-choice');
      const active = choice === mode;
      btn.classList.toggle('segmented-control__item--active', active);
      btn.setAttribute('aria-checked', active ? 'true' : 'false');
    });

    window.dispatchEvent(new CustomEvent('queueease_theme_change', { detail: { mode, isDark } }));
    window.dispatchEvent(new CustomEvent('queueease_contrast_change', { detail: { enabled: isDark, mode } }));
  },

  // Backward-compatibility aliases
  isContrast() {
    return this.isDarkMode();
  },
  setContrast(enable) {
    this.setThemeMode(enable ? 'dark' : 'light');
  },
  applyContrast() {
    this.applyTheme();
  },

  // Text Scaling: 'compact' (90%), 'default' (100%), 'large' (115%), 'xlarge' (130%)
  getTextSize() {
    return localStorage.getItem(A11Y_KEYS.TEXT_SIZE) || 'default';
  },
  setTextSize(size) {
    localStorage.setItem(A11Y_KEYS.TEXT_SIZE, size);
    this.applyTextSize();
  },
  applyTextSize() {
    const size = this.getTextSize();
    let fontSize = '16px';
    if (size === 'compact') fontSize = '14px';
    else if (size === 'large') fontSize = '18px';
    else if (size === 'xlarge') fontSize = '20px';

    document.documentElement.style.fontSize = fontSize;
  },

  // Auditory Guidance (Delegates to i18n voice engine with Marathi / Hindi / English)
  isSpeechEnabled() {
    const stored = localStorage.getItem(A11Y_KEYS.SPEECH);
    return stored === null ? true : stored === 'true';
  },
  setSpeechEnabled(enable) {
    localStorage.setItem(A11Y_KEYS.SPEECH, enable ? 'true' : 'false');
  },
  speak(textOrKey, params = {}) {
    if (!this.isSpeechEnabled()) return;
    speakVoice(textOrKey, params);
  },

  // Multi-Language Delegation
  getLanguage() {
    return getI18nLang();
  },
  setLanguage(langCode) {
    setI18nLang(langCode);
  },
  applyLanguage() {
    applyTranslations();
  },
  t(key, params) {
    return t(key, params);
  },

  // Senior Fast-Track setting
  isSeniorFastTrack() {
    return localStorage.getItem(A11Y_KEYS.FAST_TRACK) === 'true';
  },
  setSeniorFastTrack(enabled) {
    localStorage.setItem(A11Y_KEYS.FAST_TRACK, enabled ? 'true' : 'false');
  },

  // Initialize all settings on load
  init() {
    this.applyTheme();
    this.applyTextSize();
    this.applyLanguage();

    // Listen for OS dark mode changes when user has set mode to 'auto'
    if (window.matchMedia) {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const osHandler = () => {
        if (this.getThemeMode() === 'auto') {
          this.applyTheme();
        }
      };
      if (mql.addEventListener) {
        mql.addEventListener('change', osHandler);
      } else if (mql.addListener) {
        mql.addListener(osHandler);
      }
    }
  }
};

// Auto-run on script execution so every page is immediately adjusted
A11y.init();
