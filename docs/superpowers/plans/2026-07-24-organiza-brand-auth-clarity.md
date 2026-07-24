# Organiza Brand and Auth Clarity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the active product to Organiza and make first-account access unambiguous.

**Architecture:** Reuse the existing metadata, manifest, authentication actions
and Cloudflare deployment. Change copy and identifiers in place; add no
dependency and do not alter the Supabase data model.

**Tech Stack:** Next.js 16, React 19, Supabase Auth, Vitest, OpenNext, Cloudflare Workers.

## Global Constraints

- Public name is exactly `Organiza`.
- Public description is exactly `Finanças, rotina e planos em um só lugar.`
- Existing pastel visual design and accessibility behavior remain unchanged.
- Email/password remains sufficient; Google is optional.
- No new dependency.

---

### Task 1: Clarify first-account access

**Files:**
- Modify: `src/features/identity/auth-actions.test.ts`
- Modify: `src/features/identity/auth-actions.ts`

**Interfaces:**
- Consumes: existing `signIn(previousState, formData)` server action.
- Produces: the same `AuthState` interface with clearer corrective copy.

- [ ] **Step 1: Change the failing expectation**

```ts
expect(result.message).toBe(
  "Não foi possível entrar. Confira os dados ou, no primeiro acesso, escolha Criar minha conta.",
);
```

- [ ] **Step 2: Verify the focused test fails**

Run: `npm test -- src/features/identity/auth-actions.test.ts`

Expected: one failure showing the old generic login message.

- [ ] **Step 3: Make the minimal copy change**

```ts
if (error) {
  return {
    message:
      "Não foi possível entrar. Confira os dados ou, no primeiro acesso, escolha Criar minha conta.",
  };
}
```

- [ ] **Step 4: Verify the focused test passes**

Run: `npm test -- src/features/identity/auth-actions.test.ts`

Expected: all authentication action tests pass.

### Task 2: Rename active product surfaces

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `README.md`
- Modify: `PRODUCT.md`
- Modify: `DESIGN.md`
- Modify: `src/app/layout.tsx`
- Modify: `src/app/manifest.ts`
- Modify: `src/app/manifest.test.ts`
- Modify: `src/app/entrar/page.tsx`
- Modify: `src/app/onboarding/page.tsx`
- Modify: `src/components/app-sidebar.tsx`
- Modify: `public/offline.html`
- Rename: `public/icons/garden-app.svg` to `public/icons/organiza-app.svg`
- Rename: `public/icons/garden-maskable.svg` to `public/icons/organiza-maskable.svg`
- Modify: `scripts/browser-identity-gate.mjs`
- Modify: `wrangler.jsonc`

**Interfaces:**
- Consumes: existing metadata and PWA icon contracts.
- Produces: public `Organiza` metadata and Worker identifier `organiza`.

- [ ] **Step 1: Update manifest assertions first**

```ts
expect(source).toMatch(/name:\s*"Organiza"/);
expect(source).toMatch(/short_name:\s*"Organiza"/);
expect(source).toContain("/icons/organiza-app.svg");
expect(source).toContain("/icons/organiza-maskable.svg");
```

- [ ] **Step 2: Verify the manifest test fails**

Run: `npm test -- src/app/manifest.test.ts`

Expected: assertions still find `Meu espaço` and old icon paths.

- [ ] **Step 3: Rename identifiers and visible copy**

Use `Organiza` for visible product names and `organiza` for package and Worker
identifiers. Keep feature copy, color tokens and illustration filenames that
are not product names.

- [ ] **Step 4: Verify no active old brand remains**

Run:

```powershell
rg -n "Meu espaço|personal-organization-superapp|garden-app|garden-maskable" package.json package-lock.json README.md PRODUCT.md DESIGN.md public src scripts wrangler.jsonc
```

Expected: no matches.

- [ ] **Step 5: Run the complete local checks**

Run: `npm test && npm run typecheck && npm run lint && npm run build:sites`

Expected: all commands exit zero.

### Task 3: Publish and verify Organiza

**Files:**
- Modify: `supabase/config.toml`

**Interfaces:**
- Consumes: Cloudflare Worker URL and existing Supabase project.
- Produces: public Organiza URL accepted by Supabase Auth.

- [ ] **Step 1: Deploy the renamed Worker**

Run: `npx wrangler deploy`

Expected: Cloudflare reports a successful `organiza` deployment.

- [ ] **Step 2: Update the Supabase redirect**

Set `site_url` and `additional_redirect_urls` to the deployed Organiza URL,
then run:

```powershell
npx supabase config push --project-ref pjvqrzkfiirfgddbexpw
```

Expected: Auth configuration is updated.

- [ ] **Step 3: Verify production**

Run an HTTP request to `/entrar`.

Expected: HTTP 200 and `<title>Entrar | Organiza</title>`.

- [ ] **Step 4: Commit and push**

```powershell
git add package.json package-lock.json README.md PRODUCT.md DESIGN.md public src scripts wrangler.jsonc supabase/config.toml
git commit -m "feat: rename app to Organiza"
git push origin release/mvp-v1
```
