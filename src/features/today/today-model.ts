export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  kind: "event" | "task" | "bill";
  detail: string;
};

export type TodaySnapshot = {
  date: Date;
  greetingName: string;
  timeline: TimelineItem[];
  priorities: Array<{ id: string; title: string; done: boolean }>;
  habits: Array<{ id: string; title: string; done: boolean }>;
  freeToSpendCents: number;
  projectedBalanceCents: number;
};

export const TODAY_DEMO: TodaySnapshot = {
  date: new Date("2026-07-23T12:00:00-03:00"),
  greetingName: "Lu",
  timeline: [
    {
      id: "planning",
      time: "09:00",
      title: "Planejamento da semana",
      kind: "event",
      detail: "Google Agenda",
    },
    {
      id: "proposal",
      time: "11:00",
      title: "Finalizar proposta",
      kind: "task",
      detail: "45 min",
    },
    {
      id: "dentist",
      time: "14:30",
      title: "Dentista",
      kind: "event",
      detail: "Clínica Aurora",
    },
    {
      id: "energy",
      time: "17:00",
      title: "Pagar energia",
      kind: "bill",
      detail: "R$ 186,00",
    },
  ],
  priorities: [
    { id: "documents", title: "Enviar documentos", done: false },
    { id: "budget", title: "Revisar orçamento de agosto", done: true },
    { id: "medicine", title: "Comprar remédio", done: false },
  ],
  habits: [
    { id: "water", title: "Beber água", done: false },
    { id: "walk", title: "Caminhar 30 minutos", done: true },
    { id: "read", title: "Ler 20 minutos", done: false },
  ],
  freeToSpendCents: 14_500,
  projectedBalanceCents: 215_000,
};

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Bahia",
  }).format(date);
}
