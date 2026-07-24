# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

O usuário inicial é uma pessoa organizando a própria vida. Ela quer reduzir a
fragmentação entre agenda, tarefas, hábitos, humor, metas, notas e finanças sem
precisar manter vários aplicativos que não compartilham contexto.

## Product Purpose

O produto é um superapp pessoal com módulos independentes conectados pela tela
Hoje, por revisões e por um assistente de IA. O sucesso significa que o usuário
consegue planejar o dia, acompanhar dinheiro e bem-estar e tomar ações práticas
com clareza e pouco trabalho manual.

## Positioning

O diferencial é tratar tempo, dinheiro, compromissos, hábitos e estado pessoal
como partes da mesma rotina. A IA explica o quadro completo e propõe ações
estruturadas, mas o usuário mantém controle explícito sobre toda alteração.

## Operating Context

Aplicação web responsiva, online e com login. O uso acontece principalmente no
planejamento da manhã, na captura rápida durante o dia, na revisão noturna e na
revisão semanal. A primeira integração externa é o Google Agenda. Dados
financeiros entram manualmente ou por CSV/OFX na primeira versão.

## Capabilities and Constraints

- Finanças, agenda, tarefas, hábitos e humor, metas e notas são módulos centrais.
- O público é individual no início, com isolamento de dados por usuário.
- A IA usa a OpenAI API e nunca grava ou exclui sem confirmação.
- Cálculos financeiros são determinísticos e auditáveis.
- O MVP usa BRL e não inclui Open Finance, pagamentos ou recomendações médicas.
- A interface deve funcionar bem em desktop e celular e atender WCAG AA.

## Brand Commitments

- Marca aprovada: Organiza, com direção visual pastel e acolhedora.
- Personalidade leve, acolhedora, moderna, otimista e “good vibes”.
- A interface não pode parecer um template genérico ou produto de “vibe code”.
- Ilustrações devem ser autorais, art-directed e consistentes entre telas.
- Iconografia deve usar um pack moderno com personalidade, não ícones genéricos.
- Acabamento visual e de interação deve passar pelas skills de frontend e pelo
  processo Impeccable antes de ser considerado pronto.

## Evidence on Hand

- Especificação aprovada em
  `docs/superpowers/specs/2026-07-23-superapp-organizacao-pessoal-design.md`.
- Pesquisa de mercado registrada na especificação.
- Não há nome final, logotipo, ilustrações, iconografia licenciada, depoimentos,
  métricas de uso ou outros ativos de marca. Trabalho futuro não deve fabricá-los
  como se já existissem.

## Product Principles

1. Hoje é o ponto de encontro entre todos os módulos.
2. Capturar deve ser rápido; agir deve ser consciente.
3. Sugestões da IA são transparentes e confirmáveis.
4. Cálculos críticos permanecem determinísticos.
5. Personalidade visual nunca pode prejudicar leitura, acessibilidade ou tarefa.

## Accessibility & Inclusion

WCAG AA, navegação por teclado, foco visível, contraste real sobre tons pastéis,
alternativas textuais para gráficos e ícones, suporte a movimento reduzido e
interações que não dependem exclusivamente de cor, emoji ou hover.
