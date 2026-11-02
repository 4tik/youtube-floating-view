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
        console.error('[YouTube Floating View ChromeService] getActiveTab error:', err);
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
      return { success: false, error: 'Not in Chrome extension context' };
    }

    return new Promise((resolve) => {
      try {
        chrome.tabs.sendMessage(tabId, message, (response) => {
          if (chrome.runtime.lastError) {
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
      console.warn('[YouTube Floating View] Script injection error:', err);
      return false;
    }
  }

  /**
   * Direct programmatic video detection fallback across all frames and shadow roots
   * @param {number} tabId
   * @returns {Promise<Array>}
   */
  async executeScriptToDetectVideos(tabId) {
    if (!isExtension || !chrome.scripting) return [];

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        func: () => {
          function findVideos(root = document) {
            const list = [];
            try {
              list.push(...Array.from(root.querySelectorAll('video')));
              const ytVid = root.querySelector?.('video.html5-main-video, #movie_player video');
              if (ytVid && !list.includes(ytVid)) {
                list.unshift(ytVid);
              }
              const allElements = root.querySelectorAll('*');
              for (const el of allElements) {
                if (el.shadowRoot) {
                  try {
                    list.push(...Array.from(el.shadowRoot.querySelectorAll('video')));
                  } catch (e) {}
                }
              }
            } catch (e) {}
            return list;
          }

          const videos = findVideos();
          if (!videos.length) return [];

          return videos.map((v, i) => {
            const rect = v.getBoundingClientRect();
            let title = '';
            if (window.location.hostname.includes('youtube.com')) {
              title = document.querySelector('h1.ytd-watch-metadata yt-formatted-string, #title h1, ytd-watch-metadata h1, h1.title')?.textContent?.trim() || '';
            }
            if (!title) {
              title = v.title || v.getAttribute('aria-label') || document.title || `Video #${i + 1}`;
            }

            if (!v.dataset.floatviewId) {
              v.dataset.floatviewId = `fv-vid-${Date.now()}-${i}`;
            }

            return {
              id: v.dataset.floatviewId,
              index: i,
              title: title.slice(0, 100),
              src: v.currentSrc || v.src || '',
              poster: v.poster || '',
              duration: Number.isFinite(v.duration) ? Math.round(v.duration) : 0,
              currentTime: Math.round(v.currentTime || 0),
              paused: v.paused,
              muted: v.muted,
              volume: Math.round(v.volume * 100) / 100,
              inPiP: document.pictureInPictureElement === v,
              canPiP: document.pictureInPictureEnabled && !v.disablePictureInPicture,
              width: v.videoWidth || Math.round(rect.width),
              height: v.videoHeight || Math.round(rect.height),
              isVisible: (rect.width > 20 && rect.height > 20) || (v.videoWidth > 20 && v.videoHeight > 20)
            };
          });
        }
      });

      const aggregated = [];
      if (results && Array.isArray(results)) {
        for (const frameResult of results) {
          if (frameResult && Array.isArray(frameResult.result)) {
            aggregated.push(...frameResult.result);
          }
        }
      }

      aggregated.sort((a, b) => {
        if (a.inPiP && !b.inPiP) return -1;
        if (!a.inPiP && b.inPiP) return 1;
        if (!a.paused && b.paused) return -1;
        if (a.paused && !b.paused) return 1;
        return (b.width * b.height) - (a.width * a.height);
      });

      return aggregated;
    } catch (err) {
      console.warn('[YouTube Floating View] Direct script detection error:', err);
      return [];
    }
  }

  /**
   * Direct programmatic PiP execution fallback
   * @param {number} tabId
   * @param {string} videoId
   */
  async executeScriptToTogglePiP(tabId, videoId) {
    if (!isExtension || !chrome.scripting) return { success: false, error: 'Scripting unavailable' };

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        args: [videoId],
        func: async (targetId) => {
          function findVideos(root = document) {
            const list = [];
            try {
              list.push(...Array.from(root.querySelectorAll('video')));
              const ytVid = root.querySelector?.('video.html5-main-video, #movie_player video');
              if (ytVid && !list.includes(ytVid)) list.unshift(ytVid);
              const all = root.querySelectorAll('*');
              for (const el of all) {
                if (el.shadowRoot) {
                  try { list.push(...Array.from(el.shadowRoot.querySelectorAll('video'))); } catch (e) {}
                }
              }
            } catch (e) {}
            return list;
          }

          const videos = findVideos();
          let target = null;
          if (targetId) {
            target = videos.find((v) => v.dataset?.floatviewId === targetId);
          }
          if (!target) {
            target = videos.find((v) => document.pictureInPictureElement === v) ||
                     videos.find((v) => !v.paused) ||
                     videos[0];
          }

          if (!target) return { found: false };

          if (target.disablePictureInPicture) {
            target.disablePictureInPicture = false;
          }

          try {
            if (document.pictureInPictureElement === target) {
              await document.exitPictureInPicture();
              return { success: true, inPiP: false, found: true };
            } else {
              await target.requestPictureInPicture();
              return { success: true, inPiP: true, found: true };
            }
          } catch (err) {
            return { success: false, error: err.message, found: true };
          }
        }
      });

      const matched = results?.find((r) => r.result?.found);
      if (matched && matched.result) {
        return matched.result;
      }
      return { success: false, error: 'No video found on page to pop out.' };
    } catch (err) {
      return { success: false, error: err.message };
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
    } catch (e) {}
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
