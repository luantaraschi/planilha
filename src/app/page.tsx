import { TodayDashboard } from "@/features/today/today-dashboard";
import { TODAY_DEMO } from "@/features/today/today-model";

export default function HomePage() {
  return <TodayDashboard snapshot={TODAY_DEMO} />;
}
