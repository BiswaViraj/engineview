import { sql } from "drizzle-orm";
import { db } from "../utils/db";

// Public health check for load balancers and uptime monitors. Verifies the
// database is reachable.
export default defineEventHandler(async (event) => {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "ok" };
  } catch {
    setResponseStatus(event, 503);
    return { status: "error", detail: "database unreachable" };
  }
});
