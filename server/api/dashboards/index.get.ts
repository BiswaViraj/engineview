import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireOwnedApp } from "../../utils/apps";

export default defineEventHandler(async (event) => {
  const appId = getQuery(event).appId as string | undefined;
  const { user } = await requireOwnedApp(event, appId);
  return db
    .select({
      id: dashboard.id,
      name: dashboard.name,
      timeRange: dashboard.timeRange,
      appId: dashboard.appId,
      createdAt: dashboard.createdAt,
    })
    .from(dashboard)
    .where(and(eq(dashboard.userId, user.id), eq(dashboard.appId, appId!)))
    .orderBy(dashboard.createdAt);
});
