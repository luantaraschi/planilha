import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  resolve("supabase/migrations/202607250001_financial_ledger.sql"),
  "utf8",
);

describe("financial ledger migration contract", () => {
  it("preserves the legacy fixed-expense due day in recurring entries", () => {
    expect(migration).toMatch(
      /insert into public\.recurring_entries\s*\([\s\S]*?due_day[\s\S]*?select[\s\S]*?expense\.due_day/i,
    );
  });

  it("confirms an import inside one idempotent security-definer function", () => {
    expect(migration).toMatch(
      /create or replace function public\.confirm_statement_import[\s\S]*security definer[\s\S]*confirmation_key_input[\s\S]*on conflict \(user_id, account_id, confirmation_key\)[\s\S]*insert into public\.transactions[\s\S]*insert into public\.import_batch_rows[\s\S]*update public\.import_batches/i,
    );
  });

  it("keeps import history immutable outside the confirmation function", () => {
    expect(migration).toMatch(
      /grant select on public\.import_batches, public\.import_batch_rows to authenticated/i,
    );
    expect(migration).not.toMatch(
      /grant select, insert, update, delete on public\.import_(?:batches|batch_rows) to authenticated/i,
    );
  });

  it("ties transaction sources to their import context", () => {
    expect(migration).toMatch(
      /constraint transactions_source_import_context check[\s\S]*source = 'bank_import'[\s\S]*import_batch_id is not null[\s\S]*import_fingerprint is not null[\s\S]*source = 'manual'[\s\S]*import_batch_id is null[\s\S]*import_fingerprint is null/i,
    );
  });

  it("allows authenticated DML only for manual transactions", () => {
    expect(migration).toMatch(
      /create policy transactions_insert_manual[\s\S]*for insert[\s\S]*source = 'manual'[\s\S]*import_batch_id is null[\s\S]*import_fingerprint is null/i,
    );
    expect(migration).toMatch(
      /create policy transactions_update_manual[\s\S]*for update[\s\S]*source = 'manual'[\s\S]*create policy transactions_delete_manual[\s\S]*source = 'manual'/i,
    );
  });

  it("anchors legacy recurrence dates in each owner's timezone", () => {
    expect(migration).toMatch(
      /join public\.preferences preferences[\s\S]*preferences\.user_id = expense\.user_id/i,
    );
    expect(migration).toMatch(
      /timezone\(preferences\.timezone,\s*now\(\)\)::date/i,
    );
    expect(migration).not.toMatch(
      /monthly_due_on\(current_date,\s*expense\.due_day\)/i,
    );
  });
});
