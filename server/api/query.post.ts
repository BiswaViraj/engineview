import { and, eq } from "drizzle-orm";
import { db } from "../utils/db";
import { cloudflareConnection } from "../database/schema";
import { requireUser } from "../utils/session";
import { decrypt } from "../utils/crypto";

// Run SQL against a connection's Analytics Engine. The token is decrypted only
// here, server-side, and used to call the Cloudflare SQL API. It is never sent
// to the browser.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const { connectionId, sql } = await readBody<{ connectionId?: string; sql?: string }>(event);

  if (!connectionId || !sql?.trim()) {
    throw createError({ statusCode: 400, statusMessage: "connectionId and sql are required" });
  }

  const [conn] = await db
    .select()
    .from(cloudflareConnection)
    .where(and(eq(cloudflareConnection.id, connectionId), eq(cloudflareConnection.userId, user.id)))
    .limit(1);

  if (!conn) throw createError({ statusCode: 404, statusMessage: "Connection not found" });

  const token = decrypt(conn.apiTokenEncrypted);
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${conn.accountId}/analytics_engine/sql`,
    { method: "POST", headers: { authorization: `Bearer ${token}` }, body: sql },
  );

  const body = await res.json().catch(() => null);
  if (!res.ok) setResponseStatus(event, res.status);
  return body;
});
