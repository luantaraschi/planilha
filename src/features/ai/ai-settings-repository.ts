import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";
import {
  defaultAiModel,
  type AiSettingsInput,
} from "./ai-settings-model";
import { decryptApiKey, encryptApiKey } from "./ai-secret";

export type AiSettingsView = {
  provider: "openai";
  model: string;
  instructions: string;
  enabled: boolean;
  hasApiKey: boolean;
  apiKeyHint: string | null;
};

export class AiSettingsError extends Error {}

const viewFields =
  "provider, model, instructions, enabled, api_key_hint";
const secretFields =
  "model, instructions, enabled, encrypted_api_key, api_key_iv, api_key_auth_tag, api_key_hint";

function defaultSettings(): AiSettingsView {
  return {
    provider: "openai",
    model: defaultAiModel,
    instructions: "",
    enabled: false,
    hasApiKey: false,
    apiKeyHint: null,
  };
}

export async function getCurrentAiSettings(): Promise<AiSettingsView> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { data, error } = await supabase
    .from("ai_agent_settings")
    .select(viewFields)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new AiSettingsError("Não foi possível carregar o agente.");
  if (!data) return defaultSettings();

  return {
    provider: "openai",
    model: data.model,
    instructions: data.instructions,
    enabled: data.enabled,
    hasApiKey: Boolean(data.api_key_hint),
    apiKeyHint: data.api_key_hint,
  };
}

export async function saveCurrentAiSettings(
  input: AiSettingsInput,
): Promise<AiSettingsView> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { data: existing, error: readError } = await supabase
    .from("ai_agent_settings")
    .select(
      "encrypted_api_key, api_key_iv, api_key_auth_tag, api_key_hint",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (readError) {
    throw new AiSettingsError("Não foi possível conferir a configuração.");
  }

  let encryptedApiKey = existing?.encrypted_api_key ?? null;
  let apiKeyIv = existing?.api_key_iv ?? null;
  let apiKeyAuthTag = existing?.api_key_auth_tag ?? null;
  let apiKeyHint = existing?.api_key_hint ?? null;

  if (input.removeApiKey) {
    encryptedApiKey = null;
    apiKeyIv = null;
    apiKeyAuthTag = null;
    apiKeyHint = null;
  } else if (input.apiKey) {
    const encrypted = encryptApiKey(input.apiKey);
    encryptedApiKey = encrypted.encryptedApiKey;
    apiKeyIv = encrypted.apiKeyIv;
    apiKeyAuthTag = encrypted.apiKeyAuthTag;
    apiKeyHint = input.apiKey.slice(-4);
  }

  const enabled = input.removeApiKey ? false : input.enabled;
  if (enabled && !encryptedApiKey) {
    throw new AiSettingsError(
      "Adicione uma chave de API antes de ativar o agente online.",
    );
  }

  const { error: saveError } = await supabase
    .from("ai_agent_settings")
    .upsert(
      {
        user_id: userId,
        provider: input.provider,
        model: input.model,
        instructions: input.instructions,
        enabled,
        encrypted_api_key: encryptedApiKey,
        api_key_iv: apiKeyIv,
        api_key_auth_tag: apiKeyAuthTag,
        api_key_hint: apiKeyHint,
      },
      { onConflict: "user_id" },
    );

  if (saveError) {
    throw new AiSettingsError("Não foi possível salvar o agente.");
  }

  return {
    provider: input.provider,
    model: input.model,
    instructions: input.instructions,
    enabled,
    hasApiKey: Boolean(apiKeyHint),
    apiKeyHint,
  };
}

export async function getCurrentAiRuntimeSettings() {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { data: preferences, error: preferencesError } = await supabase
    .from("preferences")
    .select("ai_processing_consent")
    .eq("user_id", userId)
    .single();

  if (preferencesError) {
    throw new AiSettingsError("Não foi possível conferir o consentimento.");
  }
  if (!preferences.ai_processing_consent) return null;

  const { data, error } = await supabase
    .from("ai_agent_settings")
    .select(secretFields)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw new AiSettingsError("Não foi possível carregar o agente.");
  if (
    !data?.enabled ||
    !data.encrypted_api_key ||
    !data.api_key_iv ||
    !data.api_key_auth_tag
  ) {
    return null;
  }

  return {
    apiKey: decryptApiKey({
      encryptedApiKey: data.encrypted_api_key,
      apiKeyIv: data.api_key_iv,
      apiKeyAuthTag: data.api_key_auth_tag,
    }),
    model: data.model,
    instructions: data.instructions,
  };
}
