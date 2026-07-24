"use server";

import { normalizeAiSettingsForm } from "./ai-settings-model";
import {
  AiSettingsError,
  type AiSettingsView,
  saveCurrentAiSettings,
} from "./ai-settings-repository";

export type AiSettingsActionState = {
  status: "idle" | "success" | "error";
  message: string;
  settings?: AiSettingsView;
};

export async function saveAiSettings(
  _previousState: AiSettingsActionState,
  formData: FormData,
): Promise<AiSettingsActionState> {
  const normalized = normalizeAiSettingsForm(formData);
  if (!normalized.ok) {
    return { status: "error", message: normalized.message };
  }

  try {
    const saved = await saveCurrentAiSettings(normalized.value);

    if (!saved.hasApiKey) {
      return {
        status: "success",
        message: "Configuração salva. O chat continuará no modo local.",
        settings: saved,
      };
    }
    if (!saved.enabled) {
      return {
        status: "success",
        message: "Configuração salva. O agente online está pausado.",
        settings: saved,
      };
    }
    return {
      status: "success",
      message: "Agente configurado e pronto para conversar.",
      settings: saved,
    };
  } catch (error) {
    if (error instanceof AiSettingsError) {
      return { status: "error", message: error.message };
    }
    if (
      error instanceof Error &&
      error.message.includes("AI_SETTINGS_ENCRYPTION_KEY")
    ) {
      return {
        status: "error",
        message:
          "O cofre do aplicativo ainda não foi configurado no servidor.",
      };
    }
    return {
      status: "error",
      message: "Não foi possível salvar a configuração do agente.",
    };
  }
}
