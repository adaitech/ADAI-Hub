---
description: Design tokens do ADAI Hub (cores, tipografia, espaçamento, raios) extraídos do Figma — fonte única para CSS
alwaysApply: true
---

# Design Tokens — ADAI Hub

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`yarn quality`). Tipos e exigências: [`Testes.md`](./Testes.md) · checklist antes de subir e de abrir o PR: [`Pull-Request.md`](./Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

> Verificado no `yarn test` (`src/__tests__/caracteristicas/css.test.ts`): nenhuma cor (hex/rgb/hsl) fora de `tokens.css` e todo `var(--token)` usado existe.

**Arquivo de código:** `next/src/styles/tokens.css` (importado uma vez em `src/styles/globals.css`).
**Origem:** Figma `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`), frame `Home / Desktop` (1440px). O arquivo tem **variáveis locais** (`cor/*`, `raio/*`) e **14 estilos de texto**, lidos em 2026-10-18; o restante veio dos layers.
**Referência completa:** [`docs/design-system.md`](../../docs/design-system.md) (Observado / Derivado / Proposto, componentes, pranchas e pendências) · style guide [`docs/design-system.html`](../../docs/design-system.html) · template [`templates/adai-page-template.html`](../../templates/adai-page-template.html). Os dois HTMLs repetem os tokens canônicos e `src/__tests__/caracteristicas/design-system.test.ts` falha se divergirem.

## Status dos valores

| Marca | Significado |
| --- | --- |
| ✅ | Confirmado no Figma (seções já extraídas: Header, Hero, Footer) |
| 🟡 | Proposta — inferida do layout ou sem referência mobile no Figma; **confirmar ao extrair a seção** e atualizar aqui |

Ao implementar uma seção: comparar os valores do Figma com esta tabela. Valor novo → adicionar token aqui **e** em `tokens.css` no mesmo PR. Valor sem referência → escrever `[VALOR NÃO ENCONTRADO]: <descrição>` no PR e perguntar; **nunca inventar**.

---

## 1. Regras de uso

1. Componentes usam **tokens semânticos** para cor (`--color-text-primary`), nunca primitivos (`--gray-900`) nem hex.
2. Espaçamento e tamanhos usam os tokens de escala (`--space-*`, `--font-size-*`); nada de `px` solto em `.module.css`, exceto `1px` de borda e `0`.
3. Breakpoints **não** são variáveis (CSS não permite em `@media`): usar apenas `769px` e `1024px` (ver `CSS-Mobile-First.md`).
4. O design é **fluido**: medidas do Figma são proporcionais a 1440px (ex.: 43,2px = 3% da largura). Tokens fluidos usam `clamp()`.

---

## 2. Cores

### 2.1 Primitivos (só dentro de `tokens.css`)

| Token | Valor | Status | Onde aparece |
| --- | --- | --- | --- |
| `--black` | `#000000` | ✅ variável `cor/preto` | Texto, botão primário, borda de botão |
| `--white` | `#FFFFFF` | ✅ variável `cor/branco` | Fundo da página, texto sobre foto |
| `--gray-900` | `#333333` | ✅ | Fundo do Hero (atrás da foto) |
| `--gray-600` | `#6B6B6B` | 🟡 decisão a11y | Texto secundário (substitui o `#777` do Figma: 4,76:1 sobre `#F2F2F2`) |
| `--gray-500` | `#777777` | ✅ variável `cor/cinza` | **Não usar em texto sobre `--gray-100`**: contraste 4,00:1 falha WCAG AA (mín. 4,5:1). Aguardando aprovação do design para o `#6B6B6B` |
| `--gray-100` | `#F2F2F2` | ✅ variável `cor/superficie` | Fundo do footer, cards, caixas |
| `--gray-200` | `#E8E8E8` | ✅ variável `cor/superficie-2` | Hover de superfície cinza (uso 🟡) |
| `--gray-300` | `#D9D9D9` | 🟡 proposta | Borda do card branco (decorativa: o texto do card já identifica a área) |
| `--blue-700` | `#1D4E89` | 🟡 proposta | Card azul — branco sobre ele: 8,39:1 |
| `--green-700` | `#1E6B4F` | 🟡 proposta | Card verde — branco: 6,42:1 |
| `--orange-700` | `#B3471D` | 🟡 proposta | Card laranja — branco: 5,47:1 |
| `--wine-700` | `#7B1E3A` | 🟡 proposta | Card vinho — branco: 10,05:1 |
| `--overlay-strong` | `rgba(0, 0, 0, 0.6)` | ✅ | Degradê do Hero (base) |
| `--overlay-soft` | `rgba(0, 0, 0, 0.05)` | ✅ | Degradê do Hero (65% da altura) |

### 2.2 Semânticos (usar nos componentes)

| Token | Aponta para | Uso |
| --- | --- | --- |
| `--color-bg-page` | `--white` | Fundo padrão |
| `--color-bg-subtle` | `--gray-100` | Footer, blocos cinza (cards FAQ/“Primeira vez”: 🟡 confirmar) |
| `--color-bg-subtle-2` | `--gray-200` | 🟡 Hover de superfície cinza. **Não** usar `--color-text-muted` sobre ela (4,35:1) |
| `--color-bg-inverse` | `--black` | Faixas escuras, botão primário |
| `--color-bg-media` | `--gray-900` | Placeholder atrás de fotos |
| `--color-text-primary` | `--black` | Texto padrão |
| `--color-text-muted` | `--gray-600` | Texto secundário, legal (AA garantido em branco e em `--gray-100`) |
| `--color-text-inverse` | `--white` | Texto sobre foto/fundo escuro |
| `--color-border-strong` | `--black` | Borda de botão outline |
| `--color-border-inverse` | `--white` | Borda de botão outline sobre foto |
| `--color-focus-ring` | `--black` 🟡 (sobre foto: `--white`) | Anel de foco `:focus-visible` |
| `--color-border-subtle` | `--gray-300` 🟡 | Borda fina de superfícies brancas sobre branco (card branco) |
| `--gradient-media-overlay` | `linear-gradient(to top, var(--overlay-strong), var(--overlay-soft) 65%)` ✅ | Garante contraste de texto sobre foto |

### 2.3 Cores de card (🟡 proposta, fora do Figma)

Usadas pelo campo "Cor do card" (`items.card.cor`) do Carrossel de cards. Nas cores escuras, **todo** o texto do card é `--color-text-inverse` (branco puro, AA ≥ 5,4:1) e botões/links usam a superfície `escura`. Detalhes em `docs/componentes/carrossel-cards.md` §3.1.

| Token | Aponta para | Texto |
| --- | --- | --- |
| `--card-cinza` (padrão) | `--color-bg-subtle` | preto |
| `--card-branco` | `--color-bg-page` + borda `--color-border-subtle` | preto |
| `--card-preto` | `--black` | branco |
| `--card-azul` | `--blue-700` | branco |
| `--card-verde` | `--green-700` | branco |
| `--card-laranja` | `--orange-700` | branco |
| `--card-vinho` | `--wine-700` | branco |

Nova cor = novo primitivo com contraste ≥ 4,5:1 contra o texto que ele recebe + token `--card-*` + valor no enum do Strapi + `CORES_CARD` no front + guia do editor.

**Fotos em preto e branco:** o Figma aplica saturação zero nas fotos (Hero, "Primeira vez", Liderança). Implementar com `filter: grayscale(1)` na imagem, não com imagem pré-editada — o editor sobe a foto colorida no Strapi. ✅

---

## 3. Tipografia

Famílias: `--font-body` (Inter) e `--font-display` (Inter Tight) — ver `Stack-Fontes-e-Bibliotecas.md`.

### 3.1 Pesos

| Token | Valor |
| --- | --- |
| `--font-weight-light` | 300 |
| `--font-weight-regular` | 400 |
| `--font-weight-bold` | 700 |

### 3.2 Escala

Estilos locais do Figma (✅ em 1440; mínimo do `clamp()` 🟡). Tracking do Figma em % = `em`.

| Token | Figma | Valor CSS | Line-height | Tracking | Uso |
| --- | --- | --- | --- | --- | --- |
| `--font-size-display` | Display 130 | `clamp(48px, 9.03vw, 130px)` | `--line-height-display` 0.88 | `--letter-spacing-display` `-0.055em` | "Amar. Servir. Influenciar." |
| `--font-size-h1` | H1 78 | `clamp(2.5rem, 5.417vw, 4.875rem)` | `--line-height-h1` 0.95 | `--letter-spacing-h1` `-0.045em` | **Títulos de seção** (linha de 74px no Figma) |
| `--font-size-h2` | H2 48 | `clamp(2rem, 3.333vw, 3rem)` | `--line-height-h2` 0.98 | `--letter-spacing-h2` `-0.04em` | Subtítulos ("Ecossistema ADAI"); ainda sem consumidor |
| `--font-size-h3` | H3 28 | `1.75rem` | `--line-height-h3` 1.1 | `--letter-spacing-h3` `-0.03em` | Título de card |
| `--font-size-h4` | H4 20 | `1.25rem` | `--line-height-h4` 1.15 | `--letter-spacing-h4` `-0.02em` | Mês do card de evento |
| `--font-size-numero` | Número / Data 86 | `clamp(4rem, 5.972vw, 5.375rem)` | `--line-height-numero` 0.85 | `--letter-spacing-numero` `-0.06em` | Dia do card de evento |
| `--font-size-marca` | Marca / Rodapé 432 | `clamp(96px, 30vw, 432px)` | `--line-height-marca` 0.78 | `--letter-spacing-marca` `-0.07em` | "ADAI" do footer (opacidade 18%) |
| `--font-size-corpo` | Corpo 18 | `1.125rem` | 1.5 | 0 | Apoio de hero e de seção |
| `--font-size-corpo-pequeno` | Corpo pequeno 16 | `1rem` | 1.5 | 0 | Menu, texto padrão |
| `--font-size-legenda` | Legenda 15 | `0.9375rem` | `--line-height-legenda` 1.45 | 0 | Local/hora de evento |
| `--font-size-micro` | Micro 13 | `0.8125rem` | 1.45 | 0 | Top bar, legal |
| `--font-size-botao` | Botão 16 Bold | `1rem` | 1.5 | 0 | Rótulo de botão |
| `--font-size-link-menu` | Link menu = Corpo pequeno | `var(--font-size-corpo-pequeno)` | 1.5 | 0 | Menu do header |
| — | Abertura | **não identificado** | — | — | Pendente |

Aliases de migração (apontam para o canônico; não usar em código novo): `--font-size-mega` → `--font-size-marca`, `--font-size-chamada` → `--font-size-h1`, `--font-size-lead` → `--font-size-corpo`, `--font-size-body` → `--font-size-corpo-pequeno`, `--font-size-xs` → `--font-size-micro`, e as linhas/trackings `-mega`/`-chamada`. Fora da escala do Figma: `--font-size-body-lg` (17, footer ✅ layers), `--font-size-destaque` (32, 🟡), `--font-size-chamada-apoio` (20, ✅ 1:300), `--font-size-sm` (14, 🟡).

Mapeamento de estilos:

| Estilo | Família | Peso | Tamanho |
| --- | --- | --- | --- |
| Display (hero) | display | bold | `--font-size-display` |
| Título de seção | display | bold | `--font-size-h1` |
| Marca (footer) | display | bold | `--font-size-marca` |
| Corpo (apoio do hero) | display | regular | `--font-size-corpo` |
| Menu | body | regular | `--font-size-body` |
| Botão | body | bold | `--font-size-body` (grande) / `--font-size-sm` (pequeno) |
| Título de coluna do footer | body | bold | `--font-size-body` |
| Link do footer | body | bold | `--font-size-body-lg` |
| Texto do footer | body | light | `--font-size-body-lg` |
| Legal | body | light | `--font-size-xs` |

---

## 4. Espaçamento

### 4.1 Escala (primitivos permitidos nos componentes)

| Token | Valor | Status (onde apareceu) |
| --- | --- | --- |
| `--space-4` | `0.25rem` (4px) | 🟡 |
| `--space-8` | `0.5rem` (8px) | ✅ lista do footer |
| `--space-10` | `0.625rem` (10px) | ✅ gap CTAs do hero |
| `--space-12` | `0.75rem` (12px) | ✅ gap CTAs do header, coluna do footer |
| `--space-14` | `0.875rem` (14px) | ✅ título→lista do footer |
| `--space-16` | `1rem` (16px) | 🟡 |
| `--space-20` | `1.25rem` (20px) | ✅ texto→CTAs do hero, padding-x botão pequeno |
| `--space-24` | `1.5rem` (24px) | ✅ padding de cards/rodapé |
| `--space-30` | `1.875rem` (30px) | ✅ padding-x botão grande |
| `--space-32` | `2rem` (32px) | ✅ gap do menu |
| `--space-40` | `2.5rem` (40px) | ✅ gap das colunas do footer |
| `--space-48` | `3rem` (48px) | ✅ footer (linha legal) |
| `--space-56` | `3.5rem` (56px) | ✅ padding interno do hero |
| `--space-96` | `6rem` (96px) | ✅ padding-top do footer |

### 4.2 Semânticos fluidos

| Token | Figma (1440px) | Valor CSS | Status |
| --- | --- | --- | --- |
| `--space-gutter` | 43,2px (3%) | `clamp(16px, 3vw, 57.6px)` | ✅ header/top bar / 🟡 mobile |
| `--space-section` | 120px (recorrente) | `clamp(64px, 8.333vw, 120px)` | ✅ desktop (derivado) / 🟡 mobile |
| `--space-page-margin` | 80px | `clamp(16px, 5.556vw, 80px)` | ✅ desktop / 🟡 mobile — margem lateral das seções |
| `--container-max` | 1440px | `90rem` | ✅ shell |
| `--content-max` | 1280px | `80rem` | ✅ conteúdo das seções |

---

## 5. Raios, bordas, opacidade

| Token | Valor | Status | Uso |
| --- | --- | --- | --- |
| `--radius-lg` | `28px` | ✅ variável `raio/grande` | Hero (mídia grande); cards 🟡 confirmar |
| `--radius-pill` | `999px` | ✅ variável `raio/pilula` | Botões |
| `--radius-md` | `20px` | ✅ variável `raio/medio` | Fotos de Imagem e texto, card de evento, cards do carrossel, caixas da lista |
| `--radius-sm` | `14px` | ✅ variável `raio/pequeno` | Linhas da lista de ministérios, foto dentro do card, campos |
| `--border-width` | `1px` | ✅ | Botões outline |
| `--opacity-ghost` | `0.18` | ✅ | "ADAI" do footer |

## 6. Componentes (tokens de componente)

| Token | Valor | Status |
| --- | --- | --- |
| `--button-height-sm` | `40px` | ✅ header |
| `--button-height-md` | `52px` | ✅ hero / seções |
| `--header-height` | `80px` | ✅ |
| `--topbar-height` | `36px` | ✅ |
| `--touch-target-min` | `44px` | ✅ WCAG (área de toque mínima no mobile) |
| `--hero-min-height` | `clamp(600px, 48.75vw, 702px)` | ✅ desktop (702px) / 🟡 mínimo |
| `--hero-min-height-mobile` | `600px` | 🟡 sem Figma mobile |
| `--hero-apoio-max` | `22.5rem` (360px) | ✅ |
| `--footer-texto-max` | `18.75rem` (300px) | ✅ |
| `--space-coluna` | `clamp(32px, 6vw, 86.4px)` | ✅ desktop (86,4px entre foto e texto) |
| `--carrossel-botao` | `52px` | ✅ (setas de "Próximos eventos") |
| `--lista-rotulo` | `10.625rem` (170px) | ✅ (coluna do título na lista de "Primeira vez") |
| `--texto-max` | `32.5rem` (520px) | ✅ |
| `--intro-max` | `47rem` (751px) | ✅ |
| `--font-size-titulo-serie` | `clamp(2.25rem, 4vw, 3.6rem)` (57,6px em 1440; −0,045em; linha 0,98) | ✅ Figma Mensagens 1:139 |
| `--serie-caixa-padding` | `clamp(24px, 5vw, 72px)` (padding e gap texto × thumbnail) | ✅ 1440 · 🟡 mobile |
| `--serie-play` | `60px` (botão play branco sobre a thumbnail) | ✅ 1:149 |
| `--serie-parte-min` | `180px` (altura mínima do card de parte) | ✅ 1:152 |
| `--font-size-ministerio` | `clamp(1.75rem, 3vw, 2.625rem)` (42px no desktop) | ✅ Figma 1:230 |
| `--ministerios-padding` | `clamp(24px, 5vw, 72px)` (padding da caixa cinza) | ✅ Figma 1:230 · 🟡 mobile |
| `--ministerios-linha-altura` | `78px` | ✅ Figma 1:239 |
| `--ministerios-linha-raio` | `14px` | ✅ Figma 1:239 |
| `--faq-pergunta-altura` | `4.5rem` (72px) | ✅ Figma 31:167 |

## 7. Movimento (proposta)

| Token | Valor | Status |
| --- | --- | --- |
| `--duration-fast` | `150ms` | 🟡 |
| `--duration-base` | `250ms` | 🟡 |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 🟡 |

Toda animação é desligada em `@media (prefers-reduced-motion: reduce)`.

---

## 8. Pendências de extração

Atualizado em 2026-10-18 (ver `docs/design-system.md` §12). O Figma MCP bloqueou após nove leituras (limite do assento View). **Não lidos:** interior de Card / Unidade (`234:998`), Card / Evento agenda (`238:1236`), Card / Página relacionada (`234:1010`) e Footer (`233:106`) na seção Componentes; as pranchas além de Home e Unidade. **Estilo Abertura:** não identificado. **Container das seções:** migrar módulos de `--container-max` + `--space-gutter` para `--content-max` + `--space-page-margin`. O Figma **não tem versão mobile** — mínimos dos `clamp()` são propostas até existir referência.
