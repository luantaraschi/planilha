"use client";

import { useActionState } from "react";
import {
  saveMoodAction,
  type PersonalActionState,
} from "@/features/personal/personal-actions";
import styles from "./today-dashboard.module.css";

const initialState: PersonalActionState = { status: "idle", message: "" };
const moods = [
  { value: "terrible", label: "Muito mal", mouth: "M10 17c2.2-2 5.8-2 8 0" },
  { value: "bad", label: "Mal", mouth: "M10.5 17c1.8-1.4 5.2-1.4 7 0" },
  { value: "neutral", label: "Neutro", mouth: "M10.5 16.7h7" },
  { value: "good", label: "Bem", mouth: "M10.5 15.8c1.8 1.8 5.2 1.8 7 0" },
  { value: "great", label: "Muito bem", mouth: "M10 15.3c2.2 2.6 5.8 2.6 8 0" },
] as const;

function MoodGlyph({ mouth }: { mouth: string }) {
  return <svg aria-hidden="true" viewBox="0 0 28 28"><path d="M14 3.5c6.3 0 10.5 4.1 10.5 10.3 0 6.3-4.2 10.7-10.5 10.7S3.5 20.1 3.5 13.8C3.5 7.6 7.7 3.5 14 3.5Z" fill="currentColor" opacity=".12" /><path d="M9.3 11.6h.1M18.6 11.6h.1" /><path d={mouth} /></svg>;
}

export function MoodQuickCheck({ date }: { date: string }) {
  const [state, action] = useActionState(saveMoodAction, initialState);
  return <form action={action}><input name="occurredOn" type="hidden" value={date} /><div className={styles.moodOptions}>{moods.map(({ value, label, mouth }) => <label key={value}><input aria-label={label} name="mood" onChange={(event) => event.currentTarget.form?.requestSubmit()} type="radio" value={value} /><span className={styles.moodGlyph}><MoodGlyph mouth={mouth} /></span><span className="sr-only">{label}</span></label>)}</div><p aria-live="polite" className={styles.moodNotice} data-status={state.status}>{state.message}</p></form>;
}
