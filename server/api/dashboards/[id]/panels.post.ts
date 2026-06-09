import { and, eq } from "drizzle-orm";
import { db } from "../../../utils/db";
import { panel, savedQuery } from "../../../database/schema";
import { requireOwnedDashboard } from "../../../utils/dashboards";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Add a panel built from one of the user's saved queries. The query's SQL and
// connection are snapshotted onto the panel so it keeps working even if the
// saved query is later changed or deleted.
export default defineEventHandler(async (event) => {
  const { user, dashboard } = await requireOwnedDashboard(event, getRouterParam(event, "id"));
  const body = await readBody<{
    title?: string;
    queryId?: string;
    chartType?: string;
    xColumn?: string;
    yColumns?: string[];
    posW?: number;
    posH?: number;
  }>(event);

  const title = body.title?.trim();
  const queryId = body.queryId;
  if (!title || !queryId || !UUID.test(queryId)) {
    throw createError({ statusCode: 400, statusMessage: "title and a valid queryId are required" });
  }

  const [sq] = await db
    .select()
    .from(savedQuery)
    .where(and(eq(savedQuery.id, queryId), eq(savedQuery.userId, user.id)))
    .limit(1);
  if (!sq) throw createError({ statusCode: 400, statusMessage: "Saved query not found" });

  const [row] = await db
    .insert(panel)
    .values({
      dashboardId: dashboard.id,
      title,
      queryId: sq.id,
      connectionId: sq.connectionId,
      sql: sq.sql,
      chartType: body.chartType || "line",
      xColumn: body.xColumn || null,
      yColumns: Array.isArray(body.yColumns) ? body.yColumns : [],
      posW: typeof body.posW === "number" ? body.posW : 6,
      posH: typeof body.posH === "number" ? body.posH : 8,
    })
    .returning();

  setResponseStatus(event, 201);
  return row;
});
