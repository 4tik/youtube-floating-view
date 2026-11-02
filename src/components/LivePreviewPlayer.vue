<script setup>
import { ref } from 'vue';
import {
  Play,
  Pause,
  Volume2,
  Maximize2,
  PictureInPicture2,
  Minimize2,
  Sparkles
} from 'lucide-vue-next';
import { FLOATING_BUTTON_POSITIONS } from '../constants/extension.js';

const props = defineProps({
  showFloatingButton: {
    type: Boolean,
    default: true
  },
  buttonPosition: {
    type: String,
    default: FLOATING_BUTTON_POSITIONS.TOP_CENTER
  }
});

const isSimulatedPiP = ref(false);
const isPlaying = ref(true);

const togglePiP = () => {
  isSimulatedPiP.value = !isSimulatedPiP.value;
};

const togglePlay = () => {
  isPlaying.value = !isPlaying.value;
};
</script>

<template>
  <div class="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700/60 shadow-xl select-none">
    <!-- Live Demo Badge -->
    <div class="absolute top-3 left-3 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-medium text-white/90 border border-white/10">
      <Sparkles class="w-3 h-3 text-red-400" />
      <span>Interactive Live Preview</span>
    </div>

    <!-- Main Video Frame -->
    <div
      class="relative aspect-video w-full flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-red-950/40 overflow-hidden group cursor-pointer"
      @click="togglePlay"
    >
      <!-- Simulated Video Content Graphic -->
      <div class="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-2 pointer-events-none opacity-85">
        <div class="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-500 shadow-inner">
          <component :is="isPlaying ? Play : Pause" class="w-7 h-7" :class="{ 'animate-pulse': isPlaying }" />
        </div>
        <p class="text-xs font-semibold text-white tracking-wide">YouTube Floating View Player</p>
        <p class="text-[11px] text-slate-400 max-w-xs">
          {{ isSimulatedPiP ? 'Video is currently floating in Picture-in-Picture window' : 'Hover over video to view the floating action button' }}
        </p>
      </div>

      <!-- Floating Button (Vivaldi Style with Material 3 polish) -->
      <transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0 -translate-y-2 scale-95"
        enter-to-class="opacity-100 translate-y-0 scale-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100 scale-100"
        leave-to-class="opacity-0 scale-95"
      >
        <div
          v-if="showFloatingButton"
          :class="[
            'absolute z-30 transition-all duration-300 pointer-events-auto',
            buttonPosition === FLOATING_BUTTON_POSITIONS.TOP_RIGHT ? 'top-3 right-3' : '',
            buttonPosition === FLOATING_BUTTON_POSITIONS.TOP_LEFT ? 'top-3 left-3' : '',
            buttonPosition === FLOATING_BUTTON_POSITIONS.TOP_CENTER ? 'top-3 left-1/2 -translate-x-1/2' : ''
          ]"
        >
          <button
            type="button"
            @click.stop="togglePiP"
            :class="[
              'inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium text-white shadow-lg backdrop-blur-md transition-all duration-200 border select-none',
              isSimulatedPiP
                ? 'bg-red-600 hover:bg-red-700 border-red-400 shadow-red-500/30'
                : 'bg-slate-900/85 hover:bg-red-600/90 border-white/20 hover:border-red-400/50 shadow-black/40'
            ]"
          >
            <component :is="isSimulatedPiP ? Minimize2 : PictureInPicture2" class="w-3.5 h-3.5" />
            <span>{{ isSimulatedPiP ? 'Exit Float View' : 'Float View' }}</span>
          </button>
        </div>
      </transition>

      <!-- Player Controls Bar -->
      <div class="absolute bottom-0 inset-x-0 h-11 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between px-4 text-white text-xs z-20">
        <div class="flex items-center gap-3">
          <button type="button" @click.stop="togglePlay" class="hover:text-red-400 transition-colors">
            <component :is="isPlaying ? Pause : Play" class="w-4 h-4" />
          </button>
          <button type="button" class="hover:text-slate-300 transition-colors">
            <Volume2 class="w-4 h-4" />
          </button>
          <span class="text-[11px] font-mono text-slate-300">01:42 / 10:20</span>
        </div>

        <div class="flex items-center gap-3">
          <button
            type="button"
            @click.stop="togglePiP"
            :class="['p-1 rounded transition-colors', isSimulatedPiP ? 'text-red-400' : 'hover:text-red-400']"
            title="Toggle Picture-in-Picture"
          >
            <PictureInPicture2 class="w-4 h-4" />
          </button>
          <button type="button" class="hover:text-slate-300 transition-colors">
            <Maximize2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Scrubber timeline line -->
      <div class="absolute bottom-11 inset-x-0 h-1 bg-white/20">
        <div class="h-full bg-red-600 w-1/4 relative">
          <div class="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-600 shadow" />
        </div>
      </div>
    </div>

    <!-- Simulated Floating Window (When Active) -->
    <transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 translate-y-4 scale-90"
      enter-to-class="opacity-100 translate-y-0 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 translate-y-4 scale-90"
    >
      <div
        v-if="isSimulatedPiP"
        class="absolute bottom-14 right-4 z-40 w-48 aspect-video rounded-xl bg-slate-950 border-2 border-red-500 shadow-2xl overflow-hidden flex flex-col justify-between p-2 pointer-events-auto"
      >
        <div class="flex items-center justify-between">
          <span class="text-[9px] font-semibold text-red-400 flex items-center gap-1">
            <span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            Floating Window
          </span>
          <button
            type="button"
            @click="togglePiP"
            class="text-white/80 hover:text-white p-0.5"
            title="Close PiP"
          >
            <Minimize2 class="w-3 h-3" />
          </button>
        </div>
        <div class="flex items-center justify-center text-white/90">
          <Play class="w-5 h-5 text-red-500" />
        </div>
        <div class="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div class="h-full bg-red-500 w-1/3" />
        </div>
      </div>
    </transition>
  </div>
</template>

