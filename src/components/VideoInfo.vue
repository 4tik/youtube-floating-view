<script setup>
import { computed } from 'vue';
import { Play, Pause, Maximize, Volume2, VolumeX, Radio } from 'lucide-vue-next';

const props = defineProps({
  video: {
    type: Object,
    required: true
  }
});

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const sec = Math.floor(seconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}:${remM.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const formattedCurrentTime = computed(() => formatTime(props.video.currentTime));
const formattedDuration = computed(() => {
  if (!props.video.duration || props.video.duration === Infinity) return 'Live / Stream';
  return formatTime(props.video.duration);
});

const progressPercent = computed(() => {
  if (!props.video.duration || props.video.duration === Infinity) return 0;
  return Math.min(100, Math.max(0, (props.video.currentTime / props.video.duration) * 100));
});
</script>

<template>
  <div class="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2.5">
    <div class="flex items-start justify-between gap-2">
      <div class="flex-1 min-w-0">
        <h3 class="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" :title="video.title">
          {{ video.title || 'HTML5 Video Player' }}
        </h3>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
          {{ formattedCurrentTime }} / {{ formattedDuration }}
        </p>
      </div>

      <!-- Status badges -->
      <div class="flex items-center gap-1.5 flex-shrink-0">
        <span
          v-if="video.inPiP"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
        >
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          PiP Active
        </span>

        <span
          :class="[
            'inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium rounded-full',
            video.paused
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
          ]"
        >
          <component :is="video.paused ? Pause : Play" class="w-2.5 h-2.5" />
          {{ video.paused ? 'Paused' : 'Playing' }}
        </span>
      </div>
    </div>

    <!-- Mini Progress Bar -->
    <div v-if="video.duration && video.duration !== Infinity" class="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
      <div
        class="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
        :style="{ width: `${progressPercent}%` }"
      />
    </div>

    <!-- Metadata Tags -->
    <div class="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 border-t border-slate-200/60 dark:border-slate-700/60">
      <div class="flex items-center gap-2">
        <span v-if="video.width && video.height" class="inline-flex items-center gap-1">
          <Maximize class="w-3 h-3 text-slate-400" />
          {{ video.width }}×{{ video.height }}
        </span>
        <span class="inline-flex items-center gap-1">
          <component :is="video.muted ? VolumeX : Volume2" class="w-3 h-3 text-slate-400" />
          {{ video.muted ? 'Muted' : `${Math.round((video.volume || 0) * 100)}%` }}
        </span>
      </div>
      <span v-if="video.duration === Infinity" class="inline-flex items-center gap-1 text-red-500 font-medium">
        <Radio class="w-3 h-3 animate-pulse" /> Live
      </span>
    </div>
  </div>
</template>

