import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OnboardingForm } from "./onboarding-form";

describe("OnboardingForm", () => {
  it("shows the required identity and preference controls", () => {
    render(<OnboardingForm initialName="Lu" />);

    expect(
      screen.getByRole("textbox", {
        name: "Como podemos chamar você?",
      }),
    ).toHaveValue("Lu");
    expect(
      screen.getByRole("combobox", { name: "Fuso horário" }),
    ).toHaveValue("America/Bahia");
    expect(
      screen.getByRole("checkbox", { name: /lembretes por e-mail/i }),
    ).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: /usar ia/i }),
    ).not.toBeChecked();
    expect(
      screen.getByRole("button", { name: "Preparar meu espaço" }),
    ).toBeInTheDocument();
  });
});
