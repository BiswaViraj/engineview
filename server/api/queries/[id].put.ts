import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { parseBody } from "../../utils/validate";
import { savedQueryUpdateSchema } from "../../utils/schemas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cols = {
  id: savedQuery.id,
  appId: savedQuery.appId,
  name: savedQuery.name,
  sql: savedQuery.sql,
  connectionId: savedQuery.connectionId,
  createdAt: savedQuery.createdAt,
};

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const body = await parseBody(event, savedQueryUpdateSchema);

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.sql !== undefined) updates.sql = body.sql;

  const where = and(eq(savedQuery.id, id), eq(savedQuery.userId, user.id));

  if (Object.keys(updates).length === 0) {
    const [row] = await db.select(cols).from(savedQuery).where(where).limit(1);
    if (!row) throw createError({ statusCode: 404, statusMessage: "Not found" });
    return row;
  }

  const [row] = await db.update(savedQuery).set(updates).where(where).returning(cols);
  if (!row) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return row;
});
