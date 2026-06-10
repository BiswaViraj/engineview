<script setup lang="ts">
import { Line, Bar } from "vue-chartjs";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler,
} from "chart.js";
import { buildChartData, type ChartType } from "~/lib/chart";

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Filler,
);

const props = withDefaults(
  defineProps<{
    rows: Record<string, unknown>[];
    type?: ChartType;
    xColumn: string;
    yColumns: string[];
    height?: number;
  }>(),
  { type: "line", height: 360 },
);

// Read chart colors from the design tokens so charts, the landing mock, and any
// future theme stay in sync. Fallbacks keep things sane outside the browser.
function token(name: string, fallback: string): string {
  if (import.meta.client) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (v) return v;
  }
  return fallback;
}

// Distinguishable by lightness as well as hue, so series stay readable without
// relying on color alone.
const PALETTE = [
  token("--chart-1", "#4d8dff"),
  token("--chart-2", "#e3b341"),
  token("--chart-3", "#43c4c0"),
  token("--chart-4", "#d678c2"),
  token("--chart-5", "#66cf83"),
  token("--chart-6", "#e58b4a"),
];

// Match the UI surfaces so charts feel native rather than dropped in.
const TICK = token("--chart-axis", "#7f8a9e");
const GRID = token("--chart-grid", "rgba(120, 134, 158, 0.12)");
const LABEL = token("--chart-label", "#aab3c4");
const TOOLTIP_BG = token("--chart-tooltip-bg", "#11161f");
const TOOLTIP_FG = token("--chart-tooltip-fg", "#eef1f6");
const GRID_FONT = {
  family: "'JetBrains Mono', ui-monospace, monospace",
  size: 10,
};

const chartData = computed(() => {
  const series = buildChartData(props.rows, props.xColumn, props.yColumns);
  return {
    labels: series.labels,
    datasets: series.datasets.map((d, i) => {
      const color = PALETTE[i % PALETTE.length]!;
      return {
        label: d.label,
        data: d.data,
        borderColor: color,
        backgroundColor: props.type === "area" ? `${color}26` : color,
        fill: props.type === "area",
        borderWidth: 2,
        tension: 0.28,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: color,
        borderRadius: props.type === "bar" ? 3 : 0,
        maxBarThickness: 26,
      };
    }),
  };
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: "index" as const, intersect: false },
  plugins: {
    legend: {
      align: "end" as const,
      labels: {
        color: LABEL,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        pointStyle: "circle",
        font: { family: "'Hanken Grotesk', sans-serif", size: 12 },
      },
    },
    tooltip: {
      backgroundColor: TOOLTIP_BG,
      borderColor: "rgba(120, 134, 158, 0.25)",
      borderWidth: 1,
      titleColor: LABEL,
      bodyColor: TOOLTIP_FG,
      padding: 10,
      cornerRadius: 8,
      titleFont: GRID_FONT,
    },
  },
  scales: {
    x: { ticks: { color: TICK, font: GRID_FONT }, grid: { color: GRID, drawTicks: false } },
    y: {
      ticks: { color: TICK, font: GRID_FONT, maxTicksLimit: 6 },
      grid: { color: GRID, drawTicks: false },
      border: { display: false },
    },
  },
};
</script>

<template>
  <div :style="{ height: `${height}px` }">
    <p v-if="rows.length === 0 || !xColumn || yColumns.length === 0" class="muted">
      Nothing to chart yet.
    </p>
    <Bar v-else-if="type === 'bar'" :data="chartData" :options="options" />
    <Line v-else :data="chartData" :options="options" />
  </div>
</template>
