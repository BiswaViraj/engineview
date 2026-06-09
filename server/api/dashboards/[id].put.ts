import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireOwnedDashboard } from "../../utils/dashboards";

export default defineEventHandler(async (event) => {
  const { dashboard: existing } = await requireOwnedDashboard(event, getRouterParam(event, "id"));
  const body = await readBody<{ name?: string; timeRange?: string }>(event);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name.trim();
  if (body.timeRange !== undefined) updates.timeRange = body.timeRange.trim();
  if (Object.keys(updates).length === 0) return existing;

  const [row] = await db
    .update(dashboard)
    .set(updates)
    .where(eq(dashboard.id, existing.id))
    .returning({
      id: dashboard.id,
      name: dashboard.name,
      timeRange: dashboard.timeRange,
      createdAt: dashboard.createdAt,
    });
  return row;
});
