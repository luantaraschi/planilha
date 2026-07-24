import Link from "next/link";
import { GardenIcon, type GardenIconName } from "@/components/garden-icon";
import { signOut } from "@/features/identity/auth-actions";
import styles from "@/features/today/today-dashboard.module.css";

type AppSection = "today" | "finance" | "settings";

const navigation = [
  {
    key: "today",
    label: "Hoje",
    compactLabel: "Hoje",
    icon: "today",
    href: "/",
    mobile: "primary",
  },
  {
    key: "agenda",
    label: "Agenda",
    compactLabel: "Agenda",
    icon: "calendar",
    href: "/#linha-do-tempo",
    mobile: "primary",
  },
  {
    key: "tasks",
    label: "Tarefas",
    compactLabel: "Tarefas",
    icon: "tasks",
    href: "/#prioridades",
    mobile: "primary",
  },
  {
    key: "finance",
    label: "Finanças",
    compactLabel: "Finanças",
    icon: "finance",
    href: "/financas",
    mobile: "primary",
  },
  {
    key: "wellbeing",
    label: "Bem-estar",
    compactLabel: "Bem-estar",
    icon: "wellbeing",
    href: "/#bem-estar",
    mobile: "primary",
  },
  {
    key: "goals",
    label: "Metas",
    compactLabel: "Metas",
    icon: "goals",
    href: "/#rituais",
    mobile: "secondary",
  },
  {
    key: "notes",
    label: "Notas",
    compactLabel: "Notas",
    icon: "notes",
    href: "/#quick-capture",
    mobile: "secondary",
  },
  {
    key: "assistant",
    label: "Assistente",
    compactLabel: "Assistente",
    icon: "assistant",
    href: "/financas#assistente",
    mobile: "secondary",
  },
  {
    key: "settings",
    label: "Configurações",
    compactLabel: "Configurações",
    icon: "settings",
    href: "/configuracoes",
    mobile: "secondary",
  },
] satisfies Array<{
  key: string;
  label: string;
  compactLabel: string;
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
    <button
      aria-label="Sair"
      className={styles.signOutButton}
      type="submit"
    >
      <SignOutIcon />
      <span className={styles.navLabel}>Sair</span>
      <span
        aria-hidden="true"
        className={styles.navCompactLabel}
      >
        Sair
      </span>
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
        <span className={styles.brandLabel}>Meu espaço</span>
      </Link>

      <nav aria-label="Principal" className={styles.nav}>
        {navigation.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
              className={isActive ? styles.navActive : styles.navItem}
              data-mobile-secondary={
                item.mobile === "secondary" ? "true" : undefined
              }
              href={item.href}
              key={item.key}
            >
              <GardenIcon name={item.icon} size={23} />
              <span className={styles.navLabel}>{item.label}</span>
              <span
                aria-hidden="true"
                className={styles.navCompactLabel}
                data-compact-label
              >
                {item.compactLabel}
              </span>
            </Link>
          );
        })}
        <details
          className={styles.moreNav}
          data-active={
            secondaryNavigation.some((item) => item.key === active)
              ? "true"
              : undefined
          }
        >
          <summary className={styles.moreSummary}>
            <GardenIcon name="goals" size={23} />
            <span>Mais</span>
          </summary>
          <div className={styles.moreMenu}>
            {secondaryNavigation.map((item) => {
              const isActive = item.key === active;
              return (
                <Link
                  aria-current={isActive ? "page" : undefined}
                  href={item.href}
                  key={item.key}
                >
                  <GardenIcon name={item.icon} size={23} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
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
