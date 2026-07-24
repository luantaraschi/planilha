# Task 0 — Responsive shell, PWA e visual gate

## Status

Implementação concluída e commitada com uma preocupação aberta no controlador
E2E responsivo, detalhada abaixo. Os gates determinísticos, a suíte completa e o
build passam.

## RED / GREEN

| Ciclo | RED observado | GREEN |
| --- | --- | --- |
| Navegação | não havia labels compactos, estado ativo de `Mais` nem breakpoints 600/1024 | `AppSidebar` expõe labels curtos reais; CSS usa barra `<600`, rail `600–1023` e sidebar `>=1024` |
| Draft local | captura rápida iniciava vazia após remontagem | somente o rascunho não enviado usa `localStorage`; envio e campo vazio removem a chave |
| PWA | manifest, service worker, shell offline, ícones e estado de conexão não existiam | manifest instalável, dois SVGs autorais, fallback público e aviso com retry |
| Cache privado | não existia política testável | service worker só pré-cacheia `/offline.html` e os ícones; navegações usam network-only com fallback e nunca são gravadas |
| Auditor responsivo | viewports e falhas de segurança visual não existiam | biblioteca compartilha cinco viewports e falha em overflow, ações cobertas e dialogs inacessíveis |
| Zoom do rail | `Sair` ficava fora da altura útil no gate a 200% | a navegação tem rolagem vertical própria e mantém foco/ações alcançáveis |
| Lint/build | lint rejeitou `setState` em effect; CSS Module rejeitou seletor global | inicializador lazy e seletor qualificado passaram em lint/build |

RED focado:

- 6 falhas Vitest de navegação/draft/layout, mais 3 contratos PWA ausentes;
- 2 falhas node:test no contrato responsivo;
- lint encontrou 1 erro e 1 warning;
- build encontrou 1 seletor CSS Module impuro;
- browser E2E revelou expectativas antigas de `Mais` no rail e ausência de
  rolagem sob zoom.

GREEN focado:

- 5 arquivos Vitest, 17 testes, todos passaram;
- `scripts/browser-gate-lib.node-test.mjs`: 15 testes, todos passaram;
- typecheck focado passou.

## Verificações finais

- `npm test`: 35 arquivos, 126 testes, todos passaram.
- `npm run typecheck`: passou.
- `npm run lint`: passou sem warning.
- `npm run build`: passou; `/manifest.webmanifest` foi gerado como rota
  estática.
- `git diff --check`: passou; apenas avisos esperados de LF/CRLF do Windows.
- `npm run test:browser`:
  - 15/15 testes unitários passaram;
  - identidade, onboarding, logout/login e auditoria de zoom passaram;
  - o viewport mobile foi exercitado com Pointer Events `pointerType="touch"`;
  - a execução E2E responsiva parou ao validar o Assistente na transição para o
    rail (`assistant is unreachable from the rail/sidebar`).

## Preocupação aberta do browser gate

O HTML/CSS e os testes determinísticos confirmam que o link do Assistente
permanece no rail e que o breakpoint é `600–1023px`, mas a troca de emulação do
Chrome headless ainda reporta esse link como sem retângulo visível após o
viewport mobile. O gate mantém a falha estrita; ela não foi mascarada nem
removida. O sintetizador touch do Chrome local também não ativou controles de
forma confiável, então o gate usa `PointerEvent` nativo com
`pointerType="touch"` sobre alvo confirmado por `elementFromPoint`.

## Arquivos

Criados:

- `public/icons/garden-app.svg`
- `public/icons/garden-maskable.svg`
- `public/offline.html`
- `public/sw.js`
- `scripts/browser-responsive-gate.mjs`
- `src/app/manifest.test.ts`
- `src/app/manifest.ts`
- `src/components/app-navigation.test.tsx`
- `src/components/service-worker-registration.tsx`

Modificados:

- `DESIGN.md`
- `package.json`
- `scripts/browser-gate-lib.mjs`
- `scripts/browser-gate-lib.node-test.mjs`
- `scripts/browser-identity-gate.mjs`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/components/app-sidebar.tsx`
- `src/features/ai/ai-settings.module.css`
- `src/features/finance/finance-dashboard.module.css`
- `src/features/finance/finance-responsive.test.ts`
- `src/features/today/quick-capture.tsx`
- `src/features/today/today-dashboard.module.css`
- `src/features/today/today-dashboard.test.tsx`

## Self-review

- Contratos financeiros do head `58ea597` foram preservados; a suíte completa
  segue verde.
- Nenhuma dependência, framework ou pack de ícones foi adicionado.
- `GardenIcon`, tokens e gramática Jardim de Pêssego foram reutilizados.
- O service worker não chama `cache.put`, não busca cache por request e não
  armazena navegações, APIs ou respostas autenticadas.
- Safe areas, foco, active state, movimento reduzido já existente e rolagem sob
  zoom foram mantidos em todos os modos.
- O draft local se limita à captura rápida existente; não foi criado framework
  genérico.
- A falha E2E restante está registrada como preocupação, não como gate verde.
