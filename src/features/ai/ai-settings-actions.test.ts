import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  saveCurrentAiSettings: vi.fn(),
}));

vi.mock("./ai-settings-repository", () => ({
  AiSettingsError: class extends Error {},
  saveCurrentAiSettings: mocks.saveCurrentAiSettings,
}));

import { saveAiSettings } from "./ai-settings-actions";

const initialState = { status: "idle" as const, message: "" };

describe("saveAiSettings", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.saveCurrentAiSettings.mockResolvedValue({
      provider: "openai",
      model: "gpt-5.6-luna",
      instructions: "",
      hasApiKey: true,
      apiKeyHint: "ters",
      enabled: true,
    });
  });

  it("validates settings before writing", async () => {
    await expect(
      saveAiSettings(initialState, new FormData()),
    ).resolves.toMatchObject({ status: "error" });
    expect(mocks.saveCurrentAiSettings).not.toHaveBeenCalled();
  });

  it("saves settings and refreshes the assistant surfaces", async () => {
    const formData = new FormData();
    formData.set("model", "gpt-5.6-luna");
    formData.set("apiKey", "sk-new-secret-with-more-than-twenty-characters");
    formData.set("enabled", "on");

    await expect(
      saveAiSettings(initialState, formData),
    ).resolves.toEqual({
      status: "success",
      message: "Agente configurado e pronto para conversar.",
      settings: {
        provider: "openai",
        model: "gpt-5.6-luna",
        instructions: "",
        hasApiKey: true,
        apiKeyHint: "ters",
        enabled: true,
      },
    });
  });
});
