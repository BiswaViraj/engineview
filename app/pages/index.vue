<script setup lang="ts">
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

const { data: connections } = await useFetch<Connection[]>("/api/connections", { default: () => [] });
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

function extractError(e: unknown): string {
  const data = (e as { data?: { errors?: { code?: number; message?: string }[]; error?: string; statusMessage?: string } })?.data;
  if (data?.errors?.length) return data.errors.map((x) => x.message ?? `code ${x.code}`).join("\n");
  if (data?.error) return data.error;
  if (data?.statusMessage) return data.statusMessage;
  return (e as Error)?.message || "Query failed.";
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
    error.value = extractError(e);
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

      <div>
        <pre v-if="error" class="error">{{ error }}</pre>
        <ResultsTable
          v-else-if="result"
          :rows="result.rows"
          :meta="result.meta"
          :elapsed-ms="result.elapsedMs"
        />
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
