import { ref, computed, onMounted, onUnmounted } from 'vue';
import { videoService } from '../services/videoService.js';
import { chromeService } from '../services/chromeService.js';
import { storageService } from '../services/storageService.js';
import { MESSAGE_TYPES, STORAGE_KEYS } from '../constants/extension.js';

export function useVideoDetection() {
  const videos = ref([]);
  const selectedVideoId = ref(null);
  const isLoading = ref(true);
  const errorMessage = ref(null);
  const isRestrictedPage = ref(false);
  const activeTabInfo = ref(null);

  let pollTimer = null;
  let removeMessageListener = null;

  const selectedVideo = computed(() => {
    if (!videos.value.length) return null;
    if (selectedVideoId.value) {
      const found = videos.value.find((v) => v.id === selectedVideoId.value);
      if (found) return found;
    }
    // Default to the first playing video or the first one in PiP, else the first video
    const inPip = videos.value.find((v) => v.inPiP);
    if (inPip) return inPip;
    const playing = videos.value.find((v) => !v.paused);
    if (playing) return playing;
    return videos.value[0];
  });

  const selectVideo = (id) => {
    selectedVideoId.value = id;
  };

  const refreshVideos = async (silent = false) => {
    if (!silent) isLoading.value = true;
    errorMessage.value = null;

    try {
      const tab = await chromeService.getActiveTab();
      if (tab) {
        activeTabInfo.value = {
          title: tab.title || '',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl || ''
        };
      }

      const res = await videoService.getVideos();
      if (res.isRestricted) {
        isRestrictedPage.value = true;
        errorMessage.value = res.error;
        videos.value = [];
        return;
      }

      if (!res.success) {
        errorMessage.value = res.error;
        videos.value = [];
        return;
      }

      videos.value = res.videos || [];
      isRestrictedPage.value = false;

      // Ensure a valid selection
      if (videos.value.length > 0) {
        const stillExists = videos.value.some((v) => v.id === selectedVideoId.value);
        if (!stillExists) {
          const preferred = videos.value.find((v) => v.inPiP) || videos.value.find((v) => !v.paused) || videos.value[0];
          selectedVideoId.value = preferred.id;
        }
      } else {
        selectedVideoId.value = null;
      }
    } catch (err) {
      console.error('[FloatView useVideoDetection] Error during refresh:', err);
      if (!silent) errorMessage.value = 'Failed to inspect videos on this page.';
    } finally {
      if (!silent) isLoading.value = false;
    }
  };

  const togglePiP = async (videoId) => {
    const targetId = videoId || selectedVideo.value?.id;
    if (!targetId) return;

    // Optimistically update UI
    const target = videos.value.find((v) => v.id === targetId);
    if (target) {
      target.inPiP = !target.inPiP;
    }

    const res = await videoService.togglePiP(targetId);
    if (res && res.error) {
      errorMessage.value = res.error;
    }
    // Refresh to get ground truth
    setTimeout(() => refreshVideos(true), 250);
  };

  const togglePlayback = async (videoId) => {
    const targetId = videoId || selectedVideo.value?.id;
    if (!targetId) return;

    const target = videos.value.find((v) => v.id === targetId);
    if (target) {
      target.paused = !target.paused;
    }

    await videoService.togglePlayback(targetId);
    setTimeout(() => refreshVideos(true), 150);
  };

  const seekBy = async (deltaSeconds, videoId) => {
    const targetId = videoId || selectedVideo.value?.id;
    if (!targetId) return;

    const target = videos.value.find((v) => v.id === targetId);
    if (target) {
      target.currentTime = Math.max(0, Math.min(target.duration || 0, target.currentTime + deltaSeconds));
    }

    await videoService.seekBy(targetId, deltaSeconds);
    setTimeout(() => refreshVideos(true), 150);
  };

  const setCurrentTime = async (time, videoId) => {
    const targetId = videoId || selectedVideo.value?.id;
    if (!targetId) return;

    await videoService.setCurrentTime(targetId, time);
    setTimeout(() => refreshVideos(true), 100);
  };

  const toggleMute = async (videoId) => {
    const targetId = videoId || selectedVideo.value?.id;
    if (!targetId) return;

    const target = videos.value.find((v) => v.id === targetId);
    if (target) {
      target.muted = !target.muted;
    }

    await videoService.toggleMute(targetId);
    setTimeout(() => refreshVideos(true), 150);
  };

  const setVolume = async (volume, videoId) => {
    const targetId = videoId || selectedVideo.value?.id;
    if (!targetId) return;

    await videoService.setVolume(targetId, volume);
  };

  onMounted(async () => {
    await refreshVideos(false);

    const intervalMs = await storageService.get(STORAGE_KEYS.AUTO_DETECT_INTERVAL, 2000);

    // Periodic polling while popup is open to keep progress bar and status synchronized
    pollTimer = setInterval(() => {
      refreshVideos(true);
    }, Math.max(1000, Number(intervalMs) || 2000));

    // Listen for live updates from content script
    removeMessageListener = chromeService.onMessage((msg) => {
      if (
        msg.type === MESSAGE_TYPES.VIDEO_LIST_CHANGED ||
        msg.type === MESSAGE_TYPES.PIP_STATE_CHANGED
      ) {
        refreshVideos(true);
      }
    });
  });

  onUnmounted(() => {
    if (pollTimer) clearInterval(pollTimer);
    if (removeMessageListener) removeMessageListener();
  });

  return {
    videos,
    selectedVideoId,
    selectedVideo,
    isLoading,
    errorMessage,
    isRestrictedPage,
    activeTabInfo,
    selectVideo,
    refreshVideos,
    togglePiP,
    togglePlayback,
    seekBy,
    setCurrentTime,
    toggleMute,
    setVolume
  };
}

