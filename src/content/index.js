import {
  getAllVideosInfo,
  getVideoById,
  scanForVideos,
  getOrCreateVideoId
} from './video-detector.js';

import {
  requestPiP,
  exitPiP,
  togglePiP,
  togglePlayback,
  seekBy,
  setCurrentTime,
  toggleMute,
  setVolume
} from './pip-controller.js';

import { initFloatingOverlay } from './floating-button.js';
import { MESSAGE_TYPES, STORAGE_KEYS, DEFAULT_SETTINGS } from '../constants/extension.js';

// Load stored settings and initialize floating button
let currentSettings = { ...DEFAULT_SETTINGS };

if (typeof chrome !== 'undefined' && chrome.storage) {
  const storageArea = chrome.storage.sync || chrome.storage.local;
  storageArea.get(DEFAULT_SETTINGS, (items) => {
    if (items) {
      currentSettings = { ...currentSettings, ...items };
      initFloatingOverlay(currentSettings);
    }
  });

  chrome.storage.onChanged.addListener((changes) => {
    let changed = false;
    for (const [k, v] of Object.entries(changes)) {
      currentSettings[k] = v.newValue;
      changed = true;
    }
    if (changed) {
      initFloatingOverlay(currentSettings);
    }
  });
} else {
  initFloatingOverlay(currentSettings);
}

// Track and broadcast video events
function attachVideoListeners(video) {
  if (video._fvAttached) return;
  video._fvAttached = true;

  const notifyChange = (type) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
        chrome.runtime.sendMessage({
          type: type || MESSAGE_TYPES.VIDEO_LIST_CHANGED,
          videoId: getOrCreateVideoId(video)
        }).catch(() => {
          // Popup might be closed, perfectly normal
        });
      }
    } catch (e) {
      // Ignore context invalidated
    }
  };

  video.addEventListener('enterpictureinpicture', () => {
    notifyChange(MESSAGE_TYPES.PIP_STATE_CHANGED);
  });

  video.addEventListener('leavepictureinpicture', () => {
    notifyChange(MESSAGE_TYPES.PIP_STATE_CHANGED);
    if (currentSettings[STORAGE_KEYS.PAUSE_ON_PIP_CLOSE]) {
      video.pause();
    }
  });

  video.addEventListener('play', () => notifyChange());
  video.addEventListener('pause', () => notifyChange());
  video.addEventListener('volumechange', () => notifyChange());
}

// Observe DOM mutations to pick up dynamically added videos (SPA / YouTube navigation)
const observer = new MutationObserver(() => {
  const videos = scanForVideos();
  videos.forEach(attachVideoListeners);
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// Initial scan
scanForVideos().forEach(attachVideoListeners);

// Auto-PiP on Tab Switch if enabled in settings
document.addEventListener('visibilitychange', () => {
  if (document.hidden && currentSettings[STORAGE_KEYS.AUTO_PIP_TAB_SWITCH]) {
    const videos = scanForVideos();
    const playingVideo = videos.find((v) => !v.paused && !v.ended && v.readyState > 2);
    if (playingVideo && document.pictureInPictureElement !== playingVideo) {
      requestPiP(playingVideo).catch(() => {});
    }
  }
});

// Chrome extension message handler
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!message || !message.type) return false;

    // Helper to find target video
    const resolveVideo = () => {
      if (message.videoId) {
        const found = getVideoById(message.videoId);
        if (found) return found;
      }
      // If no videoId provided, find the active or first video
      const videos = scanForVideos();
      return (
        videos.find((v) => document.pictureInPictureElement === v) ||
        videos.find((v) => !v.paused) ||
        videos[0] ||
        null
      );
    };

    switch (message.type) {
      case MESSAGE_TYPES.DETECT_VIDEOS: {
        const videoList = getAllVideosInfo();
        sendResponse({ success: true, videos: videoList });
        return false;
      }

      case MESSAGE_TYPES.TOGGLE_PIP: {
        const video = resolveVideo();
        if (!video) {
          sendResponse({ success: false, error: 'No video element found to pop out.' });
          return false;
        }

        togglePiP(video)
          .then((res) => sendResponse({ success: true, inPiP: document.pictureInPictureElement === video }))
          .catch((err) => sendResponse({ success: false, error: err.message || 'Failed to enter Picture-in-Picture.' }));
        return true; // async response
      }

      case MESSAGE_TYPES.REQUEST_PIP: {
        const video = resolveVideo();
        if (!video) {
          sendResponse({ success: false, error: 'No video element found.' });
          return false;
        }

        requestPiP(video)
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }

      case MESSAGE_TYPES.EXIT_PIP: {
        exitPiP()
          .then(() => sendResponse({ success: true }))
          .catch((err) => sendResponse({ success: false, error: err.message }));
        return true;
      }

      case MESSAGE_TYPES.TOGGLE_PLAYBACK: {
        const video = resolveVideo();
        if (video) {
          const isPlaying = togglePlayback(video);
          sendResponse({ success: true, isPlaying });
        } else {
          sendResponse({ success: false, error: 'Video not found' });
        }
        return false;
      }

      case MESSAGE_TYPES.SEEK_BY: {
        const video = resolveVideo();
        if (video) {
          seekBy(video, message.seconds || 10);
          sendResponse({ success: true, currentTime: video.currentTime });
        } else {
          sendResponse({ success: false, error: 'Video not found' });
        }
        return false;
      }

      case MESSAGE_TYPES.SET_CURRENT_TIME: {
        const video = resolveVideo();
        if (video) {
          setCurrentTime(video, message.time || 0);
          sendResponse({ success: true, currentTime: video.currentTime });
        } else {
          sendResponse({ success: false, error: 'Video not found' });
        }
        return false;
      }

      case MESSAGE_TYPES.TOGGLE_MUTE: {
        const video = resolveVideo();
        if (video) {
          toggleMute(video);
          sendResponse({ success: true, muted: video.muted });
        } else {
          sendResponse({ success: false, error: 'Video not found' });
        }
        return false;
      }

      case MESSAGE_TYPES.SET_VOLUME: {
        const video = resolveVideo();
        if (video) {
          setVolume(video, message.volume);
          sendResponse({ success: true, volume: video.volume });
        } else {
          sendResponse({ success: false, error: 'Video not found' });
        }
        return false;
      }

      default:
        return false;
    }
  });
}

