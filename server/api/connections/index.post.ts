import { db } from "../../utils/db";
import { cloudflareConnection } from "../../database/schema";
import { requireUser } from "../../utils/session";
import { encrypt } from "../../utils/crypto";
import { parseBody } from "../../utils/validate";
import { connectionCreateSchema } from "../../utils/schemas";

// Create a Cloudflare connection for the current user. The API token is
// encrypted before it touches the database.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event);
  const body = await parseBody(event, connectionCreateSchema);

  const [row] = await db
    .insert(cloudflareConnection)
    .values({
      userId: user.id,
      label: body.label,
      accountId: body.accountId,
      apiTokenEncrypted: encrypt(body.apiToken),
      defaultDataset: body.defaultDataset ?? null,
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
