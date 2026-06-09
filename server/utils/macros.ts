// Dashboard time-range macro. A query may use the literal `$SINCE` token, which
// expands to a timestamp expression built from the dashboard's selected range,
// e.g. `NOW() - INTERVAL '24' HOUR`. Queries without the token run unchanged, so
// the macro is fully opt-in. The number is digits-only and the unit comes from a
// fixed allow-list, so expansion cannot inject arbitrary SQL.

export const DEFAULT_RANGE = "24 HOUR";

const RANGE = /^(\d+)\s+(MINUTE|HOUR|DAY|WEEK|MONTH)S?$/i;

export function sinceExpression(timeRange: string): string {
  const match = RANGE.exec((timeRange ?? "").trim());
  const amount = match ? match[1] : "24";
  const unit = match ? match[2]!.toUpperCase() : "HOUR";
  return `NOW() - INTERVAL '${amount}' ${unit}`;
}

export function expandTimeMacro(sql: string, timeRange: string = DEFAULT_RANGE): string {
  return sql.replace(/\$SINCE\b/g, sinceExpression(timeRange));
}
