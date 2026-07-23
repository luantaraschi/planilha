# Foundation and Today Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a bootable, tested and responsive Next.js application that establishes the Jardim de Pêssego visual language and renders a realistic read-only Today experience.

**Architecture:** Next.js App Router renders the route as a Server Component. One typed demo snapshot feeds the Today feature so the visual layer has the same input shape a later repository will provide. CSS custom properties hold global tokens; CSS Modules own surface-specific styles; no component framework is added.

**Tech Stack:** Next.js 16.2.11, React 19.2.8, TypeScript 7.0.2, CSS Modules, Vitest 4.1.10, Testing Library and native SVG/HTML controls.

## Global Constraints

- Platform is responsive web.
- UI language is Brazilian Portuguese and currency is BRL.
- Visual direction is Jardim de Pêssego from `DESIGN.md`.
- Do not use Tailwind, shadcn, Lucide, Heroicons, emoji as final iconography, gradients, glassmorphism or generic card grids.
- All text on pastel surfaces must meet WCAG AA.
- Respect `prefers-reduced-motion`.
- This phase is read-only and uses one demo data file; auth and persistence belong to Phase 2.
- Before UI edits, load `frontend-design`, Impeccable new-work context and craft-floor, then follow `vercel-react-best-practices`.
- Before completion, inspect desktop and mobile, use `fixing-accessibility`, run the Impeccable detector once and request the Impeccable finish review.

---

## File map

- `package.json`: dependencies and validation scripts.
- `next.config.ts`: strict Next.js configuration.
- `tsconfig.json`: strict TypeScript and `@/*` alias.
- `eslint.config.mjs`: Next.js Core Web Vitals and TypeScript lint rules.
- `vitest.config.ts`, `vitest.setup.ts`: jsdom test environment.
- `src/app/layout.tsx`: Portuguese root document and metadata.
- `src/app/page.tsx`: route composition only.
- `src/app/globals.css`: reset and normative Jardim de Pêssego tokens.
- `src/features/today/today-model.ts`: snapshot types, demo data and formatters.
- `src/features/today/today-model.test.ts`: deterministic model checks.
- `src/components/garden-icon.tsx`: original icon subset and accessible SVG API.
- `src/components/garden-icon.test.tsx`: icon accessibility contract.
- `src/features/today/today-dashboard.tsx`: semantic Today surface.
- `src/features/today/today-dashboard.module.css`: layout, responsive behavior and states.
- `src/features/today/today-dashboard.test.tsx`: user-visible content and landmarks.
- `src/app/loading.tsx`, `src/app/error.tsx`, `src/app/not-found.tsx`: designed route states.
- `public/illustrations/morning-garden.webp`: approved custom illustration.

### Task 1: Toolchain and bootable route

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `next-env.d.ts`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`

**Interfaces:**
- Produces: `npm run test`, `npm run typecheck`, `npm run lint`, `npm run build`.
- Produces: the `/` App Router route and global token names consumed by later tasks.

- [ ] **Step 1: Create the package manifest**

```json
{
  "name": "personal-organization-superapp",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "next": "16.2.11",
    "react": "19.2.8",
    "react-dom": "19.2.8"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "7.0.0",
    "@testing-library/react": "16.3.2",
    "@testing-library/user-event": "14.6.1",
    "@types/node": "26.1.1",
    "@types/react": "19.2.17",
    "@types/react-dom": "19.2.3",
    "eslint": "10.7.0",
    "eslint-config-next": "16.2.11",
    "jsdom": "29.1.1",
    "typescript": "7.0.2",
    "vitest": "4.1.10"
  }
}
```

- [ ] **Step 2: Install the locked dependencies**

Run: `npm install`

Expected: exit code 0 and a new `package-lock.json`.

- [ ] **Step 3: Create framework and test configuration**

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
```

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "react-jsx",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

```ts
// next-env.d.ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />
```

```js
// eslint.config.mjs
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  globalIgnores([".next/**", "coverage/**"]),
]);
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    passWithNoTests: true,
  },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
});
```

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Create the minimal accessible route**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-ui",
});

export const metadata: Metadata = {
  title: "Meu espaço",
  description: "Organização pessoal, rotina e finanças em um só lugar.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body className={nunito.variable}>{children}</body>
    </html>
  );
}
```

```tsx
// src/app/page.tsx
export default function HomePage() {
  return (
    <main>
      <h1>Meu dia</h1>
    </main>
  );
}
```

```css
/* src/app/globals.css */
:root {
  color-scheme: light;
  --porcelain: #fffaf7;
  --surface: #ffffff;
  --peach: #ffe5d5;
  --tea-rose: #fce1e8;
  --butter: #fff2be;
  --sage: #dfead9;
  --cocoa: #45352f;
  --clay: #725e55;
  --raspberry: #a73655;
  --focus: #71334a;
  --border: #eadbd4;
  --shadow-ambient: 0 18px 50px rgb(101 73 61 / 9%);
  --radius-sm: 0.75rem;
  --radius-md: 1.125rem;
  --radius-lg: 1.5rem;
}

* {
  box-sizing: border-box;
}

html {
  background: var(--porcelain);
}

body {
  margin: 0;
  color: var(--cocoa);
  background: var(--porcelain);
  font-family: var(--font-ui), "Segoe UI", sans-serif;
}

button,
input {
  font: inherit;
}

:focus-visible {
  outline: 3px solid var(--focus);
  outline-offset: 3px;
}
```

- [ ] **Step 5: Verify the foundation**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`

Expected: tests report no test files without failing; typecheck, lint and build exit 0.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json next.config.ts tsconfig.json next-env.d.ts eslint.config.mjs vitest.config.ts vitest.setup.ts src/app
git commit -m "build: initialize Next.js application"
```

### Task 2: Typed Today snapshot and deterministic formatters

**Files:**
- Create: `src/features/today/today-model.test.ts`
- Create: `src/features/today/today-model.ts`

**Interfaces:**
- Produces: `TodaySnapshot`, `TODAY_DEMO`, `formatCurrency(valueInCents)` and `formatLongDate(date)`.
- Consumed by: Tasks 4 and 5.

- [ ] **Step 1: Write the failing model test**

```ts
// src/features/today/today-model.test.ts
import { describe, expect, it } from "vitest";
import { formatCurrency, formatLongDate, TODAY_DEMO } from "./today-model";

describe("today model", () => {
  it("formats BRL from integer cents", () => {
    expect(formatCurrency(14500)).toBe("R$ 145,00");
  });

  it("formats the reference day in Portuguese", () => {
    expect(formatLongDate(TODAY_DEMO.date)).toBe("quinta-feira, 23 de julho");
  });

  it("keeps the demo snapshot internally consistent", () => {
    expect(TODAY_DEMO.timeline).toHaveLength(4);
    expect(TODAY_DEMO.freeToSpendCents).toBeGreaterThan(0);
    expect(TODAY_DEMO.priorities.filter((item) => item.done)).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/today/today-model.test.ts`

Expected: FAIL because `today-model.ts` does not exist.

- [ ] **Step 3: Implement the typed snapshot**

```ts
// src/features/today/today-model.ts
export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  kind: "event" | "task" | "bill";
  detail: string;
};

export type TodaySnapshot = {
  date: Date;
  greetingName: string;
  timeline: TimelineItem[];
  priorities: Array<{ id: string; title: string; done: boolean }>;
  habits: Array<{ id: string; title: string; done: boolean }>;
  freeToSpendCents: number;
  projectedBalanceCents: number;
};

export const TODAY_DEMO: TodaySnapshot = {
  date: new Date("2026-07-23T12:00:00-03:00"),
  greetingName: "Lu",
  timeline: [
    { id: "planning", time: "09:00", title: "Planejamento da semana", kind: "event", detail: "Google Agenda" },
    { id: "proposal", time: "11:00", title: "Finalizar proposta", kind: "task", detail: "45 min" },
    { id: "dentist", time: "14:30", title: "Dentista", kind: "event", detail: "Clínica Aurora" },
    { id: "energy", time: "17:00", title: "Pagar energia", kind: "bill", detail: "R$ 186,00" },
  ],
  priorities: [
    { id: "documents", title: "Enviar documentos", done: false },
    { id: "budget", title: "Revisar orçamento de agosto", done: true },
    { id: "medicine", title: "Comprar remédio", done: false },
  ],
  habits: [
    { id: "water", title: "Beber água", done: false },
    { id: "walk", title: "Caminhar 30 minutos", done: true },
    { id: "read", title: "Ler 20 minutos", done: false },
  ],
  freeToSpendCents: 14500,
  projectedBalanceCents: 215000,
};

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bahia",
  }).format(date);
}
```

- [ ] **Step 4: Run the model tests**

Run: `npm test -- src/features/today/today-model.test.ts`

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/today/today-model.ts src/features/today/today-model.test.ts
git commit -m "feat: add typed Today snapshot"
```

### Task 3: Original Garden icon subset

**Files:**
- Create: `src/components/garden-icon.test.tsx`
- Create: `src/components/garden-icon.tsx`

**Interfaces:**
- Produces: `GardenIcon({ name, title?, size? })`.
- Valid names: `today`, `calendar`, `tasks`, `finance`, `wellbeing`, `goals`, `notes`, `assistant`.

- [ ] **Step 1: Write the failing accessibility test**

```tsx
// src/components/garden-icon.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GardenIcon } from "./garden-icon";

describe("GardenIcon", () => {
  it("exposes a named image when a title is supplied", () => {
    render(<GardenIcon name="today" title="Hoje" />);
    expect(screen.getByRole("img", { name: "Hoje" })).toBeInTheDocument();
  });

  it("stays decorative without a title", () => {
    const { container } = render(<GardenIcon name="finance" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/components/garden-icon.test.tsx`

Expected: FAIL because `garden-icon.tsx` does not exist.

- [ ] **Step 3: Implement the original SVG subset**

```tsx
// src/components/garden-icon.tsx
import type { SVGProps } from "react";

const paths = {
  today: <><path d="M8 5.5h16a3.5 3.5 0 0 1 3.5 3.5v15A3.5 3.5 0 0 1 24 27.5H8A3.5 3.5 0 0 1 4.5 24V9A3.5 3.5 0 0 1 8 5.5Z"/><path d="M10 3.5v5M22 3.5v5M5 12.5h22"/><path className="fill" d="M11 17h4v4h-4z"/></>,
  calendar: <><path d="M7 6h18a3 3 0 0 1 3 3v16a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3Z"/><path d="M10 3v6M22 3v6M4 13h24M10 18h3M18 18h4M10 23h5"/></>,
  tasks: <><path d="m5 9 2.5 2.5L12 6"/><path d="M15 9h12M5 18l2.5 2.5L12 15M15 18h12M5 27l2.5 2.5L12 24M15 27h12"/></>,
  finance: <><path d="M5 10.5 16 5l11 5.5v15A2.5 2.5 0 0 1 24.5 28h-17A2.5 2.5 0 0 1 5 25.5Z"/><path d="M5 12h22M10 16v8M16 16v8M22 16v8M3 28h26"/><path className="fill" d="M14 8h4v2h-4z"/></>,
  wellbeing: <><path d="M16 28S5 22 5 13.5A6.5 6.5 0 0 1 16 8.8a6.5 6.5 0 0 1 11 4.7C27 22 16 28 16 28Z"/><path d="M10.5 16.5c2.5 3 8.5 3 11 0"/></>,
  goals: <><circle cx="16" cy="16" r="12"/><circle cx="16" cy="16" r="7"/><circle className="fill" cx="16" cy="16" r="2.5"/><path d="m23 9 5-5M23 4h5v5"/></>,
  notes: <><path d="M7 4h14l5 5v19H7Z"/><path d="M21 4v6h5M11 15h11M11 20h11M11 25h7"/></>,
  assistant: <><path d="M7 7.5h18a3 3 0 0 1 3 3v11a3 3 0 0 1-3 3H15l-6 4v-4H7a3 3 0 0 1-3-3v-11a3 3 0 0 1 3-3Z"/><path className="fill" d="M16 11.5 17.3 15l3.7 1.3-3.7 1.3L16 21l-1.3-3.4-3.7-1.3 3.7-1.3Z"/></>,
} as const;

export type GardenIconName = keyof typeof paths;

type GardenIconProps = Omit<SVGProps<SVGSVGElement>, "name"> & {
  name: GardenIconName;
  title?: string;
  size?: number;
};

export function GardenIcon({ name, title, size = 24, ...props }: GardenIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      <g>{paths[name]}</g>
    </svg>
  );
}
```

- [ ] **Step 4: Run the icon tests**

Run: `npm test -- src/components/garden-icon.test.tsx`

Expected: 2 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/garden-icon.tsx src/components/garden-icon.test.tsx
git commit -m "feat: add original Garden icon subset"
```

### Task 4: Responsive shell and Today surface

**Files:**
- Create: `src/features/today/today-dashboard.test.tsx`
- Create: `src/features/today/today-dashboard.tsx`
- Create: `src/features/today/today-dashboard.module.css`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `TodaySnapshot`, formatters and `GardenIcon`.
- Produces: `TodayDashboard({ snapshot }: { snapshot: TodaySnapshot })`.

- [ ] **Step 1: Write the failing surface test**

```tsx
// src/features/today/today-dashboard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TODAY_DEMO } from "./today-model";
import { TodayDashboard } from "./today-dashboard";

describe("TodayDashboard", () => {
  it("renders the core daily information with semantic landmarks", () => {
    render(<TodayDashboard snapshot={TODAY_DEMO} />);

    expect(screen.getByRole("navigation", { name: "Principal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /bom dia, lu/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Seu dia" })).toBeInTheDocument();
    expect(screen.getByText("R$ 145,00")).toBeInTheDocument();
    expect(screen.getByText("Pagar energia")).toBeInTheDocument();
    expect(screen.getByRole("radiogroup", { name: "Como você está?" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/features/today/today-dashboard.test.tsx`

Expected: FAIL because `today-dashboard.tsx` does not exist.

- [ ] **Step 3: Implement the semantic surface**

```tsx
// src/features/today/today-dashboard.tsx
import { GardenIcon, type GardenIconName } from "@/components/garden-icon";
import {
  formatCurrency,
  formatLongDate,
  type TodaySnapshot,
} from "./today-model";
import styles from "./today-dashboard.module.css";

const navigation: Array<{ label: string; icon: GardenIconName; href: string }> = [
  { label: "Hoje", icon: "today", href: "#inicio" },
  { label: "Agenda", icon: "calendar", href: "#linha-do-tempo" },
  { label: "Tarefas", icon: "tasks", href: "#prioridades" },
  { label: "Finanças", icon: "finance", href: "#financas" },
  { label: "Hábitos e humor", icon: "wellbeing", href: "#bem-estar" },
  { label: "Metas", icon: "goals", href: "#metas" },
  { label: "Notas", icon: "notes", href: "#notas" },
];

const moods = [
  ["muito-baixo", "Muito baixo"],
  ["baixo", "Baixo"],
  ["neutro", "Neutro"],
  ["bem", "Bem"],
  ["otimo", "Ótimo"],
] as const;

export function TodayDashboard({ snapshot }: { snapshot: TodaySnapshot }) {
  return (
    <div className={styles.shell} id="inicio">
      <aside className={styles.sidebar}>
        <a className={styles.brand} href="#inicio" aria-label="Ir para o início">
          <span className={styles.brandMark}><GardenIcon name="wellbeing" /></span>
          <span>Meu espaço</span>
        </a>
        <nav aria-label="Principal" className={styles.nav}>
          {navigation.map((item, index) => (
            <a
              href={item.href}
              key={item.label}
              className={index === 0 ? styles.navActive : styles.navItem}
              aria-current={index === 0 ? "page" : undefined}
            >
              <GardenIcon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>{formatLongDate(snapshot.date)}</p>
            <h1>Bom dia, {snapshot.greetingName}</h1>
            <p className={styles.subtitle}>Tudo o que merece sua atenção, com calma.</p>
          </div>
          <label className={styles.primaryAction} htmlFor="quick-capture">Adicionar</label>
        </header>

        <label className={styles.capture}>
          <span className="sr-only">Captura rápida</span>
          <GardenIcon name="assistant" />
          <input id="quick-capture" placeholder="Registre uma tarefa, gasto, nota ou compromisso…" />
        </label>

        <div className={styles.contentGrid}>
          <section className={styles.timeline} id="linha-do-tempo" aria-labelledby="timeline-title">
            <div className={styles.sectionHeading}>
              <div>
                <p className={styles.kicker}>RITMO DO DIA</p>
                <h2 id="timeline-title">Seu dia</h2>
              </div>
              <span>{snapshot.timeline.length} momentos</span>
            </div>
            <ol className={styles.timelineList}>
              {snapshot.timeline.map((item) => (
                <li key={item.id} className={styles.timelineItem} data-kind={item.kind}>
                  <time>{item.time}</time>
                  <span className={styles.timelineDot} aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className={styles.rightRail}>
            <fieldset className={styles.mood} id="bem-estar">
              <legend>Como você está?</legend>
              <p>Um check-in rápido já ajuda a enxergar padrões.</p>
              <div className={styles.moodOptions} role="radiogroup" aria-label="Como você está?">
                {moods.map(([value, label], index) => (
                  <label key={value}>
                    <input type="radio" name="mood" value={value} />
                    <span aria-hidden="true">{index + 1}</span>
                    <span className="sr-only">{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <section className={styles.finance} id="financas" aria-labelledby="finance-title">
              <div className={styles.financeIcon}><GardenIcon name="finance" /></div>
              <p className={styles.kicker}>PARA HOJE</p>
              <h2 id="finance-title">{formatCurrency(snapshot.freeToSpendCents)}</h2>
              <p>livres para gastar sem sair do seu plano.</p>
              <span>Fim do mês: {formatCurrency(snapshot.projectedBalanceCents)}</span>
            </section>
          </aside>
        </div>

        <div className={styles.lowerGrid}>
          <section id="prioridades" aria-labelledby="priority-title">
            <div className={styles.sectionHeading}>
              <h2 id="priority-title">Prioridades</h2>
              <span>{snapshot.priorities.filter((item) => !item.done).length} pendentes</span>
            </div>
            <ul className={styles.checkList}>
              {snapshot.priorities.map((item) => (
                <li key={item.id}>
                  <input type="checkbox" defaultChecked={item.done} id={item.id} />
                  <label htmlFor={item.id}>{item.title}</label>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="habit-title">
            <div className={styles.sectionHeading}>
              <h2 id="habit-title">Hábitos</h2>
              <span>{snapshot.habits.filter((item) => item.done).length}/{snapshot.habits.length}</span>
            </div>
            <ul className={styles.habitList}>
              {snapshot.habits.map((item) => (
                <li key={item.id} data-done={item.done}>
                  <GardenIcon name={item.done ? "wellbeing" : "today"} />
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
```

- [ ] **Step 4: Add the feature stylesheet**

Create `src/features/today/today-dashboard.module.css` with:

```css
.shell { min-height: 100vh; display: grid; grid-template-columns: 15.5rem 1fr; }
.sidebar { position: sticky; top: 0; height: 100vh; padding: 1.5rem 1rem; background: color-mix(in srgb, var(--tea-rose) 58%, white); border-right: 1px solid var(--border); }
.brand { display: flex; align-items: center; gap: .75rem; color: var(--cocoa); font-weight: 800; text-decoration: none; padding: .5rem; }
.brandMark { display: grid; place-items: center; width: 2.5rem; height: 2.5rem; color: var(--raspberry); background: var(--surface); border-radius: 44% 56% 52% 48%; }
.nav { display: grid; gap: .25rem; margin-top: 2rem; }
.navItem, .navActive { display: flex; align-items: center; gap: .75rem; min-height: 2.75rem; padding: .6rem .75rem; color: var(--clay); text-decoration: none; border-radius: var(--radius-sm); }
.navActive { color: var(--cocoa); background: var(--surface); box-shadow: 0 8px 24px rgb(101 73 61 / 7%); }
.main { width: min(100%, 92rem); padding: clamp(1.25rem, 3vw, 3rem); }
.header { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
.header h1 { margin: .2rem 0; font-size: clamp(2rem, 4vw, 3.5rem); line-height: 1; letter-spacing: -.04em; }
.eyebrow, .kicker { margin: 0; color: var(--raspberry); font-size: .75rem; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.subtitle { margin: .65rem 0 0; color: var(--clay); }
.primaryAction { display: grid; place-items: center; min-height: 2.75rem; padding: 0 1.15rem; color: white; background: var(--raspberry); border: 0; border-radius: 999px; font-weight: 800; cursor: pointer; }
.capture { display: flex; align-items: center; gap: .75rem; margin: 2rem 0; padding: .8rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-ambient); color: var(--raspberry); }
.capture input { width: 100%; border: 0; outline: 0; color: var(--cocoa); background: transparent; }
.contentGrid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(18rem, .75fr); gap: 1.25rem; }
.timeline { padding: clamp(1.25rem, 3vw, 2rem); background: var(--surface); border-radius: var(--radius-lg); border: 1px solid var(--border); }
.sectionHeading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.sectionHeading h2 { margin: .2rem 0 0; font-size: 1.35rem; }
.sectionHeading > span { color: var(--clay); font-size: .8rem; }
.timelineList { list-style: none; padding: 0; margin: 1.5rem 0 0; }
.timelineItem { display: grid; grid-template-columns: 3.5rem 1rem 1fr; gap: .75rem; align-items: start; min-height: 5rem; }
.timelineItem time { color: var(--clay); font-variant-numeric: tabular-nums; }
.timelineDot { width: .75rem; height: .75rem; margin-top: .2rem; border-radius: 50%; background: var(--peach); box-shadow: 0 0 0 .3rem color-mix(in srgb, var(--peach) 45%, white); }
.timelineItem[data-kind="task"] .timelineDot { background: var(--sage); }
.timelineItem[data-kind="bill"] .timelineDot { background: var(--butter); }
.timelineItem strong, .timelineItem div > span { display: block; }
.timelineItem div > span { margin-top: .25rem; color: var(--clay); font-size: .85rem; }
.rightRail { display: grid; gap: 1.25rem; align-content: start; }
.mood, .finance { margin: 0; padding: 1.35rem; border: 0; border-radius: var(--radius-lg); }
.mood { background: var(--tea-rose); }
.mood legend { padding-top: 1.35rem; font-weight: 800; font-size: 1.1rem; }
.mood p, .finance p { color: var(--clay); line-height: 1.45; }
.moodOptions { display: grid; grid-template-columns: repeat(5, 1fr); gap: .4rem; }
.moodOptions label { cursor: pointer; }
.moodOptions input { position: absolute; opacity: 0; }
.moodOptions label > span:first-of-type { display: grid; place-items: center; aspect-ratio: 1; color: var(--cocoa); background: rgb(255 255 255 / 65%); border: 1px solid transparent; border-radius: 50%; font-weight: 800; }
.moodOptions input:checked + span { background: var(--surface); border-color: var(--raspberry); box-shadow: 0 0 0 3px rgb(167 54 85 / 14%); }
.finance { position: relative; overflow: hidden; background: var(--sage); }
.financeIcon { display: grid; place-items: center; width: 3rem; height: 3rem; margin-bottom: 1rem; color: #375739; background: rgb(255 255 255 / 58%); border-radius: 48% 52% 45% 55%; }
.finance h2 { margin: .35rem 0; font-size: clamp(1.8rem, 3vw, 2.5rem); font-variant-numeric: tabular-nums; }
.finance > span { display: block; margin-top: 1rem; color: #375739; font-size: .85rem; font-weight: 700; }
.lowerGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; margin-top: 1.25rem; }
.lowerGrid > section { padding: 1.35rem; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
.checkList, .habitList { list-style: none; display: grid; gap: .8rem; padding: 0; margin: 1.1rem 0 0; }
.checkList li { display: flex; gap: .7rem; align-items: center; }
.checkList input { width: 1.1rem; height: 1.1rem; accent-color: var(--raspberry); }
.habitList { grid-template-columns: repeat(3, 1fr); }
.habitList li { display: grid; gap: .5rem; color: var(--clay); }
.habitList li[data-done="true"] { color: #375739; font-weight: 700; }
@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; padding-bottom: 5rem; }
  .sidebar { position: fixed; inset: auto 0 0; z-index: 10; width: auto; height: auto; padding: .5rem; border-top: 1px solid var(--border); border-right: 0; }
  .brand { display: none; }
  .nav { grid-template-columns: repeat(5, 1fr); margin: 0; }
  .nav a:nth-child(n + 6) { display: none; }
  .navItem, .navActive { min-height: 3.5rem; flex-direction: column; justify-content: center; gap: .15rem; padding: .25rem; font-size: .7rem; }
  .main { padding: 1.25rem; }
  .contentGrid, .lowerGrid { grid-template-columns: 1fr; }
}

@media (max-width: 520px) {
  .header { align-items: flex-start; }
  .primaryAction { width: 2.75rem; padding: 0; overflow: hidden; color: transparent; }
  .primaryAction::after { content: "+"; color: white; font-size: 1.35rem; }
  .habitList { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: no-preference) {
  .navItem, .navActive, .primaryAction, .moodOptions span { transition: transform 160ms ease, background-color 160ms ease, box-shadow 160ms ease; }
  .primaryAction:hover { transform: translateY(-1px); }
}
```

Add this global utility to `src/app/globals.css`:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

- [ ] **Step 5: Wire the route**

```tsx
// src/app/page.tsx
import { TodayDashboard } from "@/features/today/today-dashboard";
import { TODAY_DEMO } from "@/features/today/today-model";

export default function HomePage() {
  return <TodayDashboard snapshot={TODAY_DEMO} />;
}
```

- [ ] **Step 6: Run focused and full validation**

Run: `npm test -- src/features/today/today-dashboard.test.tsx && npm run typecheck && npm run lint`

Expected: surface test PASS; typecheck and lint exit 0.

- [ ] **Step 7: Commit**

```bash
git add src/app/page.tsx src/app/globals.css src/features/today
git commit -m "feat: add responsive Today experience"
```

### Task 5: Art-directed illustration and route states

**Files:**
- Create: `public/illustrations/morning-garden.webp`
- Create: `src/components/state-page.tsx`
- Create: `src/components/state-page.module.css`
- Create: `src/app/loading.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`
- Modify: `src/features/today/today-dashboard.tsx`
- Modify: `src/features/today/today-dashboard.module.css`

**Interfaces:**
- Consumes: Jardim de Pêssego art direction from `DESIGN.md`.
- Produces: one owned illustration asset and designed loading/error/not-found states.

- [ ] **Step 1: Generate the owned illustration**

Use the image generation tool with this exact prompt:

```text
Create a refined editorial spot illustration for a modern Brazilian personal planner app.
Scene: a sunlit breakfast table seen at a gentle three-quarter angle, with an open planner,
a small peach-colored wallet, a rounded desk clock, three handwritten task tabs, a tiny
sprouting plant, and two loose flower petals. Visual grammar: contemporary paper-cut and
gouache hybrid, organic dark-cocoa outlines, flat shapes, subtle paper grain, warm porcelain
background, peach, tea-rose, butter yellow and sage green palette. Calm, optimistic,
grown-up, premium product illustration. No people, no text, no logos, no 3D plastic,
no gradients, no neon, no generic corporate vector style. Wide 3:2 composition with
transparent or clean warm background and generous negative space.
```

Save the approved result as `public/illustrations/morning-garden.webp`, max width
1200px and target file size below 250KB.

- [ ] **Step 2: Add the illustration to the Today header**

In `today-dashboard.tsx`, import `Image` from `next/image` and add after the header
copy:

```tsx
<Image
  className={styles.morningIllustration}
  src="/illustrations/morning-garden.webp"
  alt=""
  width={600}
  height={400}
  priority
/>
```

Add:

```css
.morningIllustration {
  width: min(28vw, 22rem);
  height: auto;
  object-fit: contain;
}

@media (max-width: 700px) {
  .morningIllustration { display: none; }
}
```

- [ ] **Step 3: Implement designed route states**

```tsx
// src/components/state-page.tsx
import type { ReactNode } from "react";
import { GardenIcon } from "@/components/garden-icon";
import styles from "./state-page.module.css";

export function StatePage({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <main className={styles.page}>
      <div className={styles.flower} aria-hidden="true"><GardenIcon name="wellbeing" /></div>
      <p>{eyebrow}</p>
      <h1>{title}</h1>
      {children}
    </main>
  );
}
```

```css
/* src/components/state-page.module.css */
.page {
  min-height: 100vh;
  display: grid;
  place-content: center;
  justify-items: start;
  padding: 2rem;
  background: var(--porcelain);
}
.page > * { max-width: 36rem; }
.page p { color: var(--raspberry); font-weight: 800; }
.page h1 { margin: .4rem 0 1.2rem; font-size: clamp(2rem, 6vw, 4.5rem); line-height: 1; }
.page button, .page a { min-height: 2.75rem; display: inline-grid; place-items: center; padding: 0 1rem; color: white; background: var(--raspberry); border: 0; border-radius: 999px; text-decoration: none; font-weight: 800; cursor: pointer; }
.flower { width: 3.5rem; height: 3.5rem; display: grid; place-items: center; color: var(--raspberry); background: var(--tea-rose); border-radius: 44% 56% 52% 48%; }
```

```tsx
// src/app/loading.tsx
import { StatePage } from "@/components/state-page";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando seu dia">
      <StatePage eyebrow="SÓ UM INSTANTE" title="Organizando seu dia…" />
    </div>
  );
}
```

```tsx
// src/app/error.tsx
"use client";
import { StatePage } from "@/components/state-page";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <StatePage eyebrow="SEU ESPAÇO CONTINUA SEGURO" title="Não conseguimos carregar esta parte agora.">
      <button type="button" onClick={reset}>Tentar novamente</button>
    </StatePage>
  );
}
```

```tsx
// src/app/not-found.tsx
import Link from "next/link";
import { StatePage } from "@/components/state-page";

export default function NotFound() {
  return (
    <StatePage eyebrow="ESSA PÁGINA SAIU PARA TOMAR UM CAFÉ" title="Não encontramos o que você procurou.">
      <Link href="/">Voltar para Hoje</Link>
    </StatePage>
  );
}
```

- [ ] **Step 4: Validate the asset and production build**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`

Expected: all tests PASS and production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add public/illustrations src/app src/features/today
git commit -m "feat: add owned illustration and route states"
```

### Task 6: Visual, accessibility and completion gate

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/garden-icon.tsx`
- Modify: `src/features/today/today-dashboard.tsx`
- Modify: `src/features/today/today-dashboard.module.css`
- Update: `DESIGN.md` with settled tokens and component behavior.

**Interfaces:**
- Consumes: complete Phase 1 surface.
- Produces: verified Phase 1 and exact design-system record.

- [ ] **Step 1: Run the app and inspect both target widths**

Run: `npm run dev`

Inspect:

- desktop at 1440 × 1000;
- mobile at 390 × 844;
- keyboard navigation from browser chrome through every interactive element;
- 200% zoom at 1280px viewport.

Expected: no horizontal overflow, hidden content, unreachable control or low-contrast
text.

- [ ] **Step 2: Apply the frontend quality skills**

Use `fixing-accessibility` for WCAG issues, `vercel-react-best-practices` for
React/Next.js findings and Impeccable `adapt`, `harden` and `polish` against
`PRODUCT.md` and `DESIGN.md`. Fix all material findings.

- [ ] **Step 3: Run the Impeccable detector once**

Run:

```bash
node C:/Users/luant/.codex/plugins/cache/impeccable/impeccable/4.0.2/skills/impeccable/scripts/detect.mjs --json src/app src/components src/features/today
```

Expected: JSON report reviewed; every applicable error is fixed.

- [ ] **Step 4: Request the independent Impeccable finish review**

Provide the reviewer:

- original visual-quality request;
- `PRODUCT.md`;
- `DESIGN.md`;
- `src/app`, `src/components`, `src/features/today`;
- detector findings;
- desktop and mobile screenshots.

Apply the reviewer’s material fixes.

- [ ] **Step 5: Re-run the complete verification**

Run: `npm run test && npm run typecheck && npm run lint && npm run build`

Expected: all commands exit 0.

- [ ] **Step 6: Update the design record and commit**

Record only implemented tokens and behaviors in `DESIGN.md`, then:

```bash
git add DESIGN.md src public package.json package-lock.json
git commit -m "feat: finish foundation and Today shell"
```
