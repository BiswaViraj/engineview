import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { panel } from "../../database/schema";
import { requireOwnedDashboard } from "../../utils/dashboards";

// A dashboard plus its panels. The panel sql is a snapshot, so it is included.
export default defineEventHandler(async (event) => {
  const { dashboard } = await requireOwnedDashboard(event, getRouterParam(event, "id"));
  const panels = await db
    .select()
    .from(panel)
    .where(eq(panel.dashboardId, dashboard.id))
    .orderBy(panel.createdAt);
  return { dashboard, panels };
});
