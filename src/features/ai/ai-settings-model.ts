export const defaultAiModel = "gpt-5.6-luna";

export type AiSettingsInput = {
  provider: "openai";
  model: string;
  instructions: string;
  enabled: boolean;
  apiKey: string | null;
  removeApiKey: boolean;
};

type NormalizedAiSettings =
  | { ok: true; value: AiSettingsInput }
  | { ok: false; message: string };

const modelPattern = /^[a-z0-9._:-]+$/i;

export function normalizeAiSettingsForm(
  formData: FormData,
): NormalizedAiSettings {
  const model = String(formData.get("model") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();
  const rawApiKey = String(formData.get("apiKey") ?? "").trim();

  if (
    !model ||
    model.length > 100 ||
    !modelPattern.test(model)
  ) {
    return {
      ok: false,
      message: "Informe um identificador de modelo válido.",
    };
  }
  if (instructions.length > 2000) {
    return {
      ok: false,
      message: "As instruções devem ter no máximo 2.000 caracteres.",
    };
  }
  if (
    rawApiKey &&
    (
      rawApiKey.length < 20 ||
      rawApiKey.length > 300 ||
      !rawApiKey.startsWith("sk-") ||
      /\s/.test(rawApiKey)
    )
  ) {
    return {
      ok: false,
      message: "A chave da OpenAI não parece válida.",
    };
  }

  return {
    ok: true,
    value: {
      provider: "openai",
      model,
      instructions,
      enabled: formData.get("enabled") === "on",
      apiKey: rawApiKey || null,
      removeApiKey: formData.get("removeApiKey") === "on",
    },
  };
}
