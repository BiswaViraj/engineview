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
const error = ref("");

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
  const started = performance.now();
  try {
    const body = await $fetch<{ data?: Record<string, unknown>[]; meta?: ColumnMeta[] }>(
      "/api/query",
      { method: "POST", body: { connectionId: selectedConnectionId.value, sql: sql.value } },
    );
    result.value = {
      rows: body.data ?? [],
      meta: body.meta ?? [],
      elapsedMs: Math.round(performance.now() - started),
    };
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    running.value = false;
  }
}

async function save() {
  const trimmed = name.value.trim();
  if (!trimmed || !sql.value.trim()) return;
  await $fetch("/api/queries", {
    method: "POST",
    body: { name: trimmed, sql: sql.value, connectionId: selectedConnectionId.value || null },
  });
  name.value = "";
  await refreshSaved();
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
    <div v-if="!connections || connections.length === 0" class="card">
      <p class="muted" style="margin: 0">
        Add a Cloudflare connection under
        <NuxtLink to="/settings">Connections</NuxtLink> to start running queries.
      </p>
    </div>

    <template v-else>
      <div class="row">
        <label style="flex: 0 0 auto">
          Connection
          <select v-model="selectedConnectionId">
            <option v-for="c in connections" :key="c.id" :value="c.id">{{ c.label }}</option>
          </select>
        </label>
      </div>

      <ClientOnly>
        <SqlEditor v-model="sql" :placeholder="'SELECT ... FROM your_dataset'" @run="run" />
        <template #fallback>
          <textarea :value="sql" placeholder="SELECT ... FROM your_dataset" />
        </template>
      </ClientOnly>

      <div class="row">
        <button :disabled="running" @click="run">{{ running ? "Running..." : "Run" }}</button>
        <span class="muted">or press Cmd/Ctrl + Enter</span>
        <button class="ghost" @click="sampleQuery">Sample query</button>
        <span class="spacer" />
        <input v-model="name" placeholder="Save as..." style="width: auto" />
        <button class="ghost" @click="save">Save query</button>
      </div>

      <div v-if="error || result" class="stack">
        <pre v-if="error" class="error">{{ error }}</pre>
        <template v-else-if="result">
          <div class="row">
            <button :class="{ ghost: view !== 'table' }" @click="view = 'table'">Table</button>
            <button :class="{ ghost: view !== 'chart' }" @click="view = 'chart'">Chart</button>
          </div>

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
                  <option value="line">line</option>
                  <option value="area">area</option>
                  <option value="bar">bar</option>
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
              <ChartView
                :rows="result.rows"
                :type="chartType"
                :x-column="xColumn"
                :y-columns="yColumns"
              />
            </ClientOnly>
          </div>
        </template>
      </div>

      <div class="card stack">
        <h3 style="margin: 0">Saved queries</h3>
        <p v-if="!saved || saved.length === 0" class="muted">None yet.</p>
        <div v-for="q in saved" v-else :key="q.id" class="row">
          <a style="cursor: pointer" @click="load(q)">{{ q.name }}</a>
          <button class="ghost" @click="remove(q.id)">delete</button>
        </div>
      </div>
    </template>
  </div>
</template>
