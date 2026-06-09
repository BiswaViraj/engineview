import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { user, session, account, verification } from "../database/schema";

const baseURL = process.env.BETTER_AUTH_URL;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL,
  // Restrict which origins may drive auth requests (CSRF defence).
  trustedOrigins: baseURL ? [baseURL] : [],
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh a day before expiry
  },
  // Throttle auth endpoints to blunt brute-force and credential-stuffing.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    // Send Secure cookies when served over HTTPS.
    useSecureCookies: baseURL?.startsWith("https://") ?? false,
  },
});
