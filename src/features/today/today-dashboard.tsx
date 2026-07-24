import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { QuickCapture } from "./quick-capture";
import {
  formatCurrency,
  formatLongDate,
  type TodaySnapshot,
} from "./today-model";
import styles from "./today-dashboard.module.css";

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

export function TodayDashboard({
  snapshot,
  userId,
}: {
  snapshot: TodaySnapshot;
  userId: string;
}) {
  const pendingPriorities = snapshot.priorities.filter(
    (item) => !item.done,
  ).length;
  const completedHabits = snapshot.habits.filter((item) => item.done).length;

  return (
    <div className={styles.shell} id="inicio">
      <a className={styles.skipLink} href="#conteudo-principal">
        Pular para o conteúdo
      </a>
      <AppSidebar active="today" />

      <main className={styles.main} id="conteudo-principal">
        <QuickCapture
          dateLabel={formatLongDate(snapshot.date)}
          greeting={`Bom dia, ${snapshot.greetingName}`}
          userId={userId}
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
