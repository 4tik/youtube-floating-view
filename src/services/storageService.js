import { DEFAULT_SETTINGS } from '../constants/extension.js';

const isExtensionContext = typeof chrome !== 'undefined' && chrome.storage;

class StorageService {
  /**
   * Get value from Chrome storage (prefers sync, falls back to local and localStorage)
   * @param {string} key
   * @param {*} defaultValue
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    if (!isExtensionContext) {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : (defaultValue ?? DEFAULT_SETTINGS[key]);
    }

    return new Promise((resolve) => {
      try {
        const storageArea = chrome.storage.sync || chrome.storage.local;
        storageArea.get([key], (result) => {
          if (chrome.runtime.lastError) {
            console.warn('[FloatView Storage] sync.get error, trying local:', chrome.runtime.lastError);
            if (chrome.storage.local && storageArea !== chrome.storage.local) {
              chrome.storage.local.get([key], (localResult) => {
                const val = localResult && localResult[key] !== undefined ? localResult[key] : (defaultValue ?? DEFAULT_SETTINGS[key]);
                resolve(val);
              });
              return;
            }
            resolve(defaultValue ?? DEFAULT_SETTINGS[key]);
            return;
          }
          const val = result && result[key] !== undefined ? result[key] : (defaultValue ?? DEFAULT_SETTINGS[key]);
          resolve(val);
        });
      } catch (err) {
        console.error('[FloatView Storage] get exception:', err);
        resolve(defaultValue ?? DEFAULT_SETTINGS[key]);
      }
    });
  }

  /**
   * Get all extension settings with defaults merged
   * @returns {Promise<Object>}
   */
  async getAllSettings() {
    if (!isExtensionContext) {
      const settings = { ...DEFAULT_SETTINGS };
      for (const key of Object.keys(DEFAULT_SETTINGS)) {
        const val = localStorage.getItem(key);
        if (val !== null) settings[key] = JSON.parse(val);
      }
      return settings;
    }

    return new Promise((resolve) => {
      try {
        const storageArea = chrome.storage.sync || chrome.storage.local;
        storageArea.get(DEFAULT_SETTINGS, (result) => {
          if (chrome.runtime.lastError) {
            console.warn('[FloatView Storage] Error fetching all settings:', chrome.runtime.lastError);
            resolve({ ...DEFAULT_SETTINGS });
            return;
          }
          resolve({ ...DEFAULT_SETTINGS, ...(result || {}) });
        });
      } catch (err) {
        console.error('[FloatView Storage] getAllSettings exception:', err);
        resolve({ ...DEFAULT_SETTINGS });
      }
    });
  }

  /**
   * Set a key-value pair in Chrome storage
   * @param {string} key
   * @param {*} value
   * @returns {Promise<boolean>}
   */
  async set(key, value) {
    return this.setMultiple({ [key]: value });
  }

  /**
   * Set multiple key-value pairs
   * @param {Object} items
   * @returns {Promise<boolean>}
   */
  async setMultiple(items) {
    if (!isExtensionContext) {
      Object.entries(items).forEach(([k, v]) => {
        localStorage.setItem(k, JSON.stringify(v));
      });
      return true;
    }

    return new Promise((resolve) => {
      try {
        const storageArea = chrome.storage.sync || chrome.storage.local;
        storageArea.set(items, () => {
          if (chrome.runtime.lastError) {
            console.warn('[FloatView Storage] set error, falling back to local:', chrome.runtime.lastError);
            if (chrome.storage.local && storageArea !== chrome.storage.local) {
              chrome.storage.local.set(items, () => resolve(!chrome.runtime.lastError));
              return;
            }
            resolve(false);
            return;
          }
          resolve(true);
        });
      } catch (err) {
        console.error('[FloatView Storage] set exception:', err);
        resolve(false);
      }
    });
  }

  /**
   * Reset settings to default
   * @returns {Promise<boolean>}
   */
  async resetToDefaults() {
    return this.setMultiple(DEFAULT_SETTINGS);
  }

  /**
   * Add listener for changes
   * @param {Function} callback (changes, areaName)
   */
  onChanged(callback) {
    if (isExtensionContext && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener(callback);
      return () => chrome.storage.onChanged.removeListener(callback);
    }
    return () => {};
  }
}

export const storageService = new StorageService();

