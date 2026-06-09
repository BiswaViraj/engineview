import { describe, it, expect } from "vitest";
import { validateEnv } from "../server/utils/env";

const VALID = {
  DATABASE_URL: "postgres://localhost/db",
  BETTER_AUTH_SECRET: "secret",
  BETTER_AUTH_URL: "http://localhost:3000",
  ENCRYPTION_KEY: "0".repeat(64),
};

describe("validateEnv", () => {
  it("passes with a complete, valid config", () => {
    expect(() => validateEnv(VALID)).not.toThrow();
  });

  it("throws listing every missing variable", () => {
    expect(() => validateEnv({ ENCRYPTION_KEY: "0".repeat(64) })).toThrow(
      /DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL/,
    );
  });

  it("rejects an ENCRYPTION_KEY that is not 64 hex chars", () => {
    expect(() => validateEnv({ ...VALID, ENCRYPTION_KEY: "tooshort" })).toThrow(/64 hex/);
    expect(() => validateEnv({ ...VALID, ENCRYPTION_KEY: "z".repeat(64) })).toThrow(/64 hex/);
  });
});
