import type { H3Event } from "h3";
import type { ZodType } from "zod";

// Parse and validate a request body against a zod schema, returning a clean 400
// with the first issue's path and message on failure.
export async function parseBody<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const raw = await readBody(event).catch(() => ({}));
  const result = schema.safeParse(raw);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path?.join(".");
    throw createError({
      statusCode: 400,
      statusMessage: path ? `${path}: ${issue?.message}` : (issue?.message ?? "Invalid request"),
    });
  }
  return result.data;
}
