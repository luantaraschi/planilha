# Organiza: marca e clareza de acesso

## Objetivo

Adotar **Organiza** como nome do produto em todas as superfícies ativas e
deixar explícita a diferença entre entrar e criar a primeira conta.

## Marca

- Nome público, título do navegador e nome instalável: **Organiza**.
- Descrição: **Finanças, rotina e planos em um só lugar.**
- A direção visual pastel já aprovada permanece; a troca é de marca, não de
  identidade cromática.
- O pacote e o Worker passam a usar `organiza`.
- Os ícones PWA passam a ter nomes neutros da nova marca.
- Documentos históricos continuam intactos; README, PRODUCT e DESIGN ativos
  registram Organiza como marca atual.

## Acesso

- O Supabase continua sendo a única autenticação interna.
- Primeiro acesso: e-mail e senha com pelo menos oito caracteres, seguido de
  **Criar minha conta**.
- Acessos seguintes: **Entrar**.
- Falha de login deve explicar que uma conta ainda não cadastrada precisa ser
  criada, sem revelar se um e-mail específico existe.
- O botão Google permanece disponível, mas não é necessário para usar o app.

## Publicação

- O app continua público na Cloudflare e funciona com o computador desligado.
- O Worker passa a se chamar `organiza`.
- O redirecionamento do Supabase deve acompanhar a URL pública publicada.

## Verificação

- Testes unitários de autenticação e manifest.
- Busca no código ativo por nomes antigos.
- Build OpenNext/Cloudflare.
- Cadastro e login temporários, com remoção da conta ao final.
- Resposta HTTP 200 em `/entrar` e título contendo **Organiza**.
