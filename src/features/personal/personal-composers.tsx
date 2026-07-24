"use client";

import { useActionState } from "react";
import { createHabitAction, setHabitStatusAction, type HabitActionState } from "@/features/habits/habit-actions";
import { createGoalAction, createNoteAction, saveMoodAction, toggleGoalAction, type PersonalActionState } from "./personal-actions";
import { moods, type Mood } from "./personal-model";
import styles from "./personal-dashboard.module.css";

const initialPersonal: PersonalActionState = { status: "idle", message: "" };
const initialHabit: HabitActionState = { status: "idle", message: "" };
const moodLabels: Record<Mood, string> = { terrible: "Muito mal", bad: "Mal", neutral: "Neutro", good: "Bem", great: "Muito bem" };

function Notice({ message, status }: { message: string; status: string }) {
  return message ? <p aria-live="polite" className={styles.notice} data-status={status}>{message}</p> : null;
}

export function MoodComposer({ date }: { date: string }) {
  const [state, action, pending] = useActionState(saveMoodAction, initialPersonal);
  return <form action={action} className={styles.composer}>
    <input name="occurredOn" type="hidden" value={date} />
    <fieldset className={styles.moodChoices}>
      <legend>Como você está hoje?</legend>
      <div>{moods.map((mood) => <label key={mood}><input name="mood" required type="radio" value={mood} /><span>{moodLabels[mood]}</span></label>)}</div>
    </fieldset>
    <label className={styles.wideField}>Quer deixar uma frase?<textarea maxLength={1000} name="note" placeholder="Opcional" rows={3} /></label>
    <div className={styles.composerFooter}><Notice message={state.message} status={state.status} /><button disabled={pending} type="submit">{pending ? "Salvando…" : "Registrar check-in"}</button></div>
  </form>;
}

export function NoteComposer() {
  const [state, action, pending] = useActionState(createNoteAction, initialPersonal);
  return <details className={styles.composer}><summary>Nova nota</summary><form action={action}>
    <label>Título <input maxLength={120} name="title" placeholder="Opcional" /></label>
    <label className={styles.wideField}>Escreva<textarea maxLength={5000} name="body" required rows={5} /></label>
    <div className={styles.composerFooter}><Notice message={state.message} status={state.status} /><button disabled={pending} type="submit">{pending ? "Salvando…" : "Salvar nota"}</button></div>
  </form></details>;
}

export function GoalComposer() {
  const [state, action, pending] = useActionState(createGoalAction, initialPersonal);
  return <details className={styles.composer}><summary>Nova meta</summary><form action={action}>
    <label className={styles.wideField}>Meta <input maxLength={120} name="title" required /></label>
    <label>Área <select defaultValue="personal" name="area"><option value="personal">Pessoal</option><option value="work">Trabalho</option><option value="wellbeing">Bem-estar</option><option value="finance">Finanças</option><option value="home">Casa</option><option value="other">Outra</option></select></label>
    <label>Até quando <input name="targetOn" type="date" /></label>
    <div className={styles.composerFooter}><Notice message={state.message} status={state.status} /><button disabled={pending} type="submit">{pending ? "Salvando…" : "Criar meta"}</button></div>
  </form></details>;
}

export function GoalToggle({ completed, goalId }: { completed: boolean; goalId: string }) {
  const [state, action, pending] = useActionState(toggleGoalAction, initialPersonal);
  return <form action={action} className={styles.inlineAction}><input name="goalId" type="hidden" value={goalId} /><input name="completed" type="hidden" value={String(!completed)} /><button disabled={pending} type="submit">{completed ? "Reabrir" : "Concluir"}</button><Notice message={state.message} status={state.status} /></form>;
}

export function HabitComposer() {
  const [state, action, pending] = useActionState(createHabitAction, initialHabit);
  return <details className={styles.composer}><summary>Novo hábito</summary><form action={action}>
    <label className={styles.wideField}>Hábito <input maxLength={120} name="title" required /></label>
    <label>Horário <input defaultValue="08:00" name="scheduledTime" required type="time" /></label>
    <div className={styles.composerFooter}><Notice message={state.message} status={state.status} /><button disabled={pending} type="submit">{pending ? "Salvando…" : "Adicionar hábito"}</button></div>
  </form></details>;
}

export function HabitToggle({ done, habitId, occurredOn }: { done: boolean; habitId: string; occurredOn: string }) {
  const [state, action, pending] = useActionState(setHabitStatusAction, initialHabit);
  return <form action={action} className={styles.inlineAction}><input name="habitId" type="hidden" value={habitId} /><input name="occurredOn" type="hidden" value={occurredOn} /><input name="status" type="hidden" value={done ? "skipped" : "completed"} /><button disabled={pending} type="submit">{done ? "Desfazer" : "Marcar feito"}</button><Notice message={state.message} status={state.status} /></form>;
}
