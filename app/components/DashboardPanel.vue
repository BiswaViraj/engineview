<script setup lang="ts">
import { defaultAxes, type ChartType } from "~/lib/chart";
import { downloadCsv } from "~/lib/csv";
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

const colNames = computed(() =>
  meta.value.length ? meta.value.map((m) => m.name) : Object.keys(rows.value[0] ?? {}),
);

function exportCsv() {
  downloadCsv(`${props.panel.title || "panel"}.csv`, colNames.value, rows.value);
}

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
  <section class="panel card" :style="{ gridColumn: `span ${panel.posW}` }">
    <header class="panel-head">
      <h3 class="panel-title">{{ panel.title }}</h3>
      <div class="panel-actions">
        <button
          v-if="panel.chartType === 'table' && !error && rows.length"
          class="ghost"
          @click="exportCsv"
        >
          CSV
        </button>
        <button class="ghost" @click="toggleWidth">{{ panel.posW >= 12 ? "Half" : "Full" }}</button>
        <ConfirmButton label="Remove" @confirm="remove" />
      </div>
    </header>
    <p v-if="loading" class="muted panel-status">Loading…</p>
    <div v-else-if="error" class="panel-error" role="alert">
      <div class="panel-error-head">
        <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden="true" class="panel-error-icon">
          <path
            d="M8 1.5 15 14H1L8 1.5Z"
            fill="none"
            stroke="currentColor"
            stroke-width="1.3"
            stroke-linejoin="round"
          />
          <path d="M8 6.5v3.2M8 11.6h.01" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" />
        </svg>
        <span>Couldn't load this panel</span>
      </div>
      <p class="panel-error-msg">{{ error }}</p>
      <button v-if="panel.connectionId" class="ghost" @click="load">Retry</button>
    </div>
    <template v-else>
      <ResultsTable
        v-if="panel.chartType === 'table'"
        :rows="rows"
        :meta="meta"
        compact
        :max-height="`${panel.posH * 28}px`"
      />
      <ClientOnly v-else>
        <LazyChartView
          :rows="rows"
          :type="panel.chartType as ChartType"
          :x-column="axes.xColumn"
          :y-columns="axes.yColumns"
          :height="panel.posH * 28"
        />
      </ClientOnly>
    </template>
  </section>
</template>

<style scoped>
.panel {
  display: grid;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg) var(--space-lg);
  min-width: 0;
}
.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-sm);
  min-height: 28px;
  min-width: 0;
}
.panel-title {
  min-width: 0;
  flex: 1;
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: -0.01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.panel-actions {
  display: flex;
  flex-shrink: 0;
  gap: var(--space-2xs);
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease);
}
.panel:hover .panel-actions,
.panel:focus-within .panel-actions {
  opacity: 1;
}
.panel-actions button {
  padding: 4px 10px;
  font-size: var(--text-xs);
}
.panel-status {
  min-height: 80px;
  display: grid;
  place-items: center;
}
.panel-error {
  display: grid;
  gap: var(--space-sm);
  justify-items: start;
}
.panel-error-head {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--text-2);
  font-weight: 600;
  font-size: var(--text-sm);
}
.panel-error-icon {
  color: var(--danger);
  flex-shrink: 0;
}
.panel-error-msg {
  margin: 0;
  max-width: 100%;
  max-height: 5.5em;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: var(--text-xs);
  line-height: 1.5;
  color: var(--text-3);
  white-space: pre-wrap;
}
</style>
