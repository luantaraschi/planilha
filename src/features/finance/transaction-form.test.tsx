import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TransactionForm } from "./transaction-form";

const accounts = [
  {
    id: "10000000-0000-4000-8000-000000000001",
    name: "Conta principal",
    accountType: "checking" as const,
    openingBalanceCents: 0,
    active: true,
  },
  {
    id: "10000000-0000-4000-8000-000000000002",
    name: "Reserva",
    accountType: "savings" as const,
    openingBalanceCents: 0,
    active: true,
  },
];

const categories = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Salário",
    categoryType: "income" as const,
    active: true,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Moradia",
    categoryType: "expense" as const,
    active: true,
  },
];

describe("TransactionForm", () => {
  it("switches category for a destination account when transfer is selected", async () => {
    const user = userEvent.setup();
    render(
      <TransactionForm
        accounts={accounts}
        categories={categories}
        defaultDate="2026-07-24"
      />,
    );

    expect(
      screen.getByRole("combobox", { name: "Categoria" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo" }),
      "transfer",
    );

    expect(
      screen.queryByRole("combobox", { name: "Categoria" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("combobox", { name: "Conta de destino" }),
    ).toBeInTheDocument();
  });
});
