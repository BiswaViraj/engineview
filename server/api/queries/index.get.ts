import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireOwnedApp } from "../../utils/apps";

export default defineEventHandler(async (event) => {
  const appId = getQuery(event).appId as string | undefined;
  const { user } = await requireOwnedApp(event, appId);
  return db
    .select({
      id: savedQuery.id,
      name: savedQuery.name,
      sql: savedQuery.sql,
      connectionId: savedQuery.connectionId,
      appId: savedQuery.appId,
      createdAt: savedQuery.createdAt,
    })
    .from(savedQuery)
    .where(and(eq(savedQuery.userId, user.id), eq(savedQuery.appId, appId!)))
    .orderBy(savedQuery.createdAt);
});
