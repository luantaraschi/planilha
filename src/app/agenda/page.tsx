import { redirect } from "next/navigation";
import { dateInTimeZone } from "@/features/finance/finance-model";
import { CalendarWorkspace } from "@/features/calendar/calendar-workspace";
import type { CalendarView } from "@/features/calendar/calendar-model";
import { getCalendarOccurrences } from "@/features/calendar/calendar-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function range(date: string, view: CalendarView) {
  const anchor = new Date(`${date}T00:00:00-03:00`);
  const start = new Date(anchor);
  if (view === "week") start.setDate(start.getDate() - start.getDay());
  if (view === "month") {
    start.setDate(1);
    start.setDate(start.getDate() - start.getDay());
  }
  const end = new Date(start);
  end.setDate(
    end.getDate() +
      (view === "day" ? 1 : view === "week" ? 7 : view === "month" ? 42 : 31),
  );
  return [start.toISOString(), end.toISOString()] as const;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ data?: string; visao?: string }>;
}) {
  const identity = await getCurrentIdentity();
  if (!identity.profile.onboarding_completed) redirect("/onboarding");
  const query = await searchParams;
  const today = dateInTimeZone(new Date(), identity.preferences.timezone);
  const date = isoDate.test(query.data ?? "") ? query.data! : today;
  const view = ["day", "week", "month", "list"].includes(query.visao ?? "")
    ? (query.visao as CalendarView)
    : "day";
  const [start, end] = range(date, view);
  const occurrences = await getCalendarOccurrences(start, end);
  return (
    <CalendarWorkspace
      date={date}
      occurrences={occurrences}
      timeZone={identity.preferences.timezone}
      view={view}
    />
  );
}
