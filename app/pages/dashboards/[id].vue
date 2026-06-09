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
const id = route.params.id as string;

const { data, error, refresh } = await useFetch<DashboardData>(`/api/dashboards/${id}`);
const { data: saved } = await useFetch<SavedQuery[]>("/api/queries", { default: () => [] });

const RANGES = ["1 HOUR", "24 HOUR", "7 DAY", "30 DAY"];
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
  await navigateTo("/dashboards");
}
</script>

<template>
  <div v-if="error" class="card">
    <p class="muted" style="margin: 0">
      Dashboard not found. <NuxtLink to="/dashboards">Back to dashboards</NuxtLink>
    </p>
  </div>
  <div v-else-if="data" class="stack">
    <div class="row">
      <h2 style="margin: 0">{{ data.dashboard.name }}</h2>
      <span class="spacer" />
      <label style="flex-direction: row; align-items: center; gap: 6px">
        <span class="muted">Time range</span>
        <select :value="timeRange" @change="setRange(($event.target as HTMLSelectElement).value)">
          <option v-for="r in RANGES" :key="r" :value="r">last {{ r.toLowerCase() }}</option>
        </select>
      </label>
      <button class="ghost" @click="removeDashboard">Delete dashboard</button>
    </div>

    <div class="card stack">
      <h3 style="margin: 0">Add a panel</h3>
      <p v-if="!saved || saved.length === 0" class="muted" style="margin: 0">
        Save a query first on the <NuxtLink to="/">Query</NuxtLink> page, then add it here.
      </p>
      <div v-else class="row">
        <input v-model="addForm.title" placeholder="Panel title" style="width: auto" />
        <select v-model="addForm.queryId">
          <option value="" disabled>Choose a saved query</option>
          <option v-for="q in saved" :key="q.id" :value="q.id">{{ q.name }}</option>
        </select>
        <select v-model="addForm.chartType">
          <option value="line">line</option>
          <option value="area">area</option>
          <option value="bar">bar</option>
        </select>
        <button :disabled="adding" @click="addPanel">Add panel</button>
      </div>
      <p class="muted" style="margin: 0">
        Tip: use the <code>$SINCE</code> token in a query (e.g. <code>timestamp &gt; $SINCE</code>)
        and it expands to the dashboard's time range.
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
    <p v-else class="muted">No panels yet. Add one above.</p>
  </div>
</template>

<style scoped>
.panel-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 16px;
}
</style>
