import { db } from "../../utils/db";
import { cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { encrypt } from "../../utils/crypto";

// Create a Cloudflare connection for the current user. The API token is
// encrypted before it touches the database.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await readBody<{
    label?: string;
    accountId?: string;
    apiToken?: string;
    defaultDataset?: string;
  }>(event);

  const label = body.label?.trim();
  const accountId = body.accountId?.trim();
  const apiToken = body.apiToken?.trim();
  const defaultDataset = body.defaultDataset?.trim() || null;

  if (!label || !accountId || !apiToken) {
    throw createError({
      statusCode: 400,
      statusMessage: "label, accountId and apiToken are required",
    });
  }

  const [row] = await db
    .insert(cloudflareConnection)
    .values({
      userId: user.id,
      label,
      accountId,
      apiTokenEncrypted: encrypt(apiToken),
      defaultDataset,
    })
    .returning({
      id: cloudflareConnection.id,
      label: cloudflareConnection.label,
      accountId: cloudflareConnection.accountId,
      defaultDataset: cloudflareConnection.defaultDataset,
      createdAt: cloudflareConnection.createdAt,
    });

  setResponseStatus(event, 201);
  return row;
});
