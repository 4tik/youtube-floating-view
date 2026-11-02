<script setup>
import { computed } from 'vue';
import { Check, X } from 'lucide-vue-next';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  ariaLabel: {
    type: String,
    default: 'Toggle Switch'
  }
});

const emit = defineEmits(['update:modelValue', 'change']);

const toggle = () => {
  if (props.disabled) return;
  const newValue = !props.modelValue;
  emit('update:modelValue', newValue);
  emit('change', newValue);
};
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="ariaLabel"
    :disabled="disabled"
    @click="toggle"
    :class="[
      'group relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full p-0.5 border-2 transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 select-none',
      modelValue
        ? 'bg-red-600 border-red-600 dark:bg-red-500 dark:border-red-500'
        : 'bg-slate-200 border-slate-300 dark:bg-slate-800 dark:border-slate-700',
      disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-sm'
    ]"
  >
    <span
      :class="[
        'pointer-events-none flex items-center justify-center h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out',
        modelValue
          ? 'translate-x-5 text-red-600'
          : 'translate-x-0 text-slate-400'
      ]"
    >
      <Check v-if="modelValue" class="w-3 h-3 stroke-[3]" />
      <X v-else class="w-2.5 h-2.5 stroke-[2.5]" />
    </span>
  </button>
</template>

