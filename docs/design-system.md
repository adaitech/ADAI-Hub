# Design system ADAI

> **Fonte visual:** Figma `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`, página `Home`, node `0:1`), desktop de 1440px.
> **Spec:** [`docs/superpowers/specs/2026-10-18-design-system-figma-design.md`](superpowers/specs/2026-10-18-design-system-figma-design.md) · **Plano:** [`docs/superpowers/plans/2026-10-18-design-system-figma.md`](superpowers/plans/2026-10-18-design-system-figma.md)
> **Código:** [`next/src/styles/tokens.css`](../next/src/styles/tokens.css) · **Style guide:** [`docs/design-system.html`](design-system.html) · **Template:** [`templates/adai-page-template.html`](../templates/adai-page-template.html)

## 1. Visão geral

O site da ADAI é editorial, contemporâneo e acolhedor: tipografia forte em Bold, títulos compactos com tracking negativo, muito espaço em branco, superfícies claras em preto, branco e cinzas, fotos (algumas em P&B) e cantos arredondados. A identidade se resume em **Amar a Deus. Servir as pessoas. Influenciar o mundo.**

Este documento é a referência humana. `tokens.css` é a fonte executável; os dois HTMLs autocontidos repetem os mesmos tokens. O teste `next/src/__tests__/caracteristicas/design-system.test.ts` falha se nomes ou valores divergirem, se uma prancha ou componente sair do inventário, se uma seção ficar vazia ou se surgir dependência de rede.

Toda afirmação tem uma classificação:

| Marca | Significado |
| --- | --- |
| **Observado** | Lido diretamente de nó, estilo ou variável do Figma. |
| **Derivado** | Consolidado de mais de uma ocorrência, ou valor já extraído do Figma e registrado no projeto antes desta auditoria. |
| **Proposto** | Necessário para produção, mas ausente do Figma. Não é oficial até o design aprovar. |
| **não identificado** | Valor citado, mas não lido. Nunca é inventado. |

## 2. Evidências e inventário

### 2.1 Como os valores foram lidos

Em 2026-10-18 foram feitas nove leituras no Figma MCP: variáveis e estilos locais da Home (`1:3`) e da seção Componentes (`237:1296`), estrutura completa da Home, e o desenho de Header, Top bar, Barra de anúncio, Botão, Hero e Card / Evento. Depois disso o Figma bloqueou novas chamadas (limite do assento View). Os nós não lidos nesta auditoria usam valores que o projeto já tinha extraído do Figma antes (marcados **Derivado**) ou ficam como pendência.

### 2.2 Pranchas

| Nó | Prancha | Rota | Leitura nesta auditoria | Padrão no template |
| --- | --- | --- | --- | --- |
| `1:3` | Home / Desktop | `/` | Estrutura completa, Hero, variáveis e estilos | Página inteira |
| `4:270` | Unidade / Campestre / Desktop | `/unidades/campestre` | Derivado (Hero / Campestre `28:419`, Ministérios `28:462`, FAQ `31:167` já extraídos) | Hero + editorial + cards + FAQ |
| `220:18960` | Nossa História | `/sobre-nos/nossa-historia` | Só ID e rota | `pagina--institucional` |
| `220:19032` | A Igreja Que Vemos | `/sobre-nos/a-igreja-que-vemos` | Só ID e rota | `pagina--institucional` |
| `220:19107` | No que cremos | `/sobre-nos/no-que-acreditamos` | Só ID e rota | `pagina--institucional` |
| `220:19183` | Jesus | `/jesus` | Só ID e rota | `pagina--institucional` + CTA |
| `220:19253` | Agenda | `/agenda` | Só ID e rota (a Agenda está em revisão no PR #10) | Card / Evento agenda |
| `220:19333` | Contribua | `/contribua` | Textos da seção Contribua da Home (`1:279`) | CTA de destaque |
| `220:19389` | Nossa Casa | `/nossacasa` | Só ID e rota | Editorial + CTA |
| `220:19607` | Connect | `/connect` | Só ID e rota | Editorial + cards |
| `220:19491` | Contato | `/contato` | Só ID e rota | Formulário |
| `253:1255` | Template · Ministério | — | Só ID | `pagina--ministerio` |
| `255:1357` | Template · Próximo passo | — | Só ID | `pagina--proximo-passo` |
| `256:1459` | Template · Evento | — | Só ID | `pagina--evento` |
| `257:1560` | Template · Mensagens | — | Derivado (Mensagens `1:133`–`1:152` já extraídos) | `pagina--mensagens` |

### 2.3 Componentes (seção `237:1296`)

| Nó | Componente | Medidas | Leitura |
| --- | --- | --- | --- |
| `244:1256` | Navegação / Barra de anúncio | 606 × 48 (instância 1440 × 48) | Observado |
| `233:21` | Navegação / Top bar | 1440 × 36 | Observado |
| `233:48` | Navegação / Header | 1440 × 80 | Observado, com o logo em SVG |
| `233:106` | Navegação / Footer | 1440 × 616,7 | Derivado (Footer `1:306` já extraído) |
| `237:1253` | Botão (conjunto de variantes) | 198 × 232 | Observado |
| `237:1246` | Botão · Claro | 145 × 52 | Observado |
| `237:1249` | Botão · Contorno | 187 × 52 | Observado |
| `237:1252` | Botão · Primário | 198 × 52 | Observado |
| `234:998` | Card / Unidade | 261 × 480 (instância da Home: 261 × 360) | Observado pela instância; interior do componente não lido |
| `237:1199` | Card / Evento | 329,41 × 398 | Observado |
| `238:1236` | Card / Evento agenda | 443 × 413 | Só dimensões; anatomia Proposta (segue o card da Agenda em revisão no PR #10) |
| `234:1010` | Card / Página relacionada | 443,2 × 508 | Só dimensões; anatomia Proposta |

## 3. Tipografia

### 3.1 Família e licença

O Figma usa **Suisse Intl** em dois cortes: `SuisseIntl-Book` (peso 450) e `SuisseIntl-Bold` (700). Não há licença web, então nenhum arquivo da Suisse é baixado, versionado ou incorporado.

| Onde | Pilha | Classificação |
| --- | --- | --- |
| Next (produção) | `--font-body` = Inter e `--font-display` = Inter Tight, auto-hospedadas pelo `next/font` | Proposto (substituto licenciado) |
| HTMLs autocontidos | `"Suisse Intl", "SuisseIntl-Book", "Inter Tight", Inter, Arial, Helvetica, sans-serif` | Proposto |

Mapeamento: Suisse **Book → Inter/Inter Tight 400** (`--font-weight-regular`) e Suisse **Bold → Inter/Inter Tight 700** (`--font-weight-bold`). Nos HTMLs, `--font-weight-book: 450` preserva o valor observado e cai para 400 nas substitutas. Se a licença vier, troca-se `Inter_Tight` por `next/font/local` com os `.woff2`, mantendo `--font-display`; nenhum componente muda.

### 3.2 Escala

Valores de 1440px **Observados** nos estilos locais. Tracking do Figma em % vira `em` no CSS. O mínimo de cada `clamp()` é **Proposto** (não há mobile no Figma).

| Estilo Figma | Token | Valor | Line-height | Tracking | Peso | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| Display | `--font-size-display` | `clamp(48px, 9.03vw, 130px)` | `--line-height-display` `0.88` | `--letter-spacing-display` `-0.055em` | Bold | "Amar. Servir. Influenciar." |
| H1 | `--font-size-h1` | `clamp(2.5rem, 5.417vw, 4.875rem)` | `--line-height-h1` `0.95` | `--letter-spacing-h1` `-0.045em` | Bold | Títulos de seção e de página |
| H2 | `--font-size-h2` | `clamp(2rem, 3.333vw, 3rem)` | `--line-height-h2` `0.98` | `--letter-spacing-h2` `-0.04em` | Bold | "Ecossistema ADAI", "Fique por dentro", nomes de ministério |
| H3 | `--font-size-h3` | `1.75rem` | `--line-height-h3` `1.1` | `--letter-spacing-h3` `-0.03em` | Bold | Título de card |
| H4 | `--font-size-h4` | `1.25rem` | `--line-height-h4` `1.15` | `--letter-spacing-h4` `-0.02em` | Bold | Mês do card de evento |
| Número / Data | `--font-size-numero` | `clamp(4rem, 5.972vw, 5.375rem)` | `--line-height-numero` `0.85` | `--letter-spacing-numero` `-0.06em` | Bold | Dia do card de evento |
| Marca / Rodapé | `--font-size-marca` | `clamp(96px, 30vw, 432px)` | `--line-height-marca` `0.78` | `--letter-spacing-marca` `-0.07em` | Bold | "ADAI" gigante do footer, opacidade 18% |
| Corpo | `--font-size-corpo` | `1.125rem` | 1.5 | 0 | Book | Apoio de hero e de seção |
| Corpo pequeno | `--font-size-corpo-pequeno` | `1rem` | 1.5 | 0 | Book | Menu, textos de card |
| Legenda | `--font-size-legenda` | `0.9375rem` | `--line-height-legenda` `1.45` | 0 | Book | Local e hora de evento |
| Micro | `--font-size-micro` | `0.8125rem` | 1.45 | 0 | Book | Top bar, linha legal |
| Botão | `--font-size-botao` | `1rem` | 1.5 | 0 | Bold | Rótulo de botão |
| Link menu | `--font-size-link-menu` | `var(--font-size-corpo-pequeno)` | 1.5 | 0 | Book | Derivado: o header usa o estilo Corpo pequeno |
| Abertura | — | não identificado | — | — | — | Citado na spec, ausente das variáveis lidas. Até confirmar, usar Corpo. |

**Derivado:** os títulos de seção da Home ("Neste domingo", "Primeira vez na ADAI?", "Próximos eventos", "Encontre seu lugar") medem 74px de linha = H1 78 × 0,95. Por isso os módulos que usavam o antigo `--font-size-h2` (72px) passaram a usar `--font-size-h1`.

### 3.3 Book × Bold

- **Bold:** displays, títulos, números, datas, rótulos de lista ("Como é o culto") e ações (botões, "Como chegar").
- **Book:** parágrafos, menus, legendas, endereços e apoios.
- **Evitar:** parágrafo inteiro em Bold, Bold espalhado para ênfase na mesma frase e título em Book.

### 3.4 Aliases de migração

Nomes antigos que continuam funcionando e apontam para o canônico: `--font-size-mega` → `--font-size-marca`, `--font-size-chamada` → `--font-size-h1`, `--font-size-lead` → `--font-size-corpo`, `--font-size-body` → `--font-size-corpo-pequeno`, `--font-size-xs` → `--font-size-micro`, e as linhas/trackings `-mega` e `-chamada`. Os aliases `-mega` e `-chamada` já não têm consumidor (o teste impede a volta); `lead`, `body` e `xs` ficam para limpeza gradual. Fora da escala do Figma, mantidos do projeto: `--font-size-body-lg` (17, Derivado do footer), `--font-size-destaque` (32, Derivado dos horários do card de unidade), `--font-size-chamada-apoio` (20) e `--font-size-sm` (14, Proposto).

## 4. Cores e contraste

### 4.1 Primitivos

| Token | Valor | Variável Figma | Classificação | Uso |
| --- | --- | --- | --- | --- |
| `--black` | `#000000` | `cor/preto` | Observado | Texto, botão primário, barra de anúncio |
| `--white` | `#ffffff` | `cor/branco` | Observado | Fundo, texto sobre foto, botão claro |
| `--gray-100` | `#f2f2f2` | `cor/superficie` | Observado | Footer, cards, caixas |
| `--gray-200` | `#e8e8e8` | `cor/superficie-2` | Observado | Hover de card (uso Proposto) |
| `--gray-500` | `#777777` | `cor/cinza` | Observado | Só borda e ícone; falha AA em texto normal |
| `--gray-600` | `#6b6b6b` | — | Proposto (acessibilidade) | Texto secundário no lugar do `#777` |
| `--gray-900` | `#333333` | — | Derivado | Fundo atrás de fotos; hover do primário (Proposto) |

Cores de card (azul, verde, laranja, vinho) e `--orange-700` continuam **Propostas** do projeto, fora do Figma.

### 4.2 Semânticos

| Token | Aponta para | Uso |
| --- | --- | --- |
| `--color-bg-page` | `var(--white)` | Fundo padrão |
| `--color-bg-subtle` | `var(--gray-100)` | Superfícies cinza |
| `--color-bg-subtle-2` | `var(--gray-200)` | Hover de superfície cinza (Proposto) |
| `--color-bg-inverse` | `var(--black)` | Faixas escuras, botão primário |
| `--color-text-primary` | `var(--black)` | Texto padrão |
| `--color-text-muted` | `var(--gray-600)` | Texto secundário (Proposto: substitui o `#777`) |
| `--color-text-inverse` | `var(--white)` | Texto sobre foto ou fundo escuro |

### 4.3 Contraste (WCAG 2.2)

| Texto | Fundo | Razão | Resultado |
| --- | --- | --- | --- |
| `#000000` | `#ffffff` | 21,00:1 | AA e AAA |
| `#000000` | `#f2f2f2` | 18,76:1 | AA e AAA |
| `#000000` | `#e8e8e8` | 17,14:1 | AA e AAA |
| `#ffffff` | `#000000` | 21,00:1 | AA e AAA |
| `#777777` (Observado) | `#ffffff` | 4,48:1 | Falha em texto normal (top bar e legenda no Figma) |
| `#777777` (Observado) | `#f2f2f2` | 4,00:1 | Falha em texto normal |
| `#6b6b6b` (Proposto) | `#ffffff` | 5,33:1 | AA |
| `#6b6b6b` (Proposto) | `#f2f2f2` | 4,76:1 | AA |
| `#6b6b6b` | `#e8e8e8` | 4,35:1 | **Par proibido**: não usar texto suave em superfície 2 |
| `#b3471d` (Proposto) | `#ffffff` | 5,47:1 | AA |

O teste de característica recalcula os quatro pares semânticos de uso comum e o par proibido.

## 5. Espaçamento

**Observados** nos nós lidos (px em 1440):

| Valor | Onde | Token |
| --- | --- | --- |
| 10 | Entre os botões do hero | `--space-10` |
| 12 | CTAs do header; grade de unidades e de eventos | `--space-12` |
| 14 | Data → título no card de evento | `--space-14` |
| 20 | Texto → botões no hero | `--space-20` |
| 22 | Padding do card de evento | só nos HTMLs (`--space-22`) |
| 24 | Padding do card de unidade; recuo do campo | `--space-24` |
| 28 | Links da top bar | só nos HTMLs (`--space-28`) |
| 32 | Itens do menu | `--space-32` |
| 40 | Colunas do footer | `--space-40` |
| 56 | Padding interno do hero | `--space-56` |
| 72 | Padding das caixas cinza (Mensagens, Ministérios) — Derivado | `--serie-caixa-padding`, `--ministerios-padding` |
| 86,4 | Foto ↔ texto | `--space-coluna` |
| 96 | Topo do footer | `--space-96` |

| Token | Valor | Classificação |
| --- | --- | --- |
| `--space-section` | `clamp(64px, 8.333vw, 120px)` | Derivado (120 recorrente) · mínimo Proposto |
| `--space-page-margin` | `clamp(16px, 5.556vw, 80px)` | Observado (80) · mínimo Proposto |

## 6. Layout e breakpoints

| Item | Token | Valor | Classificação |
| --- | --- | --- | --- |
| Shell | `--container-max` | `90rem` | Observado (1440) |
| Conteúdo | `--content-max` | `80rem` | Observado (1280) |
| Margem lateral das seções | `--space-page-margin` | `clamp(16px, 5.556vw, 80px)` | Observado em 1440 · Proposto abaixo |
| Gutter de header e top bar | `--space-gutter` | 43,2px em 1440 (3%) | Observado |
| Mobile | — | base, até 768px | Proposto |
| Tablet | — | `@media (min-width: 769px)` | Proposto |
| Desktop | — | `@media (min-width: 1024px)` | Derivado (grades do Figma) |

Os módulos do Next ainda usam `--container-max` + `--space-gutter` nas seções; a troca para `--content-max` + `--space-page-margin` está registrada em Pendências.

## 7. Formas

| Token | Valor | Variável Figma | Uso |
| --- | --- | --- | --- |
| `--radius-sm` | `14px` | `raio/pequeno` | Linhas de lista (Ministérios `1:239`); campos de formulário (Proposto) |
| `--radius-md` | `20px` | `raio/medio` | Fotos editoriais, card de evento |
| `--radius-lg` | `28px` | `raio/grande` | Hero, grandes superfícies |
| `--radius-pill` | `999px` | `raio/pilula` | Botões, selos |

Borda de botão: 1px (Observado). Opacidade da marca do footer: 18% (Observado).

## 8. Componentes

### 8.1 Barra de anúncio (`244:1256`)

- **Finalidade:** aviso curto e temporário com uma ação.
- **Anatomia e medidas (Observado):** faixa preta de 48px, texto e link em Botão 16 Bold branco, gap 12, link sublinhado.
- **Estados:** hover do link com sublinhado de 2px (Proposto).
- **Mobile (Proposto):** quebra em duas linhas, centralizada; link com 44px de altura.
- **Acessibilidade:** `<aside aria-label="Anúncio">`; o link ganha complemento para leitor de tela ("Inscrever-se no Alpha").
- **Evitar:** mais de um aviso ou aviso permanente.

### 8.2 Top bar (`233:21`)

- **Anatomia (Observado):** 36px, links institucionais em Micro 13, gap 28, centralizados, padding 43,2.
- **Cor:** `#777` no Figma; `--color-text-muted` (`#6b6b6b`) no produto (Proposto de acessibilidade).
- **Mobile (Proposto):** alvo de 44px; quebra em mais linhas se faltar espaço.
- **Acessibilidade:** `<nav aria-label="Institucional">`.

### 8.3 Header (`233:48`)

- **Anatomia (Observado):** 80px; logo de 99,21 × 32,6; menu em Corpo pequeno com gap 32; dois botões de 40px com gap 12: "Ao vivo" (contorno preto) e "Planeje sua visita" (primário).
- **Estados (Proposto):** sublinhado no hover; `aria-current="page"` sublinhado.
- **Mobile e tablet (Proposto):** abaixo de 1024px, botão "Menu" (44px, `aria-expanded`) abre o painel; Esc fecha e devolve o foco.
- **Acessibilidade:** `<header>`, `<nav aria-label="Principal">`, logo com nome "ADAI, página inicial".

### 8.4 Footer (`233:106`)

- **Anatomia (Derivado de `1:306`):** fundo `#f2f2f2`, padding-top 96, grade 1.4fr / 1fr / 1fr / 1fr com gap 40; frase da marca em 17 Light até 300px; colunas com título 16 Bold e links 17 Bold; linha legal em Micro; "ADAI" em Marca 432 com 18% de opacidade cortado na borda inferior.
- **Mobile (Proposto):** tudo empilhado; três colunas lado a lado a partir de 769px.
- **Acessibilidade:** `<footer>`, `<nav aria-label="Rodapé">`, títulos de coluna em `h2`, "ADAI" com `aria-hidden` e `pointer-events: none`.

### 8.5 Botão (`237:1253`: `237:1246` Claro, `237:1249` Contorno, `237:1252` Primário)

- **Anatomia (Observado):** 52px, pílula, Botão 16 Bold, padding lateral 28,5 (Claro e Contorno) e 29,5 (Primário), borda de 1px.
- **Variantes:** Primário (preto, texto branco), Claro (branco, texto preto, sobre foto), Contorno (borda e texto brancos, sobre foto), Contorno escuro (borda e texto pretos, observado no header), Baixo (40px, observado no header).
- **Estados (Proposto):** hover do Primário `#333333`; hover do Claro `#f2f2f2`; hover dos contornos preenche; ativo com escala 0,97; foco com anel de 3px a 3px de distância (preto em fundo claro, branco em fundo escuro ou foto); desabilitado com 40% de opacidade.
- **Evitar:** dois primários lado a lado; rótulo genérico ("Clique aqui").

### 8.6 Card / Unidade (`234:998`)

- **Anatomia (Observado na Home):** 261 × 360, padding 24, nome em H3, horários em 32 Bold (3 linhas em 93px, Derivado), endereço em Legenda, link "Como chegar" com borda inferior.
- **Fundo e raio:** `#f2f2f2` e 20px (Proposto); hover `#e8e8e8` (Proposto).
- **Grade:** 5 colunas com gap 12 no desktop (Observado); 2 no tablet e 1 no mobile (Proposto).
- **Acessibilidade:** um único link esticado sobre o card; nome acessível "Como chegar à unidade Santos".

### 8.7 Card / Evento (`237:1199`)

- **Anatomia (Observado):** 329,41 de largura; quadro de data em `#f2f2f2` com raio 20 e padding 22 (mês em H4 no topo, dia em Número 86 na base); gap 14; título em H3; local e hora em Legenda.
- **Cor da legenda:** `#777` no Figma; `#6b6b6b` no produto (Proposto de acessibilidade).
- **Interação (Proposto):** trilho com rolagem horizontal própria e scroll-snap; setas de 52 × 52 (Observado) que desabilitam nas pontas.
- **Acessibilidade:** quadro de data `aria-hidden`; a data se repete em `<time>`; o link é o título.

### 8.8 Card / Evento agenda (`238:1236`)

- **Medidas (Observado):** 443 × 413.
- **Anatomia (Proposto até ler o nó; segue o card da Agenda em revisão no PR #10):** arte 16:9 no topo, selo da unidade no canto superior direito, data, título em H3 e resumo.
- **Acessibilidade:** `article` com link esticado; arte decorativa porque o título está em texto.

### 8.9 Card / Página relacionada (`234:1010`)

- **Medidas (Observado):** 443,2 × 508.
- **Anatomia (Proposto até ler o nó):** foto 4:3 com raio 20 em P&B, título em H3, uma linha de apoio e "Ler mais".
- **Uso:** fim de páginas institucionais e de ministério.

### 8.10 Campos de formulário

- **Observado:** um campo ("Seu melhor e-mail", `245:1295`) de 420 × 52 com recuo de 24.
- **Proposto:** rótulo visível em Bold acima; borda de 1px `#777` (4,48:1, acima dos 3:1 de WCAG 1.4.11); raio 14; foco com borda e sombra pretas de 2px; erro com borda `#b3471d`, ícone e texto, `aria-invalid` e resumo de erros com links para os campos; desabilitado em `#f2f2f2`.

## 9. Padrões de página

O template ([`templates/adai-page-template.html`](../templates/adai-page-template.html)) compõe anúncio, top bar, header, hero, editorial, grade de cards, próximos eventos, CTA de destaque, formulário e footer. Cada variação muda a classe do `<body>` e segue os comentários `VARIAÇÃO`:

| Classe | Pranchas | O que muda |
| --- | --- | --- |
| `pagina--institucional` | Nossa História, A Igreja Que Vemos, No que cremos, Jesus, Nossa Casa | Editorial sem lista; grade de cards vira Página relacionada |
| `pagina--ministerio` | Template · Ministério | Hero com o nome do ministério; próximos eventos do ministério |
| `pagina--proximo-passo` | Template · Próximo passo, Connect | Formulário de inscrição em destaque |
| `pagina--evento` | Template · Evento, Agenda | Hero com o evento; "Outros eventos" com Card / Evento agenda |
| `pagina--mensagens` | Template · Mensagens | Caixa cinza da série atual e cards de parte |

## 10. Boas práticas

- Usar sempre tokens semânticos em componentes; nada de hex ou px soltos fora de `tokens.css` (o `css.test.ts` verifica).
- Mobile-first, só `min-width` 769 e 1024; títulos fluidos com `clamp()`, `text-wrap: balance` e sem `nowrap`.
- Fotos coloridas sobem no Strapi; P&B é `filter: grayscale(1)` quando a seção pede (Observado em "Primeira vez"; o Hero e a liderança são coloridos).
- Texto sobre foto só com `--gradient-media-overlay`.
- Um único `h1` por página; seções em `h2`, cards em `h3`.
- Links com nome compreensível fora de contexto; complemento só para leitor de tela quando o texto visível é curto.
- Foco sempre visível; `prefers-reduced-motion` desliga transições; alvo de toque de 44px no mobile.

## 11. Inventário de propostas

Tudo abaixo é **Proposto** e depende de aprovação do design:

1. Layout de mobile e tablet, mínimos de `clamp()` e breakpoints.
2. `#6b6b6b` como cor de texto secundário no lugar do `#777` (acessibilidade).
3. Estados de hover, foco, ativo e desabilitado de botões, links, cards e campos.
4. Fundo `#f2f2f2`, raio 20 e hover `#e8e8e8` do Card / Unidade.
5. Anatomia do Card / Página relacionada e do Card / Evento agenda.
6. Campos de formulário completos (borda, raio, estados, erro em `#b3471d`).
7. Menu compacto abaixo de 1024px.
8. Trilho de eventos com scroll-snap e ícones das setas redesenhados (o vetor original não foi exportado).
9. Raio 28 na caixa do CTA de destaque.
10. Pilha de fontes com Inter Tight/Inter como substitutas da Suisse Intl.

## 12. Pendências

- **Licença web da Suisse Intl:** sem comprovação, o produto segue com Inter/Inter Tight.
- **Validação do mobile** pelo time de design.
- **Estilo Abertura:** não identificado nas variáveis lidas.
- **Cinza de texto:** aprovação do `#6b6b6b`.
- **Nós não lidos** (bloqueio do Figma MCP): interior de Card / Unidade, Card / Evento agenda, Card / Página relacionada e Footer na seção Componentes; as 13 pranchas além de Home e Unidade.
- **Container das seções no Next:** migrar os módulos de `--container-max` + `--space-gutter` para `--content-max` + `--space-page-margin` (80px em 1440), seção por seção, com conferência visual.
- **Aliases** `--font-size-lead`, `--font-size-body` e `--font-size-xs`: trocar pelos canônicos e remover.
