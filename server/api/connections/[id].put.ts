import { and, eq } from "drizzle-orm";
import { db } from "../../utils/db";
import { cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { encrypt } from "../../utils/crypto";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Update a connection the user owns. The API token is only re-encrypted when a
// new one is supplied, so editing a label does not require re-entering it.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const id = getRouterParam(event, "id");
  if (!id || !UUID.test(id)) throw createError({ statusCode: 404, statusMessage: "Not found" });

  const body = await readBody<{
    label?: string;
    accountId?: string;
    apiToken?: string;
    defaultDataset?: string;
  }>(event);

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (body.label !== undefined) updates.label = body.label.trim();
  if (body.accountId !== undefined) updates.accountId = body.accountId.trim();
  if (body.defaultDataset !== undefined)
    updates.defaultDataset = body.defaultDataset.trim() || null;
  if (body.apiToken) updates.apiTokenEncrypted = encrypt(body.apiToken.trim());

  const [row] = await db
    .update(cloudflareConnection)
    .set(updates)
    .where(and(eq(cloudflareConnection.id, id), eq(cloudflareConnection.userId, user.id)))
    .returning({
      id: cloudflareConnection.id,
      label: cloudflareConnection.label,
      accountId: cloudflareConnection.accountId,
      defaultDataset: cloudflareConnection.defaultDataset,
      createdAt: cloudflareConnection.createdAt,
    });

  if (!row) throw createError({ statusCode: 404, statusMessage: "Not found" });
  return row;
});
