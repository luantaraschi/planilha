import {
  GardenIcon,
  type GardenIconName,
} from "@/components/garden-icon";
import { signOut } from "@/features/identity/auth-actions";
import { QuickCapture } from "./quick-capture";
import {
  formatCurrency,
  formatLongDate,
  type TodaySnapshot,
} from "./today-model";
import styles from "./today-dashboard.module.css";

const navigation = [
  { label: "Hoje", icon: "today", href: "#inicio", mobile: "primary" },
  {
    label: "Agenda",
    icon: "calendar",
    href: "#linha-do-tempo",
    mobile: "primary",
  },
  {
    label: "Tarefas",
    icon: "tasks",
    href: "#prioridades",
    mobile: "primary",
  },
  {
    label: "Finanças",
    icon: "finance",
    href: "#financas",
    mobile: "primary",
  },
  {
    label: "Bem-estar",
    icon: "wellbeing",
    href: "#bem-estar",
    mobile: "primary",
  },
  { label: "Metas", icon: "goals", href: "#rituais", mobile: "secondary" },
  {
    label: "Notas",
    icon: "notes",
    href: "#quick-capture",
    mobile: "secondary",
  },
  {
    label: "Assistente",
    icon: "assistant",
    href: "#quick-capture",
    mobile: "secondary",
  },
] satisfies Array<{
  label: string;
  icon: GardenIconName;
  href: string;
  mobile: "primary" | "secondary";
}>;

const secondaryNavigation = navigation.filter(
  (item) => item.mobile === "secondary",
);

const moods = [
  { value: "terrible", label: "Muito mal", mouth: "M10 17c2.2-2 5.8-2 8 0" },
  { value: "bad", label: "Mal", mouth: "M10.5 17c1.8-1.4 5.2-1.4 7 0" },
  { value: "neutral", label: "Neutro", mouth: "M10.5 16.7h7" },
  { value: "good", label: "Bem", mouth: "M10.5 15.8c1.8 1.8 5.2 1.8 7 0" },
  {
    value: "great",
    label: "Muito bem",
    mouth: "M10 15.3c2.2 2.6 5.8 2.6 8 0",
  },
] as const;

const timelineLabels = {
  event: "Compromisso",
  task: "Tarefa",
  bill: "Conta",
} as const;

function SignOutIcon() {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="23"
      viewBox="0 0 24 24"
      width="23"
    >
      <path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M9 12h9" />
    </svg>
  );
}

function SignOutButton() {
  return (
    <button className={styles.signOutButton} type="submit">
      <SignOutIcon />
      <span>Sair</span>
    </button>
  );
}

function MoodGlyph({ mouth }: { mouth: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 28 28">
      <path
        d="M14 3.5c6.3 0 10.5 4.1 10.5 10.3 0 6.3-4.2 10.7-10.5 10.7S3.5 20.1 3.5 13.8C3.5 7.6 7.7 3.5 14 3.5Z"
        fill="currentColor"
        opacity=".12"
      />
      <path d="M9.3 11.6h.1M18.6 11.6h.1" />
      <path d={mouth} />
    </svg>
  );
}

export function TodayDashboard({ snapshot }: { snapshot: TodaySnapshot }) {
  const pendingPriorities = snapshot.priorities.filter(
    (item) => !item.done,
  ).length;
  const completedHabits = snapshot.habits.filter((item) => item.done).length;

  return (
    <div className={styles.shell} id="inicio">
      <a className={styles.skipLink} href="#conteudo-principal">
        Pular para o conteúdo
      </a>
      <aside className={styles.sidebar}>
        <a
          aria-label="Ir para o início"
          className={styles.brand}
          href="#inicio"
        >
          <span aria-hidden="true" className={styles.brandMark}>
            <GardenIcon name="wellbeing" size={26} />
          </span>
          <span>Meu espaço</span>
        </a>

        <nav aria-label="Principal" className={styles.nav}>
          {navigation.map((item, index) => (
            <a
              aria-current={index === 0 ? "page" : undefined}
              className={index === 0 ? styles.navActive : styles.navItem}
              data-mobile-secondary={
                item.mobile === "secondary" ? "true" : undefined
              }
              href={item.href}
              key={item.label}
            >
              <GardenIcon name={item.icon} size={23} />
              <span>{item.label}</span>
            </a>
          ))}
          <details className={styles.moreNav}>
            <summary className={styles.moreSummary}>
              <GardenIcon name="goals" size={23} />
              <span>Mais</span>
            </summary>
            <div className={styles.moreMenu}>
              {secondaryNavigation.map((item) => (
                <a href={item.href} key={item.label}>
                  <GardenIcon name={item.icon} size={23} />
                  <span>{item.label}</span>
                </a>
              ))}
              <form action={signOut}>
                <SignOutButton />
              </form>
            </div>
          </details>
          <form action={signOut} className={styles.desktopSignOut}>
            <SignOutButton />
          </form>
        </nav>

        <p className={styles.sidebarNote}>
          <GardenIcon name="assistant" size={19} />
          <span>
            Seu assistente organiza o que você escrever na captura rápida.
          </span>
        </p>
      </aside>

      <main className={styles.main} id="conteudo-principal">
        <QuickCapture
          dateLabel={formatLongDate(snapshot.date)}
          greeting={`Bom dia, ${snapshot.greetingName}`}
        />

        <div className={styles.contentGrid}>
          <section
            aria-labelledby="timeline-title"
            className={styles.timeline}
            id="linha-do-tempo"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Ritmo do dia</p>
                <h2 id="timeline-title">Seu dia</h2>
              </div>
              <span>{snapshot.timeline.length} momentos</span>
            </div>

            <ol className={styles.timelineList}>
              {snapshot.timeline.map((item) => (
                <li
                  className={styles.timelineItem}
                  data-kind={item.kind}
                  key={item.id}
                >
                  <time dateTime={item.time}>{item.time}</time>
                  <span className={styles.timelineStem} aria-hidden="true">
                    <span />
                  </span>
                  <div className={styles.timelineCopy}>
                    <span>{timelineLabels[item.kind]}</span>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside aria-label="Resumo do dia" className={styles.rightRail}>
            <fieldset className={styles.mood} id="bem-estar">
              <legend>Como você está?</legend>
              <p>Um check-in rápido ajuda a enxergar seus padrões.</p>
              <div className={styles.moodOptions}>
                {moods.map(({ value, label, mouth }) => (
                  <label key={value}>
                    <input
                      aria-describedby="preview-notice"
                      name="mood"
                      type="radio"
                      value={value}
                    />
                    <span className={styles.moodGlyph}>
                      <MoodGlyph mouth={mouth} />
                    </span>
                    <span className="sr-only">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section
              aria-labelledby="finance-title"
              className={styles.finance}
              id="financas"
            >
              <div aria-hidden="true" className={styles.financeSprig}>
                <i />
                <i />
                <i />
              </div>
              <GardenIcon name="finance" size={35} />
              <p className={styles.kicker}>Para hoje</p>
              <h2 id="finance-title">
                {formatCurrency(snapshot.freeToSpendCents)}
              </h2>
              <p>livres para gastar sem sair do seu plano.</p>
              <span>
                Saldo projetado no fim do mês:{" "}
                <strong>
                  {formatCurrency(snapshot.projectedBalanceCents)}
                </strong>
              </span>
            </section>
          </aside>
        </div>

        <div className={styles.lowerGrid}>
          <section
            aria-labelledby="priority-title"
            className={styles.prioritySheet}
            id="prioridades"
          >
            <div className={styles.sectionHeading}>
              <h2 id="priority-title">Prioridades</h2>
              <span>{pendingPriorities} pendentes</span>
            </div>
            <ul className={styles.checkList}>
              {snapshot.priorities.map((item) => (
                <li key={item.id}>
                  <input
                    aria-describedby="preview-notice"
                    defaultChecked={item.done}
                    id={`priority-${item.id}`}
                    type="checkbox"
                  />
                  <label htmlFor={`priority-${item.id}`}>{item.title}</label>
                </li>
              ))}
            </ul>
          </section>

          <section
            aria-labelledby="habit-title"
            className={styles.habitGarden}
            id="rituais"
          >
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>Pequenos rituais</p>
                <h2 id="habit-title">Hábitos</h2>
              </div>
              <span>
                {completedHabits}/{snapshot.habits.length}
              </span>
            </div>
            <ul className={styles.habitList}>
              {snapshot.habits.map((item) => (
                <li data-done={item.done} key={item.id}>
                  <GardenIcon
                    name={item.done ? "wellbeing" : "today"}
                    size={24}
                  />
                  <span>{item.title}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
