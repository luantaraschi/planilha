import { redirect } from "next/navigation";
import { dateInTimeZone } from "@/features/finance/finance-model";
import { getCurrentHabits } from "@/features/habits/habit-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { WellbeingDashboard } from "@/features/personal/personal-dashboard";
import { getRecentMoodEntries } from "@/features/personal/personal-repository";

export default async function WellbeingPage() {
  const identity = await getCurrentIdentity();
  if (!identity.profile.onboarding_completed) redirect("/onboarding");
  const date = dateInTimeZone(new Date(), identity.preferences.timezone);
  const [habits, moods] = await Promise.all([getCurrentHabits(date), getRecentMoodEntries()]);
  return <WellbeingDashboard date={date} habits={habits} moods={moods} />;
}
