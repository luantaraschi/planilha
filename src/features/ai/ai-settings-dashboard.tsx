import { AppSidebar } from "@/components/app-sidebar";
import { GardenIcon } from "@/components/garden-icon";
import { AiSettingsForm } from "./ai-settings-form";
import type { AiSettingsView } from "./ai-settings-repository";
import styles from "./ai-settings.module.css";

export function AiSettingsDashboard({
  greetingName,
  settings,
}: {
  greetingName: string;
  settings: AiSettingsView;
}) {
  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#conteudo-configuracoes">
        Pular para o conteúdo
      </a>
      <AppSidebar active="settings" />

      <main className={styles.main} id="conteudo-configuracoes">
        <header className={styles.pageHeader}>
          <div>
            <p className={styles.eyebrow}>Configurações de {greetingName}</p>
            <h1>Seu agente, do seu jeito</h1>
            <p>
              Escolha quando usar IA online e mantenha o modo local sempre à
              mão.
            </p>
          </div>
          <span aria-hidden="true" className={styles.envelope}>
            <GardenIcon name="settings" size={49} />
            <i />
          </span>
        </header>

        <aside className={styles.costPromise}>
          <GardenIcon name="finance" size={24} />
          <p>
            <strong>Sem mensalidade do app.</strong> O único valor externo é o
            consumo direto da API que você escolher.
          </p>
          <span>modo local disponível</span>
        </aside>

        <AiSettingsForm settings={settings} />
      </main>
    </div>
  );
}
