import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "../server/utils/crypto";

const KEY = "0".repeat(64); // 32 bytes of zeros, hex
const OTHER_KEY = "f".repeat(64);

describe("token encryption", () => {
  it("round-trips a value", () => {
    const secret = "cf-api-token-abc123";
    expect(decrypt(encrypt(secret, KEY), KEY)).toBe(secret);
  });

  it("produces different ciphertext each time (random IV)", () => {
    expect(encrypt("same", KEY)).not.toBe(encrypt("same", KEY));
  });

  it("fails to decrypt with the wrong key", () => {
    const enc = encrypt("secret", KEY);
    expect(() => decrypt(enc, OTHER_KEY)).toThrow();
  });

  it("rejects a tampered auth tag", () => {
    const [iv, , ct] = encrypt("secret", KEY).split(".");
    const forgedTag = Buffer.alloc(16).toString("base64");
    expect(() => decrypt(`${iv}.${forgedTag}.${ct}`, KEY)).toThrow();
  });

  it("rejects malformed input", () => {
    expect(() => decrypt("not-a-valid-payload", KEY)).toThrow();
  });

  it("requires a 32-byte key", () => {
    expect(() => encrypt("x", "tooshort")).toThrow();
  });
});
