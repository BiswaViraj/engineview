<script setup lang="ts">
import { Codemirror } from "vue-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { Prec } from "@codemirror/state";

defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ "update:modelValue": [string]; run: [] }>();

// SQL syntax highlighting, dark theme, and Cmd/Ctrl+Enter to run.
const extensions = [
  sql(),
  oneDark,
  Prec.highest(
    keymap.of([
      {
        key: "Mod-Enter",
        run: () => {
          emit("run");
          return true;
        },
      },
    ]),
  ),
];
</script>

<template>
  <Codemirror
    :model-value="modelValue"
    :placeholder="placeholder"
    :extensions="extensions"
    :indent-with-tab="true"
    :tab-size="2"
    :style="{
      minHeight: '160px',
      fontSize: '13px',
      border: '1px solid #1c2530',
      borderRadius: '8px',
      overflow: 'hidden',
    }"
    @update:model-value="(v: string) => emit('update:modelValue', v)"
  />
</template>
