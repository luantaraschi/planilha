<!-- IMPLEMENTED: synchronized with the Foundation + Today shell on 2026-07-23. -->
---
name: Superapp de organização pessoal
description: Um planner ilustrado que conecta rotina, bem-estar e finanças.
---

# Design System: Jardim de Pêssego

## Overview

**Creative North Star: "O planner ilustrado na mesa do café da manhã"**

Jardim de Pêssego é um mundo claro, acolhedor e tátil: papelaria contemporânea,
abas coloridas, desenhos autorais e pictogramas com personalidade. A interface
deve parecer desenhada por um estúdio de produto cuidadoso, não montada com uma
grade de cards e um kit padrão.

O modo é **Operate**. Expressão visual aparece nos detalhes, nas transições e nos
assets; tarefas, estados e números continuam imediatamente legíveis. A
composição alterna áreas editoriais abertas, linhas do tempo e painéis
especializados em vez de repetir o mesmo cartão para todo conteúdo.

**Key Characteristics:**

- calor visual sem ruído;
- iconografia curvilínea e reconhecível;
- ilustrações autorais com função narrativa;
- hierarquia editorial, não grade SaaS genérica;
- movimento curto, tátil e informativo;
- pastéis em superfícies, texto escuro para contraste.

## Colors

A estratégia é **Full palette** com campos de cor nomeados: porcelana quente,
pêssego, rosa chá, manteiga e sálvia. A ação principal usa um tom framboesa
escuro; pastéis nunca carregam texto de baixo contraste.

- **Porcelana quente** (`#FFFAF7`): fundo principal.
- **Pêssego de caderno** (`#FFE5D5`): agenda, próximos eventos e acolhimento.
- **Rosa chá** (`#FCE1E8`): humor, cuidado e seleção suave.
- **Manteiga solar** (`#FFF2BE`): lembretes e atenção não crítica.
- **Sálvia calma** (`#DFEAD9`): progresso, hábitos e finanças saudáveis.
- **Cacau tipográfico** (`#45352F`): texto principal.
- **Argila suave** (`#725E55`): texto secundário.
- **Framboesa de ação** (`#A73655`): ações primárias e foco de marca.

**The Dark-Ink Rule.** Texto sobre pastel usa cacau ou outro tom validado em
WCAG AA; nunca se clareia a tipografia para “combinar” com a superfície.

**The Color-Field Rule.** Cor deve assumir regiões e estados com significado,
não aparecer como quadradinhos aleatórios atrás de cada ícone.

## Typography

A família implementada é **Nunito Sans Variable**, carregada por `next/font`
com subset latino. Ela assume display, corpo, rótulos e dados; contraste entre
papéis vem de peso, escala e espaçamento, sem adicionar uma segunda família.

Títulos são compactos, humanos e diretos. Corpo e dados financeiros usam
alinhamento e numerais adequados. Rótulos em caixa alta são raros e nunca
substituem hierarquia tipográfica.

**The One-Family Rule.** Uma segunda família só entra se resolver uma
necessidade comprovada.

## Layout

O desktop usa uma navegação global estável e áreas de trabalho específicas por
módulo. A tela Hoje é uma composição editorial: linha do tempo dominante,
resumos laterais e um ponto de captura universal. Módulos não devem ser
reduzidos a uma coleção uniforme de cards.

No celular, a navegação vira barra inferior e o conteúdo secundário abre em
páginas ou painéis próprios. A prioridade visual segue tarefa, urgência e
momento do dia. Densidade pode variar entre módulos, mas a cadência de espaço e
a posição das ações permanecem previsíveis.

Na implementação atual, a navegação lateral muda para uma barra inferior a
partir de `900px`: cinco destinos ficam expostos e `Mais` agrupa Metas, Notas e
Assistente. Abaixo de `700px`, a ilustração vira um recorte horizontal compacto;
captura rápida, linha do tempo e resumos seguem em uma coluna.

## Elevation & Depth

Profundidade vem primeiro de campos tonais, sobreposição sutil e bordas de
papel. Sombras são ambientais, macias e raras. Contêineres em repouso não
parecem flutuar individualmente.

**The Shared-Table Rule.** Elementos da mesma tarefa pertencem ao mesmo plano
visual; não transformar cada métrica, texto e ação em um card separado.

## Shapes

Formas são suavemente arredondadas e assimétricas apenas nas ilustrações.
Controles mantêm geometria consistente e leitura nativa. Abas, marcadores e
recortes inspirados em papelaria podem criar uma assinatura, mas nunca esconder
estado ou área clicável.

Iconografia usa a família
[Streamline Plump](https://blog.streamlinehq.com/plump/) como referência de
volume e simpatia. A fundação implementa oito pictogramas SVG originais
(`today`, `calendar`, `tasks`, `finance`, `wellbeing`, `goals`, `notes` e
`assistant`) com `viewBox 32`, traço arredondado de `1.8` e preenchimento tonal.
Um pack externo só entra após confirmação de cobertura e licença comercial.

Ilustrações são autorais: objetos cotidianos, folhas, flores, cadernos, relógios,
carteiras e pequenas cenas da rotina, desenhados com contorno orgânico, formas
chapadas e textura discreta. O conjunto compartilha perspectiva, paleta,
espessura de traço e iluminação.

## Implemented Components

- **Login e criação de conta:** formulário de e-mail/senha com rótulos
  nativos, feedback de validação, ações separadas de entrada/cadastro e opção
  de acesso com Google.
- **Onboarding:** primeira configuração protegida para nome, fuso horário,
  lembretes por e-mail e consentimento opcional para processamento com IA.
- **Conta e logout:** o nome autenticado personaliza Hoje; `Sair` está
  disponível na navegação desktop e no menu móvel `Mais`.
- **Estados dos formulários de identidade:** restrições nativas de
  preenchimento/tamanho mínimo, ações desabilitadas e anunciadas durante envio,
  erros inline associados aos campos e redirects protegidos para perfis sem
  sessão ou onboarding.
- **Today shell:** sidebar persistente no desktop e barra inferior com cinco
  destinos + `Mais` no mobile, com link de salto para o conteúdo principal.
- **Morning header:** saudação, data localizada, ação `Adicionar` e ilustração
  editorial própria em WebP (`1200 × 800`, 94 KB).
- **Quick capture:** campo universal em superfície branca; a ação do cabeçalho
  move o foco quando vazio e confirma localmente a captura quando preenchido.
  Um aviso persistente explica que alterações ficam apenas na prévia.
- **Day trail:** linha do tempo branca com aba pêssego, haste fina e marcadores
  semânticos para compromisso, tarefa e conta.
- **Daily summaries:** check-in de humor com cinco glifos próprios e campo
  financeiro em sálvia com motivo botânico.
- **Paper sections:** lista de prioridades e canteiro de hábitos, cada um com
  estrutura e raio próprios.
- **Route states:** carregamento anunciado, erro recuperável e página não
  encontrada compartilham uma pequena cena floral.

## Settled Tokens and Behavior

- Raios: `0.75rem`, `1.125rem` e `1.5rem`, com assimetria pontual na papelaria.
- Sombra ambiental: `0 18px 50px rgb(101 73 61 / 9%)`; elevação de ação usa
  deslocamento vertical e nunca halo decorativo.
- Foco: contorno de `3px` em `#71334A`, deslocado `3px`.
- Movimento: `180ms`, curva `cubic-bezier(0.16, 1, 0.3, 1)`; todo movimento
  não essencial é removido com `prefers-reduced-motion`.
- Dados: moeda em BRL, datas em `pt-BR` e fuso `America/Bahia`.
- Contraste: pares de texto medidos entre `5.24:1` e `7.31:1`.

## Do's and Don'ts

### Do:

- **Do** criar ilustrações específicas para onboarding, estados vazios,
  conquistas, revisão semanal e falhas importantes.
- **Do** usar Plump Line e Plump Duo dentro da mesma gramática.
- **Do** desenhar pictogramas próprios quando o pack não representar bem um
  conceito central do produto.
- **Do** tratar carregamento, vazio, erro, permissão e sucesso como telas
  projetadas, não mensagens improvisadas.
- **Do** validar desktop e celular com conteúdo realista e extremos de dados.
- **Do** usar movimento para explicar confirmação, progresso e mudança de
  estado.

### Don't:

- **Don't** usar Lucide, Heroicons, emojis ou ícones do sistema como identidade
  final do produto.
- **Don't** usar ilustrações corporativas genéricas, pessoas 3D de banco de
  imagens, blobs, órbitas, brilho neon ou gradientes “AI”.
- **Don't** montar páginas inteiras com cards do mesmo tamanho e raio.
- **Don't** colocar cada ícone em um quadrado pastel apenas para preencher
  espaço.
- **Don't** usar glassmorphism, sombras pesadas, excesso de pills ou números
  gigantes sem hierarquia funcional.
- **Don't** substituir conteúdo realista por lorem ipsum, gráficos vazios ou
  placeholders na revisão final.
