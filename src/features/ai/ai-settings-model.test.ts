import { describe, expect, it } from "vitest";
import { normalizeAiSettingsForm } from "./ai-settings-model";

describe("normalizeAiSettingsForm", () => {
  it("normalizes an OpenAI agent configuration", () => {
    const formData = new FormData();
    formData.set("model", "  gpt-5.6-luna ");
    formData.set("instructions", " Seja direto e acolhedor. ");
    formData.set("enabled", "on");
    formData.set("apiKey", "sk-project-key-with-more-than-twenty-characters");

    expect(normalizeAiSettingsForm(formData)).toEqual({
      ok: true,
      value: {
        provider: "openai",
        model: "gpt-5.6-luna",
        instructions: "Seja direto e acolhedor.",
        enabled: true,
        apiKey: "sk-project-key-with-more-than-twenty-characters",
        removeApiKey: false,
      },
    });
  });

  it("allows a blank key so an existing secret can be preserved", () => {
    const formData = new FormData();
    formData.set("model", "gpt-5.6-luna");

    expect(normalizeAiSettingsForm(formData)).toMatchObject({
      ok: true,
      value: { apiKey: null, enabled: false },
    });
  });

  it("rejects malformed model identifiers and API keys", () => {
    const invalidModel = new FormData();
    invalidModel.set("model", "modelo com espaços");
    expect(normalizeAiSettingsForm(invalidModel)).toMatchObject({
      ok: false,
    });

    const invalidKey = new FormData();
    invalidKey.set("model", "gpt-5.6-luna");
    invalidKey.set("apiKey", "senha-curta");
    expect(normalizeAiSettingsForm(invalidKey)).toMatchObject({
      ok: false,
    });
  });
});
