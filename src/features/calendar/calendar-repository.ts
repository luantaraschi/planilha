import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";
import type {
  CalendarEventInput,
  CalendarOccurrence,
} from "./calendar-model";

type OccurrenceRow = {
  id: string;
  source_id: string;
  kind: string;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  location: string | null;
  source: string;
  last_synced_at: string | null;
  estimated_minutes: number | null;
  parent_event_id: string | null;
};

export function mapOccurrenceRows(
  rows: OccurrenceRow[],
): CalendarOccurrence[] {
  return rows.map((row) => ({
    id: row.id,
    sourceId: row.source_id,
    kind: row.kind as CalendarOccurrence["kind"],
    title: row.title,
    start: row.starts_at,
    end: row.ends_at,
    allDay: row.all_day,
    location: row.location,
    source: row.source,
    lastSyncedAt: row.last_synced_at,
    estimatedMinutes: row.estimated_minutes,
    parentEventId: row.parent_event_id,
  }));
}

export async function getCalendarOccurrences(
  windowStart: string,
  windowEnd: string,
) {
  const supabase = await createClient();
  await getVerifiedUserId(supabase);
  const { data, error } = await supabase.rpc("planning_occurrences", {
    window_start: windowStart,
    window_end: windowEnd,
  });
  if (error) throw new Error("Não foi possível carregar sua agenda.");
  return mapOccurrenceRows((data ?? []) as OccurrenceRow[]);
}

export async function addCurrentEvent(input: CalendarEventInput) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase.from("events").insert({
    user_id: userId,
    title: input.title,
    event_type: input.eventType,
    location: input.location,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    all_day: input.allDay,
    recurrence_rule: input.recurrenceRule,
    trip_starts_on: input.tripStartsOn,
    trip_ends_on: input.tripEndsOn,
    parent_event_id: input.parentEventId,
    timezone: input.timeZone,
    source: "local",
  });
  return error ? ("error" as const) : ("added" as const);
}
