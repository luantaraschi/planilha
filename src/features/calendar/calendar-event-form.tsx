"use client";

import { useActionState } from "react";
import {
  createCalendarEvent,
  type CalendarActionState,
} from "./calendar-actions";
import type { CalendarOccurrence } from "./calendar-model";
import styles from "./calendar-workspace.module.css";

const initialState: CalendarActionState = { status: "idle", message: "" };

export function CalendarEventForm({
  trips,
  timeZone,
}: {
  trips: CalendarOccurrence[];
  timeZone: string;
}) {
  const [state, action, pending] = useActionState(
    createCalendarEvent,
    initialState,
  );
  return (
    <details className={styles.eventComposer}>
      <summary>Adicionar à agenda</summary>
      <form action={action}>
        <input name="timeZone" type="hidden" value={timeZone} />
        <label className={styles.wideField}>
          Título
          <input maxLength={240} name="title" required />
        </label>
        <label>
          Tipo
          <select defaultValue="event" name="eventType">
            <option value="event">Compromisso</option>
            <option value="bill">Conta</option>
            <option value="trip">Viagem</option>
          </select>
        </label>
        <label>
          Local
          <input maxLength={500} name="location" />
        </label>
        <label>
          Começa
          <input name="startsAt" required type="datetime-local" />
        </label>
        <label>
          Termina
          <input name="endsAt" required type="datetime-local" />
        </label>
        <label>
          Início da viagem
          <input name="tripStartsOn" type="date" />
        </label>
        <label>
          Fim da viagem
          <input name="tripEndsOn" type="date" />
        </label>
        <label>
          Roteiro de
          <select defaultValue="" name="parentEventId">
            <option value="">Não é item de roteiro</option>
            {trips.map((trip) => (
              <option key={trip.sourceId} value={trip.sourceId}>
                {trip.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Recorrência (RRULE)
          <input name="recurrenceRule" placeholder="FREQ=MONTHLY" />
        </label>
        <label className={styles.checkField}>
          <input name="allDay" type="checkbox" />
          Dia todo
        </label>
        <button disabled={pending} type="submit">
          {pending ? "Salvando…" : "Salvar na agenda"}
        </button>
        <p aria-live="polite" data-status={state.status}>
          {state.message}
        </p>
      </form>
    </details>
  );
}
