# Carrossel de cards — componente `sections.carrossel-cards`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local: Home e `/exemplos`, via seed v6) · validação humana pendente
> **Figma:** [Neste domingo — node 1:51](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-51) (estrutura e textos; o carrossel **não** está no Figma)
> **Vitrine:** `/componentes/carrossel-cards`
> **Guia do editor:** `strapi/src/editor-guide/sections.carrossel-cards.json` + `items.card.json`

## 1. O que é

Título, texto de apoio e uma fileira de cards que passa para o lado com setas. É a seção "Neste domingo" da Home (unidades com horários e endereço), mas serve para qualquer lista de opções: ministérios, eventos, projetos.

**Onde é usado:** Home (Neste domingo) e `/exemplos` (ministérios com foto e cores; eventos com foto abaixo).

## 2. Comportamento do carrossel (pedido do time, sem Figma)

- **Setas** "Card anterior" / "Próximo card" (52 × 52, estilo das setas de "Próximos eventos" no Figma).
- **Infinito com retorno:** no último card, "próximo" volta ao primeiro; no primeiro, "anterior" vai ao último.
- **Animação:** rolagem suave; cards que saem de vista encolhem (95%) e descem 8px, e os que entram sobem de volta; barra de progresso desliza; setas reagem ao hover/clique. Tudo desliga com `prefers-reduced-motion`. A opacidade **não** é reduzida: esmaecer derrubava o contraste do texto abaixo do WCAG AA (apontado pelo axe).
- **Títulos:** o título do card é um nível abaixo do da seção (`h3` normalmente; `h2` se o carrossel for a primeira seção da página).
- **Alinhamento:** cards com 2 ou 3 horários (ou com/sem foto) ficam com título, destaques, texto e ações **na mesma linha** (CSS `subgrid`); os botões/links ficam sempre no rodapé do card.
- **Setas só quando precisa:** escondidas quando todos os cards cabem (mobile: 1 card; tablet: até 2; desktop: até 5).
- Também rola com toque/trackpad e com o teclado (a trilha recebe foco); o leitor de tela ouve "Card 2 de 5".

## 3. Contrato no Strapi

```text
sections.carrossel-cards
├── titulo        Text (short) · obrigatório · máx. 60
├── texto_apoio   Text (long) · máx. 200
├── cards[]       Component repeatable (items.card) · 1 a 12
│   ├── cor          Enumeration · obrigatório · padrão "cinza"
│   │                cinza | branco | preto | azul | verde | laranja | vinho
│   ├── imagem       Media (1 imagem) · opcional
│   ├── titulo       Text (short) · obrigatório · máx. 40
│   ├── destaques    Text (long) · máx. 80 · um por linha (ex.: horários)
│   ├── texto        Text (long) · máx. 240 · linhas por Enter (ex.: endereço)
│   ├── botao        Component (shared.botao) · opcional
│   ├── link         Component (shared.link) · opcional
│   └── url          Text (short) · máx. 255 · opcional — "Página do card": o card inteiro leva a esse endereço
├── estilo_imagem Enumeration · obrigatório · padrão "foto" · foto | arte
│                 foto = 3:2 em preto e branco; arte = arte de divulgação 16:9 colorida (Próximos eventos)
├── posicao_imagem Enumeration · obrigatório · padrão "acima" · acima | abaixo
│                 vale para todos os cards: foto acima do título ou abaixo das ações
└── link          Component (shared.link) · opcional ("ver todos")
```

### 3.1 Cor do card (🟡 paleta proposta, aguardando o design)

| Cor | Fundo (token) | Texto | Contraste do texto | Botão / link |
| --- | --- | --- | --- | --- |
| cinza (padrão) | `--card-cinza` (#F2F2F2) | preto; apoio `--gray-600` | ≥ 4,9:1 | superfície clara |
| branco | `--card-branco` + borda `--color-border-subtle` | preto; apoio `--gray-600` | ≥ 5,3:1 | superfície clara |
| preto | `--card-preto` | **todo branco** | 21:1 | superfície escura (botão branco) |
| azul | `--card-azul` (#1D4E89) | **todo branco** | 8,39:1 | superfície escura |
| verde | `--card-verde` (#1E6B4F) | **todo branco** | 6,42:1 | superfície escura |
| laranja | `--card-laranja` (#B3471D) | **todo branco** | 5,47:1 | superfície escura |
| vinho | `--card-vinho` (#7B1E3A) | **todo branco** | 10,05:1 | superfície escura |

Regras:
- Nas cores escuras **todo** o texto fica branco puro, inclusive o texto de apoio (o cinza `--gray-600` não passa AA sobre cor). O anel de foco inverte para branco.
- `normalize` troca cor vazia ou desconhecida por `cinza` e calcula `superficie` (`clara` para cinza e branco, `escura` para as demais), que é repassada ao `ButtonLink` e ao `TextLink`.
- Fotos continuam em P&B em qualquer cor.

### 3.2 Página do card (card clicável)

Com `url` (sanitizado por `sanitizeHref`; `javascript:` e afins viram "sem link"), o título do card vira um link cujo `::after` cobre o card inteiro (link esticado). Botão e link do card ficam por cima (`z-index`), com destinos próprios — nunca link dentro de link. Foco: contorno no card inteiro. Uso: cards de "Neste domingo" (Home) e "Outras unidades" levam à página da unidade; "Como chegar" continua abrindo o mapa.

### 3.3 Posição e cor da foto

`posicao_imagem`: `acima` (padrão) · `apos_titulo` (título → foto → destaques; usada na agenda) · `abaixo`. `preto_e_branco` (Boolean, padrão `true`): desligado, as fotos dos cards ficam coloridas; arte (`estilo_imagem: arte`) é sempre colorida.


`acima` (padrão): foto → título → destaques → texto → ações. `abaixo`: título → destaques → texto → ações → foto. As linhas continuam alinhadas entre os cards (`subgrid`); a classe `.imagemAbaixo` só é aplicada quando algum card tem foto.

**Decisão:** cards cadastrados dentro da seção (genéricos). Quando a página "Localidades" existir, avaliar um collection type `unidade` referenciado pela seção, para não repetir endereços/horários (regra `Componentes-e-CMS.md` §2.3).

## 4. Variações (vitrine e Strapi)

| Variação | Onde ver |
| --- | --- |
| Sem foto + link "Como chegar" (Figma) | Home · vitrine `completo` |
| Com foto + 7 cores + botão + link de contato (8 cards, setas no desktop) | `/exemplos` · vitrine `com_imagem` |
| Foto abaixo, só link, cores vinho/branco/preto | `/exemplos` ("Eventos com foto abaixo") · vitrine `foto_abaixo` |
| Sem foto, só botão, 2 e 3 horários alinhados | vitrine `so_botao` |
| Mínimo (1 card, sem setas) | vitrine `minimo` |
| Texto longo | vitrine `texto_longo` |
| Arte de divulgação 16:9 colorida (eventos da inChurch) | Home e `/exemplos` (seção Próximos eventos) · vitrine `proximos-eventos` |

**Controles na vitrine** (liga/desliga em cima de qualquer exemplo): cor dos cards (uma cor ou variadas), foto nos cards, tipo de imagem (foto P&B 3:2 ou arte 16:9 colorida), posição da foto, ação do card (botão + link, só botão, só link, nenhuma), estilo do botão, texto de apoio e link "ver todos".

## 5. Estados incompletos

| Se o editor… | Na página acontece |
| --- | --- |
| deixar o título da seção vazio ou não cadastrar cards | a seção não aparece |
| criar card sem título | o card não aparece |
| escrever mais de 4 destaques | só os 4 primeiros aparecem |
| não escolher a cor (ou vier uma cor desconhecida) | card cinza |
| escolher "abaixo" sem nenhum card com foto | nada muda (não há foto) |
| criar botão/link sem texto, sem URL ou com URL inválida | o botão/link não aparece |
| misturar cards com e sem foto | continua alinhado (espaço da foto reservado), mas fica irregular — evite |

## 6. Layout

| Tier | Comportamento |
| --- | --- |
| Mobile ≤768 | 🟡 1 card (80%) + pedaço do próximo; título, depois setas; trilha vai até a borda |
| Tablet 769–1023 | 🟡 2 cards e meio (40% cada) |
| Desktop ≥1024 | ✅ 5 cards por vez (Figma: 261px, gap 12); setas à direita do título |

Tokens novos: `--font-size-h2`, `--font-size-h3`, `--font-size-destaque`, `--radius-md`, `--radius-sm`, `--carrossel-botao`, `--intro-max` (🟡 inferidos das caixas de texto do Figma).

## 7. Pendências

- Texto do link dos cards no Figma não extraído (limite do MCP): usado "Como chegar" / "Assistir".
- Fundo e raio do card: proposta (cinza `--color-bg-subtle`, raio 20).
- Paleta de cores dos cards (azul, verde, laranja, vinho) e foto abaixo: propostas, sem Figma — aguardam o design.
- ⏳ Validação humana: leitor de tela, celular real, aprovação do design para o carrossel.

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `como_chegar` (link do Google Maps, `unidade` = título do card); `clique_cta` (no card clicável: `texto` = título do card, `destino` = página, ex.: `/campestre`); `ver_secao`. Quando reaproveitado por Próximos eventos, `data-section="proximos-eventos"` e `selecionar_evento`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/sections/CarrosselCardsSection/CarrosselCardsSection.test.tsx`
- `next/src/components/sections/CarrosselCardsSection/normalize.test.ts`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
