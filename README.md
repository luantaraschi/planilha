# Organiza (planilha)

Planner pessoal com módulos integrados de agenda, finanças, metas, bem-estar, notas e tarefas.

## Como funciona

O Organiza centraliza a rotina pessoal em módulos especializados dentro de `src/app/` (`agenda`, `bem-estar`, `financas`, `metas`, `notas` e `tarefas`).

A aplicação utiliza Next.js com App Router e Supabase como camada de banco de dados e autenticação. O projeto se destaca por uma suíte rigorosa de verificações cobrindo quatro camadas: testes unitários de componentes, testes de políticas de segurança do banco (`db:test`), validação estática de tipos (`typecheck`) e testes e2e no navegador (`test:browser`) que criam e limpam identidades efêmeras para validação real de fluxos.

Para detalhes de arquitetura e especificações de produto, consulte os arquivos `DESIGN.md` e `PRODUCT.md`.

## Rodar local

Pré-requisitos: Node.js 22+ e Docker Desktop ativo.

1. Instalar dependências e iniciar o Supabase local:

```bash
npm install
npm run supabase:start
```

2. Configurar `.env.local` a partir do modelo `.env.example`:

```bash
cp .env.example .env.local
```

3. Aplicar as migrações do banco e iniciar o servidor de desenvolvimento:

```bash
npm run db:reset
npm run dev
```

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Para encerrar os serviços do Supabase:

```bash
npm run supabase:stop
```

## Verificações

A suíte completa de verificações pode ser executada localmente:

```bash
npm run typecheck
npm run lint
npm run db:test
npm test
npm run build
```

## Estado

A aplicação é executada e validada localmente com a instância do Supabase via Docker. O projeto não possui configuração de hospedagem ou demonstração remota ativa.

## Licença

MIT
