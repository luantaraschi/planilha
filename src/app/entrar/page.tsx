import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GardenIcon } from "@/components/garden-icon";
import { AuthForm } from "@/features/identity/auth-form";
import styles from "./auth-page.module.css";

export const metadata: Metadata = {
  title: "Entrar | Meu espaço",
  description: "Entre ou crie sua conta para voltar ao seu planejamento.",
};

export default function SignInPage() {
  return (
    <main className={styles.page}>
      <section className={styles.morning} aria-labelledby="welcome-title">
        <Link className={styles.brand} href="/">
          <GardenIcon name="wellbeing" size={27} />
          <span>Meu espaço</span>
        </Link>
        <div className={styles.welcome}>
          <p>Um começo tranquilo</p>
          <h1 id="welcome-title">Seu dia, no lugar certo.</h1>
          <span>Volte ao planner e cuide do que importa, uma coisa por vez.</span>
        </div>
        <Image
          alt="Planner aberto sobre uma mesa iluminada pela manhã"
          className={styles.illustration}
          fill
          priority
          sizes="(max-width: 760px) 100vw, 58vw"
          src="/illustrations/morning-garden.webp"
        />
      </section>

      <section className={styles.paper} aria-labelledby="auth-title">
        <span aria-hidden="true" className={styles.botanicalTab}>
          <GardenIcon name="wellbeing" size={23} />
        </span>
        <header>
          <p>Bem-vinda de volta</p>
          <h2 id="auth-title">Entre no seu espaço</h2>
          <span>Use seus dados ou crie uma conta para começar.</span>
        </header>
        <AuthForm />
        <small>
          Ao continuar, você concorda com o uso responsável dos seus dados.
        </small>
      </section>
    </main>
  );
}
