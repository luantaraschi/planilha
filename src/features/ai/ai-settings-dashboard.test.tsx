import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AiSettingsDashboard } from "./ai-settings-dashboard";

describe("AiSettingsDashboard", () => {
  it("shows a complete, masked agent configuration", () => {
    render(
      <AiSettingsDashboard
        greetingName="Lu"
        settings={{
          provider: "openai",
          model: "gpt-5.6-luna",
          instructions: "Explique sem julgamentos.",
          enabled: true,
          hasApiKey: true,
          apiKeyHint: "9xYz",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Seu agente, do seu jeito",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Modelo")).toHaveValue("gpt-5.6-luna");
    expect(screen.getByLabelText("Chave da API")).toHaveValue("");
    expect(screen.getByText(/terminada em 9xYz/)).toBeInTheDocument();
    expect(screen.getByLabelText("Usar IA online no chat")).toBeChecked();
    expect(screen.getByLabelText("Instruções para o agente")).toHaveValue(
      "Explique sem julgamentos.",
    );
    expect(
      screen.getByRole("button", { name: "Salvar agente" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Criar chave na OpenAI" }),
    ).toHaveAttribute("href", "https://platform.openai.com/api-keys");
  });
});
