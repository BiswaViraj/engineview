import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { panel } from "../../database/schema";
import { requireOwnedPanel } from "../../utils/dashboards";

export default defineEventHandler(async (event) => {
  const { panel: existing } = await requireOwnedPanel(event, getRouterParam(event, "id"));
  const body = await readBody<{
    title?: string;
    chartType?: string;
    xColumn?: string;
    yColumns?: string[];
    posW?: number;
    posH?: number;
  }>(event);

  const updates: Record<string, unknown> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.chartType !== undefined) updates.chartType = body.chartType;
  if (body.xColumn !== undefined) updates.xColumn = body.xColumn || null;
  if (body.yColumns !== undefined)
    updates.yColumns = Array.isArray(body.yColumns) ? body.yColumns : [];
  if (typeof body.posW === "number") updates.posW = body.posW;
  if (typeof body.posH === "number") updates.posH = body.posH;
  if (Object.keys(updates).length === 0) return existing;

  const [row] = await db.update(panel).set(updates).where(eq(panel.id, existing.id)).returning();
  return row;
});
