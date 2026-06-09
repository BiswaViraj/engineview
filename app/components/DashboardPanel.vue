<script setup lang="ts">
import { defaultAxes, type ChartType } from "~/lib/chart";
import { extractApiError } from "~/lib/errors";

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
interface ColumnMeta {
  name: string;
  type: string;
}

const props = defineProps<{ panel: Panel; timeRange: string }>();
const emit = defineEmits<{ deleted: []; updated: [] }>();

const rows = ref<Record<string, unknown>[]>([]);
const meta = ref<ColumnMeta[]>([]);
const error = ref("");
const loading = ref(true);

async function load() {
  if (!props.panel.connectionId) {
    error.value = "This panel's Cloudflare connection was removed. Recreate the panel.";
    loading.value = false;
    return;
  }
  loading.value = true;
  error.value = "";
  try {
    const body = await $fetch<{ data?: Record<string, unknown>[]; meta?: ColumnMeta[] }>(
      "/api/query",
      {
        method: "POST",
        body: {
          connectionId: props.panel.connectionId,
          sql: props.panel.sql,
          timeRange: props.timeRange,
        },
      },
    );
    rows.value = body.data ?? [];
    meta.value = body.meta ?? [];
  } catch (e) {
    error.value = extractApiError(e);
  } finally {
    loading.value = false;
  }
}

const axes = computed(() => {
  if (props.panel.xColumn && props.panel.yColumns?.length) {
    return { xColumn: props.panel.xColumn, yColumns: props.panel.yColumns };
  }
  return defaultAxes(meta.value, rows.value);
});

onMounted(load);
watch(() => props.timeRange, load);

async function remove() {
  await $fetch(`/api/panels/${props.panel.id}`, { method: "DELETE" });
  emit("deleted");
}

async function toggleWidth() {
  const next = props.panel.posW >= 12 ? 6 : 12;
  await $fetch(`/api/panels/${props.panel.id}`, { method: "PUT", body: { posW: next } });
  emit("updated");
}
</script>

<template>
  <div class="card stack" :style="{ gridColumn: `span ${panel.posW}` }">
    <div class="row">
      <strong>{{ panel.title }}</strong>
      <span class="spacer" />
      <button class="ghost" @click="toggleWidth">{{ panel.posW >= 12 ? "half" : "full" }}</button>
      <button class="ghost" @click="remove">remove</button>
    </div>
    <p v-if="loading" class="muted">Loading...</p>
    <pre v-else-if="error" class="error">{{ error }}</pre>
    <ClientOnly v-else>
      <ChartView
        :rows="rows"
        :type="panel.chartType as ChartType"
        :x-column="axes.xColumn"
        :y-columns="axes.yColumns"
        :height="panel.posH * 28"
      />
    </ClientOnly>
  </div>
</template>
