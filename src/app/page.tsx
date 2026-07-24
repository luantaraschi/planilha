import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { TodayDashboard } from "@/features/today/today-dashboard";
import { getCurrentTodaySnapshot } from "@/features/today/today-repository";

export default async function HomePage() {
  const { preferences, profile } = await getCurrentIdentity();
  if (!profile.onboarding_completed) redirect("/onboarding");
  const snapshot = await getCurrentTodaySnapshot({
    greetingName: profile.display_name,
    timeZone: preferences.timezone,
  });

  return (
    <TodayDashboard
      snapshot={snapshot}
    />
  );
}
