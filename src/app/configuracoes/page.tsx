import { redirect } from "next/navigation";
import { AiSettingsDashboard } from "@/features/ai/ai-settings-dashboard";
import { getCurrentAiSettings } from "@/features/ai/ai-settings-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";

export default async function SettingsPage() {
  const identity = await getCurrentIdentity();

  if (!identity.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <AiSettingsDashboard
      greetingName={identity.profile.display_name}
      settings={await getCurrentAiSettings()}
    />
  );
}
