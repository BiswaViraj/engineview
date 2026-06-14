// CSV serialisation shared by the results table and dashboard table panels.
// Pure (toCsv) so it is unit-testable; downloadCsv is the browser side.
export function toCsv(columns: string[], rows: Record<string, unknown>[]): string {
  const cell = (v: unknown) => (v == null ? "" : String(v));
  const escape = (v: unknown) => {
    const s = cell(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = columns.map(escape).join(",");
  const body = rows.map((r) => columns.map((c) => escape(r[c])).join(","));
  return [header, ...body].join("\n");
}

export function downloadCsv(
  filename: string,
  columns: string[],
  rows: Record<string, unknown>[],
): void {
  const blob = new Blob([toCsv(columns, rows)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
