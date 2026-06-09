import { and, eq } from "drizzle-orm";
import { db } from "../utils/db";
import { cloudflareConnection } from "../database/schema";
import { requireUser } from "../utils/session";
import { decrypt } from "../utils/crypto";
import { expandTimeMacro } from "../utils/macros";
import { parseBody } from "../utils/validate";
import { queryRunSchema } from "../utils/schemas";

// Run SQL against a connection's Analytics Engine. The token is decrypted only
// here, server-side, and used to call the Cloudflare SQL API. It is never sent
// to the browser. An optional timeRange expands the $SINCE macro; the runner
// omits it (so the default applies) and dashboards pass their shared range.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { connectionId, sql, timeRange } = await parseBody(event, queryRunSchema);

  const [conn] = await db
    .select()
    .from(cloudflareConnection)
    .where(and(eq(cloudflareConnection.id, connectionId), eq(cloudflareConnection.userId, user.id)))
    .limit(1);

  if (!conn) throw createError({ statusCode: 404, statusMessage: "Connection not found" });

  const token = decrypt(conn.apiTokenEncrypted);
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${conn.accountId}/analytics_engine/sql`,
    {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      body: expandTimeMacro(sql, timeRange),
    },
  );

  const body = await res.json().catch(() => null);
  if (!res.ok) setResponseStatus(event, res.status);
  return body;
});
