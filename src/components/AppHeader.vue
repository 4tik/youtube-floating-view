<script setup>
import { Settings, RefreshCw, Tv } from 'lucide-vue-next';
import { chromeService } from '../services/chromeService.js';

const props = defineProps({
  videoCount: {
    type: Number,
    default: 0
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['refresh']);

const openSettings = () => {
  chromeService.openOptionsPage();
};
</script>

<template>
  <header class="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none">
    <div class="flex items-center space-x-2.5">
      <!-- Modern YouTube Floating View logo mark -->
      <div class="relative flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 shadow-sm shadow-red-500/20 text-white">
        <Tv class="w-4 h-4 text-white stroke-[2.2]" />
        <span class="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-slate-900 dark:bg-white rounded-md border-2 border-white dark:border-slate-900 flex items-center justify-center">
          <span class="w-1 h-1 bg-red-500 rounded-full" />
        </span>
      </div>
      <div>
        <div class="flex items-center space-x-1.5">
          <h1 class="text-xs font-bold text-slate-900 dark:text-white tracking-tight">YouTube Floating View</h1>
          <span
            v-if="videoCount > 0"
            class="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-50 text-red-600 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60"
          >
            {{ videoCount }}
          </span>
        </div>
        <p class="text-[10px] text-slate-500 dark:text-slate-400">Picture-in-Picture</p>
      </div>
    </div>

    <div class="flex items-center space-x-1">
      <button
        type="button"
        @click="emit('refresh')"
        :disabled="isLoading"
        class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
        title="Refresh Videos"
      >
        <RefreshCw class="w-4 h-4" :class="{ 'animate-spin': isLoading }" />
      </button>

      <button
        type="button"
        @click="openSettings"
        class="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Settings"
      >
        <Settings class="w-4 h-4" />
      </button>
    </div>
  </header>
</template>
