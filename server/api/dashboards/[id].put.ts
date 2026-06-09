import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireOwnedDashboard } from "../../utils/dashboards";
import { parseBody } from "../../utils/validate";
import { dashboardUpdateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const { dashboard: existing } = await requireOwnedDashboard(event, getRouterParam(event, "id"));
  const body = await parseBody(event, dashboardUpdateSchema);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.timeRange !== undefined) updates.timeRange = body.timeRange;
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
