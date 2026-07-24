import { redirect } from "next/navigation";
import { GoalsDashboard } from "@/features/personal/personal-dashboard";
import { getCurrentGoals } from "@/features/personal/personal-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";

export default async function GoalsPage() {
  const identity = await getCurrentIdentity();
  if (!identity.profile.onboarding_completed) redirect("/onboarding");
  return <GoalsDashboard goals={await getCurrentGoals()} />;
}
