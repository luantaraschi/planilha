import { StatePage } from "@/components/state-page";

export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Carregando seu dia">
      <StatePage eyebrow="Só um instante" title="Organizando seu dia…" />
    </div>
  );
}
