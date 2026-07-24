import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AppSidebar } from "./app-sidebar";

const navigationCss = readFileSync(
  resolve("src/features/today/today-dashboard.module.css"),
  "utf8",
);

describe("AppSidebar", () => {
  it("keeps visible short labels for every destination in the tablet rail", () => {
    const { container } = render(<AppSidebar active="finance" />);

    expect(
      [...container.querySelectorAll("[data-compact-label]")].map((label) =>
        label.textContent?.trim(),
      ),
    ).toEqual([
      "Hoje",
      "Agenda",
      "Tarefas",
      "Finanças",
      "Bem-estar",
      "Metas",
      "Notas",
      "Assistente",
      "Ajustes",
    ]);
    expect(
      screen.getByRole("link", { name: "Finanças" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      [...container.querySelectorAll("nav > a")].map((link) =>
        link.getAttribute("aria-label"),
      ),
    ).toEqual([
      "Hoje",
      "Agenda",
      "Tarefas",
      "Finanças",
      "Bem-estar",
      "Metas",
      "Notas",
      "Assistente",
      "Configurações",
    ]);
    expect(
      container.querySelector("nav > form button"),
    ).toHaveAttribute("aria-label", "Sair");
  });

  it("exposes the active secondary destination through the mobile More state", () => {
    const { container } = render(<AppSidebar active="settings" />);

    expect(container.querySelector("details")).toHaveAttribute(
      "data-active",
      "true",
    );
    expect(
      screen
        .getAllByRole("link", { name: "Configurações" })
        .every((link) => link.getAttribute("aria-current") === "page"),
    ).toBe(true);
  });
});

describe("responsive navigation contract", () => {
  it("uses bottom navigation only below 600px", () => {
    expect(navigationCss).toContain("@media (max-width: 37.499rem)");
  });

  it("uses a labeled rail from 600px through 1023px", () => {
    const tabletRules = navigationCss
      .split("@media (min-width: 37.5rem) and (max-width: 63.999rem)")[1]
      ?.split("@media (max-width: 37.499rem)")[0];

    expect(tabletRules).toContain(".navCompactLabel");
    expect(tabletRules).toMatch(/grid-template-columns:\s*6\.75rem/);
  });
});
