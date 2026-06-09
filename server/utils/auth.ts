import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import { user, session, account, verification } from "../database/schema";
import { sendEmail, emailLayout } from "./email";

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
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Reset your EngineView password",
        html: emailLayout(
          "Reset your password",
          "We received a request to reset your EngineView password. This link expires in an hour.",
          "Reset password",
          url,
        ),
        text: `Reset your EngineView password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your EngineView email",
        html: emailLayout(
          "Verify your email",
          "Confirm your email address to start using EngineView.",
          "Verify email",
          url,
        ),
        text: `Verify your EngineView email: ${url}`,
      });
    },
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
    // Behind a reverse proxy, read the real client IP so rate limiting works.
    ipAddress: {
      ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for"],
    },
  },
});
