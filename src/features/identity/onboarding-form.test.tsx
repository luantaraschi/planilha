import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  completeOnboarding: vi.fn(),
}));

vi.mock("./onboarding-actions", () => actions);

import { OnboardingForm } from "./onboarding-form";

describe("OnboardingForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    actions.completeOnboarding.mockResolvedValue({ message: "" });
  });

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

  it("associates errors only after a failed submit", async () => {
    const user = userEvent.setup();
    actions.completeOnboarding.mockResolvedValue({
      message: "Não foi possível preparar seu espaço.",
    });
    render(<OnboardingForm initialName="Lu" />);

    const name = screen.getByRole("textbox", {
      name: "Como podemos chamar você?",
    });
    const timezone = screen.getByRole("combobox", {
      name: "Fuso horário",
    });
    expect(name).not.toHaveAttribute("aria-describedby");
    expect(name).not.toHaveAttribute("aria-invalid");
    expect(timezone).not.toHaveAttribute("aria-describedby");
    expect(timezone).not.toHaveAttribute("aria-invalid");

    await user.click(
      screen.getByRole("button", { name: "Preparar meu espaço" }),
    );

    const error = await screen.findByRole("alert");
    expect(error).toHaveAttribute("id", "onboarding-error");
    expect(name).toHaveAttribute("aria-describedby", "onboarding-error");
    expect(name).toHaveAttribute("aria-invalid", "true");
    expect(timezone).toHaveAttribute(
      "aria-describedby",
      "onboarding-error",
    );
    expect(timezone).toHaveAttribute("aria-invalid", "true");
  });

  it("announces a pending onboarding submission", async () => {
    const user = userEvent.setup();
    actions.completeOnboarding.mockImplementation(() => new Promise(() => {}));
    render(<OnboardingForm initialName="Lu" />);

    const submit = screen.getByRole("button", {
      name: "Preparar meu espaço",
    });
    await user.click(submit);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Preparando seu espaço.",
    );
    expect(submit).toBeDisabled();
  });
});
