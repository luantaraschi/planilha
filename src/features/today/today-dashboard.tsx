import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { MoodQuickCheck } from "./mood-quick-check";
import {
  HabitProgressAction,
  PriorityProgressAction,
} from "./today-progress-actions";
import { QuickCapture } from "./quick-capture";
import {
  formatCurrency,
  formatLongDate,
  type TodaySnapshot,
} from "./today-model";
import styles from "./today-dashboard.module.css";

const timelineLabels = {
  event: "Compromisso",
  task: "Tarefa",
  bill: "Conta",
  habit: "Hábito",
} as const;

export function TodayDashboard({ snapshot }: {
  snapshot: TodaySnapshot;
  userId?: string;
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
          dateLabel={formatLongDate(snapshot.date, snapshot.timeZone)}
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
              {snapshot.timeline.length === 0 ? (
                <li className={styles.emptyTimeline}>
                  <GardenIcon name="calendar" size={34} />
                  <strong>Seu dia ainda está aberto.</strong>
                  <span>Agende uma tarefa ou compromisso para montar o ritmo.</span>
                </li>
              ) : snapshot.timeline.map((item) => (
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
              <MoodQuickCheck
                date={snapshot.dateIso ?? snapshot.date.toISOString().slice(0, 10)}
              />
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
              {snapshot.priorities.length === 0 ? (
                <li className={styles.emptyList}>
                  Nenhuma prioridade sem horário.
                </li>
              ) : snapshot.priorities.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <PriorityProgressAction
                    done={item.done}
                    taskId={item.id}
                    title={item.title}
                  />
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
              {snapshot.habits.length === 0 ? (
                <li className={styles.emptyList}>
                  Crie seu primeiro hábito para vê-lo aqui.
                </li>
              ) : snapshot.habits.map((item) => (
                <li data-done={item.done} key={item.id}>
                  <GardenIcon
                    name={item.done ? "wellbeing" : "today"}
                    size={24}
                  />
                  <span>{item.title}</span>
                  <HabitProgressAction
                    done={item.done}
                    habitId={item.id}
                    occurredOn={snapshot.dateIso ?? snapshot.date.toISOString().slice(0, 10)}
                    title={item.title}
                  />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
