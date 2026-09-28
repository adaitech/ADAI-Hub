---
description: Design tokens do ADAI Hub (cores, tipografia, espaçamento, raios) extraídos do Figma — fonte única para CSS
alwaysApply: true
---

# Design Tokens — ADAI Hub

**Arquivo de código:** `next/src/styles/tokens.css` (importado uma vez em `src/styles/globals.css`).
**Origem:** Figma `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`), frame `Home / Desktop` (1440px). O arquivo **não tem variáveis/tokens no Figma**; os valores abaixo foram extraídos dos layers.

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
| `--black` | `#000000` | ✅ | Texto, botão primário, borda de botão |
| `--white` | `#FFFFFF` | ✅ | Fundo da página, texto sobre foto |
| `--gray-900` | `#333333` | ✅ | Fundo do Hero (atrás da foto) |
| `--gray-600` | `#6B6B6B` | 🟡 decisão a11y | Texto secundário (substitui o `#777` do Figma: 4,76:1 sobre `#F2F2F2`) |
| `--gray-500` | `#777777` | ✅ Figma | **Não usar em texto sobre `--gray-100`**: contraste 4,00:1 falha WCAG AA (mín. 4,5:1). Aguardando aprovação do design para o `#6B6B6B` |
| `--gray-100` | `#F2F2F2` | ✅ | Fundo do footer |
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

| Token | Figma (1440px) | Valor CSS | Line-height | Tracking | Status | Uso |
| --- | --- | --- | --- | --- | --- | --- |
| `--font-size-mega` | 432px | `clamp(96px, 30vw, 432px)` | 0.72 | `-0.07em` | ✅ desktop / 🟡 mínimo | "ADAI" gigante do footer (opacidade 18%) |
| `--font-size-display` | 129,6px | `clamp(48px, 9vw, 129.6px)` | 0.88 | `-0.055em` | ✅ desktop / 🟡 mínimo | "Amar. Servir. Influenciar." |
| `--font-size-h2` | ~72px (linha de 74px) | `clamp(40px, 5vw, 72px)` | 1.03 | `-0.04em` | 🟡 inferido | Títulos de seção ("Neste domingo", "Primeira vez na ADAI?") |
| `--font-size-h3` | ~28px (linha de 32px) | `1.75rem` | 1.15 | 0 | 🟡 inferido | Título de card (nome da unidade) |
| `--font-size-destaque` | ~32px (3 linhas em 109px) | `2rem` | 1.1 | 0 | 🟡 inferido | Destaques do card (horários) |
| `--font-size-lead` | 18px | `1.125rem` | 1.5 (27px) | 0 | ✅ | Texto de apoio do Hero |
| `--font-size-body-lg` | 17px | `1.0625rem` | 1.5 (25,5px) | 0 | ✅ | Links e texto do footer |
| `--font-size-body` | 16px | `1rem` | 1.5 (24px) | 0 | ✅ | Menu, texto padrão, botão grande |
| `--font-size-sm` | 14px | `0.875rem` | 1.5 (21px) | 0 | ✅ | Botão pequeno (header) |
| `--font-size-xs` | 13px | `0.8125rem` | 1.5 (19,5px) | 0 | ✅ | Copyright / legal |

Mapeamento de estilos:

| Estilo | Família | Peso | Tamanho |
| --- | --- | --- | --- |
| Display (hero) | display | bold | `--font-size-display` |
| Mega (footer) | display | bold | `--font-size-mega` |
| Lead (apoio do hero) | display | regular | `--font-size-lead` |
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
| `--space-gutter` | 43,2px (3%) | `clamp(16px, 3vw, 57.6px)` | ✅ desktop / 🟡 mobile |
| `--space-section` | 129,6px (9%) | `clamp(64px, 9vw, 172.8px)` | ✅ desktop / 🟡 mobile |
| `--container-max` | 1440px | `90rem` | ✅ footer |

---

## 5. Raios, bordas, opacidade

| Token | Valor | Status | Uso |
| --- | --- | --- | --- |
| `--radius-lg` | `28px` | ✅ | Hero (mídia grande); cards 🟡 confirmar |
| `--radius-pill` | `999px` | ✅ | Botões |
| `--radius-md` | `20px` | ✅ fotos de Imagem e texto (Figma 1:108, 6:14) · 🟡 cards e caixas da lista | Fotos de Imagem e texto, cards do carrossel, caixas da lista |
| `--radius-sm` | `12px` | 🟡 | Foto dentro do card |
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

## 7. Movimento (proposta)

| Token | Valor | Status |
| --- | --- | --- |
| `--duration-fast` | `150ms` | 🟡 |
| `--duration-base` | `250ms` | 🟡 |
| `--easing-standard` | `cubic-bezier(0.2, 0, 0, 1)` | 🟡 |

Toda animação é desligada em `@media (prefers-reduced-motion: reduce)`.

---

## 8. Pendências de extração

Seções do Figma ainda **não** inspecionadas para tokens (atualizar este arquivo ao extrair cada uma): Top bar, Neste domingo (Unidades), Primeira vez, Nossa Liderança, Mensagens, Próximos eventos, Encontre seu lugar (Ministérios), Contribua, App, Perguntas frequentes. O Figma **não tem versão mobile** — valores mínimos dos `clamp()` são propostas até existir referência.
