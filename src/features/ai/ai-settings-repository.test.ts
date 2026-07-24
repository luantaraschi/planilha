import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { encryptApiKey } from "./ai-secret";

const mocks = vi.hoisted(() => ({
  createClient: vi.fn(),
  getVerifiedUserId: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mocks.createClient,
}));
vi.mock("@/features/identity/identity-repository", () => ({
  getVerifiedUserId: mocks.getVerifiedUserId,
}));

import {
  getCurrentAiRuntimeSettings,
  getCurrentAiSettings,
  saveCurrentAiSettings,
} from "./ai-settings-repository";

const previousEncryptionKey = process.env.AI_SETTINGS_ENCRYPTION_KEY;
const encryptionKey = "repository-test-encryption-key-at-least-32-chars";

describe("AI settings repository", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env.AI_SETTINGS_ENCRYPTION_KEY = encryptionKey;
    mocks.createClient.mockResolvedValue({ from: mocks.from });
    mocks.getVerifiedUserId.mockResolvedValue("user-123");
  });

  afterAll(() => {
    if (previousEncryptionKey === undefined) {
      delete process.env.AI_SETTINGS_ENCRYPTION_KEY;
    } else {
      process.env.AI_SETTINGS_ENCRYPTION_KEY = previousEncryptionKey;
    }
  });

  it("returns free local defaults before a provider is configured", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    mocks.from.mockReturnValue({ select: vi.fn(() => ({ eq })) });

    await expect(getCurrentAiSettings()).resolves.toEqual({
      provider: "openai",
      model: "gpt-5.6-luna",
      instructions: "",
      enabled: false,
      hasApiKey: false,
      apiKeyHint: null,
    });
  });

  it("encrypts a new key before upserting settings", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const eq = vi.fn(() => ({ maybeSingle }));
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mocks.from.mockReturnValue({
      select: vi.fn(() => ({ eq })),
      upsert,
    });

    await expect(
      saveCurrentAiSettings({
        provider: "openai",
        model: "gpt-5.6-luna",
        instructions: "Seja breve.",
        enabled: true,
        apiKey: "sk-new-secret-with-more-than-twenty-characters",
        removeApiKey: false,
      }),
    ).resolves.toMatchObject({
      enabled: true,
      hasApiKey: true,
      apiKeyHint: "ters",
    });

    const saved = upsert.mock.calls[0]?.[0];
    expect(saved.encrypted_api_key).not.toContain("sk-new-secret");
    expect(saved).toMatchObject({
      user_id: "user-123",
      model: "gpt-5.6-luna",
      api_key_hint: "ters",
    });
  });

  it("decrypts provider settings only for the server runtime", async () => {
    const encrypted = encryptApiKey("sk-runtime-secret", encryptionKey);
    const settingsMaybeSingle = vi.fn().mockResolvedValue({
      data: {
        model: "gpt-5.6-luna",
        instructions: "Seja breve.",
        enabled: true,
        encrypted_api_key: encrypted.encryptedApiKey,
        api_key_iv: encrypted.apiKeyIv,
        api_key_auth_tag: encrypted.apiKeyAuthTag,
      },
      error: null,
    });
    const consentSingle = vi.fn().mockResolvedValue({
      data: { ai_processing_consent: true },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() =>
          table === "preferences"
            ? { single: consentSingle }
            : { maybeSingle: settingsMaybeSingle },
        ),
      })),
    }));

    await expect(getCurrentAiRuntimeSettings()).resolves.toEqual({
      apiKey: "sk-runtime-secret",
      model: "gpt-5.6-luna",
      instructions: "Seja breve.",
    });
  });

  it("does not read provider secrets when external processing consent is revoked", async () => {
    const consentSingle = vi.fn().mockResolvedValue({
      data: { ai_processing_consent: false },
      error: null,
    });
    mocks.from.mockImplementation((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ single: consentSingle })),
      })),
      table,
    }));

    await expect(getCurrentAiRuntimeSettings()).resolves.toBeNull();
    expect(mocks.from).toHaveBeenCalledWith("preferences");
    expect(mocks.from).not.toHaveBeenCalledWith("ai_agent_settings");
  });
});
