<script setup>
import { PictureInPicture2, Minimize2 } from 'lucide-vue-next';

const props = defineProps({
  inPiP: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'normal' // 'small' | 'normal' | 'large'
  }
});

const emit = defineEmits(['toggle']);
</script>

<template>
  <button
    type="button"
    @click="emit('toggle')"
    :disabled="disabled"
    :class="[
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 select-none shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2',
      inPiP
        ? 'bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 focus:ring-slate-500'
        : 'bg-gradient-to-r from-red-500 to-rose-600 text-white hover:from-red-600 hover:to-rose-700 focus:ring-red-500 shadow-red-500/20 hover:shadow-md hover:shadow-red-500/30',
      disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-95',
      size === 'small' ? 'px-2.5 py-1 text-xs gap-1.5' : 'px-4 py-2 text-sm gap-2 w-full'
    ]"
  >
    <component :is="inPiP ? Minimize2 : PictureInPicture2" class="w-4 h-4 flex-shrink-0" />
    <span class="tracking-wide">
      {{ inPiP ? 'Exit Float View' : 'Float Video (PiP)' }}
    </span>
    <span
      v-if="size !== 'small'"
      class="ml-auto text-[10px] font-mono opacity-80 bg-black/20 px-1.5 py-0.5 rounded"
    >
      Alt+Shift+P
    </span>
  </button>
</template>

