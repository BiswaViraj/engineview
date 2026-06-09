import { and, eq } from "drizzle-orm";
import { db } from "../../../utils/db";
import { panel, savedQuery } from "../../../database/schema";
import { requireOwnedDashboard } from "../../../utils/dashboards";
import { parseBody } from "../../../utils/validate";
import { panelCreateSchema } from "../../../utils/schemas";

// Add a panel built from one of the user's saved queries. The query's SQL and
// connection are snapshotted onto the panel so it keeps working even if the
// saved query is later changed or deleted.
export default defineEventHandler(async (event) => {
  const { user, dashboard } = await requireOwnedDashboard(event, getRouterParam(event, "id"));
  const body = await parseBody(event, panelCreateSchema);

  const [sq] = await db
    .select()
    .from(savedQuery)
    .where(and(eq(savedQuery.id, body.queryId), eq(savedQuery.userId, user.id)))
    .limit(1);
  if (!sq) throw createError({ statusCode: 400, statusMessage: "Saved query not found" });

  const [row] = await db
    .insert(panel)
    .values({
      dashboardId: dashboard.id,
      title: body.title,
      queryId: sq.id,
      connectionId: sq.connectionId,
      sql: sq.sql,
      chartType: body.chartType ?? "line",
      xColumn: body.xColumn ?? null,
      yColumns: body.yColumns ?? [],
      posW: body.posW ?? 6,
      posH: body.posH ?? 8,
    })
    .returning();

  setResponseStatus(event, 201);
  return row;
});
