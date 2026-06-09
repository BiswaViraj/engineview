import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireUser } from "../../utils/session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });

  const deleted = await db
    .delete(savedQuery)
    .where(and(eq(savedQuery.id, id), eq(savedQuery.userId, user.id)))
    .returning({ id: savedQuery.id });

  if (deleted.length === 0) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return { ok: true };
});
