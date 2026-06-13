import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { app, cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { parseBody } from "../../utils/validate";
import { appCreateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await parseBody(event, appCreateSchema);

  const [conn] = await db
    .select({ id: cloudflareConnection.id })
    .from(cloudflareConnection)
    .where(
      and(eq(cloudflareConnection.id, body.connectionId), eq(cloudflareConnection.userId, user.id)),
    )
    .limit(1);
  if (!conn) throw createError({ statusCode: 400, statusMessage: "Connection not found" });

  const [row] = await db
    .insert(app)
    .values({
      userId: user.id,
      connectionId: body.connectionId,
      name: body.name,
      dataset: body.dataset || null,
      url: body.url || null,
      logoUrl: body.logoUrl || null,
    })
    .returning();

  setResponseStatus(event, 201);
  return row;
});
