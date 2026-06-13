import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../../utils/db";
import { app, dashboard, savedQuery } from "../../database/schema";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);

  const apps = await db
    .select({
      id: app.id,
      name: app.name,
      connectionId: app.connectionId,
      dataset: app.dataset,
      url: app.url,
      logoUrl: app.logoUrl,
      createdAt: app.createdAt,
    })
    .from(app)
    .where(eq(app.userId, user.id))
    .orderBy(app.createdAt);

  const ids = apps.map((a) => a.id);
  const countBy = async (table: typeof dashboard | typeof savedQuery) => {
    if (ids.length === 0) return new Map<string, number>();
    const rows = await db
      .select({ appId: table.appId, n: sql<number>`count(*)`.mapWith(Number) })
      .from(table)
      .where(inArray(table.appId, ids))
      .groupBy(table.appId);
    return new Map(rows.map((r) => [r.appId, r.n]));
  };
  const [dashCounts, queryCounts] = await Promise.all([countBy(dashboard), countBy(savedQuery)]);

  return apps.map((a) => ({
    ...a,
    dashboardCount: dashCounts.get(a.id) ?? 0,
    queryCount: queryCounts.get(a.id) ?? 0,
  }));
});
