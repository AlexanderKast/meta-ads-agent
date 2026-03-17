import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const key = process.env.PLATFORM_ENCRYPTION_KEY;
  if (!key) throw new Error("PLATFORM_ENCRYPTION_KEY not set");
  return Buffer.from(key, "hex");
}

export function encryptToken(token: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(token, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptToken(encryptedToken: string): string {
  const key = getKey();
  const [ivHex, authTagHex, encrypted] = encryptedToken.split(":");
  if (!ivHex || !authTagHex || !encrypted) {
    // Token might not be encrypted (legacy), return as-is
    return encryptedToken;
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/** Generate a random 32-byte hex key for PLATFORM_ENCRYPTION_KEY */
export function generateEncryptionKey(): string {
  return randomBytes(32).toString("hex");
}
