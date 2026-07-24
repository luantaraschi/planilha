import { redirect } from "next/navigation";
import { FinanceDashboard } from "@/features/finance/finance-dashboard";
import {
  buildFinanceSnapshot,
} from "@/features/finance/finance-model";
import { listCurrentExpenses } from "@/features/finance/finance-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";

const timeZone = "America/Bahia";

function todayInProductTimeZone() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(new Date());
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

export default async function FinancePage() {
  const identity = await getCurrentIdentity();

  if (!identity.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const expenses = await listCurrentExpenses();
  const today = todayInProductTimeZone();
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date());

  return (
    <FinanceDashboard
      defaultDate={today}
      greetingName={identity.profile.display_name}
      monthLabel={monthLabel}
      snapshot={buildFinanceSnapshot(expenses, today)}
    />
  );
}
