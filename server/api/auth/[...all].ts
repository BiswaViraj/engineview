import { auth } from "../../utils/auth";

// Mount better-auth on every /api/auth/* route.
export default defineEventHandler((event) => auth.handler(toWebRequest(event)));
