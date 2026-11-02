<script setup>
import { AlertCircle, Film, RefreshCw, ExternalLink } from 'lucide-vue-next';

const props = defineProps({
  isRestricted: {
    type: Boolean,
    default: false
  },
  errorMessage: {
    type: String,
    default: null
  }
});

const emit = defineEmits(['refresh']);
</script>

<template>
  <div class="flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
    <div
      :class="[
        'w-12 h-12 rounded-2xl flex items-center justify-center',
        isRestricted
          ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
          : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400'
      ]"
    >
      <component :is="isRestricted ? AlertCircle : Film" class="w-6 h-6" />
    </div>

    <div class="space-y-1 max-w-[260px]">
      <h3 class="text-sm font-semibold text-slate-800 dark:text-slate-100">
        {{ isRestricted ? 'Restricted Page' : 'No Videos Detected' }}
      </h3>
      <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
        <template v-if="isRestricted">
          FloatView cannot run on Chrome internal pages or the Chrome Web Store due to browser security restrictions.
        </template>
        <template v-else-if="errorMessage">
          {{ errorMessage }}
        </template>
        <template v-else>
          No HTML5 video element was found on this page. Try opening a video on YouTube, Twitch, Vimeo, or a news website.
        </template>
      </p>
    </div>

    <div class="pt-1 flex items-center gap-2">
      <button
        v-if="!isRestricted"
        type="button"
        @click="emit('refresh')"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
      >
        <RefreshCw class="w-3.5 h-3.5" />
        Scan Again
      </button>

      <a
        href="https://www.youtube.com"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
      >
        Open YouTube
        <ExternalLink class="w-3 h-3" />
      </a>
    </div>
  </div>
</template>

