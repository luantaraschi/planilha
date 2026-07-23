type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export const ONBOARDING_TIMEZONES = [
  "America/Bahia",
  "America/Sao_Paulo",
  "America/Fortaleza",
  "America/Manaus",
] as const;

export type OnboardingInput = {
  displayName: string;
  timezone: (typeof ONBOARDING_TIMEZONES)[number];
  emailReminders: boolean;
  aiConsent: boolean;
};

export function normalizeAuthInput(
  formData: FormData,
): Result<{ email: string; password: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return {
      ok: false,
      message: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
    };
  }

  return { ok: true, value: { email, password } };
}

export function normalizeOnboardingInput(
  formData: FormData,
): Result<OnboardingInput> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (displayName.length < 1 || displayName.length > 80) {
    return { ok: false, message: "Informe um nome com até 80 caracteres." };
  }

  if (
    !ONBOARDING_TIMEZONES.includes(
      timezone as (typeof ONBOARDING_TIMEZONES)[number],
    )
  ) {
    return { ok: false, message: "Escolha um fuso horário válido." };
  }

  return {
    ok: true,
    value: {
      displayName,
      timezone: timezone as OnboardingInput["timezone"],
      emailReminders: formData.get("emailReminders") === "on",
      aiConsent: formData.get("aiConsent") === "on",
    },
  };
}
