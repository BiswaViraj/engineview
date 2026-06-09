import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  return db
    .select({
      id: savedQuery.id,
      name: savedQuery.name,
      sql: savedQuery.sql,
      connectionId: savedQuery.connectionId,
      createdAt: savedQuery.createdAt,
    })
    .from(savedQuery)
    .where(eq(savedQuery.userId, user.id))
    .orderBy(savedQuery.createdAt);
});
