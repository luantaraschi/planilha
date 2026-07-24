import Link from "next/link";
import { GardenIcon, type GardenIconName } from "@/components/garden-icon";
import { signOut } from "@/features/identity/auth-actions";
import styles from "@/features/today/today-dashboard.module.css";

type AppSection = "today" | "finance" | "settings";

const navigation = [
  { key: "today", label: "Hoje", icon: "today", href: "/", mobile: "primary" },
  {
    key: "agenda",
    label: "Agenda",
    icon: "calendar",
    href: "/#linha-do-tempo",
    mobile: "primary",
  },
  {
    key: "tasks",
    label: "Tarefas",
    icon: "tasks",
    href: "/#prioridades",
    mobile: "primary",
  },
  {
    key: "finance",
    label: "Finanças",
    icon: "finance",
    href: "/financas",
    mobile: "primary",
  },
  {
    key: "wellbeing",
    label: "Bem-estar",
    icon: "wellbeing",
    href: "/#bem-estar",
    mobile: "primary",
  },
  {
    key: "goals",
    label: "Metas",
    icon: "goals",
    href: "/#rituais",
    mobile: "secondary",
  },
  {
    key: "notes",
    label: "Notas",
    icon: "notes",
    href: "/#quick-capture",
    mobile: "secondary",
  },
  {
    key: "assistant",
    label: "Assistente",
    icon: "assistant",
    href: "/financas#assistente",
    mobile: "secondary",
  },
  {
    key: "settings",
    label: "Configurações",
    icon: "settings",
    href: "/configuracoes",
    mobile: "secondary",
  },
] satisfies Array<{
  key: string;
  label: string;
  icon: GardenIconName;
  href: string;
  mobile: "primary" | "secondary";
}>;

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

export function AppSidebar({ active }: { active: AppSection }) {
  const secondaryNavigation = navigation.filter(
    (item) => item.mobile === "secondary",
  );

  return (
    <aside className={styles.sidebar}>
      <Link aria-label="Ir para o início" className={styles.brand} href="/">
        <span aria-hidden="true" className={styles.brandMark}>
          <GardenIcon name="wellbeing" size={26} />
        </span>
        <span>Meu espaço</span>
      </Link>

      <nav aria-label="Principal" className={styles.nav}>
        {navigation.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={isActive ? styles.navActive : styles.navItem}
              data-mobile-secondary={
                item.mobile === "secondary" ? "true" : undefined
              }
              href={item.href}
              key={item.key}
            >
              <GardenIcon name={item.icon} size={23} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <details className={styles.moreNav}>
          <summary className={styles.moreSummary}>
            <GardenIcon name="goals" size={23} />
            <span>Mais</span>
          </summary>
          <div className={styles.moreMenu}>
            {secondaryNavigation.map((item) => (
              <Link href={item.href} key={item.key}>
                <GardenIcon name={item.icon} size={23} />
                <span>{item.label}</span>
              </Link>
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
          Seu assistente transforma lançamentos em respostas simples.
        </span>
      </p>
    </aside>
  );
}
