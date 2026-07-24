export type AccountType = "checking" | "cash" | "savings" | "credit";
export type TransactionType =
  | "income"
  | "expense"
  | "transfer"
  | "adjustment";
export type TransactionStatus = "planned" | "cleared" | "ignored";
export type TransactionSource = "manual" | "bank_import" | "legacy";

export type FinancialAccount = {
  id: string;
  name: string;
  accountType: AccountType;
  openingBalanceCents: number;
  active: boolean;
};

export type FinancialCategory = {
  id: string;
  name: string;
  categoryType: "income" | "expense";
  active: boolean;
};

export type FinancialTransaction = {
  id: string;
  accountId: string;
  transactionType: TransactionType;
  amountCents: number;
  occurredOn: string;
  dueOn: string | null;
  status: TransactionStatus;
  description: string;
  categoryId: string | null;
  categoryName: string | null;
  transferAccountId: string | null;
  source: TransactionSource;
};

export type RecurringEntry = {
  id: string;
  accountId: string;
  transactionType: "income" | "expense";
  amountCents: number;
  description: string;
  categoryId: string | null;
  frequency: "weekly" | "monthly" | "yearly";
  nextDueOn: string;
  dueDay: number | null;
  active: boolean;
};

export type Budget = {
  id: string;
  categoryId: string | null;
  month: string;
  amountCents: number;
};

export type FinancialGoal = {
  id: string;
  name: string;
  targetCents: number;
  savedCents: number;
  targetOn: string | null;
  status: "active" | "completed" | "paused";
};

export type FinanceLedger = {
  accounts: FinancialAccount[];
  categories: FinancialCategory[];
  transactions: FinancialTransaction[];
  recurringEntries: RecurringEntry[];
  budgets: Budget[];
  goals: FinancialGoal[];
};

export type MonthlyFinanceSummary = {
  incomeCents: number;
  expenseCents: number;
  resultCents: number;
  projectedEndBalanceCents: number;
  freePerDayCents: number | null;
  confidence: "complete" | "partial";
  missingInputs: string[];
  budgetRemainingCents: number | null;
  forecastIncomeCents: number;
  forecastExpenseCents: number;
};

export type FinanceWorkspace = FinanceLedger & {
  selectedAccountId: string | null;
  summary: MonthlyFinanceSummary;
};

export type TransactionInput = Omit<
  FinancialTransaction,
  "id" | "categoryName" | "source"
>;

export type StatementRow = {
  rowNumber: number;
  description: string;
  amountCents: number;
  occurredOn: string;
  transactionType: "income" | "expense";
  externalId: string | null;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formatFinanceCurrency(cents: number) {
  return currencyFormatter.format(cents / 100);
}

function isValidIsoDate(value: string) {
  if (!isoDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value;
}

function groupedInteger(value: string, separator: string) {
  const groups = value.split(separator);
  return groups.length > 1 &&
    /^\d{1,3}$/.test(groups[0]) &&
    groups.slice(1).every((group) => /^\d{3}$/.test(group))
    ? groups.join("")
    : null;
}

function normalizedLocalizedNumber(value: string) {
  const cleaned = value
    .replace(/(?:BRL|R\$|\$)/gi, "")
    .replace(/\s/gu, "");
  const sign = cleaned.startsWith("-") ? "-" : "";
  const unsigned = /^[+-]/.test(cleaned) ? cleaned.slice(1) : cleaned;
  if (!unsigned || !/^[\d.,]+$/.test(unsigned)) return null;

  const commas = [...unsigned.matchAll(/,/g)].length;
  const dots = [...unsigned.matchAll(/\./g)].length;
  if (commas && dots) {
    const decimalSeparator =
      unsigned.lastIndexOf(",") > unsigned.lastIndexOf(".") ? "," : ".";
    const thousandsSeparator = decimalSeparator === "," ? "." : ",";
    if (
      (decimalSeparator === "," ? commas : dots) !== 1
    ) {
      return null;
    }
    const [integerPart, fraction] = unsigned.split(decimalSeparator);
    const integer = groupedInteger(integerPart, thousandsSeparator);
    if (!integer || !/^\d{1,2}$/.test(fraction ?? "")) return null;
    return `${sign}${integer}.${fraction}`;
  }

  const separator = commas ? "," : dots ? "." : null;
  if (!separator) return /^\d+$/.test(unsigned) ? `${sign}${unsigned}` : null;

  const groups = unsigned.split(separator);
  if (groups.some((group) => !/^\d+$/.test(group))) return null;
  if (groups.length === 2 && /^\d{1,2}$/.test(groups[1])) {
    return `${sign}${groups[0]}.${groups[1]}`;
  }
  if (groups.length > 2 && /^\d{1,2}$/.test(groups.at(-1) ?? "")) {
    const integer = groupedInteger(
      groups.slice(0, -1).join(separator),
      separator,
    );
    return integer ? `${sign}${integer}.${groups.at(-1)}` : null;
  }
  const integer = groupedInteger(unsigned, separator);
  return integer ? `${sign}${integer}` : null;
}

function centsFromLocalizedValue(value: string) {
  const normalized = normalizedLocalizedNumber(value);
  const amount = normalized === null ? Number.NaN : Number(normalized);
  return Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
}

export function normalizeTransactionInput(
  formData: FormData,
):
  | { ok: true; value: TransactionInput }
  | { ok: false; message: string } {
  const accountId = String(formData.get("accountId") ?? "");
  const transactionType = String(formData.get("transactionType") ?? "");
  const rawDescription = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "") || null;
  const amountCents = centsFromLocalizedValue(
    String(formData.get("amount") ?? ""),
  );
  const occurredOn = String(formData.get("occurredOn") ?? "");
  const dueOn = String(formData.get("dueOn") ?? "") || null;
  const status = String(formData.get("status") ?? "");
  const transferAccountId =
    String(formData.get("transferAccountId") ?? "") || null;

  if (!uuidPattern.test(accountId)) {
    return { ok: false, message: "Escolha uma conta válida." };
  }
  if (
    transactionType !== "income" &&
    transactionType !== "expense" &&
    transactionType !== "transfer" &&
    transactionType !== "adjustment"
  ) {
    return { ok: false, message: "Escolha um tipo de lançamento válido." };
  }
  if (rawDescription.length > 120) {
    return {
      ok: false,
      message: "Informe uma descrição de até 120 caracteres.",
    };
  }
  if (
    !Number.isSafeInteger(amountCents) ||
    amountCents <= 0 ||
    amountCents > 999_999_999_999
  ) {
    return { ok: false, message: "Informe um valor maior que zero." };
  }
  if (!isValidIsoDate(occurredOn) || (dueOn && !isValidIsoDate(dueOn))) {
    return { ok: false, message: "Informe uma data válida." };
  }
  if (status !== "planned" && status !== "cleared") {
    return { ok: false, message: "Escolha um estado válido." };
  }
  if (
    categoryId &&
    !uuidPattern.test(categoryId)
  ) {
    return { ok: false, message: "Escolha uma categoria válida." };
  }
  if (
    transactionType === "transfer" &&
    (!transferAccountId ||
      !uuidPattern.test(transferAccountId) ||
      transferAccountId === accountId)
  ) {
    return {
      ok: false,
      message: "Escolha uma conta de destino diferente.",
    };
  }

  return {
    ok: true,
    value: {
      accountId,
      transactionType,
      description:
        rawDescription ||
        (transactionType === "income"
          ? "Entrada"
          : transactionType === "expense"
            ? "Saída"
            : transactionType === "transfer"
              ? "Transferência"
              : "Ajuste de saldo"),
      categoryId:
        transactionType === "income" || transactionType === "expense"
          ? categoryId
          : null,
      amountCents,
      occurredOn,
      dueOn,
      status,
      transferAccountId:
        transactionType === "transfer" ? transferAccountId : null,
    },
  };
}

function monthEnd(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNumber, 0))
    .toISOString()
    .slice(0, 10);
}

export function dateInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const value = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${value.year}-${value.month}-${value.day}`;
}

function clampedUtcDate(year: number, monthIndex: number, day: number) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthIndex, Math.min(day, lastDay)));
}

function recurringOccurrencesUntil(
  entry: RecurringEntry,
  currentDate: string,
  end: string,
) {
  let candidate = new Date(`${entry.nextDueOn}T00:00:00Z`);
  if (
    !isValidIsoDate(entry.nextDueOn) ||
    Number.isNaN(candidate.valueOf()) ||
    (entry.dueDay !== null &&
      (!Number.isInteger(entry.dueDay) ||
        entry.dueDay < 1 ||
        entry.dueDay > 31))
  ) {
    return null;
  }

  const anchorDay = entry.dueDay ?? candidate.getUTCDate();
  const anchorMonth = candidate.getUTCMonth();
  const nextOccurrence = () => {
    if (entry.frequency === "weekly") {
      candidate = new Date(candidate.valueOf() + 7 * 86_400_000);
    } else if (entry.frequency === "monthly") {
      candidate = clampedUtcDate(
        candidate.getUTCFullYear(),
        candidate.getUTCMonth() + 1,
        anchorDay,
      );
    } else {
      candidate = clampedUtcDate(
        candidate.getUTCFullYear() + 1,
        anchorMonth,
        anchorDay,
      );
    }
  };

  let guard = 0;
  while (candidate.toISOString().slice(0, 10) < currentDate && guard < 600) {
    nextOccurrence();
    guard += 1;
  }
  if (guard >= 600) return null;

  let count = 0;
  while (candidate.toISOString().slice(0, 10) <= end && guard < 600) {
    count += 1;
    nextOccurrence();
    guard += 1;
  }
  return guard >= 600 ? null : count;
}

export function buildMonthlyFinanceSummary(
  ledger: FinanceLedger,
  currentDate: string,
  selectedAccountId: string | null = null,
): MonthlyFinanceSummary {
  const month = currentDate.slice(0, 7);
  const end = monthEnd(month);
  const selectedAccounts = ledger.accounts.filter(
    (account) =>
      account.active &&
      (!selectedAccountId || account.id === selectedAccountId),
  );
  const selectedIds = new Set(selectedAccounts.map((account) => account.id));
  const inScope = (accountId: string) => selectedIds.has(accountId);
  const scopedActiveRecurringEntries = ledger.recurringEntries.filter(
    (entry) => entry.active && inScope(entry.accountId),
  );

  const monthTransactions = ledger.transactions.filter(
    (transaction) =>
      transaction.status !== "ignored" &&
      transaction.occurredOn.startsWith(month) &&
      (inScope(transaction.accountId) ||
        (transaction.transferAccountId
          ? inScope(transaction.transferAccountId)
          : false)),
  );
  let incomeCents = 0;
  let expenseCents = 0;
  for (const transaction of monthTransactions) {
    if (transaction.transactionType === "income") {
      incomeCents += transaction.amountCents;
    } else if (transaction.transactionType === "expense") {
      expenseCents += transaction.amountCents;
    }
  }

  let projectedEndBalanceCents = selectedAccounts.reduce(
    (total, account) => total + account.openingBalanceCents,
    0,
  );
  for (const transaction of ledger.transactions) {
    if (transaction.status === "ignored" || transaction.occurredOn > end) {
      continue;
    }
    if (
      transaction.transactionType === "income" &&
      inScope(transaction.accountId)
    ) {
      projectedEndBalanceCents += transaction.amountCents;
    } else if (
      transaction.transactionType === "expense" &&
      inScope(transaction.accountId)
    ) {
      projectedEndBalanceCents -= transaction.amountCents;
    } else if (
      transaction.transactionType === "adjustment" &&
      inScope(transaction.accountId)
    ) {
      projectedEndBalanceCents += transaction.amountCents;
    } else if (transaction.transactionType === "transfer") {
      if (inScope(transaction.accountId)) {
        projectedEndBalanceCents -= transaction.amountCents;
      }
      if (
        transaction.transferAccountId &&
        inScope(transaction.transferAccountId)
      ) {
        projectedEndBalanceCents += transaction.amountCents;
      }
    }
  }

  let forecastIncomeCents = 0;
  let forecastExpenseCents = 0;
  let invalidRecurringSchedule = false;
  for (const entry of scopedActiveRecurringEntries) {
    const occurrences = recurringOccurrencesUntil(entry, currentDate, end);
    if (occurrences === null) {
      invalidRecurringSchedule = true;
      continue;
    }
    const forecastAmount = entry.amountCents * occurrences;
    if (entry.transactionType === "income") {
      forecastIncomeCents += forecastAmount;
      projectedEndBalanceCents += forecastAmount;
    } else {
      forecastExpenseCents += forecastAmount;
      projectedEndBalanceCents -= forecastAmount;
    }
  }

  const budgetTotal = ledger.budgets
    .filter((budget) => budget.month.startsWith(month))
    .reduce((total, budget) => total + budget.amountCents, 0);
  const budgetRemainingCents =
    budgetTotal > 0 ? budgetTotal - expenseCents : null;
  const remainingDays =
    Math.floor(
      (Date.parse(`${end}T00:00:00Z`) -
        Date.parse(`${currentDate}T00:00:00Z`)) /
        86_400_000,
    ) + 1;

  const missingInputs: string[] = [];
  if (selectedAccounts.length === 0) {
    missingInputs.push("Cadastre o saldo inicial de pelo menos uma conta.");
  }
  if (budgetRemainingCents === null) {
    missingInputs.push(
      "Defina um orçamento mensal para calcular o valor livre por dia.",
    );
  }
  if (scopedActiveRecurringEntries.length === 0) {
    missingInputs.push(
      "Cadastre entradas e contas recorrentes para completar a previsão.",
    );
  }
  if (invalidRecurringSchedule) {
    missingInputs.push(
      "Revise as datas das recorrências para completar a previsão.",
    );
  }

  return {
    incomeCents,
    expenseCents,
    resultCents: incomeCents - expenseCents,
    projectedEndBalanceCents,
    freePerDayCents:
      budgetRemainingCents === null || remainingDays <= 0
        ? null
        : Math.floor(budgetRemainingCents / remainingDays),
    confidence: missingInputs.length === 0 ? "complete" : "partial",
    missingInputs,
    budgetRemainingCents,
    forecastIncomeCents,
    forecastExpenseCents,
  };
}

export function buildFinanceWorkspace(
  ledger: FinanceLedger,
  currentDate: string,
  selectedAccountId: string | null = null,
): FinanceWorkspace {
  return {
    ...ledger,
    selectedAccountId,
    summary: buildMonthlyFinanceSummary(ledger, currentDate, selectedAccountId),
  };
}

export function normalizeFinancialAccountInput(formData: FormData):
  | {
      ok: true;
      value: {
        name: string;
        accountType: AccountType;
        openingBalanceCents: number;
      };
    }
  | { ok: false; message: string } {
  const name = String(formData.get("name") ?? "").trim();
  const accountType = String(formData.get("accountType") ?? "checking");
  const openingBalance = String(formData.get("openingBalance") ?? "").trim();
  const openingBalanceCents = openingBalance
    ? centsFromLocalizedValue(openingBalance)
    : 0;

  if (!name || name.length > 80) {
    return { ok: false, message: "Dê um nome de até 80 caracteres para a conta." };
  }
  if (!["checking", "cash", "savings", "credit"].includes(accountType)) {
    return { ok: false, message: "Escolha um tipo de conta válido." };
  }
  if (
    !Number.isSafeInteger(openingBalanceCents) ||
    Math.abs(openingBalanceCents) > 999_999_999_999
  ) {
    return { ok: false, message: "Informe um saldo inicial válido." };
  }
  return {
    ok: true,
    value: {
      name,
      accountType: accountType as AccountType,
      openingBalanceCents,
    },
  };
}

function parseCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += character;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function statementDate(value: string) {
  if (isValidIsoDate(value)) return value;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const normalized = `${match[3]}-${match[2]}-${match[1]}`;
  return isValidIsoDate(normalized) ? normalized : null;
}

function statementType(value: string, amountCents: number) {
  const normalized = normalizeText(value);
  if (/credito|entrada|recebimento|deposito|salario/.test(normalized)) {
    return "income" as const;
  }
  if (/debito|saida|compra|pagamento|tarifa/.test(normalized)) {
    return "expense" as const;
  }
  return amountCents < 0 ? ("expense" as const) : ("income" as const);
}

export function parseBankStatementCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return { rows: [] as StatementRow[], skipped: 0 };

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeText);
  const findHeader = (...names: string[]) =>
    headers.findIndex((header) => names.includes(header));
  const dateIndex = findHeader("data", "date");
  const descriptionIndex = findHeader(
    "descricao",
    "description",
    "historico",
    "lancamento",
  );
  const amountIndex = findHeader("valor", "amount");
  const typeIndex = findHeader("tipo", "type");
  const idIndex = findHeader("id", "fitid", "identificador");

  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    throw new Error("O CSV precisa ter colunas de data, descrição e valor.");
  }

  const rows: StatementRow[] = [];
  let skipped = 0;
  lines.slice(1).forEach((line, index) => {
    const cells = parseCsvLine(line, delimiter);
    const occurredOn = statementDate(cells[dateIndex] ?? "");
    const description = (cells[descriptionIndex] ?? "").trim();
    const signedAmountCents = centsFromLocalizedValue(
      cells[amountIndex] ?? "",
    );
    if (
      !occurredOn ||
      !description ||
      !Number.isSafeInteger(signedAmountCents) ||
      signedAmountCents === 0
    ) {
      skipped += 1;
      return;
    }

    rows.push({
      rowNumber: index + 2,
      description: description.slice(0, 120),
      amountCents: Math.abs(signedAmountCents),
      occurredOn,
      transactionType: statementType(
        typeIndex >= 0 ? cells[typeIndex] ?? "" : "",
        signedAmountCents,
      ),
      externalId:
        idIndex >= 0 ? (cells[idIndex] ?? "").trim() || null : null,
    });
  });

  return { rows, skipped };
}

function ofxField(transaction: string, name: string) {
  const match = transaction.match(
    new RegExp(`<${name}>\\s*([^<\\r\\n]+)`, "i"),
  );
  return match?.[1]?.trim() ?? "";
}

function decodeOfxText(value: string) {
  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'");
}

export function parseBankStatementOfx(text: string) {
  const transactions = [
    ...text.matchAll(
      /<STMTTRN\b[^>]*>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN\b|<\/BANKTRANLIST>|<\/OFX>))/gi,
    ),
  ];
  const rows: StatementRow[] = [];
  let skipped = 0;

  transactions.forEach((match, index) => {
    const transaction = match[1];
    const dateDigits = ofxField(transaction, "DTPOSTED")
      .replace(/\D/g, "")
      .slice(0, 8);
    const occurredOn =
      dateDigits.length === 8
        ? `${dateDigits.slice(0, 4)}-${dateDigits.slice(4, 6)}-${dateDigits.slice(6, 8)}`
        : "";
    const signedAmountCents = centsFromLocalizedValue(
      ofxField(transaction, "TRNAMT"),
    );
    const description = decodeOfxText(
      ofxField(transaction, "NAME") || ofxField(transaction, "MEMO"),
    );
    if (
      !isValidIsoDate(occurredOn) ||
      !description ||
      !Number.isSafeInteger(signedAmountCents) ||
      signedAmountCents === 0
    ) {
      skipped += 1;
      return;
    }

    rows.push({
      rowNumber: index + 1,
      description: description.slice(0, 120),
      amountCents: Math.abs(signedAmountCents),
      occurredOn,
      transactionType: statementType(
        ofxField(transaction, "TRNTYPE"),
        signedAmountCents,
      ),
      externalId: ofxField(transaction, "FITID") || null,
    });
  });

  return { rows, skipped };
}

export function parseBankStatement(text: string, fileName: string) {
  const normalizedName = fileName.toLowerCase();
  if (normalizedName.endsWith(".csv")) return parseBankStatementCsv(text);
  if (normalizedName.endsWith(".ofx")) return parseBankStatementOfx(text);
  throw new Error("Use um arquivo CSV ou OFX.");
}

export function answerFinanceQuestion(
  question: string,
  workspace: FinanceWorkspace,
) {
  const { summary } = workspace;
  if (summary.incomeCents === 0 && summary.expenseCents === 0) {
    return "Ainda não há lançamentos neste mês. Adicione um item ou importe um extrato para começar.";
  }

  const normalized = normalizeText(question);
  if (/receita|entrada|ganh/.test(normalized)) {
    return `As entradas do mês somam ${formatFinanceCurrency(summary.incomeCents)}.`;
  }
  if (/previs|saldo/.test(normalized)) {
    const caveat =
      summary.confidence === "partial"
        ? ` A previsão é parcial: ${summary.missingInputs.join(" ")}`
        : "";
    return `O saldo projetado ao fim do mês é ${formatFinanceCurrency(summary.projectedEndBalanceCents)}.${caveat}`;
  }
  if (/economizar|orcamento|livre/.test(normalized)) {
    return summary.freePerDayCents === null
      ? "Defina um orçamento mensal para eu calcular quanto está livre por dia."
      : `O orçamento deixa ${formatFinanceCurrency(summary.freePerDayCents)} livres por dia até o fim do mês.`;
  }

  return `Neste mês, entraram ${formatFinanceCurrency(summary.incomeCents)} e saíram ${formatFinanceCurrency(summary.expenseCents)}, com resultado de ${formatFinanceCurrency(summary.resultCents)}.`;
}
