import Link from "next/link";
import { StatePage } from "@/components/state-page";

export default function NotFound() {
  return (
    <StatePage
      eyebrow="Essa página saiu para tomar um café"
      title="Não encontramos o que você procurou."
    >
      <Link href="/">Voltar para Hoje</Link>
    </StatePage>
  );
}
