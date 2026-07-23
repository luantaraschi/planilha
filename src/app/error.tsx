"use client";

import { StatePage } from "@/components/state-page";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <StatePage
      eyebrow="Seu espaço continua seguro"
      title="Não conseguimos carregar esta parte agora."
    >
      <button onClick={reset} type="button">
        Tentar novamente
      </button>
    </StatePage>
  );
}
