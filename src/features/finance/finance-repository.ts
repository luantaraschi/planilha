import { createHash } from "node:crypto";
import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";
import type {
  AccountType,
  FinanceLedger,
  FinancialCategory,
  FinancialGoal,
  FinancialTransaction,
  RecurringEntry,
  StatementRow,
  TransactionInput,
} from "./finance-model";

const accountFields =
  "id, name, account_type, opening_balance_cents, active";
const categoryFields = "id, name, category_type, active";
const transactionFields =
  "id, account_id, transaction_type, amount_cents, occurred_on, due_on, status, description, category_id, transfer_account_id, source, financial_categories(name)";
const recurringFields =
  "id, account_id, transaction_type, amount_cents, description, category_id, frequency, next_due_on, active";
const budgetFields = "id, category_id, month, amount_cents";
const goalFields =
  "id, name, target_cents, saved_cents, target_on, status";

function safeCents(value: number | string) {
  const cents = Number(value);
  if (!Number.isSafeInteger(cents)) {
    throw new Error("Um valor financeiro excede o limite suportado.");
  }
  return cents;
}

function firstRelationName(value: unknown) {
  if (Array.isArray(value)) {
    const first = value[0];
    return first && typeof first === "object" && "name" in first
      ? String(first.name)
      : null;
  }
  return value && typeof value === "object" && "name" in value
    ? String(value.name)
    : null;
}

export async function getCurrentFinanceLedger(): Promise<FinanceLedger> {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const [
    accountsResult,
    categoriesResult,
    transactionsResult,
    recurringResult,
    budgetsResult,
    goalsResult,
  ] = await Promise.all([
    supabase
      .from("financial_accounts")
      .select(accountFields)
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("financial_categories")
      .select(categoryFields)
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("transactions")
      .select(transactionFields)
      .eq("user_id", userId)
      .order("occurred_on", { ascending: false }),
    supabase
      .from("recurring_entries")
      .select(recurringFields)
      .eq("user_id", userId)
      .order("next_due_on"),
    supabase
      .from("budgets")
      .select(budgetFields)
      .eq("user_id", userId)
      .order("month", { ascending: false }),
    supabase
      .from("financial_goals")
      .select(goalFields)
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (
    accountsResult.error ||
    categoriesResult.error ||
    transactionsResult.error ||
    recurringResult.error ||
    budgetsResult.error ||
    goalsResult.error
  ) {
    throw new Error("Não foi possível carregar seu livro financeiro.");
  }

  return {
    accounts: (accountsResult.data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      accountType: row.account_type as AccountType,
      openingBalanceCents: safeCents(row.opening_balance_cents),
      active: row.active,
    })),
    categories: (categoriesResult.data ?? []).map(
      (row): FinancialCategory => ({
        id: row.id,
        name: row.name,
        categoryType:
          row.category_type as FinancialCategory["categoryType"],
        active: row.active,
      }),
    ),
    transactions: (transactionsResult.data ?? []).map(
      (row): FinancialTransaction => ({
        id: row.id,
        accountId: row.account_id,
        transactionType:
          row.transaction_type as FinancialTransaction["transactionType"],
        amountCents: safeCents(row.amount_cents),
        occurredOn: row.occurred_on,
        dueOn: row.due_on,
        status: row.status as FinancialTransaction["status"],
        description: row.description,
        categoryId: row.category_id,
        categoryName: firstRelationName(row.financial_categories),
        transferAccountId: row.transfer_account_id,
        source: row.source as FinancialTransaction["source"],
      }),
    ),
    recurringEntries: (recurringResult.data ?? []).map(
      (row): RecurringEntry => ({
        id: row.id,
        accountId: row.account_id,
        transactionType:
          row.transaction_type as RecurringEntry["transactionType"],
        amountCents: safeCents(row.amount_cents),
        description: row.description,
        categoryId: row.category_id,
        frequency: row.frequency as RecurringEntry["frequency"],
        nextDueOn: row.next_due_on,
        active: row.active,
      }),
    ),
    budgets: (budgetsResult.data ?? []).map((row) => ({
      id: row.id,
      categoryId: row.category_id,
      month: row.month,
      amountCents: safeCents(row.amount_cents),
    })),
    goals: (goalsResult.data ?? []).map(
      (row): FinancialGoal => ({
        id: row.id,
        name: row.name,
        targetCents: safeCents(row.target_cents),
        savedCents: safeCents(row.saved_cents),
        targetOn: row.target_on,
        status: row.status as FinancialGoal["status"],
      }),
    ),
  };
}

export async function addCurrentTransaction(input: TransactionInput) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    account_id: input.accountId,
    transaction_type: input.transactionType,
    amount_cents: input.amountCents,
    occurred_on: input.occurredOn,
    due_on: input.dueOn,
    status: input.status,
    description: input.description,
    category_id: input.categoryId,
    transfer_account_id: input.transferAccountId,
    source: "manual",
  });
  return !error;
}

function fingerprint(accountId: string, row: StatementRow) {
  if (row.externalId) return row.externalId;
  return createHash("sha256")
    .update(
      [
        accountId,
        row.occurredOn,
        row.transactionType,
        row.description.trim().toLowerCase(),
        row.amountCents,
      ].join("|"),
    )
    .digest("hex");
}

export async function importCurrentTransactions(
  accountId: string,
  fileName: string,
  rows: StatementRow[],
) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { data: categories, error: categoryError } = await supabase
    .from("financial_categories")
    .select("id, name")
    .eq("user_id", userId)
    .in("name", ["Receita extra", "Outros"]);
  if (categoryError) {
    throw new Error("Não foi possível preparar as categorias do extrato.");
  }
  const incomeCategoryId = categories?.find(
    (category) => category.name === "Receita extra",
  )?.id;
  const expenseCategoryId = categories?.find(
    (category) => category.name === "Outros",
  )?.id;
  if (!incomeCategoryId || !expenseCategoryId) {
    throw new Error("As categorias padrão do extrato não foram encontradas.");
  }

  const { data: batch, error: batchError } = await supabase
    .from("import_batches")
    .insert({
      user_id: userId,
      account_id: accountId,
      file_name: fileName.slice(0, 255),
      file_type: fileName.toLowerCase().endsWith(".ofx") ? "ofx" : "csv",
      status: "reviewed",
      row_count: rows.length,
    })
    .select("id")
    .single();
  if (batchError || !batch) {
    throw new Error("Não foi possível abrir a revisão do extrato.");
  }

  const prepared = rows.map((row) => ({
    row,
    fingerprint: fingerprint(accountId, row),
  }));
  const fingerprints = prepared.map((item) => item.fingerprint);
  const { data: existing, error: lookupError } = await supabase
    .from("transactions")
    .select("import_fingerprint")
    .eq("user_id", userId)
    .eq("account_id", accountId)
    .in("import_fingerprint", fingerprints);
  if (lookupError) {
    throw new Error("Não foi possível conferir duplicidades do extrato.");
  }

  const seen = new Set(
    (existing ?? []).flatMap((item) =>
      item.import_fingerprint ? [item.import_fingerprint] : [],
    ),
  );
  const reviewed = prepared.map((item) => {
    const duplicate = seen.has(item.fingerprint);
    if (!duplicate) {
      seen.add(item.fingerprint);
    }
    return { ...item, duplicate };
  });
  const unique = reviewed.filter((item) => !item.duplicate);

  let inserted: Array<{ id: string; import_fingerprint: string | null }> = [];
  if (unique.length > 0) {
    const { data, error } = await supabase
      .from("transactions")
      .insert(
        unique.map(({ row, fingerprint: importFingerprint }) => ({
          user_id: userId,
          account_id: accountId,
          transaction_type: row.transactionType,
          amount_cents: row.amountCents,
          occurred_on: row.occurredOn,
          due_on: null,
          status: "cleared",
          description: row.description,
          category_id:
            row.transactionType === "income"
              ? incomeCategoryId
              : expenseCategoryId,
          transfer_account_id: null,
          import_batch_id: batch.id,
          import_fingerprint: importFingerprint,
          source: "bank_import",
        })),
      )
      .select("id, import_fingerprint");
    if (error) {
      throw new Error("Não foi possível importar os lançamentos.");
    }
    inserted = data ?? [];
  }

  const transactionIds = new Map(
    inserted.flatMap((item) =>
      item.import_fingerprint
        ? [[item.import_fingerprint, item.id] as const]
        : [],
    ),
  );
  const { error: reviewError } = await supabase
    .from("import_batch_rows")
    .insert(
      reviewed.map(
        ({ row, fingerprint: importFingerprint, duplicate }) => ({
          user_id: userId,
          batch_id: batch.id,
          transaction_id: transactionIds.get(importFingerprint) ?? null,
          row_number: row.rowNumber,
          occurred_on: row.occurredOn,
          description: row.description,
          signed_amount_cents:
            row.transactionType === "income"
              ? row.amountCents
              : -row.amountCents,
          transaction_type: row.transactionType,
          import_fingerprint: importFingerprint,
          review_status: duplicate ? "duplicate" : "imported",
        }),
      ),
    );
  if (reviewError) {
    throw new Error("Não foi possível registrar a revisão do extrato.");
  }

  const result = {
    imported: unique.length,
    duplicates: rows.length - unique.length,
  };
  const { error: updateError } = await supabase
    .from("import_batches")
    .update({
      status: "completed",
      imported_count: result.imported,
      duplicate_count: result.duplicates,
    })
    .eq("id", batch.id)
    .eq("user_id", userId);
  if (updateError) {
    throw new Error("Não foi possível concluir a revisão do extrato.");
  }
  return result;
}

export async function deleteCurrentTransaction(transactionId: string) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", userId)
    .eq("id", transactionId);
  return !error;
}
