<script setup>
import { computed } from 'vue';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Volume1
} from 'lucide-vue-next';

const props = defineProps({
  video: {
    type: Object,
    required: true
  },
  seekStep: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits([
  'toggle-play',
  'seek-by',
  'seek-to',
  'toggle-mute',
  'set-volume'
]);

const handleVolumeChange = (e) => {
  const val = parseFloat(e.target.value);
  emit('set-volume', val);
};

const handleScrubberChange = (e) => {
  const time = parseFloat(e.target.value);
  emit('seek-to', time);
};

const volumeIcon = computed(() => {
  if (props.video.muted || props.video.volume === 0) return VolumeX;
  if (props.video.volume < 0.5) return Volume1;
  return Volume2;
});
</script>

<template>
  <div class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
    <!-- Scrubber Slider -->
    <div v-if="video.duration && video.duration !== Infinity" class="space-y-1">
      <div class="flex items-center justify-between text-[10px] text-slate-400 font-mono">
        <span>Timeline Scrubber</span>
        <span>{{ Math.round((video.currentTime / video.duration) * 100) || 0 }}%</span>
      </div>
      <input
        type="range"
        min="0"
        :max="video.duration"
        step="0.5"
        :value="video.currentTime"
        @input="handleScrubberChange"
        class="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
      />
    </div>

    <!-- Playback buttons -->
    <div class="flex items-center justify-between gap-2">
      <div class="flex items-center gap-1.5">
        <!-- Seek Back -->
        <button
          type="button"
          @click="emit('seek-by', -seekStep)"
          class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :title="`Rewind ${seekStep}s`"
        >
          <RotateCcw class="w-4 h-4" />
        </button>

        <!-- Play / Pause -->
        <button
          type="button"
          @click="emit('toggle-play')"
          class="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all active:scale-95"
          :title="video.paused ? 'Play' : 'Pause'"
        >
          <component :is="video.paused ? Play : Pause" class="w-4 h-4" />
        </button>

        <!-- Seek Forward -->
        <button
          type="button"
          @click="emit('seek-by', seekStep)"
          class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :title="`Forward ${seekStep}s`"
        >
          <RotateCw class="w-4 h-4" />
        </button>
      </div>

      <!-- Volume & Mute -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="emit('toggle-mute')"
          class="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          :title="video.muted ? 'Unmute' : 'Mute'"
        >
          <component :is="volumeIcon" class="w-4 h-4" />
        </button>

        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          :value="video.muted ? 0 : video.volume"
          @input="handleVolumeChange"
          class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
          title="Volume Control"
        />
      </div>
    </div>
  </div>
</template>

