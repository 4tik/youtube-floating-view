<script setup>
import { Sun, Moon, Monitor } from 'lucide-vue-next';
import { useTheme } from '../composables/useTheme.js';

const { currentTheme, setTheme, THEMES } = useTheme();
</script>

<template>
  <div class="inline-flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
    <button
      type="button"
      @click="setTheme(THEMES.LIGHT)"
      :class="[
        'flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
        currentTheme === THEMES.LIGHT
          ? 'bg-white text-slate-900 shadow-sm'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      ]"
      title="Light Theme"
    >
      <Sun class="w-3.5 h-3.5" />
      <span>Light</span>
    </button>

    <button
      type="button"
      @click="setTheme(THEMES.DARK)"
      :class="[
        'flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
        currentTheme === THEMES.DARK
          ? 'bg-slate-900 text-white shadow-sm dark:bg-slate-700'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      ]"
      title="Dark Theme"
    >
      <Moon class="w-3.5 h-3.5" />
      <span>Dark</span>
    </button>

    <button
      type="button"
      @click="setTheme(THEMES.SYSTEM)"
      :class="[
        'flex items-center space-x-1 px-2.5 py-1 text-xs font-medium rounded-md transition-all',
        currentTheme === THEMES.SYSTEM
          ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
          : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      ]"
      title="System Theme"
    >
      <Monitor class="w-3.5 h-3.5" />
      <span>System</span>
    </button>
  </div>
</template>

