# Superapp de organização pessoal com IA

**Data:** 23 de julho de 2026  
**Status:** design aprovado  
**Público inicial:** uma pessoa organizando a própria vida  
**Plataforma inicial:** aplicação web responsiva, online e com login

## 1. Visão

Criar um superapp pessoal que reúna finanças, agenda, tarefas, hábitos, humor,
metas e notas. Cada módulo deve funcionar de forma independente, enquanto a
tela **Hoje**, a busca global, os alertas e o assistente de IA conectam os dados
em uma experiência única.

O produto começa para uso individual, mas o isolamento por usuário será
obrigatório desde a primeira versão para permitir evolução futura para um
produto com várias contas.

## 2. Resultado esperado

Ao abrir o sistema, o usuário deve conseguir responder rapidamente:

- O que preciso fazer hoje?
- Quais compromissos e contas estão próximos?
- Quanto posso gastar sem comprometer o mês?
- Como estão meus hábitos, humor e metas?
- O que merece minha atenção agora?

O sistema deve reduzir preenchimento manual, mas nunca esconder de onde saiu
um cálculo ou permitir que a IA altere dados sem confirmação.

## 3. Referências de mercado

O desenho combina padrões públicos, sem copiar marca, textos, identidade visual,
ativos ou telas proprietárias:

- [Pierre](https://lp.pierre.finance/): conversa financeira, categorização,
  recorrências, previsões, objetivos, alertas e leitura via Open Finance.
- [e-Mind](https://emind.ia.br/): agenda, tarefas, finanças, Google Agenda,
  WhatsApp e resumos proativos.
- [Theros](https://therosapp.com/): módulos de vida conectados por IA.
- [Copilot Money](https://help.copilot.money/en/articles/11157550-quick-start-guide),
  [YNAB](https://www.ynab.com/features) e
  [Organizze](https://www.organizze.com.br/): revisão de transações, orçamento,
  recorrências, metas e relatórios.
- [Motion](https://www.usemotion.com/help),
  [Sunsama](https://sunsama.com/features/daily-planning-and-shutdown) e
  [Akiflow](https://akiflow.com/): planejamento diário, time blocking e carga de
  trabalho.
- [TickTick](https://www.ticktick.com/) e [Daylio](https://daylio.net/):
  hábitos, foco, humor e correlações.

## 4. Princípios do produto

1. **Módulos completos, núcleo compartilhado.** Cada área possui sua própria
   navegação e regras; autenticação, busca, alertas, auditoria e IA são comuns.
2. **Hoje é o ponto de encontro.** O usuário não precisa visitar todos os
   módulos para entender o dia.
3. **Capturar primeiro, organizar depois.** Um campo universal aceita linguagem
   natural e cria um rascunho tipado.
4. **Sugestão antes de automação.** Toda ação da IA mostra uma prévia e exige
   confirmação.
5. **Cálculos auditáveis.** Saldos, orçamentos e previsões usam regras
   determinísticas; a IA apenas explica e recomenda.
6. **Privacidade por padrão.** O assistente recebe apenas o contexto necessário
   para cada solicitação.
7. **Acolhedor sem infantilizar.** A interface usa tons pastéis e linguagem
   humana, mantendo clareza em decisões financeiras.

## 5. Escopo da primeira versão

### 5.1 Hoje

- Linha do tempo com eventos, tarefas agendadas e contas a vencer.
- Prioridades do dia.
- Check-in opcional de humor e energia.
- Hábitos do dia.
- Resumo financeiro: saldo projetado, contas próximas e valor livre estimado.
- Insights do assistente e ações sugeridas.
- Campo universal para registrar tarefa, evento, nota, hábito ou movimentação.

### 5.2 Finanças

- Contas financeiras manuais.
- Receitas, despesas, transferências e ajustes.
- Categorias, tags e descrições.
- Lançamentos parcelados e recorrentes.
- Importação de CSV e OFX com prévia.
- Detecção de duplicatas.
- Orçamento mensal por categoria.
- Contas a pagar e alertas de vencimento.
- Metas financeiras.
- Fluxo mensal, relatórios e projeção de saldo.
- Classificação e explicação assistidas por IA.

Transferências entre contas, pagamento de fatura e lançamentos ignorados devem
ter tipos próprios para não distorcer receitas, despesas ou relatórios.

### 5.3 Agenda

- Eventos locais.
- Visualizações de dia, semana, mês e lista.
- Eventos recorrentes.
- Integração inicial com uma conta Google.
- Sincronização nos dois sentidos.
- Associação opcional entre evento, tarefa, meta ou nota.

Eventos vinculados ao Google usam o Google Agenda como fonte de verdade. A base
local mantém uma cópia para compor a tela Hoje e a busca.

### 5.4 Tarefas

- Caixa de entrada, Hoje, Próximas e Concluídas.
- Projetos simples.
- Prioridade, prazo, duração estimada e recorrência.
- Subtarefas.
- Visualização em lista e kanban.
- Associação opcional com evento, meta ou nota.
- Transformação de tarefa em bloco de agenda mediante confirmação.

O reagendamento automático estilo Motion não faz parte da primeira versão.

### 5.5 Hábitos e humor

- Hábitos diários ou semanais.
- Lembretes e sequência de dias.
- Registro de conclusão.
- Check-in de humor em escala curta.
- Energia do dia e atividades/tags opcionais.
- Histórico e correlações somente após quantidade mínima de registros.

Correlações devem informar tamanho da amostra e nível de confiança. O produto
não atribui causalidade e não oferece diagnóstico médico.

### 5.6 Metas

- Metas pessoais e financeiras.
- Valor ou progresso percentual.
- Prazo opcional.
- Marcos intermediários.
- Associação com tarefas, hábitos e movimentações financeiras.

### 5.7 Notas

- Notas de texto simples.
- Tags, fixação e busca.
- Associação com tarefas, eventos ou metas.

Editor avançado, anexos e colaboração ficam fora da primeira versão.

### 5.8 Assistente de IA

- Chat com acesso autorizado aos módulos.
- Perguntas sobre agenda, tarefas, finanças, hábitos, humor, metas e notas.
- Resumo diário e revisão semanal.
- Classificação sugerida de transações.
- Detecção de gastos incomuns e conflitos de agenda.
- Criação de rascunhos de ações em linguagem natural.
- Explicação de cálculos e origem dos dados.

O assistente não movimenta dinheiro, não fornece diagnóstico médico e não
apresenta conteúdo educacional como recomendação financeira profissional.

### 5.9 Alertas

- Contas próximas ou vencidas.
- Tarefa ou evento próximo.
- Orçamento perto do limite.
- Risco de saldo negativo.
- Conflito de agenda.
- Hábito pendente, quando o usuário ativar o lembrete.

Na primeira versão, alertas aparecem no sistema e por e-mail. Push, WhatsApp e
alertas de localização ficam para depois.

## 6. Fora do escopo inicial

- Open Finance e iniciação de pagamentos.
- Investimentos e cotação de ativos.
- WhatsApp, Gmail e Outlook.
- Comandos de voz e OCR de recibos.
- Aplicativos nativos e modo offline.
- Colaboração, contas familiares e quadros compartilhados.
- Agendamento totalmente automático.
- Agentes autônomos que executam ações sem confirmação.
- Múltiplas moedas.
- Temas alternativos e modo escuro.

## 7. Navegação

### 7.1 Desktop

A barra lateral global contém:

- Hoje
- Agenda
- Tarefas
- Finanças
- Hábitos e humor
- Metas
- Notas
- Revisões
- Integrações
- Configurações

Cada módulo possui abas locais somente para suas próprias funções. O campo de
captura global fica no topo. O painel do assistente pode ser aberto em qualquer
tela.

### 7.2 Celular

A navegação inferior contém Hoje, Agenda, Tarefas, Finanças e Mais. O assistente
fica em um botão flutuante. Conteúdo secundário abre em painéis ou páginas
dedicadas, sem depender de interação por hover.

## 8. Fluxos principais

### 8.1 Primeiro acesso

1. Criar conta ou entrar com Google.
2. Definir nome, moeda BRL, fuso horário e preferências de lembrete.
3. Escolher quais módulos deseja configurar imediatamente.
4. Conectar Google Agenda opcionalmente.
5. Configurar conta financeira e orçamento opcionalmente.
6. Abrir a tela Hoje com um checklist curto de configuração pendente.

### 8.2 Captura universal

1. Usuário escreve, por exemplo, “pagar energia sexta, 186 reais”.
2. O servidor envia apenas o texto e contexto mínimo para classificação.
3. A IA retorna um rascunho estruturado.
4. O sistema valida tipo, campos, datas, valores e permissões.
5. O usuário revisa e confirma.
6. O módulo responsável grava a ação e registra auditoria.

Se a IA estiver indisponível, o usuário escolhe o tipo e preenche o formulário
normalmente.

### 8.3 Importação financeira

1. Usuário envia CSV ou OFX.
2. O servidor valida formato, tamanho e conteúdo.
3. O importador normaliza datas, moeda, descrição e valor.
4. Registros duplicados ou ambíguos são destacados.
5. Categorias são sugeridas.
6. O usuário revisa a prévia.
7. A confirmação grava o lote em uma transação de banco.

Um erro em uma linha não pode apagar dados existentes. Nenhuma linha é gravada
antes da confirmação do lote.

### 8.4 Google Agenda

1. Usuário autoriza o menor escopo necessário via OAuth.
2. O sistema executa sincronização inicial e guarda o token incremental.
3. Alterações externas chegam por notificação e são reconciliadas.
4. Ao abrir Agenda ou Hoje, o sistema também verifica mudanças pendentes.
5. Token inválido dispara sincronização completa controlada.

A implementação seguirá a
[sincronização incremental](https://developers.google.com/workspace/calendar/api/guides/sync)
e as
[notificações de mudança](https://developers.google.com/workspace/calendar/api/guides/push)
oficiais. Como notificações podem falhar, uma reconciliação periódica permanece
necessária.

### 8.5 Revisão semanal

O sistema reúne:

- tarefas planejadas e concluídas;
- tempo comprometido na agenda;
- gastos e orçamento;
- evolução de hábitos, humor e metas;
- alertas relevantes.

A IA resume os dados, separa fatos de interpretações e propõe até três ações
práticas para a semana seguinte.

## 9. Regras financeiras

### 9.1 Projeção de saldo

`saldo projetado = saldos atuais + receitas futuras - despesas futuras - estimativa de gastos variáveis`

Receitas e despesas futuras vêm de recorrências e lançamentos agendados. A
estimativa variável usa orçamento restante quando houver; sem orçamento, usa a
média diária recente e identifica a estimativa como tal.

### 9.2 Valor livre por dia

Com orçamento:

`valor livre diário = orçamento variável restante / dias restantes do mês`

Sem orçamento:

`valor livre diário = (saldo atual + receitas futuras - despesas fixas futuras - reserva de metas - reserva de segurança) / dias restantes`

O usuário pode configurar a reserva de segurança. Valores negativos aparecem
como risco, não como zero silencioso.

## 10. Arquitetura

### 10.1 Forma

Monólito modular:

- **Next.js:** interface responsiva e rotas de servidor.
- **Supabase Auth:** autenticação.
- **PostgreSQL/Supabase:** dados e isolamento por usuário.
- **Supabase Cron:** lembretes e reconciliação periódica de integrações.
- **OpenAI API:** classificação, resumo, chat e explicações.
- **Google Calendar API:** integração de agenda.
- **Resend:** envio de e-mails transacionais de alerta.

Não haverá microsserviços na primeira versão.

### 10.2 Módulos internos

- identidade e preferências;
- hoje e revisões;
- finanças;
- agenda e integrações;
- tarefas e projetos;
- hábitos e humor;
- metas;
- notas;
- notificações;
- assistente e rascunhos de ação;
- auditoria.

Os módulos compartilham IDs e serviços de aplicação, mas não acessam tabelas de
outro módulo diretamente pela interface. A composição da tela Hoje acontece no
servidor.

## 11. Modelo de dados

Entidades principais:

- `profiles`, `preferences`;
- `projects`, `tasks`, `task_links`;
- `events`, `calendar_connections`;
- `habits`, `habit_logs`, `mood_entries`;
- `goals`, `goal_links`;
- `notes`;
- `financial_accounts`, `transactions`, `categories`, `budgets`,
  `recurring_entries`, `imports`;
- `reminders`, `notification_deliveries`;
- `ai_threads`, `ai_messages`, `ai_action_drafts`;
- `audit_events`.

Toda entidade pertencente ao usuário contém `user_id`, datas de criação e
alteração. Valores monetários são armazenados em centavos inteiros e nunca em
ponto flutuante.

## 12. IA e segurança de ações

O modelo nunca recebe acesso direto ao banco de dados. Ferramentas internas
aceitam esquemas fechados e retornam dados mínimos.

Fluxo de escrita:

1. modelo propõe ação estruturada;
2. servidor valida esquema, permissões e regras;
3. interface mostra a prévia;
4. usuário confirma;
5. servidor executa;
6. auditoria registra ator, ação e resultado.

Excluir dados, enviar mensagens, alterar eventos externos ou importar um lote
exige confirmação específica. A chave da OpenAI permanece somente no servidor.

## 13. Tratamento de falhas

- **IA indisponível:** formulários e módulos continuam funcionando.
- **Google indisponível:** eventos locais continuam acessíveis; operações
  externas mostram estado pendente ou opção de salvar somente localmente.
- **Sincronização divergente:** mostrar origem, última sincronização e opção de
  reconciliar.
- **Importação inválida:** manter prévia com erros por linha e não gravar lote
  parcial sem escolha explícita.
- **Lembrete falho:** registrar tentativa e repetir com limite.
- **Sessão expirada:** preservar rascunho local e solicitar novo login.
- **Cálculo incompleto:** mostrar quais dados faltam em vez de gerar estimativa
  com falsa precisão.

## 14. Privacidade

- Row Level Security em todas as tabelas com dados pessoais.
- Tokens OAuth criptografados e nunca enviados ao navegador.
- Segredos somente no servidor.
- Coleta mínima de dados.
- Exportação e exclusão de conta.
- Histórico de ações sensíveis.
- Consentimento separado para Google Agenda e processamento por IA.
- Humor e notas não entram em análises financeiras sem autorização explícita.

## 15. Design visual

Direção aprovada: **Jardim de Pêssego**.

### 15.1 Personalidade

- leve;
- acolhedora;
- moderna;
- otimista;
- organizada;
- “good vibes”, sem infantilização.

### 15.2 Paleta-base

- fundo: `#FFFAF7`;
- superfície: `#FFFFFF`;
- pêssego: `#FFE5D5`;
- rosa chá: `#FCE1E8`;
- amarelo manteiga: `#FFF2BE`;
- sálvia: `#DFEAD9`;
- texto principal: `#45352F`;
- texto secundário: `#725E55`;
- ação principal: `#A73655`.

Tons pastéis são usados em superfícies e destaques. Textos e controles usam
cores escuras com contraste WCAG AA.

### 15.3 Componentes

- cantos arredondados moderados;
- sombras suaves e poucas bordas;
- tipografia única, arredondada e legível: Nunito Sans;
- ícones de contorno simples;
- ilustrações discretas somente em estados vazios e onboarding;
- animações curtas e opcionais, respeitando `prefers-reduced-motion`.

## 16. Acessibilidade

- contraste mínimo WCAG AA;
- navegação completa por teclado;
- foco visível;
- rótulos associados a campos;
- ícones nunca são a única forma de comunicar estado;
- gráficos possuem resumo textual;
- humor pode ser escolhido por texto além de emoji;
- valores não dependem somente de verde ou vermelho;
- alvos de toque adequados no celular.

## 17. Estratégia de testes

### 17.1 Unidade

- cálculos monetários e projeções;
- parser CSV/OFX e duplicatas;
- recorrências;
- classificação dos tipos de transação;
- regras de prazo, hábitos e valor livre diário.

### 17.2 Integração

- autenticação e Row Level Security;
- confirmação de ações da IA;
- importação financeira transacional;
- sincronização e reconciliação Google;
- geração de alertas.

### 17.3 Fluxos ponta a ponta

- primeiro acesso;
- captura universal até confirmação;
- importar extrato;
- criar e sincronizar evento;
- concluir tarefa e hábito;
- registrar humor;
- executar revisão semanal;
- exportar e excluir conta.

## 18. Critérios de aceite

A primeira versão estará pronta quando:

1. um usuário novo conseguir configurar e usar os módulos sem ajuda externa;
2. a tela Hoje reunir dados reais dos módulos ativos;
3. CSV e OFX puderem ser revisados antes da gravação e não criarem duplicatas
   silenciosas;
4. cálculos financeiros passarem pelos testes com valores inteiros;
5. eventos Google sincronizarem e exibirem a origem;
6. toda escrita sugerida pela IA exigir confirmação;
7. uma conta não conseguir ler ou alterar dados de outra;
8. falhas de IA ou integração não impedirem uso manual;
9. exportação e exclusão de conta funcionarem;
10. desktop e celular atenderem aos requisitos básicos de acessibilidade.

## 19. Evolução posterior

Após validar uso recorrente:

1. Open Finance por parceiro autorizado;
2. WhatsApp para captura e lembretes;
3. Gmail e Outlook;
4. voz e OCR;
5. aplicativos nativos e offline;
6. investimentos;
7. agendamento automático;
8. colaboração e contas familiares;
9. agentes especializados com permissões graduais.
