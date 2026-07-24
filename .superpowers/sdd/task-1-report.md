# Task 1 — Fase financeira completa

## Status

Concluída. O protótipo limitado a despesas foi substituído no runtime por um
ledger financeiro com contas, entradas, saídas, transferências, ajustes,
recorrências, orçamentos, metas e importações auditáveis.

## Implementação

### Ledger e migração

- Criada `202607250001_financial_ledger.sql` com:
  - `financial_accounts`;
  - `financial_categories`;
  - `transactions`;
  - `recurring_entries`;
  - `import_batches`;
  - `import_batch_rows`;
  - `budgets`;
  - `financial_goals`.
- Todos os valores novos usam `bigint` em centavos inteiros.
- Todas as tabelas financeiras têm RLS e políticas de proprietário para
  leitura/escrita.
- Referências sensíveis usam chaves estrangeiras compostas por `(id, user_id)`,
  impedindo que uma transação use conta, categoria, lote ou destino de outro
  usuário mesmo quando o `user_id` da linha é válido.
- Transferências exigem conta de destino diferente da origem, não aceitam
  categoria e ficam registradas em uma única linha auditável.
- Cada usuário novo recebe uma conta principal e categorias padrão.
- Usuários existentes recebem o mesmo bootstrap durante a migração.
- Despesas legadas são convertidas para transações em centavos com fingerprint
  `legacy-expense:<id>`.
- A migração aborta se o total das despesas legadas, convertido linha a linha
  para centavos, não reconciliar com o total inserido no ledger.
- Gastos fixos legados são preservados como recorrências mensais.
- A tabela `expenses` foi mantida, mas passou a ser somente leitura para o
  papel `authenticated`.
- Os tipos Supabase foram regenerados a partir do banco local migrado.

### Modelo e cálculos

- Criado o contrato `FinanceLedger`/`FinanceWorkspace`.
- Criado `MonthlyFinanceSummary` com:
  - entradas;
  - saídas;
  - resultado;
  - saldo projetado;
  - valor livre por dia;
  - confiança completa/parcial;
  - entradas ausentes explicadas;
  - orçamento restante;
  - previsão recorrente de entradas e saídas.
- Transferências nunca entram nas somas de entrada, saída ou resultado.
- Em saldo consolidado, transferências debitam a origem e creditam o destino,
  portanto o efeito líquido é zero.
- Projeções usam saldo inicial, lançamentos não ignorados e recorrências ainda
  previstas no mês.
- Sem conta, orçamento ou recorrências, a projeção informa exatamente o que
  falta e não inventa valor diário.
- Formatação monetária recebe centavos e só converte para BRL na apresentação.

### Repositório e ações

- O runtime não consulta nem grava mais `expenses`.
- `getCurrentFinanceLedger` carrega todas as partes do ledger do usuário
  verificado.
- Inclusão manual grava `amount_cents` diretamente.
- Exclusão exige UUID e ainda filtra por `user_id`, além da RLS.
- CSV e OFX aceitam créditos e débitos.
- A prévia conserva tipo, data, descrição, centavos e `FITID`/ID externo.
- A deduplicação usa o identificador externo quando disponível e SHA-256
  determinístico nos demais casos.
- Duplicatas já existentes e duplicatas dentro do mesmo arquivo são ignoradas.
- Cada importação cria lote e linhas de revisão com estado `imported` ou
  `duplicate`.
- O histórico mantém contagens de linhas importadas e duplicadas.

### Workspace mensal

- A tela `/financas` agora apresenta:
  - seletor de conta;
  - contas e saldos iniciais;
  - entradas, saídas e resultado imediato;
  - barras acompanhadas de valores textuais;
  - tabela de lançamentos;
  - formulário de entrada, saída, transferência e ajuste;
  - previsão de saldo;
  - orçamento restante e valor livre por dia;
  - próximos recorrentes;
  - metas financeiras;
  - revisão de CSV/OFX antes da confirmação;
  - assistente atualizado para o novo contexto em centavos.
- A interface reutiliza `GardenIcon`, tokens, tipografia e campos de cor do
  Jardim de Pêssego.
- Estado positivo/negativo nunca depende apenas de cor: tipo, sinal, rótulo e
  valor permanecem textuais.
- Controles nativos mantêm rótulos, foco global visível e áreas de toque.
- Em 900 px, a navegação muda para a barra inferior, mas resumo e ledger
  continuam em duas colunas. O workspace só colapsa abaixo de 752 px.

## RED / GREEN

| Ciclo | RED observado | GREEN |
| --- | --- | --- |
| Banco | `financial_ledger.test.sql` falhou porque as tabelas não existiam | 24/24 testes do ledger passaram |
| Modelo | 8/8 falharam por APIs ausentes e importador expense-only | 8/8 passaram com centavos, transferências neutras, previsão e créditos/débitos |
| Repositório | 3/3 falharam por contrato novo ausente | 3/3 passaram após troca para o ledger |
| Ações | 4/4 falharam por ações novas ausentes/importação antiga | 4/4 passaram |
| UI | dashboard falhou ao receber o novo workspace e `transaction-form` não existia | dashboard, formulário e assistente passaram |
| IA | ações e payload falharam por depender de `FinanceSnapshot` | integração passou usando `FinanceWorkspace` |
| Duplicata interna | a primeira e a segunda linha repetidas eram marcadas como duplicadas | somente a repetição passou a receber `duplicate` |

## Verificação final

- `npm test`
  - 32 arquivos;
  - 92 testes;
  - todos passaram.
- `npm run db:test`
  - 4 arquivos SQL;
  - 80 testes;
  - todos passaram.
- `npm run typecheck`
  - passou sem erros.
- `npm run lint`
  - passou sem erros ou avisos.
- `npm run build`
  - build Next.js 16 de produção concluído;
  - rota `/financas` compilada como dinâmica.
- Testes focados da fase financeira:
  - 9 arquivos;
  - 24 testes;
  - todos passaram antes da suíte completa.
- Verificação de responsividade:
  - teste automatizado confirma split view no breakpoint de tablet;
  - teste automatizado confirma colapso somente no breakpoint de telefone.

## Arquivos

### Criados

- `.superpowers/sdd/task-1-report.md`
- `supabase/migrations/202607250001_financial_ledger.sql`
- `supabase/tests/financial_ledger.test.sql`
- `src/features/finance/account-list.tsx`
- `src/features/finance/transaction-form.tsx`
- `src/features/finance/transaction-form.test.tsx`
- `src/features/finance/finance-responsive.test.ts`

### Substituídos ou modificados

- `supabase/tests/finance_core.test.sql`
- `src/lib/supabase/database.types.ts`
- `src/app/financas/page.tsx`
- `src/features/finance/finance-model.ts`
- `src/features/finance/finance-model.test.ts`
- `src/features/finance/finance-repository.ts`
- `src/features/finance/finance-repository.test.ts`
- `src/features/finance/finance-actions.ts`
- `src/features/finance/finance-actions.test.ts`
- `src/features/finance/finance-dashboard.tsx`
- `src/features/finance/finance-dashboard.test.tsx`
- `src/features/finance/finance-dashboard.module.css`
- `src/features/finance/statement-importer.tsx`
- `src/features/finance/finance-assistant.tsx`
- `src/features/finance/finance-assistant.test.tsx`
- `src/features/ai/finance-assistant-actions.ts`
- `src/features/ai/finance-assistant-actions.test.ts`
- `src/features/ai/openai-finance.ts`
- `src/features/ai/openai-finance.test.ts`

### Removidos

- `src/features/finance/expense-form.tsx`
- `src/features/finance/expense-form.test.tsx`

## Self-review

- Confirmei que não há leitura ou gravação de `expenses` no runtime
  financeiro.
- Confirmei que todos os valores novos do schema são centavos inteiros.
- Confirmei que transferências não entram em receitas/despesas no modelo e
  mantêm efeito consolidado zero.
- Confirmei RLS nas oito tabelas e isolamento real entre dois usuários.
- Confirmei integridade cross-user com FK composta.
- Confirmei que o legado continua consultável apenas pelo dono e sem DML
  autenticado.
- Confirmei que CSV/OFX apresentam créditos e débitos na revisão e que a
  deduplicação cobre banco e arquivo atual.
- Confirmei que a UI usa texto além de cor, tabela semântica, `progress` nativo,
  labels e mensagens `aria-live`.
- Confirmei que nenhuma dependência foi adicionada.
- `git diff --check` passou.
- A alteração preexistente em `package-lock.json` foi preservada e não faz
  parte do commit desta tarefa.

## Preocupações e limites conhecidos

1. Não foi possível produzir screenshot real: o runtime do navegador integrado
   informou que não havia nenhum backend disponível. A compensação foi o teste
   automatizado de breakpoint, além dos testes de componente e build de
   produção.
2. A importação usa chamadas sequenciais ao Supabase, não uma função SQL
   transacional única. A constraint de fingerprint e a deduplicação tornam a
   repetição segura, mas uma queda de rede entre a criação da transação e o
   fechamento do lote pode deixar um lote em `reviewed`. Se isso aparecer em
   telemetria, a evolução indicada é mover a confirmação para uma RPC
   transacional.
3. O workspace exibe contas, recorrências, orçamentos e metas e oferece criação
   de lançamentos/importação. Fluxos dedicados de CRUD para essas quatro
   configurações não foram inventados porque o brief desta fase pede seletor e
   visualização, não telas de administração.

---

## Correções após o review bloqueante

### Privacidade e fuso horário

- O runtime do agente consulta `preferences.ai_processing_consent` no servidor
  antes de ler o segredo do provedor ou enviar qualquer contexto financeiro.
- Consentimento ausente, falso ou revogado mantém a análise local e impede a
  chamada externa.
- A página financeira e a ação do assistente usam
  `identity.preferences.timezone`; o valor fixo `America/Bahia` foi removido.
- O helper de data foi coberto no instante de virada em que Bahia ainda está em
  30/06 e Tóquio já está em 01/07.

### Recorrências, contas inativas e valores localizados

- A projeção avança recorrências vencidas e gera deterministicamente todas as
  ocorrências devidas até o fim do mês.
- Recorrências mensais preservam `due_day` e fazem clamp no último dia do mês,
  sem perder a âncora 31 nos meses seguintes.
- O backfill legado copia `expenses.due_day` e calcula o próximo vencimento
  futuro a partir desse dia.
- Contas inativas e seus lançamentos não entram no saldo consolidado; uma
  transferência ainda mostra origem e destino quando o filtro seleciona a
  conta receptora.
- O parser monetário diferencia `1.234,56` e `1,234.56` pela posição e
  agrupamento dos separadores. Agrupamentos incoerentes são rejeitados em vez
  de serem importados com valor corrompido.

### Confirmação atômica e histórico de importação

- `importCurrentTransactions` faz uma única chamada à RPC
  `confirm_statement_import`.
- A RPC `security definer` valida usuário, conta ativa, lote e cada linha;
  resolve categorias; cria lote, transações e linhas de revisão; e conclui as
  contagens dentro da mesma transação PostgreSQL.
- Uma chave SHA-256 determinística identifica a confirmação. A constraint
  `(user_id, account_id, confirmation_key)` e o retorno do lote já concluído
  tornam repetições idempotentes.
- Um erro em qualquer linha reverte inclusive transações inseridas antes dela
  na mesma confirmação.
- `import_batches` e `import_batch_rows` são somente leitura para
  `authenticated`; apenas a RPC grava o histórico. Linhas imutáveis registram
  `created_at`, enquanto a conclusão mutável do lote mantém `updated_at` por
  trigger.

### Exclusão e clareza do ledger

- Apenas lançamentos `manual` podem ser removidos pelo repositório.
- Importados e legados aparecem como `Preservado no histórico`, sem ação
  destrutiva; uma tentativa direta ainda recebe rejeição explícita do servidor.
- A exclusão manual agora usa estado de ação e apresenta sucesso ou erro em uma
  região `aria-live`, eliminando a falha silenciosa.
- Transferências exibem `origem → destino` na coluna de conta.

## RED / GREEN das correções

| Ciclo | RED observado | GREEN |
| --- | --- | --- |
| Consentimento | o teste recebeu configuração online e leu `ai_agent_settings` mesmo com consentimento falso | consentimento falso retorna `null` sem consultar o segredo |
| Fuso horário | na virada UTC, o assistente esperava a entrada de 01/07 em Tóquio e recebeu zero pelo fuso fixo de Bahia | página e ação usam o fuso do perfil |
| Recorrências | semanal esperava 5 ocorrências e recebeu 1; mensal vencida esperava 1 e recebeu 0 | todas as ocorrências restantes são geradas com âncora preservada |
| Conta inativa | uma receita de conta inativa apareceu como R$ 5.000,00 e distorceu o saldo | conta inativa ficou fora das somas consolidadas |
| Parser | `1,234.56` virou 123 centavos e agrupamento malformado não tinha proteção | pt-BR/en-US chegam aos mesmos centavos e formato ambíguo é ignorado |
| Migração legada | contrato falhou porque `due_day` não existia no insert/backfill | schema, tipos e backfill preservam `due_day` |
| RPC atômica | contratos falharam sem função/idempotência e os testes do repositório ainda exigiam várias tabelas | uma chamada RPC; pgTAP prova repetição idempotente e rollback integral |
| Histórico | contratos encontraram permissões de insert/update/delete nas tabelas de importação | políticas e grants permitem somente leitura externa |
| Exclusão | repositório retornava apenas `true`, a ação não retornava feedback e a UI oferecia remover importado | estados `deleted/protected/missing/error` e feedback visível |
| Transferência | a tabela mostrava somente a conta de origem | origem e destino aparecem inclusive no recorte da receptora |

## Verificação final após as correções

- `npm run db:reset`
  - migrações aplicadas integralmente no banco local.
- Testes focados durante os ciclos:
  - os RED acima foram observados antes da implementação;
  - execução final: 7 arquivos e 37 testes, todos passaram.
- `npm test`
  - 33 arquivos;
  - 106 testes;
  - todos passaram.
- `npm run db:test`
  - 4 arquivos SQL;
  - 98 testes;
  - todos passaram.
- `npm run db:types`
  - tipos locais regenerados com `due_day`, `confirmation_key` e a RPC.
- `npm run typecheck`
  - passou sem erros.
- `npm run lint`
  - passou sem erros ou avisos.
- `npm run build`
  - build Next.js 16 concluído;
  - `/financas` compilada como rota dinâmica.
- `git diff --check`
  - passou.

## Limitação visual desta rodada

Por orientação do controlador, nenhuma ferramenta visual adicional foi
instalada e a inspeção real no Galaxy Tab S9 FE ficou reservada ao controlador.
A aplicação está migrada, testada e com build de produção pronto para essa
inspeção. Essa validação visual real continua pendente e não é apresentada aqui
como evidência concluída.

As correções acima substituem a preocupação anterior sobre chamadas sequenciais
de importação: a confirmação agora é uma RPC PostgreSQL única, atômica e
idempotente.

---

## Correções do segundo re-review

### Imutabilidade das transações importadas

- `supabase/migrations/202607250001_financial_ledger.sql`
  - adiciona a constraint `transactions_source_import_context`;
  - exige lote e fingerprint para `bank_import`;
  - proíbe contexto de importação em `manual`;
  - preserva o fingerprint legado sem associá-lo a um lote;
  - substitui as policies genéricas de `transactions` por policies que só
    permitem INSERT, UPDATE e DELETE autenticados em linhas manuais;
  - mantém a RPC `security definer` como único caminho para gravar
    `bank_import`.
- `supabase/tests/financial_ledger.test.sql`
  - prova as combinações da constraint;
  - prova que INSERT, UPDATE e DELETE diretos em importados não alteram dados;
  - prova que uma linha manual não pode ser promovida a importada por DML.

### Confiança no recorte ativo

- `src/features/finance/finance-model.ts`
  - calcula previsão e confiança a partir das recorrências simultaneamente
    ativas e pertencentes às contas ativas do recorte selecionado.
- `src/features/finance/finance-model.test.ts`
  - cobre uma conta selecionada sem recorrência ativa, mesmo quando outra conta
    possui recorrências globais.

### Contas inativas e seleção stale

- `account-list.tsx`, `transaction-form.tsx` e `statement-importer.tsx`
  removem contas inativas dos respectivos seletores e desabilitam submissão
  quando nenhuma conta ativa existe.
- O seletor de importação ignora um `selectedAccountId` stale e volta para a
  primeira conta ativa.
- `finance-repository.ts` valida no servidor todas as contas de um lançamento,
  inclusive o destino da transferência.
- A rejeição `invalid account` da RPC é convertida em
  `InactiveFinancialAccountError`.
- `finance-actions.ts` retorna a mensagem precisa:
  `A conta selecionada está inativa. Atualize a página e escolha uma conta ativa.`
- Testes de dashboard, repositório e ações cobrem seletores e os dois caminhos
  stale.

### Backfill no timezone do proprietário

- O backfill de recorrências junta `public.preferences` por proprietário.
- A data local usada para escolher este ou o próximo mês é calculada com
  `timezone(preferences.timezone, now())::date`, eliminando a dependência do
  `current_date` do servidor.
- O contrato da migração cobre o join, o cálculo local e a ausência do antigo
  anchor global.

### Hit areas verificadas pelo controlador

O controlador inspecionou o aplicativo real em `800x1280`, `1280x800` e
`720x800`: não houve overflow horizontal, textos e valores permaneceram
legíveis e o workspace continuou em duas colunas nos tablets.

Os controles medidos abaixo do contrato foram elevados para no mínimo 48 px:

- wrapper e input do valor monetário: `3rem`;
- botões primário e secundário: `3rem`;
- botão de envio do assistente: `3rem × 3rem`;
- perguntas sugeridas: `min-height: 3rem`;
- label clicável do arquivo: `min-height: 3rem`.

O input de arquivo continua nativo e dentro do próprio `label`, preservando
nome acessível, teclado e toda a área do label como alvo clicável.

## RED / GREEN do segundo re-review

| Ciclo | RED observado | GREEN |
| --- | --- | --- |
| Contexto importado | migration contract não encontrou constraint nem policies manuais | constraint e policies específicas passaram; pgTAP bloqueou todo DML direto testado |
| Confiança | conta selecionada sem recorrência ativa ainda retornava `complete` | retorna `partial` e explica a recorrência ausente |
| Seletores | `Conta arquivada` ainda aparecia em `Conta exibida` e `Conta do extrato` | nenhuma conta inativa aparece nos três seletores |
| Conta stale | ação manual retornava sucesso e importação retornava erro genérico | ambos retornam a mensagem precisa de conta inativa |
| Timezone | contrato encontrou `current_date` global e nenhum join com preferences | backfill usa a data local de cada proprietário |
| Hit areas | contrato encontrou 43 px/30 px nos controles frequentes | todos os alvos identificados têm pelo menos 48 px |

Execução RED focada: 6 arquivos, 42 testes, 11 falhas esperadas e 31 passes.
Ao tornar o contrato CSS estrito ao bloco de cada seletor, um RED adicional
confirmou que o input monetário interno ainda tinha 46 px; ele também foi
elevado a 48 px antes do GREEN final.

Execução GREEN focada:

- `npm test -- src/features/finance/finance-migration-contract.test.ts src/features/finance/finance-model.test.ts src/features/finance/finance-responsive.test.ts src/features/finance/finance-actions.test.ts src/features/finance/finance-repository.test.ts src/features/finance/finance-dashboard.test.tsx`
- 6 arquivos, 42 testes, todos passaram.

## Gates finais do segundo re-review

- `npm run db:reset`
  - migração completa aplicada com sucesso.
- `npm run db:test`
  - 4 arquivos SQL;
  - 104 testes;
  - todos passaram.
- `npm run typecheck`
  - passou sem erros.
- `npm test`
  - 33 arquivos;
  - 116 testes;
  - todos passaram.
- `npm run lint`
  - passou sem erros ou avisos.
- `npm run build`
  - build de produção concluído;
  - `/financas` compilada como rota dinâmica.
- `git diff --check`
  - passou.

## Preocupação restante

O layout real já foi validado pelo controlador nos três viewports. As novas
dimensões de 48 px têm contrato automatizado e preservam a estrutura aprovada;
uma re-medição visual desses controles após o ajuste continua recomendável no
próximo passe do controlador.
