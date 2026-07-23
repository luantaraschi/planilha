"use client";

import { useActionState, useState, type FormEvent } from "react";
import { useFormStatus } from "react-dom";
import {
  signIn,
  signInWithGoogle,
  signUp,
  type AuthState,
} from "./auth-actions";
import styles from "@/app/entrar/auth-page.module.css";

const INITIAL_STATE: AuthState = { message: "" };
type FormAction = (formData: FormData) => void;
type AuthAction = "signin" | "signup" | "google";

function credentialAction(event: FormEvent<HTMLFormElement>): AuthAction {
  const submitter = (event.nativeEvent as SubmitEvent).submitter;
  return submitter instanceof HTMLButtonElement &&
    submitter.dataset.authAction === "signup"
    ? "signup"
    : "signin";
}

function AccountButtons({ signUpAction }: { signUpAction: FormAction }) {
  const { pending } = useFormStatus();

  return (
    <div className={styles.accountActions}>
      <button disabled={pending} type="submit">
        {pending ? "Aguarde…" : "Entrar"}
      </button>
      <button
        className={styles.secondaryButton}
        data-auth-action="signup"
        disabled={pending}
        formAction={signUpAction}
        type="submit"
      >
        {pending ? "Aguarde…" : "Criar minha conta"}
      </button>
    </div>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className={styles.googleButton}
      disabled={pending}
      type="submit"
    >
      {pending ? "Conectando…" : "Continuar com Google"}
    </button>
  );
}

export function AuthForm() {
  const [lastAction, setLastAction] = useState<AuthAction | null>(null);
  const [signInState, signInAction] = useActionState(signIn, INITIAL_STATE);
  const [signUpState, signUpAction] = useActionState(signUp, INITIAL_STATE);
  const [googleState, googleAction] = useActionState(
    signInWithGoogle,
    INITIAL_STATE,
  );
  const message = lastAction
    ? {
        signin: signInState,
        signup: signUpState,
        google: googleState,
      }[lastAction].message
    : "";

  return (
    <>
      <form
        action={signInAction}
        className={styles.credentialsForm}
        onSubmit={(event) => setLastAction(credentialAction(event))}
      >
        <label htmlFor="email">E-mail</label>
        <input
          autoComplete="email"
          id="email"
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />

        <label htmlFor="password">Senha</label>
        <input
          autoComplete="current-password"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />

        {message ? <p role="alert">{message}</p> : null}
        <AccountButtons signUpAction={signUpAction} />
      </form>

      <div className={styles.divider}>
        <span>ou</span>
      </div>

      <form action={googleAction} onSubmit={() => setLastAction("google")}>
        <GoogleButton />
      </form>
    </>
  );
}
