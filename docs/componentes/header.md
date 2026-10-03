# Cabeçalho — componente `layout.header`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local, via seed) · validação humana pendente
> **Figma:** [Header — node 1:13](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-13)
> **Vitrine:** `/componentes/header`
> **Guia do editor:** `strapi/src/editor-guide/layout.header.json`

## 1. O que é

Topo de todas as páginas: logo da ADAI (fixo, leva à Home), menu principal e até dois botões de destaque ("Ao vivo", "Planeje sua visita").

O botão **Ao vivo** só aparece quando a API do YouTube confirma uma transmissão em andamento na série atual. O destino passa a ser o vídeo confirmado; sem confirmação recente ou com erro da API, o botão fica oculto nos layouts desktop e mobile. A checagem usa cache de 5 minutos e descarta um resultado com mais de 10 minutos. O cadastro `/ao-vivo` no Strapi identifica essa ação.

**Onde é usado:** todas as páginas (layout do grupo `(site)`).

## 2. Escopo

**Dentro:** logo fixo, até 6 links, até 2 botões, menu mobile (botão "Menu").
**Fora:** submenus, busca, cabeçalho fixo ao rolar.
**Decisões pendentes:**
- **Top bar** (faixa de 36px acima do header no Figma, node 1:4): não extraída — limite de chamadas do Figma MCP. Implementar numa próxima etapa.
- Menu mobile e hover dos links/botões não existem no Figma (propostos).

## 3. Contrato no Strapi

| Propriedade | Valor |
| --- | --- |
| Display name | `Cabeçalho` |
| Nome técnico | `layout.header` |
| Onde entra | Campo `header` do single type `global` ("Configurações do site") |
| Componente no front | `next/src/components/layout/Header/` |

```text
layout.header
├── links[]    Component repeatable (shared.link) · máx. 6
│   ├── texto     Text (short) · obrigatório · máx. 40
│   ├── url       Text (short) · obrigatório · máx. 300
│   └── nova_aba  Boolean
└── botoes[]   Component repeatable (shared.botao) · máx. 2
```

## 4. Campos

Textos completos no guia do editor. Resumo:

| Campo | Nome no painel | Onde aparece |
| --- | --- | --- |
| `links` | Links do menu | Centro do cabeçalho (computador) / dentro do Menu (celular) |
| `botoes` | Botões de destaque | Direita do cabeçalho (celular: dentro do Menu) |

## 5. Estados incompletos

| Se o editor… | Na página acontece |
| --- | --- |
| não cadastrar links nem botões | só o logo aparece (sem botão Menu) |
| criar link sem texto, sem URL ou com URL inválida | o link não aparece |
| passar de 6 links / 2 botões | só os primeiros aparecem |
| cadastrar “Ao vivo” enquanto não há transmissão confirmada | o botão é ocultado; os demais permanecem |

## 6. Layout e acessibilidade

| Tier | Comportamento |
| --- | --- |
| Mobile/Tablet <1024 | 🟡 Logo + botão "Menu" (44px); painel com links grandes e botões em largura total/lado a lado |
| Desktop ≥1024 | ✅ Figma: 80px de altura; logo · menu (gap 32) · botões pequenos (40px, gap 12) |

- `<header>` (banner) e `<nav aria-label="Principal">`.
- Menu mobile: `aria-expanded`/`aria-controls`; `Esc` fecha e devolve o foco ao botão; fecha ao clicar num link ou ao virar desktop.
- Links externos avisam "(abre em nova aba)" para leitores de tela.

## 7. Checklist

- [x] Schema e guia do editor no Strapi
- [x] Normalize, mock (JSON real da API), testes, vitrine
- [ ] ⏳ Top bar (Figma 1:4)
- [ ] ⏳ Validação humana (teclado, leitor de tela, celular real, menu mobile aprovado pelo design)

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `clique_cta` em todos os links; `planejar_visita` no botão "Planeje sua visita"; `contribuir` em "Contribua".

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/layout/Header/Header.test.tsx`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
