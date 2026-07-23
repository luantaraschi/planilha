import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { TODAY_DEMO } from "./today-model";
import { TodayDashboard } from "./today-dashboard";

describe("TodayDashboard", () => {
  it("apresenta agenda, prioridades e panorama financeiro do dia", () => {
    render(<TodayDashboard snapshot={TODAY_DEMO} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bom dia, Lu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Principal" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Planejamento da semana")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /R\$\s145,00/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Prioridades" }),
    ).toBeInTheDocument();
  });

  it("oferece captura rápida e check-in de humor acessíveis", async () => {
    const user = userEvent.setup();
    render(<TodayDashboard snapshot={TODAY_DEMO} />);

    const capture = screen.getByRole("textbox", { name: "Captura rápida" });
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(capture).toHaveFocus();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("radio", { name: "Bem" })).toBeInTheDocument();
  });
});
