export const expenseCategories = [
  "Moradia",
  "Alimentação",
  "Transporte",
  "Saúde",
  "Educação",
  "Lazer",
  "Assinaturas",
  "Outros",
] as const;

export type ExpenseType = "fixed" | "variable";
export type ExpenseSource = "manual" | "bank_import";

export type Expense = {
  id: string;
  expenseType: ExpenseType;
  description: string;
  category: string;
  amount: number;
  expenseDate: string;
  dueDay: number | null;
  source: ExpenseSource;
  active: boolean;
};

export type ExpenseInput = Omit<
  Expense,
  "id" | "source" | "active"
>;

export type FinanceSnapshot = {
  fixedTotal: number;
  variableTotal: number;
  monthTotal: number;
  topCategory: string | null;
  topCategoryTotal: number;
  visibleExpenses: Expense[];
};

type NormalizedExpense =
  | { ok: true; value: ExpenseInput }
  | { ok: false; message: string };

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatFinanceCurrency(value: number) {
  return currencyFormatter.format(value);
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

function numberFromLocalizedValue(value: string) {
  const cleaned = value.replace(/[R$\s]/g, "");
  const normalized =
    cleaned.includes(",") && cleaned.includes(".")
      ? cleaned.replace(/\./g, "").replace(",", ".")
      : cleaned.replace(",", ".");
  return Number(normalized);
}

function isValidIsoDate(value: string) {
  if (!isoDatePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) &&
    parsed.toISOString().slice(0, 10) === value;
}

export function normalizeExpenseInput(formData: FormData): NormalizedExpense {
  const expenseType = String(formData.get("expenseType") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const amount = numberFromLocalizedValue(
    String(formData.get("amount") ?? ""),
  );
  const expenseDate = String(formData.get("expenseDate") ?? "");
  const dueDayValue = Number(formData.get("dueDay"));

  if (expenseType !== "fixed" && expenseType !== "variable") {
    return { ok: false, message: "Escolha o tipo de despesa." };
  }
  if (!description || description.length > 120) {
    return { ok: false, message: "Informe uma descrição de até 120 caracteres." };
  }
  if (!expenseCategories.includes(category as (typeof expenseCategories)[number])) {
    return { ok: false, message: "Escolha uma categoria válida." };
  }
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9_999_999_999.99) {
    return { ok: false, message: "Informe um valor maior que zero." };
  }
  if (!isValidIsoDate(expenseDate)) {
    return { ok: false, message: "Informe uma data válida." };
  }
  if (
    expenseType === "fixed" &&
    (!Number.isInteger(dueDayValue) || dueDayValue < 1 || dueDayValue > 31)
  ) {
    return { ok: false, message: "Informe um dia de vencimento entre 1 e 31." };
  }

  return {
    ok: true,
    value: {
      expenseType,
      description,
      category,
      amount: Math.round(amount * 100) / 100,
      expenseDate,
      dueDay: expenseType === "fixed" ? dueDayValue : null,
    },
  };
}

export function buildFinanceSnapshot(
  expenses: Expense[],
  currentDate: string,
): FinanceSnapshot {
  const month = currentDate.slice(0, 7);
  const visibleExpenses = expenses.filter((expense) =>
    expense.expenseType === "fixed"
      ? expense.active
      : expense.expenseDate.startsWith(month),
  );
  let fixedTotal = 0;
  let variableTotal = 0;
  const categoryTotals = new Map<string, number>();

  for (const expense of visibleExpenses) {
    if (expense.expenseType === "fixed") fixedTotal += expense.amount;
    else variableTotal += expense.amount;
    categoryTotals.set(
      expense.category,
      (categoryTotals.get(expense.category) ?? 0) + expense.amount,
    );
  }

  let topCategory: string | null = null;
  let topCategoryTotal = 0;
  for (const [category, total] of categoryTotals) {
    if (total > topCategoryTotal) {
      topCategory = category;
      topCategoryTotal = total;
    }
  }

  return {
    fixedTotal,
    variableTotal,
    monthTotal: fixedTotal + variableTotal,
    topCategory,
    topCategoryTotal,
    visibleExpenses,
  };
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();
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

export function parseBankStatementCsv(text: string) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());
  if (lines.length < 2) return { rows: [], skipped: 0 };

  const delimiter = lines[0].includes(";") ? ";" : ",";
  const headers = parseCsvLine(lines[0], delimiter).map(normalizeHeader);
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

  if (dateIndex < 0 || descriptionIndex < 0 || amountIndex < 0) {
    throw new Error("O CSV precisa ter colunas de data, descrição e valor.");
  }

  const rows: Array<{
    description: string;
    amount: number;
    expenseDate: string;
    category: "Outros";
  }> = [];
  let skipped = 0;

  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line, delimiter);
    const date = statementDate(cells[dateIndex] ?? "");
    const description = (cells[descriptionIndex] ?? "").trim();
    const amount = numberFromLocalizedValue(cells[amountIndex] ?? "");
    const statementType = normalizeHeader(cells[typeIndex] ?? "");
    const isCredit = /credito|entrada|recebimento/.test(statementType) ||
      (!statementType && amount > 0);
    const isDebit = /debito|saida|compra/.test(statementType) || amount < 0;

    if (!date || !description || !Number.isFinite(amount) || !isDebit || isCredit) {
      skipped += 1;
      continue;
    }

    rows.push({
      description: description.slice(0, 120),
      amount: Math.round(Math.abs(amount) * 100) / 100,
      expenseDate: date,
      category: "Outros",
    });
  }

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
  const rows: Array<{
    description: string;
    amount: number;
    expenseDate: string;
    category: "Outros";
  }> = [];
  let skipped = 0;

  for (const match of transactions) {
    const transaction = match[1];
    const rawDate = ofxField(transaction, "DTPOSTED");
    const dateDigits = rawDate.replace(/\D/g, "").slice(0, 8);
    const expenseDate = dateDigits.length === 8
      ? `${dateDigits.slice(0, 4)}-${dateDigits.slice(4, 6)}-${dateDigits.slice(6, 8)}`
      : "";
    const amount = Number(ofxField(transaction, "TRNAMT").replace(",", "."));
    const transactionType = normalizeHeader(ofxField(transaction, "TRNTYPE"));
    const description = decodeOfxText(
      ofxField(transaction, "NAME") || ofxField(transaction, "MEMO"),
    );
    const isCredit =
      amount > 0 || /credit|dep|directdep|interest/.test(transactionType);
    const isDebit =
      amount < 0 ||
      /debit|check|payment|fee|cash|directdebit/.test(transactionType);

    if (
      !isValidIsoDate(expenseDate) ||
      !description ||
      !Number.isFinite(amount) ||
      !isDebit ||
      isCredit
    ) {
      skipped += 1;
      continue;
    }

    rows.push({
      description: description.slice(0, 120),
      amount: Math.round(Math.abs(amount) * 100) / 100,
      expenseDate,
      category: "Outros",
    });
  }

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
  snapshot: FinanceSnapshot,
) {
  if (snapshot.monthTotal === 0) {
    return "Ainda não há despesas neste mês. Adicione um gasto ou importe um extrato para começarmos.";
  }

  const normalized = normalizeHeader(question);
  if (
    /categoria|\bpesa\b|maior gasto/.test(normalized) &&
    snapshot.topCategory
  ) {
    return `${snapshot.topCategory} é a categoria que mais pesa neste mês, com ${formatFinanceCurrency(snapshot.topCategoryTotal)}.`;
  }
  if (/fixo|fixa/.test(normalized)) {
    const share = Math.round(
      (snapshot.fixedTotal / snapshot.monthTotal) * 100,
    );
    return `Seus gastos fixos somam ${formatFinanceCurrency(snapshot.fixedTotal)} e representam ${share}% das despesas do mês.`;
  }
  if (/variavel|economizar|dica/.test(normalized)) {
    return `As despesas variáveis estão em ${formatFinanceCurrency(snapshot.variableTotal)}. Comece revisando ${snapshot.topCategory ?? "a maior categoria"} antes de cortar itens essenciais.`;
  }

  return `Neste mês você registrou ${formatFinanceCurrency(snapshot.monthTotal)} em despesas: ${formatFinanceCurrency(snapshot.fixedTotal)} fixas e ${formatFinanceCurrency(snapshot.variableTotal)} variáveis.`;
}
