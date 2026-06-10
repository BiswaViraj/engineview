<script setup lang="ts">
const props = defineProps<{
  modelValue: string;
  options: { value: string; label: string }[];
  ariaLabel?: string;
}>();
const emit = defineEmits<{ "update:modelValue": [string] }>();

// Arrow keys move selection within the group; only the selected option is in the
// tab order (roving tabindex), per the ARIA radiogroup pattern.
function onKeydown(e: KeyboardEvent, index: number) {
  const forward = e.key === "ArrowRight" || e.key === "ArrowDown";
  const back = e.key === "ArrowLeft" || e.key === "ArrowUp";
  if (!forward && !back) return;
  e.preventDefault();
  const next = (index + (forward ? 1 : -1) + props.options.length) % props.options.length;
  emit("update:modelValue", props.options[next]!.value);
  const buttons = (e.currentTarget as HTMLElement).parentElement?.querySelectorAll("button");
  (buttons?.[next] as HTMLElement | undefined)?.focus();
}
</script>

<template>
  <div class="segmented" role="radiogroup" :aria-label="ariaLabel">
    <button
      v-for="(o, i) in options"
      :key="o.value"
      type="button"
      role="radio"
      :class="{ on: o.value === modelValue }"
      :aria-checked="o.value === modelValue"
      :tabindex="o.value === modelValue ? 0 : -1"
      @click="emit('update:modelValue', o.value)"
      @keydown="onKeydown($event, i)"
    >
      {{ o.label }}
    </button>
  </div>
</template>
