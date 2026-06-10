<script setup lang="ts">
// A destructive button that requires a second, deliberate click. The first
// click arms it (label changes, turns danger-coloured); a second click within
// the timeout confirms; clicking away or waiting cancels. No modal needed.
const props = withDefaults(
  defineProps<{ label?: string; confirmLabel?: string; timeout?: number }>(),
  { label: "Delete", confirmLabel: "Confirm?", timeout: 3000 },
);
const emit = defineEmits<{ confirm: [] }>();

const armed = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;

function reset() {
  armed.value = false;
  if (timer) {
    clearTimeout(timer);
    timer = undefined;
  }
}

function onClick() {
  if (armed.value) {
    reset();
    emit("confirm");
  } else {
    armed.value = true;
    timer = setTimeout(reset, props.timeout);
  }
}

onBeforeUnmount(reset);
</script>

<template>
  <button type="button" class="ghost confirm-btn" :class="{ armed }" @click="onClick" @blur="reset">
    {{ armed ? confirmLabel : label }}
  </button>
</template>

<style scoped>
.confirm-btn.armed,
.confirm-btn.armed:hover {
  background: var(--danger-quiet);
  color: var(--danger-text);
  border-color: var(--danger-line);
}
</style>
