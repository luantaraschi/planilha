# Superapp Implementation Roadmap

> **For agentic workers:** Each phase gets its own reviewed implementation plan. Do not merge phases into one change.

**Goal:** Deliver the approved personal organization superapp as independent, testable vertical slices.

## Cost and integration rule

- The core app must remain free to run with local and open-source dependencies.
- AI is optional and uses a user-owned provider key; the app adds no subscription
  or markup to API usage.
- The settings screen owns provider, model, instructions and encrypted key
  management. When AI is disabled or unavailable, useful local analysis remains.
- Open Finance is deferred. Bank data enters through manual records and CSV/OFX
  import until a later, separately approved integration.

## Phase order

1. **Foundation and Today shell**  
   Bootable Next.js app, Jardim de Pêssego visual system, original icon subset,
   responsive navigation, art-directed illustration and a realistic read-only
   Today screen.

2. **Identity and data core**  
   Supabase Auth, user profile, PostgreSQL migrations, Row Level Security,
   repository boundaries, audit log and protected app routes.

3. **Finance**  
   Accounts, transactions, categories, transfers, recurring entries, budgets,
   deterministic projections, CSV/OFX preview, duplicate detection and local
   financial analysis.

4. **Tasks and projects**  
   Inbox, Today, Upcoming, projects, recurrence, subtasks, duration and kanban.

5. **Agenda and Google Calendar**  
   Local events, OAuth, incremental Google synchronization, reconciliation,
   event/task links and calendar views.

6. **Habits, mood, goals and notes**  
   Check-ins, streaks, mood and energy logs, linked goals and searchable notes.

7. **Assistant and universal capture**  
   User-owned OpenAI key and model settings, encrypted server-side credential
   storage, structured action drafts, confirmation flow, chat with local
   fallback, daily summary and weekly review.

8. **Alerts and delivery**  
   Supabase Cron, in-app notifications, Resend email delivery, retries and
   alert preferences.

9. **Production hardening**  
   Export/delete account, privacy consent, full responsive/a11y audit,
   performance pass, Impeccable finish review and deployment preparation.

## Dependency rule

Each phase consumes only documented interfaces from completed phases. A phase
must pass tests, type-check, lint and production build before the next phase
starts.

## Current detailed plan

`docs/superpowers/plans/2026-07-23-identity-data-core.md`
