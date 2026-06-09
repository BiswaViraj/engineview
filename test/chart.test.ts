import { describe, it, expect } from "vitest";
import { buildChartData, defaultAxes } from "../app/lib/chart";

describe("buildChartData", () => {
  const rows = [
    { referrer: "google", views: 100, visits: 40 },
    { referrer: "direct", views: 50, visits: 30 },
  ];

  it("maps the x column to labels and y columns to datasets", () => {
    const series = buildChartData(rows, "referrer", ["views", "visits"]);
    expect(series.labels).toEqual(["google", "direct"]);
    expect(series.datasets).toHaveLength(2);
    expect(series.datasets[0]).toEqual({ label: "views", data: [100, 50] });
    expect(series.datasets[1]).toEqual({ label: "visits", data: [40, 30] });
  });

  it("coerces numeric strings and nulls out non-numbers", () => {
    const mixed = [
      { x: "a", y: "12" },
      { x: "b", y: "not-a-number" },
      { x: "c", y: null },
    ];
    const series = buildChartData(mixed, "x", ["y"]);
    expect(series.datasets[0]!.data).toEqual([12, null, null]);
  });

  it("keeps numeric x labels as numbers", () => {
    const series = buildChartData([{ t: 1, y: 5 }], "t", ["y"]);
    expect(series.labels).toEqual([1]);
  });
});

describe("defaultAxes", () => {
  it("uses the first column as x and numeric columns as series", () => {
    const meta = [
      { name: "referrer", type: "String" },
      { name: "views", type: "UInt64" },
      { name: "visits", type: "Float64" },
    ];
    expect(defaultAxes(meta, [])).toEqual({
      xColumn: "referrer",
      yColumns: ["views", "visits"],
    });
  });

  it("falls back to value types when meta has no types", () => {
    const rows = [{ name: "a", count: 3 }];
    expect(defaultAxes([], rows)).toEqual({ xColumn: "name", yColumns: ["count"] });
  });

  it("falls back to remaining columns when none look numeric", () => {
    const meta = [
      { name: "a", type: "String" },
      { name: "b", type: "String" },
    ];
    expect(defaultAxes(meta, [{ a: "x", b: "y" }])).toEqual({ xColumn: "a", yColumns: ["b"] });
  });

  it("handles an empty result", () => {
    expect(defaultAxes([], [])).toEqual({ xColumn: "", yColumns: [] });
  });
});
