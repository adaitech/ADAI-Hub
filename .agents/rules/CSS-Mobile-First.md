---
description: CSS responsivo mobile-first — tiers, anti-padrões e checklist (prioridade em layout/UI)
alwaysApply: true
---

# CSS Mobile-First — Prioridade Obrigatória

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`yarn quality`). Tipos e exigências: [`Testes.md`](./Testes.md) · checklist antes de subir e de abrir o PR: [`Pull-Request.md`](./Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

**Adaptado de:** vitru-portal (`CSS-Mobile-First.md` + `docs/desenvolvimento/css-mobile-first.md`).

## Princípio

Todo CSS responsivo deve ser **mobile-first**: estilos base para mobile (≤768px) e evolução progressiva com `@media (min-width: …)`.

A IA deve **começar pelo layout mobile** antes de tablet/desktop — em CSS, JSX de composição e decisões de visibilidade.

> **Atenção:** o Figma atual só tem o frame **Desktop (1440px)**. Até existir referência mobile, o layout mobile é **proposto** a partir do desktop (empilhar colunas, reduzir escala via tokens fluidos) e deve ser **validado com o time** antes do merge. Registrar no PR: *"layout mobile proposto, sem Figma mobile"*.

---

## Tiers oficiais

| Tier | Viewport | CSS |
| --- | --- | --- |
| **Mobile** | ≤768px | Estilos **base** (sem `@media`) |
| **Tablet** | 769px–1023px | `@media (min-width: 769px)` |
| **Desktop** | ≥1024px | `@media (min-width: 1024px)` |

`1024px` é o início do tier **desktop**. Empilhar em tablet (769–1023px) é permitido enquanto não houver Figma de tablet, mas deve ser consciente (comentado).

---

## Obrigatório

```css
/* ✅ Mobile-first */
.grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-16);
}

/* tier: tablet */
@media (min-width: 769px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* tier: desktop */
@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(5, 1fr); gap: var(--space-12); }
}
```

- Usar apenas `min-width` em `@media`.
- Um bloco `@media` por breakpoint por arquivo (consolidar); sem propriedades duplicadas.
- Comentar os tiers: `/* tier: tablet */`, `/* tier: desktop */`.
- Preferir medidas fluidas dos tokens (`clamp()`) a novos breakpoints.
- Breakpoints fora de 769/1024 são proibidos, salvo exceção documentada abaixo.
- **Contêiner com scroll próprio** (`overflow-x: auto`, `overflow: auto`) leva `position: relative`. Sem isso, um elemento `position: absolute` lá dentro (ex.: o `.visually-hidden` de "abre em nova aba" num card do carrossel) escapa do recorte e **alarga a página inteira no celular** — bug real de 2026-10-03.

Estas regras são verificadas no `yarn test` por `src/__tests__/caracteristicas/css.test.ts`.

## Proibido

```css
/* ❌ Desktop-first */
.component { width: 1200px; }
@media (max-width: 768px) { .component { width: 100%; } }

/* ❌ Largura fixa que causa scroll horizontal no mobile */
.titulo { width: 626px; white-space: nowrap; }
```

- Copiar medidas absolutas do código gerado pelo Figma (`left: 43.2px`, `w-[626px]`, `position: absolute` para layout). O código do Figma é **referência visual**, não implementação: traduzir para flex/grid + tokens.
- `white-space: nowrap` em títulos grandes sem garantir que cabem em 375px.

---

## CSS vs JavaScript

| Camada | Padrão |
| --- | --- |
| **CSS Modules / globals** | Mobile-first, `min-width` |
| **`matchMedia` em hook** | Permitido para comportamento (ex.: fechar menu ao virar desktop); usar os mesmos valores (`(min-width: 1024px)`) |

Preferir resolver visibilidade e layout em **CSS**; JS de viewport só quando CSS não resolve (carrossel, menu).

---

## Exceções documentadas

| Área | Comportamento |
| --- | --- |
| *(nenhuma ainda)* | Registrar aqui com motivo e link do Figma quando surgir |

---

## Checklist (PR com CSS/layout)

- [ ] Base = mobile (≤768px), escrita primeiro
- [ ] Apenas `min-width` 769 / 1024
- [ ] Nenhum valor solto: cores, espaços e fontes via tokens (`Design-Tokens.md`)
- [ ] Sem scroll horizontal em **375px** — no console do navegador: `document.documentElement.scrollWidth <= innerWidth` → `true`
- [ ] Contêiner com scroll próprio tem `position: relative`
- [ ] Smoke visual em **375, 768, 820, 1024, 1280, 1440** (a vitrine `/componentes` tem os botões 375/768/1440)
- [ ] Touch targets ≥ **44×44px** em controles interativos no mobile
- [ ] Textos grandes (display/mega) conferidos em 375px
