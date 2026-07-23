import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GardenIcon } from "@/components/garden-icon";
import { getCurrentIdentity } from "@/features/identity/identity-repository";
import { OnboardingForm } from "@/features/identity/onboarding-form";
import styles from "@/app/entrar/auth-page.module.css";

export const metadata: Metadata = {
  title: "Prepare seu espaço | Meu espaço",
  description: "Escolha como seu planejamento pessoal deve começar.",
};

export default async function OnboardingPage() {
  const { profile } = await getCurrentIdentity();
  if (profile.onboarding_completed) redirect("/");

  return (
    <main className={styles.page}>
      <section className={styles.morning} aria-labelledby="welcome-title">
        <Link className={styles.brand} href="/">
          <GardenIcon name="wellbeing" size={27} />
          <span>Meu espaço</span>
        </Link>
        <div className={styles.welcome}>
          <p>Seu espaço, do seu jeito</p>
          <h1 id="welcome-title">Só o essencial para começar.</h1>
          <span>
            Confirme como podemos chamar você e suas preferências iniciais.
          </span>
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

      <section className={styles.paper} aria-labelledby="onboarding-title">
        <span aria-hidden="true" className={styles.botanicalTab}>
          <GardenIcon name="wellbeing" size={23} />
        </span>
        <header>
          <p>Leva menos de um minuto</p>
          <h2 id="onboarding-title">Prepare seu espaço</h2>
          <span>Você poderá alterar estas escolhas depois.</span>
        </header>
        <OnboardingForm initialName={profile.display_name} />
      </section>
    </main>
  );
}
