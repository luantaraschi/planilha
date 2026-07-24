import type { CalendarOccurrence } from "./calendar-model";
import styles from "./calendar-workspace.module.css";

const labels = {
  event: "Compromisso",
  task: "Tarefa",
  bill: "Conta",
  trip: "Viagem",
};

export function OccurrenceItem({
  occurrence,
}: {
  occurrence: CalendarOccurrence;
}) {
  return (
    <li className={styles.occurrence} data-kind={occurrence.kind}>
      <time dateTime={occurrence.start}>
        {occurrence.allDay
          ? "Dia todo"
          : new Intl.DateTimeFormat("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            }).format(new Date(occurrence.start))}
      </time>
      <span aria-hidden="true" className={styles.kindShape} />
      <div>
        <span>{labels[occurrence.kind]}</span>
        <strong>{occurrence.title}</strong>
        {occurrence.location ? <small>{occurrence.location}</small> : null}
      </div>
    </li>
  );
}

export function DayView({
  occurrences,
}: {
  occurrences: CalendarOccurrence[];
}) {
  return (
    <ol aria-label="Agenda do dia" className={styles.dayTrail}>
      {occurrences.length ? (
        occurrences.map((item) => (
          <OccurrenceItem key={item.id} occurrence={item} />
        ))
      ) : (
        <li className={styles.emptyDay}>
          O dia está aberto. Use esse espaço antes de preenchê-lo.
        </li>
      )}
    </ol>
  );
}
