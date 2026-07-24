import { createHash } from "node:crypto";
import { getVerifiedUserId } from "@/features/identity/identity-repository";
import { createClient } from "@/lib/supabase/server";
import type { Expense, ExpenseInput } from "./finance-model";

const EXPENSE_FIELDS =
  "id, expense_type, description, category, amount, expense_date, due_day, source, active";

type ImportedExpense = Pick<
  Expense,
  "description" | "amount" | "expenseDate" | "category"
>;

function toExpense(row: {
  id: string;
  expense_type: string;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  due_day: number | null;
  source: string;
  active: boolean;
}): Expense {
  return {
    id: row.id,
    expenseType: row.expense_type as Expense["expenseType"],
    description: row.description,
    category: row.category,
    amount: Number(row.amount),
    expenseDate: row.expense_date,
    dueDay: row.due_day,
    source: row.source as Expense["source"],
    active: row.active,
  };
}

function importFingerprint(expense: ImportedExpense) {
  return createHash("sha256")
    .update(
      [
        expense.expenseDate,
        expense.description.trim().toLowerCase(),
        expense.amount.toFixed(2),
      ].join("|"),
    )
    .digest("hex");
}

export async function listCurrentExpenses() {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { data, error } = await supabase
    .from("expenses")
    .select(EXPENSE_FIELDS)
    .eq("user_id", userId)
    .order("expense_date", { ascending: false });

  if (error || !data) {
    throw new Error("Não foi possível carregar suas despesas.");
  }
  return data.map(toExpense);
}

export async function addCurrentExpense(input: ExpenseInput) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase.from("expenses").insert({
    user_id: userId,
    expense_type: input.expenseType,
    description: input.description,
    category: input.category,
    amount: input.amount,
    expense_date: input.expenseDate,
    due_day: input.dueDay,
    source: "manual",
  });
  return !error;
}

export async function importCurrentExpenses(rows: ImportedExpense[]) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const withFingerprints = rows.map((expense) => ({
    ...expense,
    fingerprint: importFingerprint(expense),
  }));
  const fingerprints = withFingerprints.map((row) => row.fingerprint);
  const { data: existing, error: lookupError } = await supabase
    .from("expenses")
    .select("import_fingerprint")
    .eq("user_id", userId)
    .in("import_fingerprint", fingerprints);

  if (lookupError) {
    throw new Error("Não foi possível conferir o extrato.");
  }

  const existingFingerprints = new Set(
    (existing ?? []).map((row) => row.import_fingerprint),
  );
  const newRows = withFingerprints.filter(
    (row) => !existingFingerprints.has(row.fingerprint),
  );

  if (newRows.length > 0) {
    const { error } = await supabase.from("expenses").insert(
      newRows.map((row) => ({
        user_id: userId,
        expense_type: "variable" as const,
        description: row.description,
        category: row.category,
        amount: row.amount,
        expense_date: row.expenseDate,
        due_day: null,
        source: "bank_import" as const,
        import_fingerprint: row.fingerprint,
      })),
    );
    if (error) throw new Error("Não foi possível importar o extrato.");
  }

  return {
    imported: newRows.length,
    duplicates: rows.length - newRows.length,
  };
}

export async function deleteCurrentExpense(expenseId: string) {
  const supabase = await createClient();
  const userId = await getVerifiedUserId(supabase);
  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("user_id", userId)
    .eq("id", expenseId);
  return !error;
}
