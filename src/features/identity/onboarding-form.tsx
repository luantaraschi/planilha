"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  completeOnboarding,
  type OnboardingState,
} from "./onboarding-actions";
import { ONBOARDING_TIMEZONES } from "./identity-model";
import styles from "@/app/entrar/auth-page.module.css";

const INITIAL_STATE: OnboardingState = { message: "" };

const timezoneLabels = {
  "America/Bahia": "Bahia",
  "America/Sao_Paulo": "São Paulo",
  "America/Fortaleza": "Fortaleza",
  "America/Manaus": "Manaus",
} satisfies Record<(typeof ONBOARDING_TIMEZONES)[number], string>;

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending} type="submit">
      {pending ? "Preparando…" : "Preparar meu espaço"}
    </button>
  );
}

export function OnboardingForm({ initialName }: { initialName: string }) {
  const [state, action] = useActionState(
    completeOnboarding,
    INITIAL_STATE,
  );

  return (
    <form action={action} className={styles.credentialsForm}>
      <label htmlFor="displayName">Como podemos chamar você?</label>
      <input
        autoComplete="name"
        defaultValue={initialName}
        id="displayName"
        maxLength={80}
        name="displayName"
        required
        type="text"
      />

      <label htmlFor="timezone">Fuso horário</label>
      <select defaultValue="America/Bahia" id="timezone" name="timezone">
        {ONBOARDING_TIMEZONES.map((timezone) => (
          <option key={timezone} value={timezone}>
            {timezoneLabels[timezone]}
          </option>
        ))}
      </select>

      <fieldset className={styles.preferenceGroup}>
        <legend>Preferências iniciais</legend>
        <label className={styles.preferenceOption}>
          <input defaultChecked name="emailReminders" type="checkbox" />
          <span>
            <strong>Lembretes por e-mail</strong>
            <small>Receba lembretes úteis sobre o que você planejou.</small>
          </span>
        </label>
        <label className={styles.preferenceOption}>
          <input name="aiConsent" type="checkbox" />
          <span>
            <strong>Usar IA para organizar minhas informações</strong>
            <small>
              Consentimento opcional; você pode mudar esta escolha depois.
            </small>
          </span>
        </label>
      </fieldset>

      {state.message ? <p role="alert">{state.message}</p> : null}
      <div
        className={`${styles.accountActions} ${styles.onboardingActions}`}
      >
        <SubmitButton />
      </div>
    </form>
  );
}
