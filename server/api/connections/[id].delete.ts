import { and, eq, sql } from "drizzle-orm";
import { db } from "../../utils/db";
import { app, cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });

  const counts = await db
    .select({ n: sql<number>`count(*)`.mapWith(Number) })
    .from(app)
    .where(eq(app.connectionId, id));
  if ((counts[0]?.n ?? 0) > 0) {
    throw createError({
      statusCode: 409,
      statusMessage: "This connection is used by one or more apps. Delete those apps first.",
    });
  }

  const deleted = await db
    .delete(cloudflareConnection)
    .where(and(eq(cloudflareConnection.id, id), eq(cloudflareConnection.userId, user.id)))
    .returning({ id: cloudflareConnection.id });

  if (deleted.length === 0) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return { ok: true };
});
