import { redirect } from "next/navigation";
import { FinanceDashboard } from "@/features/finance/finance-dashboard";
import {
  buildFinanceWorkspace,
} from "@/features/finance/finance-model";
import { getCurrentFinanceLedger } from "@/features/finance/finance-repository";
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

export default async function FinancePage({
  searchParams,
}: {
  searchParams: Promise<{ conta?: string }>;
}) {
  const identity = await getCurrentIdentity();

  if (!identity.profile.onboarding_completed) {
    redirect("/onboarding");
  }

  const ledger = await getCurrentFinanceLedger();
  const today = todayInProductTimeZone();
  const requestedAccountId = (await searchParams).conta ?? null;
  const selectedAccountId = ledger.accounts.some(
    (account) => account.id === requestedAccountId,
  )
    ? requestedAccountId
    : null;
  const monthLabel = new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone,
  }).format(new Date(`${today}T12:00:00Z`));

  return (
    <FinanceDashboard
      defaultDate={today}
      greetingName={identity.profile.display_name}
      monthLabel={monthLabel}
      workspace={buildFinanceWorkspace(ledger, today, selectedAccountId)}
    />
  );
}
