# Identity and Data Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a locally runnable Supabase identity core with secure per-user data, email/password authentication, profile onboarding, preferences and an append-only audit trail.

**Architecture:** Next.js keeps session handling in server code through `@supabase/ssr`; a root Proxy refreshes tokens but route components make authorization decisions with verified claims. PostgreSQL owns defaults, validation, user bootstrap, RLS and the transactional onboarding operation. The UI talks to the database only through the identity repository.

**Tech Stack:** Next.js 16.2.11, React 19.2.8, TypeScript 6.0.3, Supabase CLI 2.109.1, `@supabase/supabase-js` 2.110.8, `@supabase/ssr` 0.12.3, PostgreSQL, pgTAP, Vitest and Testing Library.

## Global Constraints

- Application language is Brazilian Portuguese, currency is BRL and default time zone is `America/Bahia`.
- Every personal-data table has a `user_id`, timestamps and Row Level Security.
- RLS policies target the `authenticated` role and compare ownership with `(select auth.uid())`.
- `anon` receives no table access; the service-role key is never exposed to the browser.
- `audit_events` is append-only to authenticated users: owner insert/select only, no update/delete policies.
- Authentication trusts `getClaims()` or `getUser()`, never the cookie-backed `getSession()` user object.
- Database writes stay behind `src/features/identity/identity-repository.ts`.
- Existing Jardim de Pêssego tokens, custom icons, WCAG AA focus behavior and reduced-motion support remain intact.
- No finance, tasks, calendar, AI, notification or generic CRUD framework is added in this phase.
- All new behavior follows TDD and each task ends with focused verification and a commit.

---

## File map

- `supabase/config.toml`: local stack configuration produced by the Supabase CLI.
- `supabase/migrations/202607230001_identity_core.sql`: identity tables, triggers, RLS and onboarding RPC.
- `supabase/tests/identity_core.test.sql`: pgTAP schema and isolation checks.
- `.env.example`: public Supabase variables required by the app.
- `src/lib/supabase/config.ts`: validated public configuration.
- `src/lib/supabase/client.ts`: browser Supabase client.
- `src/lib/supabase/server.ts`: cookie-backed server Supabase client.
- `src/lib/supabase/proxy.ts`: token refresh helper.
- `src/lib/supabase/database.types.ts`: generated database types.
- `src/proxy.ts`: Next.js root Proxy.
- `src/features/identity/identity-model.ts`: input normalization and validation.
- `src/features/identity/identity-model.test.ts`: deterministic identity validation tests.
- `src/features/identity/identity-repository.ts`: sole profile/preferences data boundary.
- `src/features/identity/auth-actions.ts`: login, signup, Google and logout server actions.
- `src/app/auth/callback/route.ts`: PKCE code exchange.
- `src/app/entrar/page.tsx`: login/signup route.
- `src/app/entrar/auth-form.tsx`: accessible pending/error form behavior.
- `src/app/entrar/auth-page.module.css`: branded identity layout.
- `src/features/identity/onboarding-form.tsx`: first-access preferences form.
- `src/app/onboarding/page.tsx`: protected onboarding route.
- `src/app/page.tsx`: protected Today composition using the persisted display name.

### Task 1: Local Supabase schema and RLS

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `supabase/config.toml`
- Create: `supabase/migrations/202607230001_identity_core.sql`
- Create: `supabase/tests/identity_core.test.sql`
- Create: `.env.example`

**Interfaces:**
- Produces tables `profiles`, `preferences`, `audit_events`.
- Produces RPC `complete_onboarding(display_name_input text, timezone_input text, email_reminders_input boolean, ai_consent_input boolean)`.
- Produces a profile/preferences row automatically for each new `auth.users` row.
- Produces `npm run supabase:start`, `npm run supabase:stop`, `npm run db:reset`, `npm run db:test` and `npm run db:types`.

- [ ] **Step 1: Install the exact Supabase dependencies**

Run:

```powershell
npm install @supabase/ssr@0.12.3 @supabase/supabase-js@2.110.8
npm install --save-dev supabase@2.109.1
```

Expected: dependencies are locked and `npm audit` reports zero known vulnerabilities.

- [ ] **Step 2: Initialize the local project**

Run:

```powershell
npx supabase init
```

Expected: `supabase/config.toml` exists. Keep the generated local ports and set `site_url = "http://127.0.0.1:3000"` plus `additional_redirect_urls = ["http://127.0.0.1:3000/auth/callback"]`.

- [ ] **Step 3: Write the failing database test**

Create `supabase/tests/identity_core.test.sql`:

```sql
begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'preferences', 'preferences table exists');
select has_table('public', 'audit_events', 'audit_events table exists');
select col_type_is('public', 'profiles', 'user_id', 'uuid', 'profile ownership uses uuid');
select col_type_is('public', 'preferences', 'currency', 'text', 'currency is text');
select col_default_is('public', 'preferences', 'currency', '''BRL''::text', 'currency defaults to BRL');
select is(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  true,
  'profiles has RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.preferences'::regclass),
  true,
  'preferences has RLS'
);
select is(
  (select relrowsecurity from pg_class where oid = 'public.audit_events'::regclass),
  true,
  'audit events has RLS'
);
select policies_are(
  'public',
  'profiles',
  array['profiles_insert_own', 'profiles_select_own', 'profiles_update_own'],
  'profiles has owner-only policies'
);
select policies_are(
  'public',
  'preferences',
  array['preferences_insert_own', 'preferences_select_own', 'preferences_update_own'],
  'preferences has owner-only policies'
);
select policies_are(
  'public',
  'audit_events',
  array['audit_events_insert_own', 'audit_events_select_own'],
  'audit log cannot be changed or deleted through the API'
);

select * from finish();
rollback;
```

- [ ] **Step 4: Start the stack and verify RED**

Run:

```powershell
npm run supabase:start
npm run db:test
```

Expected: pgTAP fails because the identity tables do not exist.

- [ ] **Step 5: Add scripts and the identity migration**

Add these scripts to `package.json`:

```json
"supabase:start": "supabase start",
"supabase:stop": "supabase stop",
"db:reset": "supabase db reset",
"db:test": "supabase test db",
"db:types": "supabase gen types typescript --local > src/lib/supabase/database.types.ts"
```

Create `supabase/migrations/202607230001_identity_core.sql` with:

```sql
create schema if not exists private;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 80),
  avatar_url text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'BRL' check (currency = 'BRL'),
  locale text not null default 'pt-BR' check (locale = 'pt-BR'),
  timezone text not null default 'America/Bahia' check (char_length(timezone) between 1 and 80),
  week_starts_on smallint not null default 0 check (week_starts_on between 0 and 6),
  email_reminders boolean not null default true,
  ai_processing_consent boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.audit_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurred_at timestamptz not null default timezone('utc', now()),
  actor text not null check (actor in ('user', 'system', 'assistant')),
  action text not null check (char_length(action) between 1 and 100),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text,
  result text not null check (result in ('success', 'failure')),
  metadata jsonb not null default '{}'::jsonb
);

create index audit_events_user_occurred_idx
on public.audit_events (user_id, occurred_at desc);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger preferences_set_updated_at
before update on public.preferences
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  chosen_name text;
begin
  chosen_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Pessoa'
    ),
    80
  );

  insert into public.profiles (user_id, display_name)
  values (new.id, chosen_name);

  insert into public.preferences (user_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

create or replace function public.complete_onboarding(
  display_name_input text,
  timezone_input text,
  email_reminders_input boolean,
  ai_consent_input boolean
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid := (select auth.uid());
  normalized_name text := trim(display_name_input);
  normalized_timezone text := trim(timezone_input);
begin
  if current_user_id is null then
    raise exception 'authentication required';
  end if;

  if char_length(normalized_name) not between 1 and 80 then
    raise exception 'invalid display name';
  end if;

  if char_length(normalized_timezone) not between 1 and 80 then
    raise exception 'invalid timezone';
  end if;

  update public.profiles
  set display_name = normalized_name, onboarding_completed = true
  where user_id = current_user_id;

  update public.preferences
  set timezone = normalized_timezone,
      email_reminders = email_reminders_input,
      ai_processing_consent = ai_consent_input
  where user_id = current_user_id;

  insert into public.audit_events (
    user_id, actor, action, entity_type, entity_id, result
  )
  values (
    current_user_id,
    'user',
    'identity.onboarding.completed',
    'profile',
    current_user_id::text,
    'success'
  );
end;
$$;

alter table public.profiles enable row level security;
alter table public.preferences enable row level security;
alter table public.audit_events enable row level security;

create policy profiles_select_own on public.profiles
for select to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_insert_own on public.profiles
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy profiles_update_own on public.profiles
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy preferences_select_own on public.preferences
for select to authenticated
using ((select auth.uid()) = user_id);

create policy preferences_insert_own on public.preferences
for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy preferences_update_own on public.preferences
for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy audit_events_select_own on public.audit_events
for select to authenticated
using ((select auth.uid()) = user_id);

create policy audit_events_insert_own on public.audit_events
for insert to authenticated
with check ((select auth.uid()) = user_id);

revoke all on public.profiles, public.preferences, public.audit_events from anon;
grant select, insert, update on public.profiles, public.preferences to authenticated;
grant select, insert on public.audit_events to authenticated;
grant execute on function public.complete_onboarding(text, text, boolean, boolean) to authenticated;
revoke execute on function public.complete_onboarding(text, text, boolean, boolean) from anon;
```

- [ ] **Step 6: Reset the database and verify GREEN**

Run:

```powershell
npm run db:reset
npm run db:test
```

Expected: 12 pgTAP assertions pass.

- [ ] **Step 7: Add the environment contract**

Create `.env.example`:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=replace-with-local-or-hosted-publishable-key
```

Generate `.env.local` from the running local stack without committing it, then run:

```powershell
npm run db:types
npm test
```

Expected: generated types exist and all existing Vitest tests pass.

- [ ] **Step 8: Commit**

```powershell
git add package.json package-lock.json .env.example supabase src/lib/supabase/database.types.ts
git commit -m "feat: add secure identity database core"
```

### Task 2: Supabase clients, session refresh and identity model

**Files:**
- Create: `src/lib/supabase/config.ts`
- Create: `src/lib/supabase/config.test.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/proxy.ts`
- Create: `src/proxy.ts`
- Create: `src/features/identity/identity-model.ts`
- Create: `src/features/identity/identity-model.test.ts`

**Interfaces:**
- Produces `getSupabaseConfig(env)`, `createClient()` browser/server helpers and `updateSession(request)`.
- Produces `normalizeAuthInput(formData)` and `normalizeOnboardingInput(formData)`.
- Consumed by Tasks 3 and 4.

- [ ] **Step 1: Write failing validation tests**

Create `src/lib/supabase/config.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { getSupabaseConfig } from "./config";

describe("getSupabaseConfig", () => {
  it("returns a valid public configuration", () => {
    expect(
      getSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "http://127.0.0.1:54321",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
      }),
    ).toEqual({
      url: "http://127.0.0.1:54321",
      publishableKey: "test-key",
    });
  });

  it("rejects missing configuration without exposing secrets", () => {
    expect(() => getSupabaseConfig({})).toThrow("Supabase não configurado.");
  });
});
```

Create `src/features/identity/identity-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalizeAuthInput, normalizeOnboardingInput } from "./identity-model";

describe("identity input", () => {
  it("normalizes a valid email and password", () => {
    const data = new FormData();
    data.set("email", " LU@EXAMPLE.COM ");
    data.set("password", "12345678");
    expect(normalizeAuthInput(data)).toEqual({
      ok: true,
      value: { email: "lu@example.com", password: "12345678" },
    });
  });

  it("rejects an invalid login", () => {
    const data = new FormData();
    data.set("email", "sem-email");
    data.set("password", "123");
    expect(normalizeAuthInput(data)).toEqual({
      ok: false,
      message: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
    });
  });

  it("normalizes onboarding preferences", () => {
    const data = new FormData();
    data.set("displayName", " Lu ");
    data.set("timezone", "America/Bahia");
    data.set("emailReminders", "on");
    expect(normalizeOnboardingInput(data)).toEqual({
      ok: true,
      value: {
        displayName: "Lu",
        timezone: "America/Bahia",
        emailReminders: true,
        aiConsent: false,
      },
    });
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/lib/supabase/config.test.ts src/features/identity/identity-model.test.ts
```

Expected: tests fail because the modules do not exist.

- [ ] **Step 3: Implement the minimal models**

Create `src/lib/supabase/config.ts`:

```ts
type PublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

export function getSupabaseConfig(env: PublicEnv) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Supabase não configurado.");
  }

  return { url, publishableKey };
}
```

Create `src/features/identity/identity-model.ts`:

```ts
type Result<T> = { ok: true; value: T } | { ok: false; message: string };

export function normalizeAuthInput(
  formData: FormData,
): Result<{ email: string; password: string }> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
    return {
      ok: false,
      message: "Informe um e-mail válido e uma senha com pelo menos 8 caracteres.",
    };
  }

  return { ok: true, value: { email, password } };
}

export function normalizeOnboardingInput(
  formData: FormData,
): Result<{
  displayName: string;
  timezone: string;
  emailReminders: boolean;
  aiConsent: boolean;
}> {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "").trim();

  if (displayName.length < 1 || displayName.length > 80) {
    return { ok: false, message: "Informe um nome com até 80 caracteres." };
  }

  if (timezone.length < 1 || timezone.length > 80) {
    return { ok: false, message: "Escolha um fuso horário válido." };
  }

  return {
    ok: true,
    value: {
      displayName,
      timezone,
      emailReminders: formData.get("emailReminders") === "on",
      aiConsent: formData.get("aiConsent") === "on",
    },
  };
}
```

- [ ] **Step 4: Add official SSR client helpers**

Create the browser and server clients with the generated `Database` type, `getSupabaseConfig(process.env)`, `createBrowserClient`, `createServerClient` and the Next.js `cookies()` adapter. The server adapter must catch cookie writes from Server Components and leave writes to the Proxy.

Create `src/lib/supabase/proxy.ts` with the official request/response cookie adapter and call `supabase.auth.getClaims()` exactly once. Return both the response and claims.

Create `src/proxy.ts`:

```ts
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { response } = await updateSession(request);
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm test -- src/lib/supabase/config.test.ts src/features/identity/identity-model.test.ts
npm run typecheck
npm run lint
```

Expected: 5 focused tests pass; typecheck and lint exit 0.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/supabase src/features/identity/identity-model* src/proxy.ts
git commit -m "feat: add Supabase session boundary"
```

### Task 3: Authentication flow

**Files:**
- Create: `src/features/identity/auth-actions.ts`
- Create: `src/features/identity/auth-form.tsx`
- Create: `src/features/identity/auth-form.test.tsx`
- Create: `src/app/entrar/page.tsx`
- Create: `src/app/entrar/auth-page.module.css`
- Create: `src/app/auth/callback/route.ts`

**Interfaces:**
- Consumes `normalizeAuthInput`, server `createClient()` and `GardenIcon`.
- Produces server actions `signIn`, `signUp`, `signInWithGoogle`, `signOut`.
- Produces public route `/entrar` and PKCE callback `/auth/callback`.

- [ ] **Step 1: Write the failing form test**

Create `src/features/identity/auth-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  it("offers accessible email, password and both account paths", () => {
    render(<AuthForm />);
    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("minLength", "8");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar minha conta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar com Google" })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/features/identity/auth-form.test.tsx
```

Expected: fail because `auth-form.tsx` does not exist.

- [ ] **Step 3: Implement authentication actions**

`signIn` and `signUp` validate the `FormData`, call the matching Supabase Auth method and return `{ message }` on user-correctable errors. Successful sign-in redirects to `/`; successful sign-up redirects to `/onboarding`. `signInWithGoogle` uses provider `google`, `redirectTo: ${origin}/auth/callback?next=/onboarding` and redirects to the returned authorization URL. `signOut` calls `supabase.auth.signOut()` and redirects to `/entrar`.

`src/app/auth/callback/route.ts` must exchange a present `code` with `exchangeCodeForSession(code)`, allow only a same-origin relative `next` beginning with `/`, and otherwise redirect to `/`.

- [ ] **Step 4: Implement the branded form**

Create a client `AuthForm` using native `<form>`, `useActionState`, `useFormStatus`, `type="email"`, `autoComplete="email"` and `autoComplete="current-password"`. Use one form for login/create-account buttons with `formAction`, plus a separate Google form. Announce errors with `role="alert"` and pending state with disabled buttons and text.

Create `/entrar` as an asymmetric Jardim de Pêssego composition: authored morning illustration on one side, one white paper-like form on the other, responsive single column below `760px`. Reuse existing tokens and `GardenIcon`; add no dependency and no generic icon.

- [ ] **Step 5: Verify GREEN**

Run:

```powershell
npm test -- src/features/identity/auth-form.test.tsx
npm run typecheck
npm run lint
```

Expected: focused test passes; typecheck and lint exit 0.

- [ ] **Step 6: Commit**

```powershell
git add src/app/entrar src/app/auth src/features/identity
git commit -m "feat: add authentication experience"
```

### Task 4: Profile repository, onboarding and protected Today

**Files:**
- Create: `src/features/identity/identity-repository.ts`
- Create: `src/features/identity/onboarding-actions.ts`
- Create: `src/features/identity/onboarding-form.tsx`
- Create: `src/features/identity/onboarding-form.test.tsx`
- Create: `src/app/onboarding/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/features/today/today-model.ts`
- Modify: `src/features/today/today-model.test.ts`
- Modify: `src/features/today/today-dashboard.tsx`

**Interfaces:**
- Produces `getCurrentIdentity()` returning verified `userId`, profile and preferences.
- Produces `completeOnboarding(previousState, formData)`.
- Produces protected `/onboarding` and `/`; the Today demo data remains, but its greeting uses the persisted profile.

- [ ] **Step 1: Write failing onboarding and Today tests**

Create `src/features/identity/onboarding-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingForm } from "./onboarding-form";

describe("OnboardingForm", () => {
  it("shows the required identity and preference controls", () => {
    render(<OnboardingForm initialName="Lu" />);
    expect(screen.getByRole("textbox", { name: "Como podemos chamar você?" })).toHaveValue("Lu");
    expect(screen.getByRole("combobox", { name: "Fuso horário" })).toHaveValue("America/Bahia");
    expect(screen.getByRole("checkbox", { name: /lembretes por e-mail/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /usar ia/i })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Preparar meu espaço" })).toBeInTheDocument();
  });
});
```

Add to `today-model.test.ts`:

```ts
it("personalizes the demo snapshot without mutating the shared seed", () => {
  const snapshot = buildTodaySnapshot("Luan");
  expect(snapshot.greetingName).toBe("Luan");
  expect(TODAY_DEMO.greetingName).toBe("Lu");
});
```

- [ ] **Step 2: Verify RED**

Run:

```powershell
npm test -- src/features/identity/onboarding-form.test.tsx src/features/today/today-model.test.ts
```

Expected: fail because `OnboardingForm` and `buildTodaySnapshot` do not exist.

- [ ] **Step 3: Implement the repository**

`getCurrentIdentity()` creates the server Supabase client, verifies the user with `auth.getClaims()`, redirects unauthenticated users to `/entrar`, fetches exactly `user_id, display_name, avatar_url, onboarding_completed` from `profiles` and `user_id, currency, locale, timezone, week_starts_on, email_reminders, ai_processing_consent` from `preferences`, and throws a safe error if either row is missing.

No route imports `createClient()` for identity data directly after this task.

- [ ] **Step 4: Implement onboarding**

Create `completeOnboarding` as a server action. Validate with `normalizeOnboardingInput`, call the `complete_onboarding` RPC with the exact generated argument names, call `revalidatePath("/")`, and redirect to `/` on success. Return a Portuguese `message` on validation or database errors without exposing raw database details.

Create an accessible native form with:

- text input `displayName`, `maxLength={80}`;
- native select `timezone` with `America/Bahia`, `America/Sao_Paulo`, `America/Fortaleza`, `America/Manaus`;
- checked checkbox `emailReminders`;
- unchecked checkbox `aiConsent` and explicit copy that this consent can be changed later;
- pending submit state and `role="alert"` error.

The route `/onboarding` loads the current identity, redirects to `/` when already complete and renders the form in the existing Jardim de Pêssego visual language.

- [ ] **Step 5: Protect and personalize Today**

Add:

```ts
export function buildTodaySnapshot(greetingName: string): TodaySnapshot {
  return { ...TODAY_DEMO, greetingName };
}
```

Update `/` to load `getCurrentIdentity()`, redirect incomplete profiles to `/onboarding`, and pass `buildTodaySnapshot(profile.display_name)` to `TodayDashboard`.

Add a compact account action to the desktop navigation and the mobile `Mais` panel that submits `signOut`; label it `Sair` and keep icon/text semantics intact.

- [ ] **Step 6: Verify GREEN**

Run:

```powershell
npm test -- src/features/identity/onboarding-form.test.tsx src/features/today/today-model.test.ts
npm test
npm run typecheck
npm run lint
```

Expected: all Vitest tests pass; typecheck and lint exit 0.

- [ ] **Step 7: Commit**

```powershell
git add src/app src/features/identity src/features/today
git commit -m "feat: add protected onboarding and profile"
```

### Task 5: Local end-to-end identity gate

**Files:**
- Modify: `README.md` if it exists; otherwise create it.
- Modify: `DESIGN.md`
- Modify: only files required by verified defects.

**Interfaces:**
- Consumes the full identity flow.
- Produces a locally runnable, documented Phase 2.

- [ ] **Step 1: Create a real local user through the UI**

Start the local Supabase stack and Next.js:

```powershell
npm run supabase:start
npm run dev -- --hostname 127.0.0.1 --port 3000
```

In a browser at `http://127.0.0.1:3000`, verify:

1. `/` redirects to `/entrar`;
2. invalid credentials show an inline error;
3. creating `luan@example.com` with a local-only test password reaches onboarding;
4. onboarding persists the name, preferences and one audit event;
5. `/` greets the persisted name;
6. logout returns to `/entrar`;
7. signing in again restores the completed profile without repeating onboarding.

- [ ] **Step 2: Verify isolation in the local database**

Create a second local account through the UI and use SQL/pgTAP to confirm neither authenticated identity can select or update the other profile/preferences rows.

Expected: cross-user select returns zero rows and cross-user update changes zero rows.

- [ ] **Step 3: Inspect responsive and keyboard behavior**

Inspect login, onboarding and Today at `1440 × 1000` and `390 × 844`. Tab through every control, test 200% zoom and confirm no horizontal overflow. Fix only observed defects.

- [ ] **Step 4: Document local startup**

Document these exact commands and the `.env.local` requirement:

```powershell
npm install
npm run supabase:start
npm run db:reset
npm run dev
```

Document `npm run supabase:stop` for cleanup. Do not document hosted deployment before a hosted Supabase project exists.

- [ ] **Step 5: Record implemented identity components**

Update `DESIGN.md` with only the login, onboarding, account/logout and form states that exist after inspection.

- [ ] **Step 6: Run the complete gate**

Run:

```powershell
npm run db:test
npm test
npm run typecheck
npm run lint
npm audit
npm run build
git diff --check
```

Expected: database and UI tests pass, audit reports zero vulnerabilities, production build succeeds and the diff check is clean.

- [ ] **Step 7: Commit**

```powershell
git add README.md DESIGN.md src supabase package.json package-lock.json .env.example
git commit -m "feat: finish identity and data core"
```

