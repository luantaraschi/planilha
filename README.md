# Meu espaço

Planner pessoal em Next.js com autenticação e dados locais no Supabase.

## Desenvolvimento local

Pré-requisitos: Node.js 22+ e Docker Desktop em execução.

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

Abra [http://127.0.0.1:3000](http://127.0.0.1:3000). Para encerrar os serviços
locais do Supabase:

```powershell
npm run supabase:stop
```

## Verificações

```powershell
npm run db:test
npm test
npm run test:browser
npm run typecheck
npm run lint
npm audit
npm run build
```

`npm run test:browser` é suportado no Windows com Node.js 22+, Docker Desktop,
Supabase local, app local ativo e Google Chrome. O gate usa os atalhos e
códigos de tecla do Windows, cria uma identidade local efêmera pela própria
UI sem registrar as credenciais e a remove ao final, confirmando a ausência em
`auth.users`, `profiles`, `preferences` e `audit_events`. A chave administrativa
local é usada somente para inspeção e cleanup. Use `APP_URL`/`CHROME_PATH` se
a URL local ou o executável do Chrome não estiverem nos padrões. URLs que não
apontam para loopback são rejeitadas antes da criação da identidade.

Para continuar somente a verificação completa de foco do Today com uma conta
local já existente, sem criar, alterar ou excluir identidade, defina
`BROWSER_GATE_MODE=continue-today`, `BROWSER_GATE_EMAIL` e
`BROWSER_GATE_PASSWORD` no ambiente antes de executar `npm run test:browser`.
O gate não registra os valores dessas credenciais.

O projeto ainda não possui configuração de Supabase hospedado ou deploy
remoto.
