import { db } from "../../utils/db";
import { savedQuery } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { parseBody } from "../../utils/validate";
import { savedQueryCreateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await parseBody(event, savedQueryCreateSchema);

  const [row] = await db
    .insert(savedQuery)
    .values({
      userId: user.id,
      name: body.name,
      sql: body.sql,
      connectionId: body.connectionId ?? null,
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
