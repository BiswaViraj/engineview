import type { H3Event } from "h3";
import { auth } from "./auth";

// Resolve the authenticated user for an API request or throw 401. Every
// data-touching handler calls this and scopes its queries to the returned id.
export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({ headers: event.headers });
  if (!session) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  return session.user;
}
