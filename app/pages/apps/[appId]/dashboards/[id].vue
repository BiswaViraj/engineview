<script setup lang="ts">
definePageMeta({ middleware: "auth" });

interface Panel {
  id: string;
  title: string;
  sql: string;
  connectionId: string | null;
  chartType: string;
  xColumn: string | null;
  yColumns: string[];
  posW: number;
  posH: number;
}
interface DashboardData {
  dashboard: { id: string; name: string; timeRange: string };
  panels: Panel[];
}
interface SavedQuery {
  id: string;
  name: string;
}

const route = useRoute();
const appId = route.params.appId as string;
const id = route.params.id as string;

const { data, error, refresh } = await useFetch<DashboardData>(`/api/dashboards/${id}`);
const { data: saved } = await useFetch<SavedQuery[]>(`/api/queries?appId=${appId}`, {
  default: () => [],
});

const RANGES = ["1 HOUR", "24 HOUR", "7 DAY", "30 DAY"];
const rangeOptions = RANGES.map((r) => ({
  value: r,
  label: r.replace(" HOUR", "h").replace(" DAY", "d"),
}));
const timeRange = ref(data.value?.dashboard.timeRange ?? "24 HOUR");

async function setRange(r: string) {
  timeRange.value = r;
  await $fetch(`/api/dashboards/${id}`, { method: "PUT", body: { timeRange: r } });
}

const addForm = reactive({ queryId: "", title: "", chartType: "line" });
const adding = ref(false);

async function addPanel() {
  if (!addForm.queryId || !addForm.title.trim() || adding.value) return;
  adding.value = true;
  try {
    await $fetch(`/api/dashboards/${id}/panels`, {
      method: "POST",
      body: { queryId: addForm.queryId, title: addForm.title.trim(), chartType: addForm.chartType },
    });
    addForm.queryId = "";
    addForm.title = "";
    addForm.chartType = "line";
    await refresh();
  } finally {
    adding.value = false;
  }
}

async function removeDashboard() {
  await $fetch(`/api/dashboards/${id}`, { method: "DELETE" });
  await navigateTo(`/apps/${appId}/dashboards`);
}
</script>

<template>
  <div v-if="error" class="card">
    <p class="muted">
      Dashboard not found.
      <NuxtLink :to="`/apps/${appId}/dashboards`">Back to dashboards</NuxtLink>
    </p>
  </div>
  <div v-else-if="data" class="stack">
    <div class="dash-head">
      <div class="dash-title">
        <span class="eyebrow">Dashboard</span>
        <h1>{{ data.dashboard.name }}</h1>
      </div>
      <span class="spacer" />
      <SegmentedControl
        :model-value="timeRange"
        :options="rangeOptions"
        aria-label="Time range"
        @update:model-value="setRange"
      />
      <ConfirmButton label="Delete" confirm-label="Delete dashboard?" @confirm="removeDashboard" />
    </div>

    <div class="add-panel">
      <p v-if="!saved || saved.length === 0" class="muted">
        Save a query first on the <NuxtLink :to="`/apps/${appId}/query`">Query</NuxtLink> page, then
        add it here.
      </p>
      <form v-else class="add-panel-row" @submit.prevent="addPanel">
        <input
          v-model="addForm.title"
          placeholder="Panel title"
          aria-label="Panel title"
          maxlength="80"
        />
        <select v-model="addForm.queryId" aria-label="Saved query">
          <option value="" disabled>Choose a saved query</option>
          <option v-for="q in saved" :key="q.id" :value="q.id">{{ q.name }}</option>
        </select>
        <select v-model="addForm.chartType" aria-label="Chart type">
          <option value="line">Line</option>
          <option value="area">Area</option>
          <option value="bar">Bar</option>
          <option value="stat">Stat</option>
          <option value="table">Table</option>
        </select>
        <button type="submit" :disabled="adding">{{ adding ? "Adding…" : "Add panel" }}</button>
      </form>
      <p class="muted add-panel-tip">
        Use <code>$SINCE</code> in a query (e.g. <code>timestamp &gt; $SINCE</code>) to follow the
        dashboard's time range.
      </p>
    </div>

    <div v-if="data.panels.length" class="panel-grid">
      <DashboardPanel
        v-for="p in data.panels"
        :key="p.id"
        :panel="p"
        :time-range="timeRange"
        @deleted="refresh"
        @updated="refresh"
      />
    </div>
    <div v-else class="empty">
      <p class="empty-title">No panels yet</p>
      <p class="muted">Add a saved query above to chart it here. Panels share the time range.</p>
    </div>
  </div>
</template>

<style scoped>
.dash-head {
  display: flex;
  align-items: flex-end;
  gap: var(--space-md);
  flex-wrap: wrap;
}
.dash-title {
  display: grid;
  gap: var(--space-2xs);
  min-width: 0;
}
.dash-title h1 {
  margin: 0;
  overflow-wrap: anywhere;
}

.add-panel {
  display: grid;
  gap: var(--space-xs);
  padding: var(--space-md);
  background: var(--surface-1);
  border: 1px solid var(--line-soft);
  border-radius: var(--radius-lg);
}
.add-panel-row {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(220px, 2fr) auto auto;
  gap: var(--space-sm);
  align-items: center;
}
.add-panel-tip {
  margin: 0;
  font-size: var(--text-xs);
}

.panel-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-md);
}

.empty {
  display: grid;
  gap: var(--space-2xs);
  place-items: center;
  text-align: center;
  padding: var(--space-3xl) var(--space-lg);
  border: 1px dashed var(--line);
  border-radius: var(--radius-lg);
}
.empty-title {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: var(--text-md);
  margin: 0;
}

@media (max-width: 720px) {
  .add-panel-row {
    grid-template-columns: 1fr;
  }
  /* Collapse to a single column so panels are full width on a phone. A panel's
     stored span is clamped to the one available column. */
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
