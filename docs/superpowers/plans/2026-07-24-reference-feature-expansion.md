# Reference Feature Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformar o superapp atual em um planner pessoal completo que conecte planejamento, finanças, bem-estar, hábitos, reflexões e projetos, com uma experiência especialmente bem resolvida no Galaxy Tab S9 FE.

**Architecture:** Manter o monólito modular Next.js + Supabase, com domínios independentes e a tela Hoje como composição server-side. Regras, cálculos, recorrências e correlações permanecem determinísticos; a IA recebe contexto mínimo, explica os dados e propõe rascunhos que sempre exigem confirmação. Cada fase abaixo deve virar uma mudança vertical independente, com migração, Row Level Security, modelo, repositório, ações, interface e testes próprios.

**Tech Stack:** Next.js 16, React 19, TypeScript 6, Supabase Auth/PostgreSQL/RLS, Vitest, Testing Library, CSS Modules, OpenAI opcional com chave do usuário, Google Calendar API opcional e APIs web nativas para PWA, notificações e Pointer Events.

## Global Constraints

- O núcleo deve continuar gratuito; IA usa chave própria do usuário e integrações pagas não podem ser requisito.
- Nenhuma ação proposta pela IA grava dados antes de uma confirmação explícita.
- Dinheiro é armazenado em centavos inteiros; datas e horas preservam o fuso escolhido pelo usuário.
- Todo dado pessoal possui `user_id`, timestamps, RLS e uma política de exportação/exclusão.
- A experiência não pode depender de hover, cor isolada, ícones genéricos ou cartões uniformes.
- O Galaxy Tab S9 FE é plataforma principal de aceite, em retrato, paisagem, multijanela e modo DeX no próprio tablet.
- Cada fase passa por teste, typecheck, lint, build, acessibilidade e inspeção visual nos viewports definidos antes da seguinte.

---

## 1. Auditoria das 18 referências

| Print | Recurso observado | Comportamento extraído | Upgrade proposto |
| --- | --- | --- | --- |
| 1 | Agenda mensal | Calendário, seleção de dia, compromissos por período e roteiro de viagem | Visões dia/semana/mês/lista, detecção de sobrecarga, intervalo de viagem, checklist e integração com tarefas |
| 2 | Flor do sentir | Distribuição mensal de emoções por pétalas e percentuais | Intensidade, energia, contexto, amostra explícita, resumo acessível e comparação com períodos anteriores |
| 3 | Balanço emocional | Calendário colorido por emoção e emoção predominante do mês | Filtros, legenda textual, padrões semanais e alertas de linguagem não clínica |
| 4 | Planejamento diário | Abas mensais, faixa semanal, tarefas por horário e prioridades | Time blocking, duração, conflitos, arrastar com teclado/toque e sugestão de encaixe pela IA |
| 5 | Linha do tempo de tarefas | Horário, título, notas, categoria e marcador da hora atual | Subtarefas, conclusão, adiamento consciente, origem e vínculo com projeto/evento |
| 6 | Registro de hobbies | Registro do que foi praticado, trouxe alegria e merece exploração | Biblioteca de hobbies, sessões, frequência, fotos opcionais e relação com humor somente mediante consentimento |
| 7 | Diário de leituras | Livro, autor, importância, datas, estrelas e comentários | Status, progresso, meta anual, trechos/notas, histórico e busca |
| 8 | Fechamento noturno | Revisar o concluído, reorganizar pendências e avaliar hábitos | Ritual guiado de encerramento, fila de reagendamento e resumo do dia |
| 9 | Planejamento diário | Tarefas, compromissos, prioridades e concluídos | Uma visão Hoje operacional alimentada por dados reais de todos os módulos |
| 10 | Resumo financeiro | Entradas, saídas, resultado e cálculo automático | Contas, transações, transferências, recorrências, orçamento, projeção e explicação auditável |
| 11 | Revisão semanal | Checklist por área da vida, hábitos, propósito e ajustes | Revisão guiada com fatos, reflexão, plano da próxima semana e síntese opcional por IA |
| 12 | Registro de emoções | Check-in diário e visualização mensal | Check-in de poucos toques, texto alternativo, lembrete configurável e privacidade granular |
| 13 | Controle de hábitos | Criação, check-in, consistência e progresso mensal | Metas por frequência, pausa sem quebrar histórico, sequência, taxa de adesão e ajuste sugerido |
| 14 | Apoio em dias difíceis | Escrita terapêutica e reconexão com sonhos | Modo Dia Leve, redução voluntária de carga, escrita privada e acesso rápido ao que dá sentido |
| 15 | Jornada e melhores momentos | Revisitar meses, registros e lembranças positivas | Linha do tempo pesquisável, retrospectiva mensal e exportação pessoal |
| 16 | Autoconhecimento e sonhos | Roda da Vida, Plano de Vida, reflexões, Top 3 e moodboard | Avaliações versionadas, metas vinculadas, marcos, evidências e revisão trimestral |
| 17 | Organização profissional | Planejamento semanal, calendário mensal, ideias e projetos | Áreas pessoal/profissional, projetos, deadlines, reuniões e caixa de entrada de ideias |
| 18 | Acompanhamento da semana | Checklist, hábitos e propósito semanal | Check-in de meio de semana, previsão de carga e ajuste de foco sem culpa |

## 2. Modelo de experiência

O produto deve ser organizado em cinco ciclos que compartilham os mesmos dados:

1. **Capturar:** texto natural, formulário rápido ou importação.
2. **Planejar:** mês, semana e dia com prioridades, tempo disponível e orçamento.
3. **Executar:** linha do tempo, foco atual, hábitos e alertas úteis.
4. **Refletir:** humor, diário, hobbies, leituras, melhores momentos e encerramento.
5. **Revisar:** semana, mês, metas, finanças e áreas da vida.

A tela Hoje não mantém cópias próprias. Ela consulta tarefas, eventos, contas,
hábitos e rituais, ordena por relevância e mostra ações curtas.

## 3. Arquitetura de informação

### Navegação global

- Hoje
- Planejar
  - Agenda
  - Tarefas
  - Projetos
- Finanças
- Bem-estar
  - Humor
  - Hábitos
  - Diário
- Vida
  - Metas e sonhos
  - Leituras
  - Hobbies
  - Memórias
- Revisões
- Assistente
- Configurações e integrações

No celular, a barra inferior mantém Hoje, Agenda, Tarefas, Finanças e Mais. No
tablet, uma rail compacta evita esconder módulos importantes. No notebook, a
sidebar completa permanece visível.

### Rotas previstas

```text
/
/planejar
/agenda
/tarefas
/projetos
/financas
/bem-estar
/bem-estar/humor
/bem-estar/habitos
/diario
/vida
/vida/metas
/vida/leituras
/vida/hobbies
/vida/memorias
/revisoes
/assistente
/configuracoes
/configuracoes/integracoes
```

## 4. Contratos compartilhados

### Itens da linha do tempo

**Files:**

- Modify: `src/features/today/today-model.ts`
- Create: `src/features/today/today-repository.ts`
- Test: `src/features/today/today-repository.test.ts`

```ts
export type TodayItem =
  | { kind: "event"; id: string; startsAt: string; endsAt: string; title: string }
  | { kind: "task"; id: string; scheduledAt: string; durationMinutes: number; title: string }
  | { kind: "bill"; id: string; dueAt: string; amountCents: number; title: string }
  | { kind: "habit"; id: string; scheduledPeriod: "morning" | "afternoon" | "evening"; title: string };
```

### Rascunhos de ação

**Files:**

- Create: `src/features/assistant/action-draft-model.ts`
- Create: `src/features/assistant/action-draft-repository.ts`
- Create: `src/features/assistant/action-draft-actions.ts`
- Test: `src/features/assistant/action-draft-model.test.ts`

```ts
export type ActionDraft =
  | { type: "create_task"; payload: TaskDraft }
  | { type: "create_event"; payload: EventDraft }
  | { type: "create_transaction"; payload: TransactionDraft }
  | { type: "log_mood"; payload: MoodDraft }
  | { type: "log_habit"; payload: HabitLogDraft }
  | { type: "create_note"; payload: JournalDraft };
```

Every draft carries `status: "proposed" | "confirmed" | "rejected" | "expired"`,
the original text, a redacted model response and an expiration timestamp.

## 5. Tablet-first interaction contract

Samsung lists the Tab S9 FE with a 10.9-inch, 2304 × 1440 display and S Pen.
The application must respond to CSS viewport and input capabilities instead of
physical pixels.

### Layout modes

```css
/* mobile */
@media (max-width: 599px) { /* bottom navigation, one column */ }

/* tablet portrait and compact multi-window */
@media (min-width: 600px) and (max-width: 1023px) {
  /* 4.75rem navigation rail, two-column workspaces when useful */
}

/* tablet landscape, DeX and notebook */
@media (min-width: 1024px) {
  /* full sidebar and master-detail workspaces */
}
```

### Acceptance viewports

- `360 × 800`: Android phone.
- `800 × 1280`: Tab S9 FE portrait proxy.
- `1280 × 800`: Tab S9 FE landscape proxy.
- `720 × 800`: tablet split-screen/compact window.
- `1440 × 900`: notebook or DeX-like desktop window.

### Interaction rules

- Minimum touch target: 48 × 48 CSS px for primary controls.
- No essential behavior on hover; context actions also open by touch and keyboard.
- Planner uses master-detail on tablet landscape: calendar/list on the left,
  selected day/item on the right.
- Forms open as centered dialogs on desktop/tablet landscape and as bottom
  sheets or full-screen flows on mobile/tablet portrait.
- S Pen behaves as a precise pointer immediately. Freehand ink is a later,
  optional layer built with Pointer Events and always has a text alternative.
- Landscape preserves the day context while editing; mobile can navigate to a
  dedicated edit page.
- Respect font scaling, safe areas, reduced motion, forced colors and keyboard
  navigation.

## 6. Phase 0 — Responsive shell and installable app

### Task 0.1: Introduce three navigation modes

**Files:**

- Modify: `src/components/app-sidebar.tsx`
- Modify: `src/features/today/today-dashboard.module.css`
- Modify: `src/features/finance/finance-dashboard.module.css`
- Create: `src/components/app-navigation.test.tsx`

- [ ] Replace the current desktop/mobile binary breakpoint with mobile, tablet
  rail and desktop sidebar modes.
- [ ] Keep labels available in the tablet rail through visible short labels,
  not tooltip-only navigation.
- [ ] Add active state, focus state and safe-area handling in every mode.
- [ ] Verify that the assistant remains reachable without covering page actions.

### Task 0.2: Add PWA shell without caching private API responses

**Files:**

- Create: `src/app/manifest.ts`
- Create: `public/sw.js`
- Create: `src/components/service-worker-registration.tsx`
- Modify: `src/app/layout.tsx`
- Test: `src/app/manifest.test.ts`

- [ ] Add install metadata, theme colors and purpose-built icons.
- [ ] Cache only immutable assets and the offline shell.
- [ ] Preserve unsent form drafts locally; do not cache authenticated responses.
- [ ] Show connection state and retry instead of pretending a save succeeded.

### Task 0.3: Add browser-device visual gate

**Files:**

- Modify: `scripts/browser-identity-gate.mjs`
- Create: `scripts/browser-responsive-gate.mjs`
- Modify: `package.json`

- [ ] Capture all five acceptance viewports.
- [ ] Fail on horizontal overflow, covered actions and inaccessible dialogs.
- [ ] Exercise touch-equivalent clicks and keyboard-only navigation.

## 7. Phase 1 — Complete the financial ledger already in progress

The existing `expenses` table is a useful prototype but cannot represent
income, accounts or transfers. It must be superseded without discarding data.

### Task 1.1: Create the complete ledger

**Files:**

- Create: `supabase/migrations/202607250001_financial_ledger.sql`
- Create: `supabase/tests/financial_ledger.test.sql`
- Regenerate: `src/lib/supabase/database.types.ts`

```sql
create table public.financial_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  account_type text not null check (account_type in ('checking','cash','savings','credit')),
  opening_balance_cents bigint not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  account_id uuid not null references public.financial_accounts(id),
  transaction_type text not null check (
    transaction_type in ('income','expense','transfer','adjustment')
  ),
  amount_cents bigint not null check (amount_cents > 0),
  occurred_on date not null,
  due_on date,
  status text not null check (status in ('planned','cleared','ignored')),
  description text not null,
  category_id uuid,
  transfer_account_id uuid references public.financial_accounts(id),
  import_fingerprint text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
```

- [ ] Add categories, recurring entries, import batches, budgets and financial goals.
- [ ] Apply RLS to every table and test cross-user isolation.
- [ ] Backfill legacy expenses into a default account and keep the old table
  read-only until totals reconcile.

### Task 1.2: Replace expense-only calculations

**Files:**

- Modify: `src/features/finance/finance-model.ts`
- Modify: `src/features/finance/finance-repository.ts`
- Modify: `src/features/finance/finance-actions.ts`
- Test: `src/features/finance/finance-model.test.ts`
- Test: `src/features/finance/finance-repository.test.ts`

```ts
export type MonthlyFinanceSummary = {
  incomeCents: number;
  expenseCents: number;
  resultCents: number;
  projectedEndBalanceCents: number;
  freePerDayCents: number | null;
  confidence: "complete" | "partial";
  missingInputs: string[];
};
```

- [ ] Ensure transfers never count as income or expense.
- [ ] Add recurring forecast and budget remainder.
- [ ] Explain incomplete projections instead of inventing precision.
- [ ] Update CSV/OFX to import credits and debits with review and duplicate detection.

### Task 1.3: Implement monthly financial workspace

**Files:**

- Modify: `src/features/finance/finance-dashboard.tsx`
- Modify: `src/features/finance/finance-dashboard.module.css`
- Create: `src/features/finance/transaction-form.tsx`
- Create: `src/features/finance/account-list.tsx`
- Test: `src/features/finance/finance-dashboard.test.tsx`

- [ ] Match the reference's immediate income/outflow/result comprehension.
- [ ] Add account selector, transaction table, recurring bills, budget and forecast.
- [ ] Use bars plus textual values; never encode positive/negative only by color.
- [ ] Provide tablet split view between summary and ledger.

## 8. Phase 2 — Planning core: tasks, projects and local agenda

### Task 2.1: Create planning schema

**Files:**

- Create: `supabase/migrations/202607260001_planning_core.sql`
- Create: `supabase/tests/planning_core.test.sql`
- Regenerate: `src/lib/supabase/database.types.ts`

Tables:

- `projects`
- `tasks`
- `task_links`
- `events`
- `event_links`
- `planning_areas`

Critical task fields are title, notes, status, priority, due time, scheduled
start/end, estimated minutes, project, parent task, recurrence rule, carried
from task and completion time. Critical event fields are local/external source,
title, location, start/end, all-day state, timezone, recurrence and optional
trip range metadata.

- [ ] Store recurrence as an iCalendar-compatible RRULE string.
- [ ] Generate occurrences in a bounded date window; do not materialize infinite series.
- [ ] Enforce that end is after start and subtasks belong to the same user.
- [ ] Add indexes for Today, Upcoming, project and calendar queries.

### Task 2.2: Build task domain

**Files:**

- Create: `src/features/tasks/task-model.ts`
- Create: `src/features/tasks/task-repository.ts`
- Create: `src/features/tasks/task-actions.ts`
- Create: `src/features/tasks/task-form.tsx`
- Create: `src/features/tasks/task-dashboard.tsx`
- Create: `src/app/tarefas/page.tsx`
- Test: `src/features/tasks/task-model.test.ts`
- Test: `src/features/tasks/task-repository.test.ts`
- Test: `src/features/tasks/task-dashboard.test.tsx`

- [ ] Implement Inbox, Hoje, Próximas and Concluídas.
- [ ] Implement priority, notes, duration, recurrence, subtasks and project link.
- [ ] Implement list, timeline and kanban without storing duplicate task copies.
- [ ] Add complete, undo, postpone and "move to tomorrow" with audit.

### Task 2.3: Build agenda domain

**Files:**

- Create: `src/features/calendar/calendar-model.ts`
- Create: `src/features/calendar/calendar-repository.ts`
- Create: `src/features/calendar/calendar-actions.ts`
- Create: `src/features/calendar/calendar-workspace.tsx`
- Create: `src/features/calendar/month-view.tsx`
- Create: `src/features/calendar/week-view.tsx`
- Create: `src/features/calendar/day-view.tsx`
- Create: `src/app/agenda/page.tsx`
- Test: `src/features/calendar/calendar-model.test.ts`
- Test: `src/features/calendar/calendar-workspace.test.tsx`

- [ ] Implement day/week/month/list views over the same occurrence query.
- [ ] Show event, task block, bill and trip range with distinct shapes and labels.
- [ ] Add a day detail panel on tablet/desktop.
- [ ] Detect overlap and workload without preventing a deliberate save.
- [ ] Add itinerary items to trips without turning every event into a project.

### Task 2.4: Compose Today from real planning data

**Files:**

- Create: `src/features/today/today-repository.ts`
- Modify: `src/features/today/today-dashboard.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/features/today/today-repository.test.ts`
- Test: `src/features/today/today-dashboard.test.tsx`

- [ ] Remove `TODAY_DEMO` from runtime paths.
- [ ] Merge events, task blocks, due bills and habits in chronological order.
- [ ] Keep unscheduled priorities in a separate section.
- [ ] Show source and last sync for external events.

## 9. Phase 3 — Mood, habits and daily rituals

### Task 3.1: Create wellbeing schema

**Files:**

- Create: `supabase/migrations/202607270001_wellbeing_core.sql`
- Create: `supabase/tests/wellbeing_core.test.sql`
- Regenerate: `src/lib/supabase/database.types.ts`

Tables:

- `mood_entries`
- `habits`
- `habit_logs`
- `reflection_entries`

`mood_entries` stores date, primary emotion, optional secondary emotions,
intensity, energy, context tags and a private note. `reflection_entries` stores
cadence (`morning`, `evening`, `weekly`, `monthly_start`, `monthly_close`) and
versioned structured answers.

- [ ] Enforce at most one primary check-in per user/day while allowing updates.
- [ ] Store emotion label in addition to color.
- [ ] Allow habits to be paused without deleting their history.
- [ ] Distinguish missed, skipped intentionally and not scheduled.

### Task 3.2: Implement emotion check-in and Flower of Feeling

**Files:**

- Create: `src/features/wellbeing/mood-model.ts`
- Create: `src/features/wellbeing/mood-repository.ts`
- Create: `src/features/wellbeing/mood-checkin.tsx`
- Create: `src/features/wellbeing/emotion-flower.tsx`
- Create: `src/features/wellbeing/mood-calendar.tsx`
- Create: `src/app/bem-estar/humor/page.tsx`
- Test: `src/features/wellbeing/mood-model.test.ts`
- Test: `src/features/wellbeing/emotion-flower.test.tsx`

- [ ] Make daily capture possible in under three taps.
- [ ] Build percentages from deterministic counts.
- [ ] Render an SVG flower with an adjacent textual summary and sample size.
- [ ] Require a minimum sample before showing trends or correlations.
- [ ] Phrase insights as observations, never diagnoses or causal claims.

### Task 3.3: Implement habits

**Files:**

- Create: `src/features/wellbeing/habit-model.ts`
- Create: `src/features/wellbeing/habit-repository.ts`
- Create: `src/features/wellbeing/habit-dashboard.tsx`
- Create: `src/app/bem-estar/habitos/page.tsx`
- Test: `src/features/wellbeing/habit-model.test.ts`
- Test: `src/features/wellbeing/habit-dashboard.test.tsx`

- [ ] Support daily, selected weekdays and weekly target schedules.
- [ ] Show day strip, monthly heatmap, adherence and current streak.
- [ ] Avoid punitive language when a sequence breaks.
- [ ] Let the user reduce frequency from the weekly review.

### Task 3.4: Implement morning and evening rituals

**Files:**

- Create: `src/features/reviews/daily-ritual-model.ts`
- Create: `src/features/reviews/morning-planning.tsx`
- Create: `src/features/reviews/evening-shutdown.tsx`
- Create: `src/app/revisoes/hoje/page.tsx`
- Test: `src/features/reviews/daily-ritual-model.test.ts`
- Test: `src/features/reviews/evening-shutdown.test.tsx`

- [ ] Morning: mood/energy, top three, calendar load and financial attention.
- [ ] Evening: completed items, pending queue, habit review and one reflection.
- [ ] Require confirmation before bulk rescheduling.
- [ ] Add a "Dia Leve" path that lets the user consciously reduce commitments.

## 10. Phase 4 — Weekly and monthly review engine

### Task 4.1: Add deterministic review snapshots

**Files:**

- Create: `src/features/reviews/review-model.ts`
- Create: `src/features/reviews/review-repository.ts`
- Create: `src/features/reviews/review-actions.ts`
- Test: `src/features/reviews/review-model.test.ts`
- Test: `src/features/reviews/review-repository.test.ts`

```ts
export type WeeklyReviewFacts = {
  tasks: { planned: number; completed: number; carried: number };
  calendar: { committedMinutes: number; conflicts: number };
  finance: { incomeCents: number; expenseCents: number; budgetVarianceCents: number | null };
  habits: Array<{ id: string; adherencePercent: number; sample: number }>;
  mood: Array<{ emotion: string; count: number }>;
  goals: Array<{ id: string; progressDelta: number }>;
};
```

- [ ] Keep the snapshot factual and reproducible.
- [ ] Store user reflections separately from computed facts.
- [ ] Make review regeneration idempotent.

### Task 4.2: Build weekly and monthly review workspaces

**Files:**

- Create: `src/features/reviews/weekly-review.tsx`
- Create: `src/features/reviews/monthly-review.tsx`
- Create: `src/app/revisoes/page.tsx`
- Test: `src/features/reviews/weekly-review.test.tsx`

- [ ] Review life areas, habits, weekly purpose, finances and workload.
- [ ] Ask what worked, what drained energy and what to change.
- [ ] Convert chosen adjustments into confirmed task/habit/budget drafts.
- [ ] Show a midweek checkpoint without creating a second planning system.

## 11. Phase 5 — Journal, readings, hobbies and memories

### Task 5.1: Create life-log schema

**Files:**

- Create: `supabase/migrations/202607280001_life_log.sql`
- Create: `supabase/tests/life_log.test.sql`
- Regenerate: `src/lib/supabase/database.types.ts`

Tables:

- `journal_entries` with kinds `free`, `therapeutic`, `memory`, `best_moment`
- `reading_items`
- `reading_notes`
- `hobbies`
- `hobby_logs`

- [ ] Keep therapeutic entries excluded from AI by default.
- [ ] Support private tags and full-text search scoped by user.
- [ ] Validate rating between 1 and 5 and reading progress between 0 and 100.

### Task 5.2: Implement the journal and memory timeline

**Files:**

- Create: `src/features/journal/journal-model.ts`
- Create: `src/features/journal/journal-editor.tsx`
- Create: `src/features/journal/memory-timeline.tsx`
- Create: `src/app/diario/page.tsx`
- Create: `src/app/vida/memorias/page.tsx`
- Test: `src/features/journal/journal-model.test.ts`
- Test: `src/features/journal/journal-editor.test.tsx`

- [ ] Provide prompts without forcing them.
- [ ] Add a distraction-free "difficult day" writing mode.
- [ ] Allow revisiting by month, tag and best moments.
- [ ] Clearly show whether an entry may be included in AI context.

### Task 5.3: Implement reading and hobby libraries

**Files:**

- Create: `src/features/life/reading-model.ts`
- Create: `src/features/life/reading-dashboard.tsx`
- Create: `src/features/life/hobby-model.ts`
- Create: `src/features/life/hobby-dashboard.tsx`
- Create: `src/app/vida/leituras/page.tsx`
- Create: `src/app/vida/hobbies/page.tsx`
- Test: `src/features/life/reading-model.test.ts`
- Test: `src/features/life/hobby-model.test.ts`

- [ ] Reading: title, author, importance, status, dates, rating and notes.
- [ ] Hobbies: practice log, joy note, frequency and ideas to explore.
- [ ] Offer optional links to goals and calendar, not mandatory coupling.

## 12. Phase 6 — Life areas, goals and dream board

### Task 6.1: Create goals schema

**Files:**

- Create: `supabase/migrations/202607290001_goals_and_life_areas.sql`
- Create: `supabase/tests/goals_and_life_areas.test.sql`
- Regenerate: `src/lib/supabase/database.types.ts`

Tables:

- `life_areas`
- `life_area_assessments`
- `goals`
- `goal_milestones`
- `goal_links`
- `dream_board_items`
- `important_dates`

- [ ] Keep Roda da Vida assessments immutable by date for historical comparison.
- [ ] Support personal and financial goal progress.
- [ ] Link goals to tasks, habits and transactions through explicit link rows.

### Task 6.2: Implement Life workspace

**Files:**

- Create: `src/features/goals/life-wheel.tsx`
- Create: `src/features/goals/goal-dashboard.tsx`
- Create: `src/features/goals/dream-board.tsx`
- Create: `src/app/vida/metas/page.tsx`
- Test: `src/features/goals/life-wheel.test.tsx`
- Test: `src/features/goals/goal-dashboard.test.tsx`

- [ ] Render Roda da Vida with sliders plus a textual table.
- [ ] Support Top 3 dreams and milestones.
- [ ] Implement moodboard with image, color, note and goal links.
- [ ] Reconnect the "Dia Leve" experience to user-selected motivations.

## 13. Phase 7 — Google Calendar and free automations

### Task 7.1: Add calendar connection schema

**Files:**

- Create: `supabase/migrations/202607300001_calendar_connections.sql`
- Create: `supabase/tests/calendar_connections.test.sql`
- Create: `src/features/integrations/google-calendar-model.ts`
- Test: `src/features/integrations/google-calendar-model.test.ts`

- [ ] Encrypt refresh tokens server-side.
- [ ] Store calendar ID, sync token, last success and error state.
- [ ] Treat Google as source of truth for Google-owned events.

### Task 7.2: Implement OAuth, incremental sync and reconciliation

**Files:**

- Create: `src/app/api/integrations/google/start/route.ts`
- Create: `src/app/api/integrations/google/callback/route.ts`
- Create: `src/app/api/integrations/google/webhook/route.ts`
- Create: `src/features/integrations/google-calendar-client.ts`
- Create: `src/features/integrations/google-calendar-sync.ts`
- Create: `src/app/configuracoes/integracoes/page.tsx`
- Test: `src/features/integrations/google-calendar-sync.test.ts`

- [ ] Request only required Calendar scopes.
- [ ] Run initial sync followed by incremental sync tokens.
- [ ] Reconcile missed webhooks on page open and scheduled runs.
- [ ] Show source, status and last sync in the interface.

### Task 7.3: Implement no-subscription reminders

**Files:**

- Create: `supabase/migrations/202607300002_notifications.sql`
- Create: `src/features/notifications/notification-model.ts`
- Create: `src/features/notifications/notification-center.tsx`
- Create: `public/notification-sw.js`
- Test: `src/features/notifications/notification-model.test.ts`

- [ ] Start with in-app reminders and browser notifications.
- [ ] Keep email as an optional provider integration, not a core dependency.
- [ ] Deduplicate notices and support snooze, dismiss and quiet hours.

## 14. Phase 8 — Universal AI and proactive assistance

### Task 8.1: Parse universal capture into closed action schemas

**Files:**

- Modify: `src/features/today/quick-capture.tsx`
- Create: `src/features/assistant/capture-classifier.ts`
- Create: `src/features/assistant/action-preview.tsx`
- Create: `supabase/migrations/202607310001_ai_action_drafts.sql`
- Create: `supabase/tests/ai_action_drafts.test.sql`
- Test: `src/features/assistant/capture-classifier.test.ts`
- Test: `src/features/assistant/action-preview.test.tsx`

Examples:

```text
"paguei 45 no almoço" -> create_transaction
"dentista sexta às 15h" -> create_event
"preparar apresentação amanhã, 40 min" -> create_task
"estou ansioso e sem energia" -> log_mood
```

- [ ] Validate dates, amount, type and ownership server-side.
- [ ] Show unknown or ambiguous fields in the preview.
- [ ] Offer manual forms when AI is disabled or unavailable.
- [ ] Log confirmation, rejection and execution result.

### Task 8.2: Add Daily Brief and Evening Shutdown assistance

**Files:**

- Create: `src/features/assistant/daily-brief.ts`
- Create: `src/features/assistant/review-narrative.ts`
- Modify: `src/features/today/today-dashboard.tsx`
- Test: `src/features/assistant/daily-brief.test.ts`
- Test: `src/features/assistant/review-narrative.test.ts`

- [ ] Compute the factual brief locally before asking the model for wording.
- [ ] Highlight calendar conflicts, due bills and unrealistic load.
- [ ] Limit suggestions to three prioritized, reversible actions.
- [ ] Mark facts, estimates and model interpretations separately.

### Task 8.3: Add privacy-safe cross-domain insights

**Files:**

- Create: `src/features/insights/correlation-model.ts`
- Create: `src/features/insights/insight-consent.tsx`
- Test: `src/features/insights/correlation-model.test.ts`

- [ ] Require explicit per-domain consent before combining mood with finances,
  journal or productivity.
- [ ] Require minimum sample sizes and expose them.
- [ ] Use neutral language: association is not causation.
- [ ] Let the user disable, delete and regenerate insight data.

## 15. Phase 9 — Optional S Pen and printable creativity

This phase is deliberately optional because it adds delight but is not required
for the planning loop.

### Task 9.1: Add freehand notes with accessible fallback

**Files:**

- Create: `src/features/journal/ink-canvas.tsx`
- Create: `src/features/journal/ink-model.ts`
- Test: `src/features/journal/ink-model.test.ts`

- [ ] Use Pointer Events for pen, touch and mouse.
- [ ] Capture pressure only when available.
- [ ] Always require an editable title/description for search and accessibility.
- [ ] Store vector strokes, not screenshots, and cap payload size.

### Task 9.2: Add printable reflection and art-therapy sheets

**Files:**

- Create: `src/app/imprimir/page.tsx`
- Create: `src/features/print/print-templates.tsx`
- Create: `src/features/print/print.css`
- Test: `src/features/print/print-templates.test.tsx`

- [ ] Build original templates; do not copy the reference artwork.
- [ ] Support A4 and US Letter print styles.
- [ ] Keep therapeutic wording non-clinical and optional.

## 16. Automation catalog

| Automation | Trigger | Deterministic work | AI work | Confirmation |
| --- | --- | --- | --- | --- |
| Morning brief | First open or chosen time | Query day, bills and habits | Concise narrative | Not needed to read |
| Conflict alert | Event/task save | Detect overlap | Explain trade-off | Needed to reschedule |
| Evening shutdown | Chosen time | Build completed/pending list | Suggest carry-over | Needed for bulk moves |
| Midweek checkpoint | Wednesday or halfway through week | Compare plan vs. actual | Suggest scope reduction | Needed for edits |
| Weekly review | End of week | Aggregate facts | Summarize and suggest three actions | Needed to create actions |
| Budget guardrail | Transaction/import | Recalculate budget | Explain impact | Not needed to warn |
| Recurrence prediction | Repeated manual pattern | Detect repeated interval | Suggest recurring rule | Needed to create rule |
| Mood/habit trend | Minimum sample reached | Compute association | Explain carefully | Consent required |
| Trip preparation | Trip event range | Calculate dates/checklist | Draft itinerary/tasks | Needed to create items |

## 17. Quality and safety gates

### Functional

- [ ] Every write path validates server-side and records audit where sensitive.
- [ ] Every list has empty, loading, error and permission states.
- [ ] Recurrence, money, timezone and correlation logic have unit tests.
- [ ] RLS tests prove that a second user cannot read or mutate records.

### Visual and responsive

- [ ] Run Impeccable context, craft floor, detector and final independent review.
- [ ] Inspect all acceptance viewports with realistic long Portuguese content.
- [ ] Test tablet portrait, landscape, split-screen and keyboard/mouse mode.
- [ ] No module looks like a repeated grid of generic SaaS cards.

### Accessibility

- [ ] Full keyboard flow and visible focus.
- [ ] 48px touch targets for frequent actions.
- [ ] Graphs have summaries and tables.
- [ ] Mood, finance and status never depend on color alone.
- [ ] Screen-reader announcements for save, undo, synchronization and errors.

### Performance and privacy

- [ ] Route-level code splitting for charts, calendar and ink canvas.
- [ ] Avoid loading the AI client on pages that do not use it.
- [ ] Encrypt external tokens and API keys at rest.
- [ ] Do not cache authenticated responses in the service worker.
- [ ] Add export and account deletion before calling the product complete.

## 18. Recommended release slices

1. **Release A — Complete money:** accounts, income, outflow, transfers,
   recurrence, budget and projection.
2. **Release B — Plan the day:** tablet shell, tasks, projects, local agenda and
   real Today composition.
3. **Release C — Care loop:** mood, habits, morning planning and evening shutdown.
4. **Release D — Learn and adjust:** weekly/monthly reviews and optional AI summaries.
5. **Release E — Personal library:** journal, memories, readings and hobbies.
6. **Release F — Direction:** Life Wheel, goals, dreams and moodboard.
7. **Release G — Connected planner:** Google Calendar, reminders and universal capture.
8. **Release H — Polish:** PWA hardening, accessibility, performance, export and
   optional S Pen/print tools.

Release A should be completed before starting parallel product expansion because
the current finance model is expense-only and would otherwise leak an incomplete
contract into Today, Reviews and the assistant.
