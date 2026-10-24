// settingsStorage.js — Default configuration & localStorage persistence for CCC settings

export const DEFAULT_SETTINGS = {
  callerName: 'Sarah Johnson',
  callerRole: 'Forward Deployed Engineer',
  callerCompany: 'DeepThought CultureTech',
  defaultTimezone: 'IST (UTC+5:30)',
  autoSuggestClose: false,
  confirmBeforeEndingCall: true,
};

const STORAGE_KEY = 'ccc_settings';

export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}
