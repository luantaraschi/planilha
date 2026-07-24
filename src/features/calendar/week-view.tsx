import { groupOccurrencesByDay, type CalendarOccurrence } from "./calendar-model";
import { OccurrenceItem } from "./day-view";
import styles from "./calendar-workspace.module.css";

export function WeekView({
  occurrences,
  timeZone,
}: {
  occurrences: CalendarOccurrence[];
  timeZone: string;
}) {
  const days = groupOccurrencesByDay(occurrences, timeZone);
  return (
    <div className={styles.week}>
      {[...days.entries()].map(([date, items]) => (
        <section key={date}>
          <h2>
            {new Intl.DateTimeFormat("pt-BR", {
              day: "2-digit",
              month: "short",
              timeZone: "UTC",
              weekday: "short",
            }).format(new Date(`${date}T12:00:00Z`))}
          </h2>
          <ol>
            {items.map((item) => (
              <OccurrenceItem key={item.id} occurrence={item} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
