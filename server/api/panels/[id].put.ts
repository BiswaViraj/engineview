import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { panel } from "../../database/schema";
import { requireOwnedPanel } from "../../utils/dashboards";
import { parseBody } from "../../utils/validate";
import { panelUpdateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const { panel: existing } = await requireOwnedPanel(event, getRouterParam(event, "id"));
  const body = await parseBody(event, panelUpdateSchema);

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title;
  if (body.chartType !== undefined) updates.chartType = body.chartType;
  if (body.xColumn !== undefined) updates.xColumn = body.xColumn || null;
  if (body.yColumns !== undefined) updates.yColumns = body.yColumns;
  if (typeof body.posW === "number") updates.posW = body.posW;
  if (typeof body.posH === "number") updates.posH = body.posH;
  if (Object.keys(updates).length === 0) return existing;

  const [row] = await db.update(panel).set(updates).where(eq(panel.id, existing.id)).returning();
  return row;
});
