import type { H3Event } from "h3";
import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { dashboard, panel } from "../database/schema";
import { requireUser } from "./session";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Load a dashboard the current user owns, or throw 404. Used by every dashboard
// route so ownership is enforced in one place.
export async function requireOwnedDashboard(event: H3Event, id: string | undefined) {
  const user = await requireUser(event);
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const [row] = await db
    .select()
    .from(dashboard)
    .where(and(eq(dashboard.id, id), eq(dashboard.userId, user.id)))
    .limit(1);
  if (!row) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return { user, dashboard: row };
}

// Load a panel whose dashboard the current user owns, or throw 404.
export async function requireOwnedPanel(event: H3Event, id: string | undefined) {
  const user = await requireUser(event);
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });
  const [row] = await db
    .select({ panel, ownerId: dashboard.userId })
    .from(panel)
    .innerJoin(dashboard, eq(panel.dashboardId, dashboard.id))
    .where(eq(panel.id, id))
    .limit(1);
  if (!row || row.ownerId !== user.id) {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }
  return { user, panel: row.panel };
}
