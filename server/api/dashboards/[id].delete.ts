import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireOwnedDashboard } from "../../utils/dashboards";

// Panels are removed by the ON DELETE CASCADE on panel.dashboard_id.
export default defineEventHandler(async (event) => {
  const { dashboard: existing } = await requireOwnedDashboard(event, getRouterParam(event, "id"));
  await db.delete(dashboard).where(eq(dashboard.id, existing.id));
  return { ok: true };
});
