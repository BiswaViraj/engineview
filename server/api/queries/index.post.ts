import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireUser } from "../../utils/session";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody<{ name?: string; sql?: string; connectionId?: string }>(event);

  const name = body.name?.trim();
  const sql = body.sql?.trim();
  if (!name || !sql) {
    throw createError({ statusCode: 400, statusMessage: "name and sql are required" });
  }

  const [row] = await db
    .insert(savedQuery)
    .values({
      userId: user.id,
      name,
      sql,
      connectionId: body.connectionId || null,
    })
    .returning({
      id: savedQuery.id,
      name: savedQuery.name,
      sql: savedQuery.sql,
      connectionId: savedQuery.connectionId,
      createdAt: savedQuery.createdAt,
    });

  setResponseStatus(event, 201);
  return row;
});
