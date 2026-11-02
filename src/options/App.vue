<script setup>
import { ref, onMounted } from 'vue';
import {
  Tv,
  Layers,
  Save,
  RotateCcw,
  Sliders,
  Keyboard,
  Eye,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Clock,
  BellRing,
  PauseCircle,
  Maximize,
  HelpCircle,
  LayoutTemplate,
  MonitorPlay,
  Settings2,
  Video
} from 'lucide-vue-next';
import MaterialSwitch from '../components/MaterialSwitch.vue';
import LivePreviewPlayer from '../components/LivePreviewPlayer.vue';
import ThemeSelector from '../components/ThemeSelector.vue';
import { storageService } from '../services/storageService.js';
import { useTheme } from '../composables/useTheme.js';
import {
  STORAGE_KEYS,
  FLOATING_BUTTON_POSITIONS,
  DEFAULT_SETTINGS
} from '../constants/extension.js';

useTheme();

const settings = ref({ ...DEFAULT_SETTINGS });
const saveStatus = ref(null);
const isLoading = ref(true);
const activeTab = ref('all');

const tabs = [
  { id: 'all', label: 'All Settings', icon: Settings2 },
  { id: 'overlay', label: 'Video Overlay', icon: Eye },
  { id: 'automation', label: 'Automation', icon: Zap },
  { id: 'playback', label: 'Playback', icon: Sliders },
  { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  { id: 'about', label: 'About', icon: HelpCircle }
];

const loadSettings = async () => {
  isLoading.value = true;
  try {
    const loaded = await storageService.getAllSettings();
    settings.value = { ...DEFAULT_SETTINGS, ...loaded };
  } catch (err) {
    console.error('[YouTube Floating View Options] Failed to load settings:', err);
  } finally {
    isLoading.value = false;
  }
};

const saveSettings = async () => {
  try {
    await storageService.setMultiple(settings.value);
    saveStatus.value = 'Settings saved successfully!';
    setTimeout(() => {
      saveStatus.value = null;
    }, 2800);
  } catch (err) {
    saveStatus.value = 'Failed to save settings.';
  }
};

const resetDefaults = async () => {
  if (confirm('Restore all YouTube Floating View settings to default?')) {
    await storageService.resetToDefaults();
    settings.value = { ...DEFAULT_SETTINGS };
    saveStatus.value = 'All settings restored to defaults!';
    setTimeout(() => {
      saveStatus.value = null;
    }, 2800);
  }
};

const openShortcutsConfig = () => {
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  } else {
    window.open('chrome://extensions/shortcuts', '_blank');
  }
};

onMounted(() => {
  loadSettings();
});
</script>

<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-red-500 selection:text-white pb-24">
    <!-- Material 3 Top App Bar -->
    <header class="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-30 shadow-sm transition-colors">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between py-3">
        <!-- Logo & Branding -->
        <div class="flex items-center space-x-3.5">
          <div class="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-red-600 via-red-500 to-rose-600 shadow-md shadow-red-500/25 text-white ring-2 ring-red-500/20">
            <Tv class="w-5 h-5 text-white stroke-[2.2]" />
            <span class="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-slate-900 dark:bg-white rounded-md border-2 border-white dark:border-slate-900 flex items-center justify-center">
              <span class="w-1.5 h-1.5 bg-red-500 rounded-full" />
            </span>
          </div>

          <div>
            <div class="flex items-center gap-2">
              <h1 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                YouTube Floating View
              </h1>
              <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/70 dark:text-red-300 border border-red-200 dark:border-red-900/60 uppercase tracking-wider">
                v1.0.0
              </span>
            </div>
            <p class="text-xs text-slate-500 dark:text-slate-400">Material 3 Picture-in-Picture Preferences</p>
          </div>
        </div>

        <!-- Right Side Header Controls -->
        <div class="flex items-center space-x-3">
          <ThemeSelector />

          <!-- Material 3 Save Button (FAB Style) -->
          <button
            type="button"
            @click="saveSettings"
            class="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white text-xs font-semibold rounded-2xl shadow-md shadow-red-500/25 transition-all duration-200 select-none focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            <Save class="w-4 h-4 stroke-[2.2]" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Material Toast / Snackbar -->
    <transition
      enter-active-class="transform transition ease-out duration-300"
      enter-from-class="translate-y-4 opacity-0 scale-95"
      enter-to-class="translate-y-0 opacity-100 scale-100"
      leave-active-class="transition ease-in duration-200"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="translate-y-4 opacity-0 scale-95"
    >
      <div
        v-if="saveStatus"
        class="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl border border-slate-700/80 text-xs font-medium"
      >
        <div class="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 class="w-4 h-4 stroke-[2.5]" />
        </div>
        <span>{{ saveStatus }}</span>
      </div>
    </transition>

    <main class="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
      <!-- Material Navigation Segmented Chips -->
      <nav class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          v-for="t in tabs"
          :key="t.id"
          type="button"
          @click="activeTab = t.id"
          :class="[
            'inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-medium transition-all duration-150 whitespace-nowrap select-none',
            activeTab === t.id
              ? 'bg-red-600 text-white shadow-sm shadow-red-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          ]"
        >
          <component :is="t.icon" class="w-3.5 h-3.5" />
          <span>{{ t.label }}</span>
        </button>
      </nav>

      <!-- Material Hero Banner -->
      <div class="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 text-white p-6 sm:p-8 border border-red-900/30 shadow-lg">
        <div class="relative z-10 max-w-2xl space-y-3">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/30 text-red-300 border border-red-500/30 text-xs font-medium backdrop-blur-sm">
            <Sparkles class="w-3.5 h-3.5 text-red-400" />
            <span>Vivaldi-Inspired Picture-in-Picture for YouTube</span>
          </div>

          <h2 class="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Effortlessly float any YouTube & HTML5 video
          </h2>

          <p class="text-xs sm:text-sm text-slate-300 leading-relaxed">
            YouTube Floating View introduces seamless Picture-in-Picture controls directly to your browser. Hover over any video to pop it out, manage multiple players, scrub timelines, and customize your experience with Material Design 3.
          </p>
        </div>

        <!-- Decorative background glow -->
        <div class="absolute -right-16 -top-16 w-80 h-80 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
      </div>

      <!-- Main Layout: Settings Grid + Live Preview Studio -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Settings Columns (Left 7 cols on large screens) -->
        <div class="lg:col-span-7 space-y-6">
          <!-- SECTION 1: Video Hover Overlay -->
          <section
            v-if="activeTab === 'all' || activeTab === 'overlay'"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
                  <Eye class="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Video Hover Overlay</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">In-page floating PiP button behavior</p>
                </div>
              </div>
            </div>

            <!-- Toggle 1: Show Button on Hover -->
            <div class="flex items-center justify-between gap-4 py-1">
              <div class="space-y-0.5">
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Show Float Button on Hover
                </span>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Display the sleek, translucent Float View button when hovering over HTML5 and YouTube videos.
                </p>
              </div>
              <MaterialSwitch
                v-model="settings[STORAGE_KEYS.SHOW_FLOATING_BUTTON]"
                aria-label="Toggle floating button"
              />
            </div>

            <!-- Position Picker with Material 3 Segmented Buttons -->
            <div
              v-if="settings[STORAGE_KEYS.SHOW_FLOATING_BUTTON]"
              class="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/60"
            >
              <label class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Floating Button Alignment
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  @click="settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] = FLOATING_BUTTON_POSITIONS.TOP_LEFT"
                  :class="[
                    'flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all duration-150 select-none gap-1.5',
                    settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] === FLOATING_BUTTON_POSITIONS.TOP_LEFT
                      ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/50 dark:border-red-500 dark:text-red-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  ]"
                >
                  <LayoutTemplate class="w-4 h-4 rotate-180" />
                  <span>Top Left</span>
                </button>

                <button
                  type="button"
                  @click="settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] = FLOATING_BUTTON_POSITIONS.TOP_CENTER"
                  :class="[
                    'flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all duration-150 select-none gap-1.5',
                    settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] === FLOATING_BUTTON_POSITIONS.TOP_CENTER
                      ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/50 dark:border-red-500 dark:text-red-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  ]"
                >
                  <LayoutTemplate class="w-4 h-4" />
                  <span>Top Center</span>
                </button>

                <button
                  type="button"
                  @click="settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] = FLOATING_BUTTON_POSITIONS.TOP_RIGHT"
                  :class="[
                    'flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-medium transition-all duration-150 select-none gap-1.5',
                    settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] === FLOATING_BUTTON_POSITIONS.TOP_RIGHT
                      ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/50 dark:border-red-500 dark:text-red-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  ]"
                >
                  <LayoutTemplate class="w-4 h-4 -scale-x-100" />
                  <span>Top Right</span>
                </button>
              </div>
            </div>
          </section>

          <!-- SECTION 2: Automation & Behavior -->
          <section
            v-if="activeTab === 'all' || activeTab === 'automation'"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Zap class="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Smart Automation</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Convenient browser events and triggers</p>
                </div>
              </div>
            </div>

            <!-- Auto PiP on Tab Switch -->
            <div class="flex items-center justify-between gap-4 py-1">
              <div class="space-y-0.5">
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Auto-Float on Tab Switch
                </span>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically pop out the active playing video into Picture-in-Picture when you switch away to another browser tab.
                </p>
              </div>
              <MaterialSwitch
                v-model="settings[STORAGE_KEYS.AUTO_PIP_TAB_SWITCH]"
                aria-label="Toggle auto PiP on tab switch"
              />
            </div>

            <div class="h-px bg-slate-100 dark:bg-slate-800/60" />

            <!-- Pause on PiP Dismiss -->
            <div class="flex items-center justify-between gap-4 py-1">
              <div class="space-y-0.5">
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Pause Video when PiP Closes
                </span>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pause the video stream automatically whenever you dismiss the Picture-in-Picture floating window.
                </p>
              </div>
              <MaterialSwitch
                v-model="settings[STORAGE_KEYS.PAUSE_ON_PIP_CLOSE]"
                aria-label="Toggle pause on PiP close"
              />
            </div>

            <div class="h-px bg-slate-100 dark:bg-slate-800/60" />

            <!-- Show Toolbar Badge -->
            <div class="flex items-center justify-between gap-4 py-1">
              <div class="space-y-0.5">
                <span class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                  Toolbar Badge Counter
                </span>
                <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Display the count of detected videos or active PiP badge directly on the extension toolbar icon.
                </p>
              </div>
              <MaterialSwitch
                v-model="settings[STORAGE_KEYS.SHOW_BADGE]"
                aria-label="Toggle toolbar badge"
              />
            </div>
          </section>

          <!-- SECTION 3: Playback Controls -->
          <section
            v-if="activeTab === 'all' || activeTab === 'playback'"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <Sliders class="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Playback & Scrubbing</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Fast-forward, rewind, and timeline response</p>
                </div>
              </div>
            </div>

            <!-- Seek Step Dropdown -->
            <div class="space-y-2">
              <label class="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
                Quick Seek Jump Step
              </label>
              <div class="grid grid-cols-4 gap-2">
                <button
                  v-for="step in [5, 10, 15, 30]"
                  :key="step"
                  type="button"
                  @click="settings[STORAGE_KEYS.SEEK_SECONDS] = step"
                  :class="[
                    'py-2 px-3 rounded-2xl border text-xs font-semibold transition-all select-none',
                    settings[STORAGE_KEYS.SEEK_SECONDS] === step
                      ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/50 dark:border-red-500 dark:text-red-300 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  ]"
                >
                  ±{{ step }}s
                </button>
              </div>
            </div>
          </section>

          <!-- SECTION 4: Shortcuts -->
          <section
            v-if="activeTab === 'all' || activeTab === 'shortcuts'"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-5"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Keyboard class="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Keyboard Shortcuts</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Trigger Picture-in-Picture without touching the mouse</p>
                </div>
              </div>
            </div>

            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between gap-4">
              <div>
                <p class="text-xs font-semibold text-slate-800 dark:text-slate-200">Toggle Picture-in-Picture</p>
                <p class="text-[11px] text-slate-400">Pops out the currently playing or active video</p>
              </div>
              <kbd class="px-2.5 py-1 text-xs font-mono font-bold bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl border border-slate-300 dark:border-slate-600 shadow-sm">
                Alt + Shift + P
              </kbd>
            </div>

            <button
              type="button"
              @click="openShortcutsConfig"
              class="inline-flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-semibold hover:underline"
            >
              <span>Customize shortcut in chrome://extensions/shortcuts</span>
              <ExternalLink class="w-3.5 h-3.5" />
            </button>
          </section>

          <!-- SECTION 5: About -->
          <section
            v-if="activeTab === 'all' || activeTab === 'about'"
            class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4"
          >
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
                  <ShieldCheck class="w-4 h-4 stroke-[2.2]" />
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900 dark:text-white">Extension Architecture</h3>
                  <p class="text-xs text-slate-500 dark:text-slate-400">Standards compliance and build specification</p>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3 text-xs">
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span class="text-[11px] text-slate-400 block font-medium">Framework</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Vue 3 Composition API</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span class="text-[11px] text-slate-400 block font-medium">Manifest Version</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Chrome Manifest V3</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span class="text-[11px] text-slate-400 block font-medium">Design System</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Material Design 3 (M3)</span>
              </div>
              <div class="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <span class="text-[11px] text-slate-400 block font-medium">Storage Mechanism</span>
                <span class="font-semibold text-slate-800 dark:text-slate-200">Chrome Storage Sync</span>
              </div>
            </div>
          </section>
        </div>

        <!-- Right Column: Interactive Live Preview Studio (5 cols on large screens) -->
        <div class="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <div class="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <div class="flex items-center gap-2.5">
                <MonitorPlay class="w-4 h-4 text-red-600 dark:text-red-400 stroke-[2.2]" />
                <h3 class="text-sm font-bold text-slate-900 dark:text-white">Live Appearance Preview</h3>
              </div>
              <span class="text-[10px] font-mono text-slate-400">Real-time</span>
            </div>

            <!-- Embedded Live Interactive Player -->
            <LivePreviewPlayer
              :show-floating-button="Boolean(settings[STORAGE_KEYS.SHOW_FLOATING_BUTTON])"
              :button-position="settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION]"
            />

            <!-- Configuration Summary Chips -->
            <div class="space-y-2 pt-2">
              <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Current Configuration
              </span>
              <div class="flex flex-wrap gap-1.5 text-[11px]">
                <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  Hover Button: {{ settings[STORAGE_KEYS.SHOW_FLOATING_BUTTON] ? 'Active' : 'Disabled' }}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize">
                  Position: {{ settings[STORAGE_KEYS.FLOATING_BUTTON_POSITION] }}
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  Seek: ±{{ settings[STORAGE_KEYS.SEEK_SECONDS] }}s
                </span>
                <span class="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                  Auto-Tab: {{ settings[STORAGE_KEYS.AUTO_PIP_TAB_SWITCH] ? 'On' : 'Off' }}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Actions & Reset Card -->
          <div class="p-5 rounded-3xl bg-slate-100/70 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
            <button
              type="button"
              @click="resetDefaults"
              class="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>Restore Factory Defaults</span>
            </button>

            <span class="text-[11px] text-slate-400">Manifest V3 Certified</span>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>
