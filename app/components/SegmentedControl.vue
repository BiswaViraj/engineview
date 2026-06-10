<script setup lang="ts">
defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  ariaLabel?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
</script>

<template>
  <div class="segmented" role="tablist" :aria-label="ariaLabel">
    <button
      v-for="o in options"
      :key="o.value"
      type="button"
      role="tab"
      :class="{ on: o.value === modelValue }"
      :aria-selected="o.value === modelValue"
      @click="emit('update:modelValue', o.value)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
