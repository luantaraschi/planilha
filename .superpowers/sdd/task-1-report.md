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
