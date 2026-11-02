import { chromeService } from './chromeService.js';
import { MESSAGE_TYPES } from '../constants/extension.js';

class VideoService {
  /**
   * Request list of detected videos from the active tab
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

    const response = await chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.DETECT_VIDEOS
    });

    if (!response || !response.success) {
      // Content script might not be injected (e.g. if page was opened before extension loaded)
      // Attempt auto-inject
      const injected = await chromeService.ensureContentScriptInjected(tab.id);
      if (injected) {
        // Retry message once
        const retryRes = await chromeService.sendMessageToActiveTab({
          type: MESSAGE_TYPES.DETECT_VIDEOS
        });
        if (retryRes && retryRes.success) {
          return { success: true, videos: retryRes.videos || [] };
        }
      }

      return {
        success: false,
        videos: [],
        error: response?.error || 'No active video controller found. Refreshing the page may help.'
      };
    }

    return {
      success: true,
      videos: response.videos || []
    };
  }

  /**
   * Request or toggle PiP on a specific video
   * @param {string} videoId
   */
  async togglePiP(videoId) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.TOGGLE_PIP,
      videoId
    });
  }

  /**
   * Request PiP explicitly
   * @param {string} videoId
   */
  async enterPiP(videoId) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.REQUEST_PIP,
      videoId
    });
  }

  /**
   * Exit PiP explicitly
   * @param {string} videoId
   */
  async exitPiP(videoId) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.EXIT_PIP,
      videoId
    });
  }

  /**
   * Toggle play / pause on a video
   * @param {string} videoId
   */
  async togglePlayback(videoId) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.TOGGLE_PLAYBACK,
      videoId
    });
  }

  /**
   * Seek by relative delta in seconds
   * @param {string} videoId
   * @param {number} deltaSeconds
   */
  async seekBy(videoId, deltaSeconds) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.SEEK_BY,
      videoId,
      seconds: deltaSeconds
    });
  }

  /**
   * Seek to absolute timestamp
   * @param {string} videoId
   * @param {number} time
   */
  async setCurrentTime(videoId, time) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.SET_CURRENT_TIME,
      videoId,
      time
    });
  }

  /**
   * Toggle mute on video
   * @param {string} videoId
   */
  async toggleMute(videoId) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.TOGGLE_MUTE,
      videoId
    });
  }

  /**
   * Set volume level (0.0 to 1.0)
   * @param {string} videoId
   * @param {number} volume
   */
  async setVolume(videoId, volume) {
    return chromeService.sendMessageToActiveTab({
      type: MESSAGE_TYPES.SET_VOLUME,
      videoId,
      volume
    });
  }
}

export const videoService = new VideoService();

