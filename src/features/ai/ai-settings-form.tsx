"use client";

import { useActionState } from "react";
import {
  saveAiSettings,
  type AiSettingsActionState,
} from "./ai-settings-actions";
import type { AiSettingsView } from "./ai-settings-repository";
import styles from "./ai-settings.module.css";

const initialState: AiSettingsActionState = {
  status: "idle",
  message: "",
};

export function AiSettingsForm({
  settings,
}: {
  settings: AiSettingsView;
}) {
  const [state, formAction, pending] = useActionState(
    saveAiSettings,
    initialState,
  );
  const visibleSettings = state.settings ?? settings;

  return (
    <form action={formAction} className={styles.settingsSheet}>
      <section aria-labelledby="provider-title" className={styles.formSection}>
        <div className={styles.sectionNumber}>01</div>
        <div className={styles.sectionBody}>
          <header>
            <p className={styles.kicker}>Conexão</p>
            <h2 id="provider-title">Provedor e modelo</h2>
            <p>
              Você usa sua própria conta. O app não cobra assinatura nem
              adiciona margem sobre a API.
            </p>
          </header>

          <div className={styles.fieldGrid}>
            <label htmlFor="ai-provider">
              <span>Provedor</span>
              <input id="ai-provider" readOnly value="OpenAI" />
            </label>
            <label htmlFor="ai-model">
              <span>Modelo</span>
              <input
                aria-label="Modelo"
                defaultValue={settings.model}
                id="ai-model"
                list="openai-models"
                name="model"
                required
              />
              <datalist id="openai-models">
                <option value="gpt-5.6-luna">Econômico</option>
                <option value="gpt-5.6-terra">Equilibrado</option>
                <option value="gpt-5.6-sol">Mais capaz</option>
              </datalist>
              <small>
                Selecione uma sugestão ou informe outro ID disponível na sua
                conta.
              </small>
            </label>
          </div>
        </div>
      </section>

      <section aria-labelledby="key-title" className={styles.formSection}>
        <div className={styles.sectionNumber}>02</div>
        <div className={styles.sectionBody}>
          <header>
            <p className={styles.kicker}>Seu cofre</p>
            <h2 id="key-title">Credencial de acesso</h2>
            <p>
              O campo sempre abre vazio. Digite uma chave apenas para adicionar
              ou substituir a atual.
            </p>
          </header>

          <label className={styles.fullField} htmlFor="ai-api-key">
            <span>Chave da API</span>
            <input
              aria-label="Chave da API"
              autoComplete="off"
              id="ai-api-key"
              name="apiKey"
              placeholder={
                visibleSettings.hasApiKey ? "••••••••••••••••" : "sk-…"
              }
              type="password"
            />
          </label>

          <div
            className={styles.keyStatus}
            data-saved={visibleSettings.hasApiKey}
          >
            <span aria-hidden="true" className={styles.keySeal} />
            <p>
              <strong>
                {visibleSettings.hasApiKey
                  ? "Chave guardada"
                  : "Nenhuma chave guardada"}
              </strong>
              {visibleSettings.hasApiKey
                ? ` · terminada em ${visibleSettings.apiKeyHint}`
                : " · o chat usa respostas locais gratuitas"}
            </p>
            <a
              href="https://platform.openai.com/api-keys"
              rel="noreferrer"
              target="_blank"
            >
              Criar chave na OpenAI
            </a>
          </div>

          {visibleSettings.hasApiKey ? (
            <label className={styles.removeKey}>
              <input name="removeApiKey" type="checkbox" />
              <span>Remover a chave guardada e voltar ao modo local</span>
            </label>
          ) : null}
        </div>
      </section>

      <section aria-labelledby="behavior-title" className={styles.formSection}>
        <div className={styles.sectionNumber}>03</div>
        <div className={styles.sectionBody}>
          <header>
            <p className={styles.kicker}>Personalidade</p>
            <h2 id="behavior-title">Como ele deve conversar</h2>
            <p>
              Diga o tom e as preferências que devem acompanhar suas perguntas
              financeiras.
            </p>
          </header>

          <label className={styles.fullField} htmlFor="ai-instructions">
            <span>Instruções para o agente</span>
            <textarea
              aria-label="Instruções para o agente"
              defaultValue={settings.instructions}
              id="ai-instructions"
              maxLength={2000}
              name="instructions"
              placeholder="Ex.: seja direto, explique termos difíceis e nunca use tom de julgamento."
              rows={5}
            />
          </label>

          <label className={styles.toggle}>
            <input
              aria-label="Usar IA online no chat"
              defaultChecked={visibleSettings.enabled}
              key={`enabled-${visibleSettings.enabled}`}
              name="enabled"
              type="checkbox"
            />
            <span aria-hidden="true" className={styles.toggleTrack}>
              <i />
            </span>
            <span>
              <strong>Usar IA online no chat</strong>
              <small>
                Se estiver desligado, o assistente continua com análises locais
                sem custo de API.
              </small>
            </span>
          </label>
        </div>
      </section>

      <footer className={styles.formFooter}>
        <p
          aria-live="polite"
          data-status={state.status}
          role={state.message ? "status" : undefined}
        >
          {state.message ||
            "A chave é criptografada e nunca é enviada de volta ao navegador."}
        </p>
        <button disabled={pending} type="submit">
          {pending ? "Guardando…" : "Salvar agente"}
        </button>
      </footer>
    </form>
  );
}
