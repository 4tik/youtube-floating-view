import { MESSAGE_TYPES, STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants/extension.js';

// Setup Context Menus on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'floatview-toggle-pip',
      title: 'Float this video (FloatView PiP)',
      contexts: ['video', 'page', 'frame']
    });
  });

  // Initialize storage defaults if empty
  const storageArea = chrome.storage.sync || chrome.storage.local;
  storageArea.get(DEFAULT_SETTINGS, (stored) => {
    storageArea.set({ ...DEFAULT_SETTINGS, ...stored });
  });
});

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'floatview-toggle-pip' && tab && tab.id) {
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: MESSAGE_TYPES.TOGGLE_PIP
      });
    } catch (err) {
      console.warn('[FloatView Background] Failed to send context menu command:', err);
    }
  }
});

// Handle Keyboard Shortcuts (e.g., Alt + Shift + P)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-pip') {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        await chrome.tabs.sendMessage(activeTab.id, {
          type: MESSAGE_TYPES.TOGGLE_PIP
        });
      }
    } catch (err) {
      console.warn('[FloatView Background] Shortcut execution error:', err);
    }
  }
});

// Update badge count when tab receives video info
chrome.runtime.onMessage.addListener((message, sender) => {
  if (!sender.tab || !sender.tab.id) return;

  if (message.type === MESSAGE_TYPES.VIDEO_LIST_CHANGED || message.type === MESSAGE_TYPES.PIP_STATE_CHANGED) {
    const storageArea = chrome.storage.sync || chrome.storage.local;
    storageArea.get({ [STORAGE_KEYS.SHOW_BADGE]: true }, (settings) => {
      if (!settings[STORAGE_KEYS.SHOW_BADGE]) {
        chrome.action.setBadgeText({ tabId: sender.tab.id, text: '' });
        return;
      }

      // Query tab for video count
      chrome.tabs.sendMessage(sender.tab.id, { type: MESSAGE_TYPES.DETECT_VIDEOS }, (res) => {
        if (chrome.runtime.lastError || !res || !res.videos) return;
        const count = res.videos.length;
        const hasPip = res.videos.some((v) => v.inPiP);

        chrome.action.setBadgeText({
          tabId: sender.tab.id,
          text: count > 0 ? (hasPip ? 'PiP' : String(count)) : ''
        });
        chrome.action.setBadgeBackgroundColor({
          tabId: sender.tab.id,
          color: hasPip ? '#10b981' : '#ef3939'
        });
      });
    });
  }
});

// Clear badge on tab navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ tabId, text: '' });
  }
});

