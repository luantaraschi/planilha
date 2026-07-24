# Task 0 — Responsive shell, PWA e visual gate

## Status

Implementação concluída. Os gates determinísticos, a suíte completa, o build e
o gate E2E responsivo passam.

## RED / GREEN

| Ciclo | RED observado | GREEN |
| --- | --- | --- |
| Navegação | não havia labels compactos, estado ativo de `Mais` nem breakpoints 600/1024 | `AppSidebar` expõe labels curtos reais; CSS usa barra `<600`, rail `600–1023` e sidebar `>=1024` |
| Nomes acessíveis | os links e `Sair` perdiam o nome acessível no rail porque o texto completo era ocultado | os destinos diretos recebem `aria-label` estável e o gate inspeciona a árvore AX no viewport de 800 px |
| Label in Name | Configurações tinha texto visível “Ajustes” no rail, divergente do nome AX “Configurações” | o texto compacto, o `aria-label` e o nome AX são “Configurações”; o ellipsis existente continua disponível |
| Draft local | a captura rápida iniciava vazia após remontagem e a chave fixa podia vazar entre contas | somente o rascunho não enviado usa `localStorage`, com chave derivada do `user.id`; troca A → B → A preserva isolamento e storage indisponível não quebra a captura |
| PWA | manifest, service worker, shell offline, ícones e estado de conexão não existiam | manifest instalável, dois SVGs autorais, fallback público e aviso com retry |
| Cache privado | não existia política testável | service worker só pré-cacheia `/offline.html` e os ícones; navegações usam network-only com fallback e nunca são gravadas |
| Auditor responsivo | viewports e falhas de segurança visual não existiam | biblioteca compartilha cinco viewports e falha em overflow, ações cobertas e dialogs inacessíveis |
| Reload do gate | `Page.reload` podia validar o DOM anterior | cada iteração marca o documento antigo e aguarda um documento novo, `readyState="complete"` e a captura rápida conectada e dimensionada |
| Zoom do rail | `Sair` ficava fora da altura útil no gate a 200% | a navegação tem rolagem vertical própria e mantém foco e ações alcançáveis |
| Lint/build | lint rejeitou `setState` em effect; CSS Module rejeitou seletor global | inicializador lazy e seletor qualificado passaram em lint e build |

### Correções da revisão independente

Os testes foram escritos e observados em RED antes das correções:

- `app-navigation.test.tsx` falhou porque os nove links diretos e `Sair` não
  tinham nomes acessíveis estáveis;
- `today-dashboard.test.tsx` falhou ao restaurar a chave escopada, mostrou o
  draft da conta A na conta B e quebrou quando o navegador lançou
  `SecurityError`;
- `browser-gate-lib.node-test.mjs` falhou porque não havia marcador de documento,
  espera por carregamento completo nem inspeção da árvore AX.
- o teste do componente reproduziu “Ajustes” no texto compacto, e a primeira
  execução E2E confirmou a expectativa antiga na ordem de foco.

Em GREEN:

- os links do rail e `Sair` mantêm os nomes esperados;
- o draft usa `quick-capture-draft:${userId}`, resiste a falhas de
  `localStorage` e foi testado na sequência A → B → A;
- o gate espera a nova navegação sem sleeps fixos e consulta
  `Accessibility.getFullAXTree` em 800 px.
- o gate compara exatamente, na ordem, os nove pares de texto visível e
  `aria-label`; “Configurações” também foi confirmado na ordem de foco e na
  árvore AX.

## Verificações finais

- `npm test`: 35 arquivos, 128 testes, todos passaram.
- `npm run typecheck`: passou.
- `npm run lint`: passou sem warning.
- `npm run build`: passou; `/manifest.webmanifest` foi gerado como rota
  estática.
- `git diff --check`: passou; apenas avisos esperados de LF/CRLF do Windows.
- `npm run test:browser`:
  - 16/16 testes unitários passaram;
  - identidade, onboarding, logout/login e auditoria de zoom passaram;
  - os cinco viewports foram validados: 360×800, 800×1280, 1280×800, 720×800 e
    1440×900;
  - o viewport mobile foi exercitado com Pointer Events
    `pointerType="touch"` sobre alvo confirmado por `elementFromPoint`;
  - a árvore de acessibilidade do rail em 800 px contém Hoje, Agenda, Tarefas,
    Finanças, Bem-estar, Metas, Notas, Assistente, Configurações e Sair.

## Arquivos

Criados na Task 0:

- `public/icons/garden-app.svg`
- `public/icons/garden-maskable.svg`
- `public/offline.html`
- `public/sw.js`
- `scripts/browser-responsive-gate.mjs`
- `src/app/manifest.test.ts`
- `src/app/manifest.ts`
- `src/components/app-navigation.test.tsx`
- `src/components/service-worker-registration.tsx`

Principais arquivos modificados:

- `DESIGN.md`
- `package.json`
- `scripts/browser-gate-lib.mjs`
- `scripts/browser-gate-lib.node-test.mjs`
- `scripts/browser-identity-gate.mjs`
- `scripts/browser-responsive-gate.mjs`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/page.tsx`
- `src/components/app-sidebar.tsx`
- `src/features/ai/ai-settings.module.css`
- `src/features/finance/finance-dashboard.module.css`
- `src/features/finance/finance-responsive.test.ts`
- `src/features/today/quick-capture.tsx`
- `src/features/today/today-dashboard.module.css`
- `src/features/today/today-dashboard.test.tsx`
- `src/features/today/today-dashboard.tsx`

## Self-review

- Contratos financeiros do head `58ea597` foram preservados; a suíte completa
  segue verde.
- Nenhuma dependência, framework ou pack de ícones foi adicionado.
- `GardenIcon`, tokens e gramática Jardim de Pêssego foram reutilizados.
- O service worker não chama `cache.put`, não busca cache por request e não
  armazena navegações, APIs ou respostas autenticadas.
- Safe areas, foco, active state, movimento reduzido já existente e rolagem sob
  zoom foram mantidos em todos os modos.
- O draft local se limita à captura rápida existente, é isolado pelo UUID
  verificado da sessão e não cria um framework genérico.
- A revisão final não encontrou mudanças fora do escopo.
