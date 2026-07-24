export type TimelineItem = {
  id: string;
  time: string;
  title: string;
  kind: "event" | "task" | "bill" | "habit";
  detail: string;
};

export type TodaySnapshot = {
  date: Date;
  greetingName: string;
  timeZone: string;
  timeline: TimelineItem[];
  priorities: Array<{ id: string; title: string; done: boolean }>;
  habits: Array<{ id: string; title: string; done: boolean; time?: string }>;
  freeToSpendCents: number;
  projectedBalanceCents: number;
};

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatLongDate(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone,
  }).format(date);
}
