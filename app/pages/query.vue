<script setup lang="ts">
import { defaultAxes, type ChartType } from "~/lib/chart";
import { extractApiError } from "~/lib/errors";

definePageMeta({ middleware: "auth" });

interface Connection {
  id: string;
  label: string;
  accountId: string;
  defaultDataset: string | null;
}
interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  connectionId: string | null;
}
interface ColumnMeta {
  name: string;
  type: string;
}
interface QueryResult {
  rows: Record<string, unknown>[];
  meta: ColumnMeta[];
  elapsedMs: number;
}

const SQL_KEY = "ev_sql";

const { data: connections } = await useFetch<Connection[]>("/api/connections", {
  default: () => [],
});
const { data: saved, refresh: refreshSaved } = await useFetch<SavedQuery[]>("/api/queries", {
  default: () => [],
});

const selectedConnectionId = ref<string>("");
watchEffect(() => {
  if (!selectedConnectionId.value && connections.value?.length) {
    selectedConnectionId.value = connections.value[0]!.id;
  }
});

const selectedConnection = computed(() =>
  connections.value?.find((c) => c.id === selectedConnectionId.value),
);

const sql = ref("");
const name = ref("");
const result = ref<QueryResult | null>(null);
const running = ref(false);
const saving = ref(false);
const error = ref("");
// Concise message announced to screen readers when a run finishes (WCAG 4.1.3).
const status = ref("");

const view = ref<"table" | "chart">("table");
const chartType = ref<ChartType>("line");
const xColumn = ref("");
const yColumns = ref<string[]>([]);

const resultColumns = computed<string[]>(() => {
  if (!result.value) return [];
  return result.value.meta.length
    ? result.value.meta.map((m) => m.name)
    : Object.keys(result.value.rows[0] ?? {});
});

watch(result, (r) => {
  if (r) {
    const axes = defaultAxes(r.meta, r.rows);
    xColumn.value = axes.xColumn;
    yColumns.value = axes.yColumns;
  }
});

function toggleY(col: string) {
  yColumns.value = yColumns.value.includes(col)
    ? yColumns.value.filter((c) => c !== col)
    : [...yColumns.value, col];
}

onMounted(() => {
  sql.value = localStorage.getItem(SQL_KEY) ?? "";
});
watch(sql, (v) => {
  if (import.meta.client) localStorage.setItem(SQL_KEY, v);
});

function sampleQuery() {
  const ds = selectedConnection.value?.defaultDataset || "your_dataset";
  sql.value = `SELECT\n  blob1 AS dimension,\n  SUM(_sample_interval) AS count\nFROM ${ds}\nWHERE timestamp > NOW() - INTERVAL '24' HOUR\nGROUP BY dimension\nORDER BY count DESC\nLIMIT 100`;
}

async function run() {
  if (!sql.value.trim() || running.value) return;
  if (!selectedConnectionId.value) {
    error.value = "Add and select a Cloudflare connection first.";
    return;
  }
  running.value = true;
  error.value = "";
  result.value = null;
  status.value = "Running query…";
  const started = performance.now();
  try {
    const body = await $fetch<{ data?: Record<string, unknown>[]; meta?: ColumnMeta[] }>(
      "/api/query",
      { method: "POST", body: { connectionId: selectedConnectionId.value, sql: sql.value } },
    );
    const rows = body.data ?? [];
    result.value = {
      rows,
      meta: body.meta ?? [],
      elapsedMs: Math.round(performance.now() - started),
    };
    status.value = `Returned ${rows.length} row${rows.length === 1 ? "" : "s"} in ${result.value.elapsedMs} ms.`;
  } catch (e) {
    error.value = extractApiError(e);
    status.value = "";
  } finally {
    running.value = false;
  }
}

async function save() {
  const trimmed = name.value.trim();
  if (!trimmed || !sql.value.trim() || saving.value) return;
  saving.value = true;
  try {
    await $fetch("/api/queries", {
      method: "POST",
      body: { name: trimmed, sql: sql.value, connectionId: selectedConnectionId.value || null },
    });
    name.value = "";
    await refreshSaved();
  } finally {
    saving.value = false;
  }
}

function load(q: SavedQuery) {
  sql.value = q.sql;
  if (q.connectionId && connections.value?.some((c) => c.id === q.connectionId)) {
    selectedConnectionId.value = q.connectionId;
  }
}

async function remove(id: string) {
  await $fetch(`/api/queries/${id}`, { method: "DELETE" });
  await refreshSaved();
}
</script>

<template>
  <div class="stack">
    <h1 class="sr-only">Query</h1>
    <div v-if="!connections || connections.length === 0" class="empty">
      <span class="brand-mark empty-mark" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 14 14" fill="none">
          <rect x="0.5" y="8" width="3" height="5.5" rx="1" fill="var(--accent)" />
          <rect x="5.5" y="4" width="3" height="9.5" rx="1" fill="var(--accent)" />
          <rect x="10.5" y="0.5" width="3" height="13" rx="1" fill="var(--accent)" />
        </svg>
      </span>
      <p class="empty-title">Connect a Cloudflare account</p>
      <p class="muted">Add a connection to run SQL against your Analytics Engine datasets.</p>
      <button @click="navigateTo('/settings')">Add a connection</button>
    </div>

    <template v-else>
      <div class="runner-head">
        <label class="conn">
          <span class="muted">Connection</span>
          <select v-model="selectedConnectionId">
            <option v-for="c in connections" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </label>
        <span class="spacer" />
        <span v-if="selectedConnection?.defaultDataset" class="mono dataset-hint">
          {{ selectedConnection.defaultDataset }}
        </span>
      </div>

      <ClientOnly>
        <SqlEditor v-model="sql" :placeholder="'SELECT ... FROM your_dataset'" @run="run" />
        <template #fallback>
          <textarea
            :value="sql"
            placeholder="SELECT ... FROM your_dataset"
            aria-label="SQL query editor"
          />
        </template>
      </ClientOnly>

      <div class="actions">
        <button :disabled="running" @click="run">{{ running ? "Running…" : "Run" }}</button>
        <span class="kbd-hint" title="Run query"><kbd>Cmd</kbd><kbd>↵</kbd></span>
        <button class="ghost" @click="sampleQuery">Sample query</button>
        <span class="spacer" />
        <input
          v-model="name"
          placeholder="Name this query…"
          class="save-input"
          aria-label="Name this query"
          @keyup.enter="save"
        />
        <button class="ghost" :disabled="saving" @click="save">Save</button>
      </div>

      <p class="sr-only" role="status" aria-live="polite">{{ status }}</p>

      <div v-if="error || result" class="stack">
        <pre v-if="error" class="error" role="alert">{{ error }}</pre>
        <template v-else-if="result">
          <SegmentedControl
            :model-value="view"
            :options="[
              { value: 'table', label: 'Table' },
              { value: 'chart', label: 'Chart' },
            ]"
            aria-label="Result view"
            @update:model-value="(v) => (view = v as 'table' | 'chart')"
          />

          <ResultsTable
            v-if="view === 'table'"
            :rows="result.rows"
            :meta="result.meta"
            :elapsed-ms="result.elapsedMs"
          />

          <div v-else class="stack">
            <div class="row">
              <label style="flex: 0 0 auto">
                Type
                <select v-model="chartType">
                  <option value="line">Line</option>
                  <option value="area">Area</option>
                  <option value="bar">Bar</option>
                </select>
              </label>
              <label style="flex: 0 0 auto">
                X axis
                <select v-model="xColumn">
                  <option v-for="c in resultColumns" :key="c" :value="c">{{ c }}</option>
                </select>
              </label>
              <span class="muted">Series:</span>
              <label
                v-for="c in resultColumns.filter((col) => col !== xColumn)"
                :key="c"
                style="flex-direction: row; align-items: center; gap: 6px"
              >
                <input
                  type="checkbox"
                  style="width: auto"
                  :checked="yColumns.includes(c)"
                  @change="toggleY(c)"
                />
                {{ c }}
              </label>
            </div>
            <ClientOnly>
              <LazyChartView
                :rows="result.rows"
                :type="chartType"
                :x-column="xColumn"
                :y-columns="yColumns"
              />
            </ClientOnly>
          </div>
        </template>
      </div>

      <section class="saved card">
        <h3>Saved queries</h3>
        <p v-if="!saved || saved.length === 0" class="muted">
          No saved queries yet. Run something and save it to reuse later.
        </p>
        <ul v-else class="saved-list">
          <li v-for="q in saved" :key="q.id" class="saved-item">
            <button class="saved-name" @click="load(q)">{{ q.name }}</button>
            <ConfirmButton class="saved-del" @confirm="remove(q.id)" />
          </li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.runner-head {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}
.conn {
  flex-direction: row;
  align-items: center;
  gap: var(--space-sm);
}
.conn select {
  width: auto;
  min-width: 160px;
  max-width: 260px;
}
.dataset-hint {
  padding: 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-1);
  border: 1px solid var(--line-soft);
  color: var(--text-3);
}

.actions {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex-wrap: wrap;
}
.save-input {
  width: auto;
  min-width: 200px;
}
.kbd-hint {
  display: inline-flex;
  gap: 3px;
}
kbd {
  min-width: 20px;
  height: 20px;
  display: inline-grid;
  place-items: center;
  padding: 0 5px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: 5px;
  font-size: 11px;
  color: var(--text-3);
}

.empty {
  display: grid;
  gap: var(--space-xs);
  place-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
}
.empty-mark {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  margin-bottom: var(--space-xs);
}
.empty-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-md);
  margin: 0;
}
.empty button {
  margin-top: var(--space-sm);
}

.saved {
  gap: var(--space-md);
  display: grid;
}
.saved-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  min-width: 0;
}
.saved-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  padding: 10px 0;
  border-top: 1px solid var(--line-soft);
  min-width: 0;
}
.saved-item:first-child {
  border-top: none;
}
.saved-name {
  min-width: 0;
  flex: 1;
  background: transparent;
  color: var(--link);
  border: 0;
  padding: 0;
  font-weight: 500;
  text-align: left;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.saved-name:hover {
  background: transparent;
  text-decoration: underline;
  transform: none;
}
.saved-del {
  flex-shrink: 0;
  padding: 4px 10px;
  font-size: var(--text-xs);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}
.saved-item:hover .saved-del,
.saved-item:focus-within .saved-del {
  opacity: 1;
}
</style>
