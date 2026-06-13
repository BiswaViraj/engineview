import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { app } from "../../database/schema";
import { requireOwnedApp } from "../../utils/apps";

export default defineEventHandler(async (event) => {
  const { app: existing } = await requireOwnedApp(event, getRouterParam(event, "id"));
  await db.delete(app).where(eq(app.id, existing.id));
  setResponseStatus(event, 204);
  return null;
});
