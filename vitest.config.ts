import { defineConfig } from "vitest/config";

// Plain Node tests for the pure server utilities (crypto, etc.). No Nuxt runtime
// needed, so this config deliberately does not load the Nuxt environment.
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
