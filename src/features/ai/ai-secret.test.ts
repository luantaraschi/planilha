import { describe, expect, it } from "vitest";
import { decryptApiKey, encryptApiKey } from "./ai-secret";

const masterKey = "a-local-test-key-with-at-least-32-characters";

describe("AI API key encryption", () => {
  it("round-trips an API key without storing plaintext", () => {
    const encrypted = encryptApiKey("sk-secret-value", masterKey);

    expect(encrypted.encryptedApiKey).not.toContain("sk-secret-value");
    expect(decryptApiKey(encrypted, masterKey)).toBe("sk-secret-value");
  });

  it("uses a fresh IV for every encryption", () => {
    const first = encryptApiKey("sk-same-value", masterKey);
    const second = encryptApiKey("sk-same-value", masterKey);

    expect(first.apiKeyIv).not.toBe(second.apiKeyIv);
    expect(first.encryptedApiKey).not.toBe(second.encryptedApiKey);
  });

  it("refuses an undersized master key", () => {
    expect(() => encryptApiKey("sk-secret-value", "too-short")).toThrow(
      "AI_SETTINGS_ENCRYPTION_KEY",
    );
  });
});
