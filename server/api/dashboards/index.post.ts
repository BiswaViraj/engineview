import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody<{ name?: string }>(event);
  const name = body.name?.trim();
  if (!name) throw createError({ statusCode: 400, statusMessage: "name is required" });

  const [row] = await db
    .insert(dashboard)
    .values({ userId: user.id, name })
    .returning({
      id: dashboard.id,
      name: dashboard.name,
      timeRange: dashboard.timeRange,
      createdAt: dashboard.createdAt,
    });

  setResponseStatus(event, 201);
  return row;
});
