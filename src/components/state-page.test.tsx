import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatePage } from "./state-page";

describe("StatePage", () => {
  it("apresenta o estado e preserva a ação de recuperação", () => {
    render(
      <StatePage eyebrow="Algo mudou" title="Não encontramos esta página.">
        <button type="button">Tentar novamente</button>
      </StatePage>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Não encontramos esta página.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Tentar novamente" }),
    ).toBeInTheDocument();
  });
});
