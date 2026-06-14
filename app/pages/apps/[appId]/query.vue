<script setup lang="ts">
import { defaultAxes, type ChartType } from "~/lib/chart";
import { extractApiError } from "~/lib/errors";

definePageMeta({ middleware: "auth" });

interface AppItem {
  id: string;
  name: string;
  connectionId: string;
  dataset: string | null;
  url: string | null;
  logoUrl: string | null;
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

const appId = useRoute().params.appId as string;
const SQL_KEY = `ev_sql_${appId}`;

const { data: appData } = await useFetch<AppItem>(`/api/apps/${appId}`);
const { data: saved, refresh: refreshSaved } = await useFetch<SavedQuery[]>(
  `/api/queries?appId=${appId}`,
  { default: () => [] },
);
const { data: connections } = await useFetch<{ id: string; label: string }[]>("/api/connections", {
  default: () => [],
});
const connectionLabel = computed(
  () => connections.value.find((c) => c.id === appData.value?.connectionId)?.label ?? "",
);

const sql = ref("");
const name = ref("");
const editingId = ref<string | null>(null);
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
  const ds = appData.value?.dataset || "your_dataset";
  sql.value = `SELECT\n  blob1 AS dimension,\n  SUM(_sample_interval) AS count\nFROM ${ds}\nWHERE timestamp > NOW() - INTERVAL '24' HOUR\nGROUP BY dimension\nORDER BY count DESC\nLIMIT 100`;
}

async function run() {
  if (!sql.value.trim() || running.value) return;
  if (!appData.value?.connectionId) {
    error.value = "This app has no connection configured.";
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
      { method: "POST", body: { connectionId: appData.value.connectionId, sql: sql.value } },
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

async function createQuery(nameValue: string): Promise<SavedQuery> {
  return await $fetch<SavedQuery>("/api/queries", {
    method: "POST",
    body: {
      name: nameValue,
      sql: sql.value,
      appId,
      connectionId: appData.value?.connectionId ?? null,
    },
  });
}

async function save() {
  const trimmed = name.value.trim();
  if (!trimmed || !sql.value.trim() || saving.value) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await $fetch(`/api/queries/${editingId.value}`, {
        method: "PUT",
        body: { name: trimmed, sql: sql.value },
      });
    } else {
      const created = await createQuery(trimmed);
      editingId.value = created.id;
    }
    await refreshSaved();
  } finally {
    saving.value = false;
  }
}

async function saveAsNew() {
  const trimmed = name.value.trim();
  if (!trimmed || !sql.value.trim() || saving.value) return;
  saving.value = true;
  try {
    const created = await createQuery(trimmed);
    editingId.value = created.id;
    await refreshSaved();
  } finally {
    saving.value = false;
  }
}

function load(q: SavedQuery) {
  sql.value = q.sql;
  name.value = q.name;
  editingId.value = q.id;
}

function clearEditing() {
  editingId.value = null;
  name.value = "";
}

async function remove(id: string) {
  await $fetch(`/api/queries/${id}`, { method: "DELETE" });
  await refreshSaved();
}
</script>

<template>
  <div class="stack">
    <AppSubnav :app-id="appId" />
    <h1 class="sr-only">Query</h1>

    <template v-if="appData">
      <div class="runner-head">
        <span class="runner-context muted">
          {{ connectionLabel
          }}<template v-if="appData.dataset">
            · <span class="mono">{{ appData.dataset }}</span></template
          >
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
        <span v-if="editingId" class="editing-chip">
          Editing
          <button
            type="button"
            class="chip-clear"
            aria-label="Start a new query"
            @click="clearEditing"
          >
            ×
          </button>
        </span>
        <input
          v-model="name"
          placeholder="Name this query…"
          class="save-input"
          aria-label="Name this query"
          @keyup.enter="save"
        />
        <button class="ghost" :disabled="saving" @click="save">Save</button>
        <button v-if="editingId" class="ghost" :disabled="saving" @click="saveAsNew">
          Save as new
        </button>
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
                  <option value="stat">Stat</option>
                </select>
              </label>
              <template v-if="chartType !== 'stat'">
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
              </template>
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
}
.runner-context {
  font-size: var(--text-sm);
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
.editing-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2xs);
  padding: 4px 6px 4px 10px;
  border-radius: var(--radius-pill);
  background: var(--surface-2);
  border: 1px solid var(--line-soft);
  font-size: var(--text-xs);
  color: var(--text-2);
  white-space: nowrap;
}
.chip-clear {
  --btn-bg: transparent;
  --btn-fg: var(--text-3);
  width: 16px;
  height: 16px;
  padding: 0;
  border: 0;
  border-radius: var(--radius-pill);
  font-size: 14px;
  line-height: 1;
}
.chip-clear:hover {
  --btn-bg: var(--surface-3);
  --btn-fg: var(--text);
  transform: none;
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
