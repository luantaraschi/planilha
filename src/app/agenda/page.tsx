import { redirect } from "next/navigation";
import { dateInTimeZone } from "@/features/finance/finance-model";
import { CalendarWorkspace } from "@/features/calendar/calendar-workspace";
import type { CalendarView } from "@/features/calendar/calendar-model";
import { getCalendarOccurrences } from "@/features/calendar/calendar-repository";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { localDateTimeToIso } from "@/lib/date-time";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

function range(date: string, view: CalendarView, timeZone: string) {
  const start = new Date(`${date}T12:00:00Z`);
  if (view === "week") start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  if (view === "month") {
    start.setUTCDate(1);
    start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  }
  const startDate = start.toISOString().slice(0, 10);
  const end = new Date(start);
  end.setUTCDate(
    end.getUTCDate() +
      (view === "day" ? 1 : view === "week" ? 7 : view === "month" ? 42 : 31),
  );
  const windowStart = localDateTimeToIso(`${startDate}T00:00`, timeZone);
  const windowEnd = localDateTimeToIso(
    `${end.toISOString().slice(0, 10)}T00:00`,
    timeZone,
  );
  if (!windowStart || !windowEnd) throw new Error("Intervalo local inválido.");
  return [windowStart, windowEnd] as const;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{
    data?: string;
    selecionado?: string;
    visao?: string;
  }>;
}) {
  const identity = await getCurrentIdentity();
  if (!identity.profile.onboarding_completed) redirect("/onboarding");
  const query = await searchParams;
  const today = dateInTimeZone(new Date(), identity.preferences.timezone);
  const date = isoDate.test(query.data ?? "") ? query.data! : today;
  const view = ["day", "week", "month", "list"].includes(query.visao ?? "")
    ? (query.visao as CalendarView)
    : "day";
  const [start, end] = range(date, view, identity.preferences.timezone);
  const occurrences = await getCalendarOccurrences(start, end);
  return (
    <CalendarWorkspace
      date={date}
      occurrences={occurrences}
      selectedId={query.selecionado}
      timeZone={identity.preferences.timezone}
      view={view}
    />
  );
}
