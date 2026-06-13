import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { app, cloudflareConnection } from "../../database/schema";
import { requireOwnedApp } from "../../utils/apps";
import { parseBody } from "../../utils/validate";
import { appUpdateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const { user, app: existing } = await requireOwnedApp(event, getRouterParam(event, "id"));
  const body = await parseBody(event, appUpdateSchema);

  if (body.connectionId) {
    const [conn] = await db
      .select({ id: cloudflareConnection.id })
      .from(cloudflareConnection)
      .where(
        and(
          eq(cloudflareConnection.id, body.connectionId),
          eq(cloudflareConnection.userId, user.id),
        ),
      )
      .limit(1);
    if (!conn) throw createError({ statusCode: 400, statusMessage: "Connection not found" });
  }

  const updates: Record<string, unknown> = {};
  if (body.name !== undefined) updates.name = body.name;
  if (body.connectionId !== undefined) updates.connectionId = body.connectionId;
  if (body.dataset !== undefined) updates.dataset = body.dataset || null;
  if (body.url !== undefined) updates.url = body.url || null;
  if (body.logoUrl !== undefined) updates.logoUrl = body.logoUrl || null;

  const [row] = await db.update(app).set(updates).where(eq(app.id, existing.id)).returning();
  return row;
});
