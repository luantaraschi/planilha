import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AuthForm } from "./auth-form";

describe("AuthForm", () => {
  it("offers accessible email, password and both account paths", () => {
    render(<AuthForm />);
    expect(screen.getByRole("textbox", { name: "E-mail" })).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toHaveAttribute("minLength", "8");
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Criar minha conta" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continuar com Google" }),
    ).toBeInTheDocument();
  });
});
