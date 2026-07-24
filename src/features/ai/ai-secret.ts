import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

export type EncryptedApiKey = {
  encryptedApiKey: string;
  apiKeyIv: string;
  apiKeyAuthTag: string;
};

function encryptionKey(masterKey = process.env.AI_SETTINGS_ENCRYPTION_KEY) {
  if (!masterKey || masterKey.length < 32) {
    throw new Error(
      "Configure AI_SETTINGS_ENCRYPTION_KEY com pelo menos 32 caracteres.",
    );
  }
  return createHash("sha256").update(masterKey).digest();
}

export function encryptApiKey(
  apiKey: string,
  masterKey?: string,
): EncryptedApiKey {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(masterKey), iv);
  const encrypted = Buffer.concat([
    cipher.update(apiKey, "utf8"),
    cipher.final(),
  ]);

  return {
    encryptedApiKey: encrypted.toString("base64"),
    apiKeyIv: iv.toString("base64"),
    apiKeyAuthTag: cipher.getAuthTag().toString("base64"),
  };
}

export function decryptApiKey(
  encrypted: EncryptedApiKey,
  masterKey?: string,
) {
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(masterKey),
    Buffer.from(encrypted.apiKeyIv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.apiKeyAuthTag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(encrypted.encryptedApiKey, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
