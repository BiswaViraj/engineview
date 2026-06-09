import { validateEnv } from "../utils/env";

// Fail fast on a misconfigured environment when the server starts.
export default defineNitroPlugin(() => {
  validateEnv();
});
