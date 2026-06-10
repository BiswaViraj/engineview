<script setup lang="ts">
import { Codemirror } from "vue-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap, EditorView } from "@codemirror/view";
import { Prec } from "@codemirror/state";

defineProps<{ modelValue: string; placeholder?: string }>();
const emit = defineEmits<{ "update:modelValue": [string]; run: [] }>();

// Keep oneDark's syntax colors but reskin the chrome to match the app surfaces:
// transparent background, JetBrains Mono, accent cursor and selection.
const surface = EditorView.theme(
  {
    "&": { backgroundColor: "transparent", color: "var(--text)" },
    "&.cm-focused": { outline: "none" },
    ".cm-scroller": { fontFamily: "var(--font-mono)", lineHeight: "1.65" },
    ".cm-content": { padding: "12px 6px", caretColor: "var(--accent)" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      border: "none",
      color: "var(--text-3)",
    },
    ".cm-lineNumbers .cm-gutterElement": { padding: "0 12px 0 12px" },
    ".cm-activeLine": { backgroundColor: "color-mix(in oklch, var(--surface-3) 50%, transparent)" },
    ".cm-activeLineGutter": { backgroundColor: "transparent", color: "var(--text-2)" },
    ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--accent)" },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
      backgroundColor: "var(--accent-quiet)",
    },
  },
  { dark: true },
);

const extensions = [
  sql(),
  oneDark,
  surface,
  // Wrap long lines instead of scrolling horizontally, so the editor never
  // forces the page wider than the viewport (important on phones).
  EditorView.lineWrapping,
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
  <div class="sql-editor">
    <Codemirror
      :model-value="modelValue"
      :placeholder="placeholder"
      :extensions="extensions"
      :indent-with-tab="true"
      :tab-size="2"
      :style="{ minHeight: '168px', fontSize: '13px' }"
      @update:model-value="(v: string) => emit('update:modelValue', v)"
    />
  </div>
</template>

<style scoped>
.sql-editor {
  min-width: 0;
  background: var(--surface-1);
  border: 1px solid var(--line);
  border-radius: var(--radius-lg);
  overflow: hidden;
  transition:
    border-color var(--dur-fast) var(--ease),
    box-shadow var(--dur-fast) var(--ease);
}
.sql-editor:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-quiet);
}
</style>
