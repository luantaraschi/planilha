import { redirect } from "next/navigation";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { TodayDashboard } from "@/features/today/today-dashboard";
import { buildTodaySnapshot } from "@/features/today/today-model";

export default async function HomePage() {
  const { profile, userId } = await getCurrentIdentity();
  if (!profile.onboarding_completed) redirect("/onboarding");

  return (
    <TodayDashboard
      snapshot={buildTodaySnapshot(profile.display_name)}
      userId={userId}
    />
  );
}
