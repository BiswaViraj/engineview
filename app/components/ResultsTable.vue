<script setup lang="ts">
interface ColumnMeta {
  name: string;
  type: string;
}

const props = defineProps<{
  rows: Record<string, unknown>[];
  meta: ColumnMeta[];
  elapsedMs: number;
}>();

const NUMERIC = /int|float|double|decimal|number/i;

const cols = computed<ColumnMeta[]>(() =>
  props.meta.length
    ? props.meta
    : Object.keys(props.rows[0] ?? {}).map((name) => ({ name, type: "" })),
);

function cell(value: unknown): string {
  return value == null ? "" : String(value);
}

function download() {
  const escape = (v: unknown) => {
    const s = cell(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = cols.value.map((c) => escape(c.name)).join(",");
  const body = props.rows.map((r) => cols.value.map((c) => escape(r[c.name])).join(","));
  const blob = new Blob([[header, ...body].join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "engineview-results.csv";
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>

<template>
  <p v-if="rows.length === 0" class="muted">No rows. The query ran in {{ elapsedMs }} ms.</p>
  <div v-else class="stack">
    <div class="result-bar">
      <span class="stat"
        ><b>{{ rows.length }}</b> row{{ rows.length === 1 ? "" : "s" }}</span
      >
      <span class="dot">·</span>
      <span class="stat"
        ><b>{{ elapsedMs }}</b> ms</span
      >
      <span class="spacer" />
      <button class="ghost" @click="download">Download CSV</button>
    </div>
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th v-for="c in cols" :key="c.name" :title="c.type">{{ c.name }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(r, i) in rows" :key="i">
            <td v-for="c in cols" :key="c.name" :class="{ num: NUMERIC.test(c.type) }">
              {{ cell(r[c.name]) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.result-bar {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}
.stat {
  font-size: var(--text-sm);
  color: var(--text-3);
}
.stat b {
  font-family: var(--font-mono);
  font-weight: 500;
  color: var(--text);
}
.dot {
  color: var(--text-3);
}
.table-scroll {
  overflow: auto;
  max-height: 62vh;
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
}
.table-scroll table {
  border: 0;
}
.table-scroll th {
  position: sticky;
  top: 0;
  z-index: 1;
}
</style>
