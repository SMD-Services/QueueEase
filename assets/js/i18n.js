/**
 * QueueEase Global Internationalization (i18n) Engine
 * assets/js/i18n.js
 *
 * Supported Languages:
 * - English (en) [en-IN]
 * - Hindi (hi) [hi-IN]
 * - Marathi (mr) [mr-IN]
 */

import en from './lang/en.js';
import hi from './lang/hi.js';
import mr from './lang/mr.js';

export const DICTIONARIES = { en, hi, mr };
export const SUPPORTED_LANGS = ['en', 'hi', 'mr'];
export const STORAGE_KEY = 'queueease_lang';

export const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN'
};

export const LANG_NAMES = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी'
};

// 1. Current Language Resolver
export function getLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LANGS.includes(saved)) {
      return saved;
    }
    const htmlLang = document.documentElement.getAttribute('lang');
    if (htmlLang && SUPPORTED_LANGS.includes(htmlLang)) {
      return htmlLang;
    }
  } catch (e) {
    // LocalStorage safety
  }
  return 'en';
}

export function getLocale() {
  return LOCALE_MAP[getLanguage()] || 'en-IN';
}

// 2. Translation Lookup Function
export function t(key, params = {}) {
  const lang = getLanguage();
  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  let text = dict[key] || DICTIONARIES.en[key] || key;

  if (typeof text === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach(p => {
      text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
    });
  }

  return text;
}

// 3. Set Language and Re-render DOM
export function setLanguage(lang) {
  if (!SUPPORTED_LANGS.includes(lang)) lang = 'en';

  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch (e) {}

  document.documentElement.setAttribute('lang', lang);
  document.documentElement.lang = lang;

  // Apply to DOM elements with data-i18n attributes
  applyTranslations();

  // Dispatch global event for components and stores to re-render
  window.dispatchEvent(new CustomEvent('queueease_language_change', {
    detail: { lang, locale: LOCALE_MAP[lang], name: LANG_NAMES[lang] }
  }));
}

// 4. DOM Translation Applicator
export function applyTranslations(root = document) {
  // Elements with text translation
  root.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      const translated = t(key);
      if (translated) {
        el.textContent = translated;
      }
    }
  });

  // Elements with placeholder translation
  root.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      el.setAttribute('placeholder', t(key));
    }
  });

  // Elements with aria-label translation
  root.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) {
      el.setAttribute('aria-label', t(key));
    }
  });

  // Elements with title tooltip translation
  root.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    if (key) {
      el.setAttribute('title', t(key));
    }
  });
}

// 5. Date & Time Formatters (Intl with Locale)
export function formatDate(date, options = {}) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const locale = getLocale();
  const defaultOpts = { day: 'numeric', month: 'short', year: 'numeric', ...options };
  try {
    return new Intl.DateTimeFormat(locale, defaultOpts).format(d);
  } catch {
    return d.toLocaleDateString();
  }
}

export function formatTime(date, options = {}) {
  if (!date) return '--:--';
  const d = date instanceof Date ? date : new Date(date);
  const locale = getLocale();
  const defaultOpts = { hour: '2-digit', minute: '2-digit', ...options };
  try {
    return new Intl.DateTimeFormat(locale, defaultOpts).format(d);
  } catch {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}

// 6. Multilingual Web Speech API (Voice System)
let voicesLoaded = false;
let availableVoices = [];

function loadVoices() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  availableVoices = window.speechSynthesis.getVoices();
  voicesLoaded = availableVoices.length > 0;
}

if (typeof window !== 'undefined' && window.speechSynthesis) {
  loadVoices();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => loadVoices();
  }
}

export function speakVoice(textOrKey, params = {}, onEnd = null) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    if (onEnd) onEnd();
    return;
  }

  // Cancel any ongoing utterance
  window.speechSynthesis.cancel();

  // Resolve message text
  const message = DICTIONARIES[getLanguage()]?.[textOrKey] ? t(textOrKey, params) : textOrKey;
  if (!message) return;

  loadVoices();

  const lang = getLanguage();
  const targetLocale = LOCALE_MAP[lang] || 'en-IN';
  const utterance = new SpeechSynthesisUtterance(message);

  let selectedVoice = null;
  let didFallback = false;

  if (lang === 'mr') {
    // Try to find Marathi voice (mr, mr-IN)
    selectedVoice = availableVoices.find(v => v.lang && (v.lang === 'mr-IN' || v.lang.startsWith('mr')));
    if (!selectedVoice) {
      // Fallback to Hindi voice
      selectedVoice = availableVoices.find(v => v.lang && (v.lang === 'hi-IN' || v.lang.startsWith('hi')));
      didFallback = true;
    }
  } else if (lang === 'hi') {
    selectedVoice = availableVoices.find(v => v.lang && (v.lang === 'hi-IN' || v.lang.startsWith('hi')));
  } else {
    // English (Indian or default)
    selectedVoice = availableVoices.find(v => v.lang && (v.lang === 'en-IN' || v.lang.startsWith('en')));
  }

  if (selectedVoice) {
    utterance.voice = selectedVoice;
    utterance.lang = selectedVoice.lang;
  } else {
    utterance.lang = targetLocale;
  }

  utterance.rate = 0.95;
  utterance.pitch = 1.0;

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }

  window.speechSynthesis.speak(utterance);

  // If user requested Marathi but device lacks Marathi TTS engine, alert once gracefully
  if (didFallback && typeof window.showToast === 'function') {
    window.showToast(t('speech_voice_fallback'), 'info', 4000);
  }
}

// 7. Auto-initialize on DOM ready
export function initI18n() {
  const lang = getLanguage();
  document.documentElement.setAttribute('lang', lang);
  document.documentElement.lang = lang;
  applyTranslations();
}

if (typeof window !== 'undefined') {
  window.QueueEaseI18n = {
    t,
    setLanguage,
    getLanguage,
    getLocale,
    applyTranslations,
    formatDate,
    formatTime,
    speakVoice,
    LANG_NAMES,
    SUPPORTED_LANGS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => initI18n());
  } else {
    initI18n();
  }
}

export default {
  t,
  setLanguage,
  getLanguage,
  getLocale,
  applyTranslations,
  formatDate,
  formatTime,
  speakVoice,
  LANG_NAMES,
  SUPPORTED_LANGS
};
