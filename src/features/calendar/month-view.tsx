import Link from "next/link";
import {
  groupOccurrencesByDay,
  type CalendarOccurrence,
} from "./calendar-model";
import styles from "./calendar-workspace.module.css";

export function MonthView({
  date,
  occurrences,
  timeZone,
}: {
  date: string;
  occurrences: CalendarOccurrence[];
  timeZone: string;
}) {
  const start = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  const days = Array.from({ length: 42 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
  const grouped = groupOccurrencesByDay(occurrences, timeZone);
  return (
    <div className={styles.month} role="grid" aria-label="Mês">
      {days.map((day) => {
        const items = grouped.get(day) ?? [];
        return (
          <section aria-label={day} key={day} role="gridcell">
            <time dateTime={day}>{Number(day.slice(-2))}</time>
            <ul>
              {items.slice(0, 3).map((item) => (
                <li data-kind={item.kind} key={item.id}>
                  <Link
                    href={`/agenda?data=${date}&visao=month&selecionado=${encodeURIComponent(item.id)}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
            {items.length > 3 ? <small>+{items.length - 3}</small> : null}
          </section>
        );
      })}
    </div>
  );
}
