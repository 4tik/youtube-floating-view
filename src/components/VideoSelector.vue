<script setup>
import { computed } from 'vue';
import { Video, Check, PictureInPicture2 } from 'lucide-vue-next';

const props = defineProps({
  videos: {
    type: Array,
    required: true
  },
  selectedId: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['select', 'toggle-pip']);

function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const sec = Math.floor(seconds);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
</script>

<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 px-1">
      <span>Detected Videos ({{ videos.length }})</span>
      <span class="text-[11px] text-slate-400">Select to control</span>
    </div>

    <div class="max-h-48 overflow-y-auto space-y-1.5 pr-0.5">
      <div
        v-for="(vid, idx) in videos"
        :key="vid.id"
        @click="emit('select', vid.id)"
        :class="[
          'group flex items-center justify-between p-2 rounded-xl border text-xs cursor-pointer transition-all duration-150 select-none',
          selectedId === vid.id
            ? 'bg-indigo-50/80 border-indigo-400 dark:bg-indigo-950/40 dark:border-indigo-600 shadow-sm'
            : 'bg-white hover:bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:hover:bg-slate-800 dark:border-slate-800'
        ]"
      >
        <div class="flex items-center gap-2 min-w-0 pr-2">
          <!-- Thumbnail / Icon placeholder -->
          <div
            :class="[
              'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors',
              vid.inPiP
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                : selectedId === vid.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
            ]"
          >
            <Video class="w-4 h-4" />
          </div>

          <div class="min-w-0">
            <p
              class="font-medium text-slate-800 dark:text-slate-200 truncate"
              :class="{ 'text-indigo-600 dark:text-indigo-400 font-semibold': selectedId === vid.id }"
            >
              {{ vid.title || `Video #${idx + 1}` }}
            </p>
            <div class="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
              <span>{{ formatTime(vid.currentTime) }} / {{ formatTime(vid.duration) }}</span>
              <span>•</span>
              <span :class="vid.paused ? 'text-amber-500' : 'text-blue-500 font-medium'">
                {{ vid.paused ? 'Paused' : 'Playing' }}
              </span>
              <span v-if="vid.inPiP" class="text-emerald-500 font-semibold">• Floating</span>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-1 flex-shrink-0">
          <!-- Direct PiP button for item -->
          <button
            type="button"
            @click.stop="emit('toggle-pip', vid.id)"
            class="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            :title="vid.inPiP ? 'Exit PiP' : 'Float this video'"
          >
            <PictureInPicture2 class="w-3.5 h-3.5" :class="{ 'text-emerald-500': vid.inPiP }" />
          </button>

          <!-- Checkmark for selected -->
          <div
            v-if="selectedId === vid.id"
            class="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 ml-1"
          >
            <Check class="w-2.5 h-2.5 stroke-[3]" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

