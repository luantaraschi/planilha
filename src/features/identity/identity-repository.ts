import { redirect } from "next/navigation";
import type { OnboardingInput } from "./identity-model";
import { createClient } from "@/lib/supabase/server";

const PROFILE_FIELDS =
  "user_id, display_name, avatar_url, onboarding_completed";
const PREFERENCE_FIELDS =
  "user_id, currency, locale, timezone, week_starts_on, email_reminders, ai_processing_consent";

async function verifiedUserId(
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims.sub) redirect("/entrar");
  return data.claims.sub;
}

export async function getCurrentIdentity() {
  const supabase = await createClient();
  const userId = await verifiedUserId(supabase);
  const [profileResult, preferenceResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(PROFILE_FIELDS)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("preferences")
      .select(PREFERENCE_FIELDS)
      .eq("user_id", userId)
      .single(),
  ]);

  if (
    profileResult.error ||
    preferenceResult.error ||
    !profileResult.data ||
    !preferenceResult.data
  ) {
    throw new Error("Não foi possível carregar seu perfil.");
  }

  return {
    userId,
    profile: profileResult.data,
    preferences: preferenceResult.data,
  };
}

export async function completeCurrentOnboarding(input: OnboardingInput) {
  const supabase = await createClient();
  await verifiedUserId(supabase);
  const { error } = await supabase.rpc("complete_onboarding", {
    display_name_input: input.displayName,
    timezone_input: input.timezone,
    email_reminders_input: input.emailReminders,
    ai_consent_input: input.aiConsent,
  });

  return !error;
}
