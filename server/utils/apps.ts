import type { H3Event } from "h3";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { app } from "../database/schema";
import { requireUser } from "./session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Load an app the current user owns, or throw 404. Used by every app-scoped route.
export async function requireOwnedApp(event: H3Event, id: string | undefined) {
  const user = await requireUser(event);
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const [row] = await db
    .select()
    .from(app)
    .where(and(eq(app.id, id), eq(app.userId, user.id)))
    .limit(1);
  if (!row) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return { user, app: row };
}
