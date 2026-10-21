// Validate required configuration. Called once at server startup so a
// misconfigured deploy fails immediately with a clear message rather than
// erroring on the first request.

const REQUIRED = [
  "DATABASE_URL",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "ENCRYPTION_KEY",
] as const;

export function validateEnv(env: Record<string, string | undefined> = process.env): void {
  const missing: string[] = REQUIRED.filter((key) => !env[key]);
  // Email verification is enforced, so a real provider and a sender on a
  // verified domain are required in production. Resend's default test sender
  // only delivers to the account owner. In development a missing key just logs
  // links to the console.
  if (env.NODE_ENV === "production") {
    if (!env.RESEND_API_KEY) missing.push("RESEND_API_KEY");
    if (!env.EMAIL_FROM) missing.push("EMAIL_FROM");
  }
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. See .env.example.`,
    );
  }
  if (!/^[0-9a-f]{64}$/i.test(env.ENCRYPTION_KEY!)) {
    throw new Error(
      "ENCRYPTION_KEY must be 64 hex characters (32 bytes). Generate one with: openssl rand -hex 32",
    );
  }
}
