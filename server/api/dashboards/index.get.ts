import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  return db
    .select({
      id: dashboard.id,
      name: dashboard.name,
      timeRange: dashboard.timeRange,
      createdAt: dashboard.createdAt,
    })
    .from(dashboard)
    .where(eq(dashboard.userId, user.id))
    .orderBy(dashboard.createdAt);
});
