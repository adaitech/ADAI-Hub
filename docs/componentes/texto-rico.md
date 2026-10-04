# Texto (documento) — componente `sections.texto-rico`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local: `/politica-de-privacidade` e `/exemplos`, seed v15) · validação humana e jurídica pendentes
> **Figma:** não existe — proposta 🟡 com os tokens do site
> **Vitrine:** `/componentes/texto-rico`
> **Guia do editor:** `strapi/src/editor-guide/sections.texto-rico.json`

## 1. O que é

Documento longo editado no Strapi em **Markdown**: títulos, parágrafos, listas, tabelas e links, numa coluna de leitura (`--texto-rico-max`, ~75 caracteres por linha). Primeiro uso: **Política de Privacidade e Cookies** (`/politica-de-privacidade`), com o texto público de `docs/conteudo/politica-de-privacidade.md`.

## 2. Contrato no Strapi

```text
sections.texto-rico                (dynamic zone `sections` de `page`)
├── titulo         Text (short) · opcional · máx. 100        título do documento (h1 na 1ª seção). Vazio abaixo de um Hero (páginas Sobre nós e Jesus): sem cabeçalho próprio, wrapper vira <div> e "##" vira h2
├── atualizado_em  Date · opcional                           "Última atualização: 2 de outubro de 2026."
└── conteudo       Rich text (Markdown) · obrigatório        corpo: ## seção, ### subseção, listas, tabelas, [links](https://…)
```

Populate: `true` (só campos simples).

## 3. Renderização

No Markdown, `[Preferências de cookies](#preferencias-cookies)` vira o botão que reabre o aviso de cookies (usado na Política de Privacidade; LGPD).


- `react-markdown` + `remark-gfm` (tabelas) no **servidor** — justificativa em `Stack-Fontes-e-Bibliotecas.md`. HTML cru no Markdown é **ignorado** (`skipHtml`); links passam por `sanitizeHref` (bloqueia `javascript:`).
- **Hierarquia de títulos (SEO/a11y):** na 1ª seção da página o título é `h1` e `##` vira `h2`; em outra posição o título é `h2` e `##` vira `h3`. `#` no texto vira o nível de `##` (só existe um `h1`).
- Links externos abrem em nova aba com aviso para leitor de tela; `mailto:` e internos, na mesma aba.
- Tabelas: região rolável no celular, focável pelo teclado, com nome acessível.

## 4. Pilares

| Pilar | Situação |
| --- | --- |
| Dados no CMS | Página `politica-de-privacidade` criada pelo seed (texto em `strapi/seed/politica-de-privacidade.md`); exemplo curto em `/exemplos` |
| Página | `/politica-de-privacidade` (rota `[slug]`) |
| Componente | `/componentes/texto-rico` (completo = política real; mínimo = exemplo); controle "Data de atualização" |
| SEO | `metaTitle`/`metaDescription` da página no Strapi; `h1` único; hierarquia de títulos; conteúdo no HTML do servidor |
| Medição | Sem evento novo — links cobertos por `clique_cta`; seção por `ver_secao` |

## 5. Pendências

- Política: revisão jurídica, confirmação dos dados da controladora e do encarregado (notas internas em `docs/conteudo/politica-de-privacidade.md` §C) antes de publicar em produção.
- Aprovação visual do design.

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `clique_cta` nos links do texto (e-mail sai só como `mailto:`) e no botão "Preferências de cookies" da Política; `ver_secao` (texto longo conta quando ocupa metade da tela). Nas páginas Sobre nós e Jesus, o Hero e o texto entram como `hero` e `texto-rico`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/sections/TextoRicoSection/TextoRicoSection.test.tsx`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
