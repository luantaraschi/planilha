import { StatePage } from "@/components/state-page";

export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Carregando seu dia"
      aria-live="polite"
      role="status"
    >
      <StatePage eyebrow="Só um instante" title="Organizando seu dia…" />
    </div>
  );
}
