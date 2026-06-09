import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM encryption for Cloudflare API tokens at rest. The key is a 32-byte
// value supplied as 64 hex chars via ENCRYPTION_KEY. The stored format is
// `iv.tag.ciphertext`, each base64. GCM's auth tag makes tampering detectable.

function keyBuffer(keyHex: string | undefined): Buffer {
  if (!keyHex || keyHex.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }
  return Buffer.from(keyHex, "hex");
}

export function encrypt(plain: string, keyHex = process.env.ENCRYPTION_KEY): string {
  const key = keyBuffer(keyHex);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("base64"), tag.toString("base64"), ciphertext.toString("base64")].join(".");
}

export function decrypt(payload: string, keyHex = process.env.ENCRYPTION_KEY): string {
  const key = keyBuffer(keyHex);
  const [ivB64, tagB64, ctB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !ctB64) throw new Error("malformed ciphertext");
  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivB64, "base64"));
  decipher.setAuthTag(Buffer.from(tagB64, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ctB64, "base64")), decipher.final()]).toString(
    "utf8",
  );
}
