import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ExpenseForm } from "./expense-form";

describe("ExpenseForm", () => {
  it("pede vencimento apenas para um gasto fixo", async () => {
    const user = userEvent.setup();
    render(<ExpenseForm defaultDate="2026-07-23" />);

    expect(
      screen.getByRole("spinbutton", { name: "Dia do vencimento" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Tipo" }),
      "variable",
    );

    expect(
      screen.queryByRole("spinbutton", { name: "Dia do vencimento" }),
    ).not.toBeInTheDocument();
  });
});
