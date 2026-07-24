import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TodaySnapshot } from "./today-model";
import { TodayDashboard } from "./today-dashboard";

const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";
const TODAY_SNAPSHOT: TodaySnapshot = {
  date: new Date("2026-07-23T12:00:00-03:00"),
  greetingName: "Lu",
  timeline: [
    {
      id: "planning",
      time: "09:00",
      title: "Planejamento da semana",
      kind: "event",
      detail: "Google Agenda · sincronizado 08:45",
    },
    {
      id: "proposal",
      time: "11:00",
      title: "Finalizar proposta",
      kind: "task",
      detail: "45 min",
    },
    {
      id: "energy",
      time: "17:00",
      title: "Pagar energia",
      kind: "bill",
      detail: "Conta planejada",
    },
  ],
  priorities: [
    { id: "documents", title: "Enviar documentos", done: false },
    { id: "budget", title: "Revisar orçamento de agosto", done: true },
  ],
  habits: [],
  freeToSpendCents: 14_500,
  projectedBalanceCents: 215_000,
};

describe("TodayDashboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("apresenta agenda, prioridades e panorama financeiro do dia", () => {
    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Bom dia, Lu" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("navigation", { name: "Principal" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pular para o conteúdo" }),
    ).toHaveAttribute("href", "#conteudo-principal");
    expect(screen.getByText("Planejamento da semana")).toBeInTheDocument();
    expect(screen.getByText(/sincronizado 08:45/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /R\$\s145,00/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Prioridades" }),
    ).toBeInTheDocument();
  });

  it("oferece captura rápida e check-in de humor acessíveis", async () => {
    const user = userEvent.setup();
    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);

    const capture = screen.getByRole("textbox", { name: "Captura rápida" });
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    expect(capture).toHaveFocus();
    expect(screen.getAllByRole("radio")).toHaveLength(5);
    expect(screen.getByRole("radio", { name: "Bem" })).toBeInTheDocument();
  });

  it("confirma a captura sem sugerir persistência", async () => {
    const user = userEvent.setup();
    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);

    const capture = screen.getByRole("textbox", { name: "Captura rápida" });
    await user.type(capture, "Pagar internet");
    await user.click(screen.getByRole("button", { name: "Adicionar" }));

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      "“Pagar internet” foi adicionado só nesta prévia.",
    );
    expect(status).not.toHaveAttribute("aria-label");
    expect(capture).not.toHaveAttribute("aria-label");
    expect(capture).toHaveValue("");
  });

  it("restaura somente o rascunho ainda não enviado da captura rápida", async () => {
    localStorage.setItem(
      `quick-capture-draft:${USER_A}`,
      "Levar guarda-chuva",
    );

    const { unmount } = render(
      <TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />,
    );
    expect(
      screen.getByRole("textbox", { name: "Captura rápida" }),
    ).toHaveValue("Levar guarda-chuva");

    const user = userEvent.setup();
    await user.clear(
      screen.getByRole("textbox", { name: "Captura rápida" }),
    );
    await user.type(
      screen.getByRole("textbox", { name: "Captura rápida" }),
      "Comprar pão",
    );
    expect(localStorage.getItem(`quick-capture-draft:${USER_A}`)).toBe(
      "Comprar pão",
    );

    unmount();
    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);
    expect(
      screen.getByRole("textbox", { name: "Captura rápida" }),
    ).toHaveValue("Comprar pão");
  });

  it("não revela o draft de uma conta após logout e login em outra", async () => {
    const user = userEvent.setup();
    const first = render(
      <TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />,
    );
    await user.type(
      screen.getByRole("textbox", { name: "Captura rápida" }),
      "Nota privada da conta A",
    );
    first.unmount();

    const second = render(
      <TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_B} />,
    );
    expect(
      screen.getByRole("textbox", { name: "Captura rápida" }),
    ).toHaveValue("");
    await user.type(
      screen.getByRole("textbox", { name: "Captura rápida" }),
      "Nota da conta B",
    );
    second.unmount();

    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);
    expect(
      screen.getByRole("textbox", { name: "Captura rápida" }),
    ).toHaveValue("Nota privada da conta A");
  });

  it("continua utilizável quando o armazenamento local está indisponível", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });

    const user = userEvent.setup();
    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);
    const capture = screen.getByRole("textbox", { name: "Captura rápida" });
    await user.type(capture, "Ainda funciona");

    expect(capture).toHaveValue("Ainda funciona");
  });

  it("agrupa os módulos secundários em Mais", async () => {
    const user = userEvent.setup();
    render(<TodayDashboard snapshot={TODAY_SNAPSHOT} userId={USER_A} />);

    const more = screen.getByText("Mais").closest("summary");
    expect(more).not.toBeNull();
    await user.click(more!);

    expect(more?.closest("details")).toHaveAttribute("open");
    expect(
      screen.getAllByRole("button", { name: "Sair" }),
    ).toHaveLength(2);
  });

  it("orienta o primeiro uso quando ainda não há planejamento real", () => {
    render(
      <TodayDashboard
        snapshot={{
          ...TODAY_SNAPSHOT,
          timeline: [],
          priorities: [],
          habits: [],
        }}
        userId={USER_A}
      />,
    );

    expect(screen.getByText("Seu dia ainda está aberto.")).toBeInTheDocument();
    expect(screen.getByText("Nenhuma prioridade sem horário.")).toBeInTheDocument();
    expect(screen.getByText("Hábitos chegam na próxima etapa.")).toBeInTheDocument();
  });
});
