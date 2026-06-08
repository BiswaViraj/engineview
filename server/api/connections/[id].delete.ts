import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });

  const deleted = await db
    .delete(cloudflareConnection)
    .where(and(eq(cloudflareConnection.id, id), eq(cloudflareConnection.userId, user.id)))
    .returning({ id: cloudflareConnection.id });

  if (deleted.length === 0) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return { ok: true };
});
