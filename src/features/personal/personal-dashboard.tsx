import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import type { Habit } from "@/features/habits/habit-repository";
import type { MoodEntry, PersonalGoal, PersonalNote } from "./personal-repository";
import { GoalComposer, GoalToggle, HabitComposer, HabitToggle, MoodComposer, NoteComposer } from "./personal-composers";
import styles from "./personal-dashboard.module.css";

function Shell({ active, children, title, subtitle, icon }: { active: "wellbeing" | "goals" | "notes"; children: React.ReactNode; title: string; subtitle: string; icon: "wellbeing" | "goals" | "notes" }) {
  return <div className={styles.shell}><a className={styles.skipLink} href="#personal-main">Pular para o conteúdo</a><AppSidebar active={active} /><main className={styles.main} id="personal-main"><header className={styles.header}><div><p>{subtitle}</p><h1>{title}</h1></div><span aria-hidden="true"><GardenIcon name={icon} size={54} /></span></header>{children}</main></div>;
}

export function NotesDashboard({ notes }: { notes: PersonalNote[] }) {
  return <Shell active="notes" icon="notes" subtitle="Um lugar para não deixar ideias escaparem" title="Notas"><section className={styles.sheet}><div className={styles.sectionHeading}><div><h2>Suas anotações</h2><p>{notes.length ? `${notes.length} ${notes.length === 1 ? "nota" : "notas"} guardadas.` : "Comece com uma ideia pequena."}</p></div><GardenIcon name="notes" size={28} /></div>{notes.length ? <ul className={styles.noteList}>{notes.map((note) => <li key={note.id}><strong>{note.title || "Sem título"}</strong><p>{note.body}</p><small>Atualizada {new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(note.updatedAt))}</small></li>)}</ul> : <Empty icon="notes" text="Nenhuma nota por enquanto. Registre uma ideia, leitura ou lembrança." />}</section><NoteComposer /></Shell>;
}

export function GoalsDashboard({ goals }: { goals: PersonalGoal[] }) {
  return <Shell active="goals" icon="goals" subtitle="Direção para o que importa" title="Metas"><section className={styles.sheet}><div className={styles.sectionHeading}><div><h2>Seus próximos marcos</h2><p>Metas simples, visíveis e ajustáveis.</p></div><GardenIcon name="goals" size={28} /></div>{goals.length ? <ul className={styles.goalList}>{goals.map((goal) => <li data-completed={goal.completed} key={goal.id}><div><strong>{goal.title}</strong><span>{goal.area}{goal.targetOn ? ` · ${goal.targetOn.split("-").reverse().join("/")}` : ""}</span></div><GoalToggle completed={goal.completed} goalId={goal.id} /></li>)}</ul> : <Empty icon="goals" text="Sua primeira meta pode ser pequena. O importante é poder acompanhá-la." />}</section><GoalComposer /></Shell>;
}

export function WellbeingDashboard({ date, habits, moods }: { date: string; habits: Habit[]; moods: MoodEntry[] }) {
  return <Shell active="wellbeing" icon="wellbeing" subtitle="Um olhar breve para o seu ritmo" title="Bem-estar"><div className={styles.split}><section className={styles.tintedSheet}><MoodComposer date={date} /></section><section className={styles.sheet}><div className={styles.sectionHeading}><div><h2>Hábitos de hoje</h2><p>Constância sem cobrança.</p></div><GardenIcon name="wellbeing" size={28} /></div>{habits.length ? <ul className={styles.habitList}>{habits.map((habit) => <li data-done={habit.done} key={habit.id}><div><strong>{habit.title}</strong><span>{habit.scheduledTime}</span></div><HabitToggle done={habit.done} habitId={habit.id} occurredOn={date} /></li>)}</ul> : <Empty icon="wellbeing" text="Ainda não há hábitos. Escolha um ritual que você queira repetir." />}</section></div><HabitComposer /><section className={styles.sheet}><div className={styles.sectionHeading}><div><h2>Seus últimos check-ins</h2><p>Uma visão simples dos seus registros.</p></div></div>{moods.length ? <ul className={styles.moodHistory}>{moods.map((entry) => <li key={entry.id}><strong>{({ terrible: "Muito mal", bad: "Mal", neutral: "Neutro", good: "Bem", great: "Muito bem" })[entry.mood]}</strong><span>{entry.occurredOn.split("-").reverse().join("/")}</span>{entry.note ? <p>{entry.note}</p> : null}</li>)}</ul> : <Empty icon="wellbeing" text="Seu primeiro check-in ficará registrado aqui." />}</section></Shell>;
}

function Empty({ icon, text }: { icon: "wellbeing" | "goals" | "notes"; text: string }) { return <div className={styles.empty}><GardenIcon name={icon} size={40} /><strong>Seu espaço está livre.</strong><span>{text}</span></div>; }
