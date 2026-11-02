<script setup>
import { onMounted } from 'vue';
import AppHeader from '../components/AppHeader.vue';
import VideoInfo from '../components/VideoInfo.vue';
import VideoSelector from '../components/VideoSelector.vue';
import PiPButton from '../components/PiPButton.vue';
import QuickControls from '../components/QuickControls.vue';
import EmptyState from '../components/EmptyState.vue';
import ThemeSelector from '../components/ThemeSelector.vue';
import { useVideoDetection } from '../composables/useVideoDetection.js';
import { useTheme } from '../composables/useTheme.js';

// Init theme composable
useTheme();

const {
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
} = useVideoDetection();
</script>

<template>
  <div class="w-[360px] min-h-[420px] max-h-[580px] flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 select-none overflow-hidden antialiased">
    <!-- Header -->
    <AppHeader
      :video-count="videos.length"
      :is-loading="isLoading"
      @refresh="refreshVideos(false)"
    />

    <!-- Active Tab Domain / Title bar -->
    <div
      v-if="activeTabInfo?.title"
      class="px-4 py-1.5 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200/70 dark:border-slate-800/70 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400"
    >
      <span class="truncate max-w-[280px]" :title="activeTabInfo.title">
        {{ activeTabInfo.title }}
      </span>
      <span class="text-[10px] font-mono text-slate-400">tab</span>
    </div>

    <!-- Main Content Area -->
    <main class="flex-1 p-3.5 space-y-3 overflow-y-auto">
      <!-- Error / Empty State -->
      <EmptyState
        v-if="videos.length === 0"
        :is-restricted="isRestrictedPage"
        :error-message="errorMessage"
        @refresh="refreshVideos(false)"
      />

      <!-- Content when videos exist -->
      <template v-else>
        <!-- Primary Float Action Button -->
        <PiPButton
          :in-pi-p="Boolean(selectedVideo?.inPiP)"
          :disabled="!selectedVideo"
          @toggle="togglePiP(selectedVideo?.id)"
        />

        <!-- Active Video Details -->
        <VideoInfo
          v-if="selectedVideo"
          :video="selectedVideo"
        />

        <!-- Quick Controls (Seek, Play/Pause, Mute, Volume) -->
        <QuickControls
          v-if="selectedVideo"
          :video="selectedVideo"
          @toggle-play="togglePlayback(selectedVideo.id)"
          @seek-by="(delta) => seekBy(delta, selectedVideo.id)"
          @seek-to="(time) => setCurrentTime(time, selectedVideo.id)"
          @toggle-mute="toggleMute(selectedVideo.id)"
          @set-volume="(vol) => setVolume(vol, selectedVideo.id)"
        />

        <!-- Video Selector (for multiple videos) -->
        <VideoSelector
          v-if="videos.length > 1"
          :videos="videos"
          :selected-id="selectedVideoId"
          @select="selectVideo"
          @toggle-pip="togglePiP"
        />
      </template>
    </main>

    <!-- Footer -->
    <footer class="px-3.5 py-2.5 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
      <div class="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span class="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span>YouTube Floating View</span>
      </div>

      <ThemeSelector />
    </footer>
  </div>
</template>

