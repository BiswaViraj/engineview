import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { panel } from "../../database/schema";
import { requireOwnedPanel } from "../../utils/dashboards";

export default defineEventHandler(async (event) => {
  const { panel: existing } = await requireOwnedPanel(event, getRouterParam(event, "id"));
  await db.delete(panel).where(eq(panel.id, existing.id));
  return { ok: true };
});
