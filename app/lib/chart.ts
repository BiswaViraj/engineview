// Pure mapping from query rows to a Chart.js-style data structure. Kept free of
// any framework so it can be unit-tested and reused by the runner and dashboard
// panels.

export type ChartType = "line" | "bar" | "area";

export interface ChartSeries {
  labels: (string | number)[];
  datasets: { label: string; data: (number | null)[] }[];
}

function toNumber(value: unknown): number | null {
  if (value == null) return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function buildChartData(
  rows: Record<string, unknown>[],
  xColumn: string,
  yColumns: string[],
): ChartSeries {
  const labels = rows.map((r) => {
    const v = r[xColumn];
    return typeof v === "number" ? v : String(v ?? "");
  });
  const datasets = yColumns.map((y) => ({
    label: y,
    data: rows.map((r) => toNumber(r[y])),
  }));
  return { labels, datasets };
}

// Sensible defaults when a result first arrives: the first column is the x axis,
// and every numeric column after it becomes a series.
const NUMERIC = /int|float|double|decimal|number/i;

export function defaultAxes(
  meta: { name: string; type: string }[],
  rows: Record<string, unknown>[],
): { xColumn: string; yColumns: string[] } {
  const columns = meta.length
    ? meta
    : Object.keys(rows[0] ?? {}).map((name) => ({ name, type: "" }));
  if (columns.length === 0) return { xColumn: "", yColumns: [] };

  const xColumn = columns[0]!.name;
  let yColumns = columns
    .slice(1)
    .filter((c) => (c.type ? NUMERIC.test(c.type) : typeof rows[0]?.[c.name] === "number"))
    .map((c) => c.name);

  // Fall back to any non-x column so a chart is still possible without type info.
  if (yColumns.length === 0) yColumns = columns.slice(1).map((c) => c.name);
  return { xColumn, yColumns };
}
