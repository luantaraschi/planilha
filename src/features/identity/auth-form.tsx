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
    <>
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
      {pending ? (
        <span className="sr-only" role="status">
          Enviando seus dados.
        </span>
      ) : null}
    </>
  );
}

function GoogleButton() {
  const { pending } = useFormStatus();

  return (
    <>
      <button
        className={styles.googleButton}
        disabled={pending}
        type="submit"
      >
        {pending ? "Conectando…" : "Continuar com Google"}
      </button>
      {pending ? (
        <span className="sr-only" role="status">
          Conectando sua conta.
        </span>
      ) : null}
    </>
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
  const credentialMessage =
    lastAction === "signin"
      ? signInState.message
      : lastAction === "signup"
        ? signUpState.message
        : "";
  const googleMessage =
    lastAction === "google" ? googleState.message : "";
  const credentialErrorId = credentialMessage
    ? "credentials-error"
    : undefined;

  return (
    <>
      <form
        action={signInAction}
        className={styles.credentialsForm}
        onSubmit={(event) => setLastAction(credentialAction(event))}
      >
        <label htmlFor="email">E-mail</label>
        <input
          aria-describedby={credentialErrorId}
          aria-invalid={credentialMessage ? true : undefined}
          autoComplete="email"
          id="email"
          name="email"
          placeholder="voce@exemplo.com"
          required
          type="email"
        />

        <label htmlFor="password">Senha</label>
        <input
          aria-describedby={credentialErrorId}
          aria-invalid={credentialMessage ? true : undefined}
          autoComplete="current-password"
          id="password"
          minLength={8}
          name="password"
          required
          type="password"
        />

        {credentialMessage ? (
          <p id="credentials-error" role="alert">
            {credentialMessage}
          </p>
        ) : null}
        <AccountButtons signUpAction={signUpAction} />
      </form>

      <div className={styles.divider}>
        <span>ou</span>
      </div>

      <form action={googleAction} onSubmit={() => setLastAction("google")}>
        {googleMessage ? <p role="alert">{googleMessage}</p> : null}
        <GoogleButton />
      </form>
    </>
  );
}
