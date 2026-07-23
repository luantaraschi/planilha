import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const actions = vi.hoisted(() => ({
  signIn: vi.fn(),
  signUp: vi.fn(),
  signInWithGoogle: vi.fn(),
}));

vi.mock("./auth-actions", () => actions);

import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    actions.signIn.mockResolvedValue({ message: "" });
    actions.signUp.mockResolvedValue({ message: "" });
    actions.signInWithGoogle.mockResolvedValue({ message: "" });
  });

  it("offers accessible email, password and both account paths", () => {
    render(<AuthForm />);
    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("minLength", "8");
    const signIn = screen.getByRole("button", { name: "Entrar" });
    const google = screen.getByRole("button", {
      name: "Continuar com Google",
    });
    expect(signIn).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar minha conta" }),
    ).toBeInTheDocument();
    expect(google).toBeInTheDocument();
    expect(google.closest("form")).not.toBe(signIn.closest("form"));
  });

  it("uses sign in when Enter submits credentials", async () => {
    const user = userEvent.setup();
    render(<AuthForm />);

    await user.type(
      screen.getByRole("textbox", { name: "E-mail" }),
      "lu@example.com",
    );
    await user.type(screen.getByLabelText("Senha"), "12345678{Enter}");

    await waitFor(() => expect(actions.signIn).toHaveBeenCalledOnce());
    expect(actions.signUp).not.toHaveBeenCalled();
  });

  it("shows only the message from the latest submitted action", async () => {
    const user = userEvent.setup();
    actions.signIn.mockResolvedValue({ message: "Erro ao entrar." });
    actions.signUp.mockResolvedValue({ message: "Erro ao criar conta." });
    actions.signInWithGoogle.mockResolvedValue({
      message: "Erro no Google.",
    });
    render(<AuthForm />);

    await user.type(
      screen.getByRole("textbox", { name: "E-mail" }),
      "lu@example.com",
    );
    await user.type(screen.getByLabelText("Senha"), "12345678");
    await user.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Erro ao entrar.",
    );

    const email = screen.getByRole("textbox", { name: "E-mail" });
    const password = screen.getByLabelText("Senha");
    await user.clear(email);
    await user.type(email, "lu@example.com");
    await user.clear(password);
    await user.type(password, "12345678");
    await user.click(
      screen.getByRole("button", { name: "Criar minha conta" }),
    );
    await waitFor(() => expect(actions.signUp).toHaveBeenCalledOnce());
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Erro ao criar conta.",
      ),
    );

    await user.click(
      screen.getByRole("button", { name: "Continuar com Google" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Erro no Google."),
    );
  });
});
