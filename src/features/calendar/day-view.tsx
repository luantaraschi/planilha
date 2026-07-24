import Link from "next/link";
import type { CalendarOccurrence } from "./calendar-model";
import styles from "./calendar-workspace.module.css";

const labels = {
  event: "Compromisso",
  task: "Tarefa",
  bill: "Conta",
  trip: "Viagem",
};

export function OccurrenceItem({
  href,
  occurrence,
  timeZone,
}: {
  href?: string;
  occurrence: CalendarOccurrence;
  timeZone: string;
}) {
  const title = href ? (
    <Link href={href}>{occurrence.title}</Link>
  ) : (
    occurrence.title
  );
  return (
    <li className={styles.occurrence} data-kind={occurrence.kind}>
      <time dateTime={occurrence.start}>
        {occurrence.allDay
          ? "Dia todo"
          : new Intl.DateTimeFormat("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone,
            }).format(new Date(occurrence.start))}
      </time>
      <span aria-hidden="true" className={styles.kindShape} />
      <div>
        <span>{labels[occurrence.kind]}</span>
        <strong>{title}</strong>
        {occurrence.location ? <small>{occurrence.location}</small> : null}
      </div>
    </li>
  );
}

export function DayView({
  date,
  occurrences,
  timeZone,
  view = "day",
}: {
  date: string;
  occurrences: CalendarOccurrence[];
  timeZone: string;
  view?: string;
}) {
  return (
    <ol aria-label="Agenda do dia" className={styles.dayTrail}>
      {occurrences.length ? (
        occurrences.map((item) => (
          <OccurrenceItem
            href={`/agenda?data=${date}&visao=${view}&selecionado=${encodeURIComponent(item.id)}`}
            key={item.id}
            occurrence={item}
            timeZone={timeZone}
          />
        ))
      ) : (
        <li className={styles.emptyDay}>
          O dia está aberto. Use esse espaço antes de preenchê-lo.
        </li>
      )}
    </ol>
  );
}
