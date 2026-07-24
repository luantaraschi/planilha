import { groupOccurrencesByDay, type CalendarOccurrence } from "./calendar-model";
import { OccurrenceItem } from "./day-view";
import styles from "./calendar-workspace.module.css";

export function WeekView({
  date,
  occurrences,
  timeZone,
}: {
  date: string;
  occurrences: CalendarOccurrence[];
  timeZone: string;
}) {
  const grouped = groupOccurrencesByDay(occurrences, timeZone);
  const start = new Date(`${date}T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const days = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  return (
    <div className={styles.week}>
      {days.map((day) => (
        <section key={day}>
          <h2>
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "short",
              timeZone: "UTC",
              weekday: "short",
            }).format(new Date(`${day}T12:00:00Z`))}
          </h2>
          <ol>
            {(grouped.get(day) ?? []).map((item) => (
              <OccurrenceItem
                href={`/agenda?data=${date}&visao=week&selecionado=${encodeURIComponent(item.id)}`}
                key={`${day}:${item.id}`}
                occurrence={item}
                timeZone={timeZone}
              />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
