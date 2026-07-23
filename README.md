# Meu espaço

Planner pessoal em Next.js com autenticação e dados locais no Supabase.

## Desenvolvimento local

Pré-requisitos: Node.js 20+ e Docker Desktop em execução.

```powershell
npm install
npm run supabase:start
```

Crie `.env.local` a partir de `.env.example` e substitua a chave de exemplo
pela `PUBLISHABLE_KEY` exibida por `npm exec -- supabase status`. O arquivo
local precisa conter:

```powershell
Copy-Item .env.example .env.local
```

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<PUBLISHABLE_KEY local>
```

Prepare o banco e inicie o app:

```powershell
npm run db:reset
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). Para encerrar os serviços
locais do Supabase:

```powershell
npm run supabase:stop
```

## Verificações

```powershell
npm run db:test
npm test
npm run typecheck
npm run lint
npm audit
npm run build
```

O projeto ainda não possui configuração de Supabase hospedado ou deploy
remoto.
