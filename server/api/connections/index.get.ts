import { eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";

// List the current user's Cloudflare connections. The encrypted token is never
// selected, so it cannot leak to the client.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  return db
    .select({
      id: cloudflareConnection.id,
      label: cloudflareConnection.label,
      accountId: cloudflareConnection.accountId,
      defaultDataset: cloudflareConnection.defaultDataset,
      createdAt: cloudflareConnection.createdAt,
    })
    .from(cloudflareConnection)
    .where(eq(cloudflareConnection.userId, user.id))
    .orderBy(cloudflareConnection.createdAt);
});
