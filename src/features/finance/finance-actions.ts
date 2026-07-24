"use server";

import { revalidatePath } from "next/cache";
import {
  addCurrentTransaction,
  deleteCurrentTransaction,
  importCurrentTransactions,
} from "./finance-repository";
import {
  normalizeTransactionInput,
  parseBankStatement,
} from "./finance-model";

export type FinanceActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function addTransaction(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const normalized = normalizeTransactionInput(formData);
  if (!normalized.ok) {
    return { status: "error", message: normalized.message };
  }
  if (!(await addCurrentTransaction(normalized.value))) {
    return {
      status: "error",
      message: "Não foi possível adicionar o lançamento.",
    };
  }

  revalidatePath("/financas");
  return { status: "success", message: "Lançamento adicionado." };
}

export async function importStatement(
  _previousState: FinanceActionState,
  formData: FormData,
): Promise<FinanceActionState> {
  const accountId = String(formData.get("accountId") ?? "");
  const file = formData.get("statement");
  const fileName = file instanceof File ? file.name.toLowerCase() : "";
  if (!uuidPattern.test(accountId)) {
    return { status: "error", message: "Escolha a conta do extrato." };
  }
  if (
    !(file instanceof File) ||
    (!fileName.endsWith(".csv") && !fileName.endsWith(".ofx"))
  ) {
    return { status: "error", message: "Escolha um arquivo CSV ou OFX." };
  }
  if (file.size > 1_000_000) {
    return {
      status: "error",
      message: "O arquivo deve ter no máximo 1 MB.",
    };
  }

  try {
    const parsed = parseBankStatement(await file.text(), file.name);
    if (parsed.rows.length === 0) {
      return {
        status: "error",
        message: "Nenhum lançamento válido foi encontrado no extrato.",
      };
    }
    if (parsed.rows.length > 200) {
      return {
        status: "error",
        message: "Importe no máximo 200 lançamentos por vez.",
      };
    }

    const result = await importCurrentTransactions(
      accountId,
      file.name,
      parsed.rows,
    );
    revalidatePath("/financas");
    const importedLabel =
      `${result.imported} lançamento${result.imported === 1 ? "" : "s"} ` +
      `importado${result.imported === 1 ? "" : "s"}.`;
    const duplicateLabel =
      result.duplicates > 0
        ? ` ${result.duplicates} duplicado${result.duplicates === 1 ? "" : "s"} ignorado${result.duplicates === 1 ? "" : "s"}.`
        : "";
    return {
      status: "success",
      message: importedLabel + duplicateLabel,
    };
  } catch {
    return {
      status: "error",
      message: "Não foi possível ler esse extrato CSV ou OFX.",
    };
  }
}

export async function deleteTransaction(formData: FormData) {
  const transactionId = String(formData.get("transactionId") ?? "");
  if (!uuidPattern.test(transactionId)) return;
  if (await deleteCurrentTransaction(transactionId)) {
    revalidatePath("/financas");
  }
}
