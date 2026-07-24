import { redirect } from "next/navigation";
import { FinanceDashboard } from "@/features/finance/finance-dashboard";
import {
  buildFinanceWorkspace,
  dateInTimeZone,
} from "@/features/finance/finance-model";
import { getCurrentFinanceLedger } from "@/features/finance/finance-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";

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
  const timeZone = identity.preferences.timezone;
  const today = dateInTimeZone(new Date(), timeZone);
  const requestedAccountId = (await searchParams).conta ?? null;
  const selectedAccountId = ledger.accounts.some(
    (account) => account.active && account.id === requestedAccountId,
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
