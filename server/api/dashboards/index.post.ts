import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireOwnedApp } from "../../utils/apps";
import { parseBody } from "../../utils/validate";
import { dashboardCreateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const body = await parseBody(event, dashboardCreateSchema);
  const { user } = await requireOwnedApp(event, body.appId);

  const [row] = await db
    .insert(dashboard)
    .values({ userId: user.id, appId: body.appId, name: body.name })
    .returning({
      id: dashboard.id,
      appId: dashboard.appId,
      name: dashboard.name,
      timeRange: dashboard.timeRange,
      createdAt: dashboard.createdAt,
    });

  setResponseStatus(event, 201);
  return row;
});
