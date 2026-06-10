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

// Distinguishable by lightness as well as hue, so series stay readable without
// relying on color alone.
const PALETTE = ["#4d8dff", "#e3b341", "#43c4c0", "#d678c2", "#66cf83", "#e58b4a"];

// Match the UI surfaces so charts feel native rather than dropped in.
const TICK = "#7f8a9e";
const GRID = "rgba(120, 134, 158, 0.12)";
const LABEL = "#aab3c4";
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
      backgroundColor: "#11161f",
      borderColor: "rgba(120, 134, 158, 0.25)",
      borderWidth: 1,
      titleColor: LABEL,
      bodyColor: "#eef1f6",
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
