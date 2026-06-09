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

const PALETTE = ["#1f6feb", "#3fb950", "#db61a2", "#e3b341", "#a371f7", "#f0883e"];

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
        backgroundColor: props.type === "area" ? `${color}33` : color,
        fill: props.type === "area",
        tension: 0.2,
        pointRadius: 2,
      };
    }),
  };
});

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { color: "#e6edf3" } } },
  scales: {
    x: { ticks: { color: "#8b949e" }, grid: { color: "#1c2530" } },
    y: { ticks: { color: "#8b949e" }, grid: { color: "#1c2530" } },
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
