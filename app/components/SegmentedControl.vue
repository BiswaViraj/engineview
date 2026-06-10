<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  ariaLabel?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
</script>

<template>
  <div class="segmented" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="radio"
      :class="{ on: o.value === modelValue }"
      :aria-checked="o.value === modelValue"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
