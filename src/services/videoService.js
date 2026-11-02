import { chromeService } from './chromeService.js';
import { MESSAGE_TYPES } from '../constants/extension.js';

class VideoService {
  /**
   * Request list of detected videos from the active tab
   * Uses dual-layer detection: content script messaging + direct script fallback
   * @returns {Promise<{success: boolean, videos: Array, isRestricted?: boolean, error?: string}>}
   */
  async getVideos() {
    const tab = await chromeService.getActiveTab();
    if (!tab) {
      return { success: false, videos: [], error: 'No active tab detected.' };
    }

    if (chromeService.isRestrictedUrl(tab.url)) {
      return {
        success: false,
        videos: [],
        isRestricted: true,
        error: 'Picture-in-Picture cannot run on browser system pages or internal URLs.'
      };
    }

    // Attempt 1: Fast path via content script messaging
    let res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.DETECT_VIDEOS
    });

    // If messaging succeeded and returned videos, return immediately
    if (res && res.success && Array.isArray(res.videos) && res.videos.length > 0) {
      return { success: true, videos: res.videos };
    }

    // Attempt 2: Programmatic fallback directly via chrome.scripting across all frames & shadow roots
    const directVideos = await chromeService.executeScriptToDetectVideos(tab.id);
    if (directVideos && directVideos.length > 0) {
      return { success: true, videos: directVideos };
    }

    // Attempt 3: If still empty/failed, ensure content script is injected and retry
    const injected = await chromeService.ensureContentScriptInjected(tab.id);
    if (injected) {
      await new Promise((r) => setTimeout(r, 120));
      res = await chromeService.sendMessageToActiveTab({
        type: MESSAGE_TYPES.DETECT_VIDEOS
      });
      if (res && res.success && Array.isArray(res.videos) && res.videos.length > 0) {
        return { success: true, videos: res.videos };
      }
    }

    // Final direct script retry
    const finalRetry = await chromeService.executeScriptToDetectVideos(tab.id);
    if (finalRetry && finalRetry.length > 0) {
      return { success: true, videos: finalRetry };
    }

    return {
      success: true,
      videos: []
    };
  }

  /**
   * Request or toggle PiP on a specific video
   * @param {string} videoId
   */
  async togglePiP(videoId) {
    const tab = await chromeService.getActiveTab();
    if (!tab) return { success: false, error: 'No active tab' };

    // 1. Try messaging content script
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.TOGGLE_PIP,
      videoId
    });

    if (res && res.success) {
      return res;
    }

    // 2. Direct script fallback if message failed or disconnected
    return chromeService.executeScriptToTogglePiP(tab.id, videoId);
  }

  /**
   * Request PiP explicitly
   * @param {string} videoId
   */
  async enterPiP(videoId) {
    return this.togglePiP(videoId);
  }

  /**
   * Exit PiP explicitly
   * @param {string} videoId
   */
  async exitPiP(videoId) {
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.EXIT_PIP,
      videoId
    });
    if (res && res.success) return res;
    const tab = await chromeService.getActiveTab();
    if (tab) return chromeService.executeScriptToTogglePiP(tab.id, videoId);
    return { success: false };
  }

  /**
   * Toggle play / pause on a video
   * @param {string} videoId
   */
  async togglePlayback(videoId) {
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.TOGGLE_PLAYBACK,
      videoId
    });
    if (res && res.success) return res;

    // Direct script fallback
    const tab = await chromeService.getActiveTab();
    if (tab && chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          args: [videoId],
          func: (targetId) => {
            const v = (targetId && document.querySelector(`video[data-floatview-id="${targetId}"]`)) ||
                      document.querySelector('video.html5-main-video') ||
                      document.querySelector('video');
            if (v) {
              if (v.paused) v.play().catch(() => {});
              else v.pause();
            }
          }
        });
      } catch (e) {}
    }
    return { success: true };
  }

  /**
   * Seek by relative delta in seconds
   * @param {string} videoId
   * @param {number} deltaSeconds
   */
  async seekBy(videoId, deltaSeconds) {
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.SEEK_BY,
      videoId,
      seconds: deltaSeconds
    });
    if (res && res.success) return res;

    const tab = await chromeService.getActiveTab();
    if (tab && chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          args: [videoId, deltaSeconds],
          func: (targetId, delta) => {
            const v = (targetId && document.querySelector(`video[data-floatview-id="${targetId}"]`)) ||
                      document.querySelector('video.html5-main-video') ||
                      document.querySelector('video');
            if (v && Number.isFinite(v.duration)) {
              v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + delta));
            }
          }
        });
      } catch (e) {}
    }
    return { success: true };
  }

  /**
   * Seek to absolute timestamp
   * @param {string} videoId
   * @param {number} time
   */
  async setCurrentTime(videoId, time) {
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.SET_CURRENT_TIME,
      videoId,
      time
    });
    if (res && res.success) return res;

    const tab = await chromeService.getActiveTab();
    if (tab && chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          args: [videoId, time],
          func: (targetId, t) => {
            const v = (targetId && document.querySelector(`video[data-floatview-id="${targetId}"]`)) ||
                      document.querySelector('video.html5-main-video') ||
                      document.querySelector('video');
            if (v && Number.isFinite(v.duration)) {
              v.currentTime = Math.max(0, Math.min(v.duration, t));
            }
          }
        });
      } catch (e) {}
    }
    return { success: true };
  }

  /**
   * Toggle mute on video
   * @param {string} videoId
   */
  async toggleMute(videoId) {
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.TOGGLE_MUTE,
      videoId
    });
    if (res && res.success) return res;

    const tab = await chromeService.getActiveTab();
    if (tab && chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          args: [videoId],
          func: (targetId) => {
            const v = (targetId && document.querySelector(`video[data-floatview-id="${targetId}"]`)) ||
                      document.querySelector('video.html5-main-video') ||
                      document.querySelector('video');
            if (v) v.muted = !v.muted;
          }
        });
      } catch (e) {}
    }
    return { success: true };
  }

  /**
   * Set volume level (0.0 to 1.0)
   * @param {string} videoId
   * @param {number} volume
   */
  async setVolume(videoId, volume) {
    const res = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.SET_VOLUME,
      videoId,
      volume
    });
    if (res && res.success) return res;

    const tab = await chromeService.getActiveTab();
    if (tab && chrome.scripting) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id, allFrames: true },
          args: [videoId, volume],
          func: (targetId, vol) => {
            const v = (targetId && document.querySelector(`video[data-floatview-id="${targetId}"]`)) ||
                      document.querySelector('video.html5-main-video') ||
                      document.querySelector('video');
            if (v) {
              v.volume = Math.max(0, Math.min(1, vol));
              if (v.volume > 0 && v.muted) v.muted = false;
            }
          }
        });
      } catch (e) {}
    }
    return { success: true };
  }
}

export const videoService = new VideoService();
