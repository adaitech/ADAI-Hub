# Rodapé — componente `layout.footer`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local, via seed) · validação humana pendente
> **Figma:** [Footer — node 1:306](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-306)
> **Vitrine:** `/componentes/footer`
> **Guia do editor:** `strapi/src/editor-guide/layout.footer.json` (+ `items.coluna-links.json`, `shared.link.json`)

## 1. O que é

Fim de todas as páginas: logo, frase da marca, até três colunas de links (Igreja, Participe, Contato), linha com direitos autorais e assinatura, e a palavra **ADAI** gigante e translúcida ao fundo (fixa, decorativa).

## 2. Escopo

**Dentro:** frase da marca, colunas de links, copyright, assinatura.
**Fora:** ícones de redes sociais, newsletter.
**Decisões pendentes:**
- **Logo:** no Figma a primeira coluna mostra o símbolo e a palavra "ADAI" empilhados e um frame de logo vazio (provável problema de auto-layout). Implementado com o **logo horizontal igual ao do cabeçalho**. Confirmar com o design.
- **Contraste:** o cinza `#777` do Figma sobre `#F2F2F2` dá **4,00:1** e falha WCAG AA (mín. 4,5:1). Usado `#6B6B6B` (4,76:1). Aguardando aprovação do design.
- **Links de contato** (E-mail, WhatsApp, Instagram, YouTube) estão com endereços provisórios no seed — trocar no Strapi pelos reais.

## 3. Contrato no Strapi

| Propriedade | Valor |
| --- | --- |
| Display name | `Rodapé` |
| Nome técnico | `layout.footer` |
| Onde entra | Campo `footer` do single type `global` ("Configurações do site") |
| Componente no front | `next/src/components/layout/Footer/` |

```text
layout.footer
├── texto_marca   Text (long) · máx. 140
├── colunas[]     Component repeatable (items.coluna-links) · máx. 3
│   ├── titulo    Text (short) · obrigatório · máx. 30
│   └── links[]   Component repeatable (shared.link) · máx. 6
├── copyright     Text (short) · máx. 80
└── assinatura    Text (short) · máx. 60
```

## 4. Campos

| Campo | Nome no painel | Onde aparece |
| --- | --- | --- |
| `texto_marca` | Frase da marca | Primeira coluna, abaixo do logo, em cinza |
| `colunas` | Colunas de links | À direita da frase (empilhadas no celular) |
| `copyright` | Direitos autorais | Canto inferior esquerdo |
| `assinatura` | Assinatura | Canto inferior direito |

## 5. Estados incompletos

| Se o editor… | Na página acontece |
| --- | --- |
| deixar tudo vazio | só logo e "ADAI" gigante |
| criar coluna sem título ou sem links válidos | a coluna não aparece |
| passar de 3 colunas / 6 links por coluna | só os primeiros aparecem |

## 6. Layout e acessibilidade

| Tier | Comportamento |
| --- | --- |
| Mobile ≤768 | 🟡 Tudo empilhado; linha final em duas linhas |
| Tablet 769–1023 | 🟡 Colunas de links lado a lado (3) |
| Desktop ≥1024 | ✅ Figma: grade 1.4fr / 1fr / 1fr / 1fr (gap 40), padding-top 96, "ADAI" 30vw cortado embaixo |

- `<footer>` (contentinfo), `<nav aria-label="Rodapé">`, títulos de coluna como `<h2>`.
- "ADAI" gigante com `aria-hidden` (decorativo). O axe acusa `color-contrast` nele (18% de opacidade é intencional); é **exceção aceita**: WCAG 1.4.3 isenta texto puramente decorativo e logotipos. Único apontamento do axe na Home (mobile e desktop, 2026-09-27).
- Logo do rodapé usa `enquadramento="justo"` (símbolo alinhado à margem); o do cabeçalho mantém o frame do Figma.

## 7. Checklist

- [x] Schema e guia do editor no Strapi
- [x] Normalize, mock (JSON real da API), testes, vitrine
- [ ] ⏳ Decisões pendentes acima (logo, contraste, links de contato)
- [ ] ⏳ Validação humana

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `clique_cta` nos links; `contribuir` quando aplicável; botão "Preferências de cookies" reabre o aviso.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/layout/Footer/Footer.test.tsx`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
