const isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.tabs;

class ChromeService {
  /**
   * Check if a URL cannot have scripts injected (chrome://, about:, edge://, etc.)
   * @param {string} url
   * @returns {boolean}
   */
  isRestrictedUrl(url) {
    if (!url) return true;
    return (
      url.startsWith('chrome://') ||
      url.startsWith('chrome-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:') ||
      url.startsWith('view-source:') ||
      url.includes('chromewebstore.google.com') ||
      url.includes('chrome.google.com/webstore')
    );
  }

  /**
   * Get the active tab in current window
   * @returns {Promise<chrome.tabs.Tab|null>}
   */
  async getActiveTab() {
    if (!isExtension) {
      return {
        id: 1,
        url: window.location.href,
        title: document.title || 'Local Preview'
      };
    }

    return new Promise((resolve) => {
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError || !tabs || tabs.length === 0) {
            resolve(null);
            return;
          }
          resolve(tabs[0]);
        });
      } catch (err) {
        console.error('[FloatView ChromeService] getActiveTab error:', err);
        resolve(null);
      }
    });
  }

  /**
   * Send a message to a specific tab
   * @param {number} tabId
   * @param {Object} message
   * @returns {Promise<any>}
   */
  async sendMessageToTab(tabId, message) {
    if (!isExtension) {
      console.log('[FloatView Mock] Sent message to tab:', tabId, message);
      return { success: false, error: 'Not in Chrome extension context' };
    }

    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
            // Could be disconnected or script not injected yet
            resolve({
              success: false,
              error: chrome.runtime.lastError.message || 'Could not communicate with tab content script.'
            });
            return;
          }
          resolve(response || { success: true });
        });
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
  }

  /**
   * Send message to the active tab
   * @param {Object} message
   * @returns {Promise<any>}
   */
  async sendMessageToActiveTab(message) {
    const tab = await this.getActiveTab();
    if (!tab || !tab.id) {
      return { success: false, error: 'No active tab found' };
    }
    if (this.isRestrictedUrl(tab.url)) {
      return {
        success: false,
        isRestricted: true,
        error: 'Picture-in-Picture is not permitted on browser system pages or the Web Store.'
      };
    }
    return this.sendMessageToTab(tab.id, message);
  }

  /**
   * Programmatically inject content script if not already loaded
   * @param {number} tabId
   */
  async ensureContentScriptInjected(tabId) {
    if (!isExtension || !chrome.scripting) return false;
    try {
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['content/content-bundle.js']
      });
      return true;
    } catch (err) {
      console.warn('[FloatView ChromeService] Script injection error:', err);
      return false;
    }
  }

  /**
   * Open the extension options page
   */
  openOptionsPage() {
    if (isExtension && chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open('options.html', '_blank');
    }
  }

  /**
   * Update badge text
   */
  async setBadgeText(text, tabId = null) {
    if (!isExtension || !chrome.action) return;
    try {
      const details = { text: text ? String(text) : '' };
      if (tabId) details.tabId = tabId;
      await chrome.action.setBadgeText(details);
      await chrome.action.setBadgeBackgroundColor({ color: '#ef3939' });
    } catch (e) {
      // Ignore badge errors
    }
  }

  /**
   * Listen to runtime messages
   */
  onMessage(callback) {
    if (isExtension && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener(callback);
      return () => chrome.runtime.onMessage.removeListener(callback);
    }
    return () => {};
  }
}

export const chromeService = new ChromeService();

