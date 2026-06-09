import { db } from "../../utils/db";
import { dashboard } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { parseBody } from "../../utils/validate";
import { dashboardCreateSchema } from "../../utils/schemas";

export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { name } = await parseBody(event, dashboardCreateSchema);

  const [row] = await db.insert(dashboard).values({ userId: user.id, name }).returning({
    id: dashboard.id,
    name: dashboard.name,
    timeRange: dashboard.timeRange,
    createdAt: dashboard.createdAt,
  });

  setResponseStatus(event, 201);
  return row;
});
