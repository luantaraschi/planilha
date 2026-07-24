import Link from "next/link";
import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { CalendarEventForm } from "./calendar-event-form";
import {
  detectScheduleIssues,
  type CalendarOccurrence,
  type CalendarView,
} from "./calendar-model";
import { DayView, OccurrenceItem } from "./day-view";
import { MonthView } from "./month-view";
import { WeekView } from "./week-view";
import styles from "./calendar-workspace.module.css";

const viewLabels: Record<CalendarView, string> = {
  day: "Dia",
  week: "Semana",
  month: "Mês",
  list: "Lista",
};

function AgendaView({
  date,
  occurrences,
  timeZone,
  view,
}: {
  date: string;
  occurrences: CalendarOccurrence[];
  timeZone: string;
  view: CalendarView;
}) {
  if (view === "month") {
    return (
      <MonthView date={date} occurrences={occurrences} timeZone={timeZone} />
    );
  }
  if (view === "week") {
    return (
      <WeekView date={date} occurrences={occurrences} timeZone={timeZone} />
    );
  }
  if (view === "list") {
    return (
      <ol aria-label="Lista da agenda" className={styles.dayTrail}>
        {occurrences.map((item) => (
          <OccurrenceItem
            href={`/agenda?data=${date}&visao=list&selecionado=${encodeURIComponent(item.id)}`}
            key={item.id}
            occurrence={item}
            timeZone={timeZone}
          />
        ))}
      </ol>
    );
  }
  return (
    <DayView
      date={date}
      occurrences={occurrences}
      timeZone={timeZone}
      view={view}
    />
  );
}

export function CalendarWorkspace({
  date,
  occurrences,
  selectedId,
  timeZone,
  view = "day",
}: {
  date: string;
  occurrences: CalendarOccurrence[];
  selectedId?: string;
  timeZone: string;
  view?: CalendarView;
}) {
  const issues = detectScheduleIssues(occurrences);
  const trips = occurrences.filter((item) => item.kind === "trip");
  const selected =
    occurrences.find(
      (item) => item.id === selectedId || item.sourceId === selectedId,
    ) ??
    occurrences[0] ??
    null;
  const selectedTripId =
    selected?.kind === "trip" ? selected.sourceId : selected?.parentEventId;
  const itinerary = selectedTripId
    ? occurrences.filter((item) => item.parentEventId === selectedTripId)
    : [];
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#agenda-principal">
        Pular para o conteúdo
      </a>
      <AppSidebar active="agenda" />
      <main className={styles.main} id="agenda-principal">
        <header className={styles.header}>
          <div>
            <p>Tempo com espaço para respirar</p>
            <h1>Agenda</h1>
            <span>
              {new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long",
                timeZone: "UTC",
              }).format(new Date(`${date}T12:00:00Z`))}
            </span>
          </div>
          <span aria-hidden="true" className={styles.calendarArt}>
            <GardenIcon name="calendar" size={55} />
            <i />
          </span>
        </header>

        <div className={styles.toolbar}>
          <nav aria-label="Visualização da agenda">
            {(Object.keys(viewLabels) as CalendarView[]).map((key) => (
              <Link
                aria-current={view === key ? "page" : undefined}
                href={`/agenda?data=${date}&visao=${key}`}
                key={key}
              >
                {viewLabels[key]}
              </Link>
            ))}
          </nav>
          <form action="/agenda">
            <input name="visao" type="hidden" value={view} />
            <label>
              Ir para
              <input defaultValue={date} name="data" type="date" />
            </label>
            <button type="submit">Abrir data</button>
          </form>
        </div>

        {(issues.overlaps.length > 0 || issues.overloaded) ? (
          <aside className={styles.scheduleNotice}>
            <GardenIcon name="today" size={25} />
            <div>
              <strong>A agenda pede atenção, mas a decisão é sua.</strong>
              <span>
                {issues.overlaps.length} sobreposição(ões) ·{" "}
                {Math.round(issues.workloadMinutes / 60)} h de carga estimada.
                Você ainda pode salvar.
              </span>
            </div>
          </aside>
        ) : null}

        <div className={styles.workspace}>
          <section aria-label={viewLabels[view]} className={styles.calendarSheet}>
            <AgendaView
              date={date}
              occurrences={occurrences}
              timeZone={timeZone}
              view={view}
            />
          </section>

          <aside className={styles.dayDetail}>
            <div className={styles.detailHeading}>
              <GardenIcon name="calendar" size={29} />
              <h2>Detalhes do dia</h2>
            </div>
            {selected ? (
              <div data-testid="selected-occurrence">
                <span data-kind={selected.kind}>
                  {selected.kind === "event"
                    ? "Compromisso"
                    : selected.kind === "task"
                      ? "Tarefa"
                      : selected.kind === "bill"
                        ? "Conta"
                        : "Viagem"}
                </span>
                <strong>{selected.title}</strong>
                {selected.location ? <p>{selected.location}</p> : null}
                {selected.source !== "local" ? (
                  <small>
                    {selected.source === "google"
                      ? "Google Agenda"
                      : "Calendário externo"}
                    {selected.lastSyncedAt
                      ? ` · sincronizado ${new Intl.DateTimeFormat("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone,
                        }).format(new Date(selected.lastSyncedAt))}`
                      : ""}
                  </small>
                ) : null}
              </div>
            ) : (
              <p>Escolha um compromisso para ver seus detalhes.</p>
            )}

            {trips.length > 0 ? (
              <section className={styles.itinerary}>
                <h2>Roteiro</h2>
                <ol>
                  {itinerary.map((item) => (
                    <li key={item.id}>
                      <time dateTime={item.start}>
                        {new Intl.DateTimeFormat("pt-BR", {
                          day: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone,
                        }).format(new Date(item.start))}
                      </time>
                      <strong>{item.title}</strong>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </aside>
        </div>
        <CalendarEventForm trips={trips} />
      </main>
    </div>
  );
}
