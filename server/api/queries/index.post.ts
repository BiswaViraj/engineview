import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireOwnedApp } from "../../utils/apps";
import { parseBody } from "../../utils/validate";
import { savedQueryCreateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, savedQueryCreateSchema);
  const { user } = await requireOwnedApp(event, body.appId);

  const [row] = await db
    .insert(savedQuery)
    .values({
      userId: user.id,
      appId: body.appId,
      name: body.name,
      sql: body.sql,
      connectionId: body.connectionId ?? null,
    })
    .returning({
      id: savedQuery.id,
      appId: savedQuery.appId,
      name: savedQuery.name,
      sql: savedQuery.sql,
      connectionId: savedQuery.connectionId,
      createdAt: savedQuery.createdAt,
    });

  setResponseStatus(event, 201);
  return row;
});
