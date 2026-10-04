# Páginas das unidades — design

**Data:** 2026-10-03 · **Figma:** `adai.com.br (Copy)` (fileKey `urakbIdwJndRKp3Qg7d439`), frame `Unidade / Campestre / Desktop` (node 4:270) · **Caminho:** arquitetural

## 1. Objetivo

Criar uma página por unidade — **Campestre, Anália Franco, São Bernardo, Santos e ADAI On** — a partir do frame do Campestre, reaproveitando as seções que já existem. Os cards de "Neste domingo" da Home passam a levar à página da unidade. A agenda da unidade mostra os eventos gerais da ADAI e os da própria unidade; a Home continua mostrando **todos** os eventos.

Pedido do usuário (2026-10-03): "reaproveitar o máximo"; verificar se é preciso componente novo. **Conclusão: nenhum componente visual novo** — só campos opcionais em seções existentes e o tipo Unidades (dados).

## 2. Decisões tomadas no brainstorming

| Tema | Decisão |
| --- | --- |
| Modelo | Cada unidade é uma `page` do Strapi (slug `campestre`, `analia-franco`, `sao-bernardo`, `santos`, `adai-on`) montada com a dynamic zone, sem rota nova (`[slug]` já atende). O tipo **Unidades** guarda só nome + ID da inChurch (não monta página). |
| Home — agenda | Todos os eventos, como hoje. |
| Unidade — agenda | Eventos **gerais** + eventos **da unidade**; eventos de outra unidade não aparecem. |
| Arte dos eventos | **Abaixo** do texto do card, na Home e na unidade (opção 3). O bloco de data "Jun / 20" do Figma não será feito. |
| Card da Home | O card inteiro é clicável e leva à página da unidade; "Como chegar" continua clicável. |
| ID da igreja na inChurch | Fica **no Strapi**, no tipo **Unidades** (nome + ID), para o time abrir uma unidade nova sem dev. Nada de ID fixo no código. |

## 3. Mapeamento Figma → seções existentes

| Figma (node) | Seção | Mudança |
| --- | --- | --- |
| Hero / Campestre (28:414) | `sections.hero` | + `subtitulo` (texto sob o título, à esquerda) e + `preto_e_branco` (padrão `true`; unidade usa foto colorida) |
| O que esperar (28:430) | `sections.carrossel-cards` | nenhuma (título + destaques + texto + link) |
| Pra todas as idades (28:462) | `sections.ministerios` | + `exibicao`: `lista` (padrão, Home) \| `cards` (unidade) |
| Seu próximo passo (28:487) | `sections.carrossel-cards` | nenhuma |
| No Campestre (28:517) | `sections.proximos-eventos` | + `unidade` (opcional) |
| Outras unidades (28:629) | `sections.carrossel-cards` | nenhuma (cards das outras 4 unidades) |
| Neste domingo — Home (1:51) | `items.card` | + `url` (destino do card inteiro) |

Top bar (node 1:4/28:379) fica fora do escopo (pendente desde o handoff).

## 4. Strapi

- `sections.hero`: `subtitulo` (`text`, máx. 220, opcional); `preto_e_branco` (`boolean`, padrão `true`).
- `sections.ministerios`: `exibicao` (`enumeration` `lista|cards`, padrão `lista`, obrigatório).
- **Novo collection type `api::unidade.unidade`** ("Unidades", sem rascunho/publicação): `nome` (`string`, obrigatório, máx. 60) e `igreja_inchurch_id` (`integer`, obrigatório, único, mín. 1) — o "ID" da tela de igrejas do painel da inChurch. Leitura pública (`find`/`findOne`) liberada no bootstrap; guia do editor `api.unidade.json` explicando onde achar o ID.
- `sections.proximos-eventos`: `unidade` (relação `oneToOne` com `api::unidade.unidade`, opcional). Vazio = todos os eventos.
- `items.card`: `url` (`string`, máx. 255, opcional) — "Página que abre ao clicar no card".
- Guia do editor (`strapi/src/editor-guide/*.json`) com descrição de cada campo novo.
- Seed v16 (`SEED_VERSION = 16`): as 5 páginas e o `url` dos 5 cards da Home (`/campestre`…). Textos do Campestre vêm do Figma; os das outras unidades seguem o mesmo modelo com endereço/horários da Home e ficam como **rascunho para revisão do time**. ADAI On: em vez de "Como chegar"/"Ver no mapa", "Assistir" (YouTube 11h) e Zoom 15h. Foto do hero: a do Figma no Campestre; as demais usam foto já existente do seed até o time enviar as reais.

## 5. Next

### 5.1 Hero
`types.ts`/`normalize.ts` ganham `subtitulo` e `pretoEBranco` (padrão `true` quando ausente). O `subtitulo` aparece abaixo do título, na coluna da esquerda; o filtro P&B só é aplicado com `pretoEBranco`.

### 5.2 Lista de ministérios
`exibicao: 'cards'` mantém a mesma marcação semântica (lista) e muda só o CSS: grade de cards cinza com nome em fonte de display e público abaixo (desktop 4 por linha; mobile 2 por linha). Valor desconhecido → `lista`.

### 5.3 Card do carrossel
Com `url` válido (`sanitizeHref`), o título do card vira um link (`SmartLink`) cujo `::after` cobre o card inteiro (link esticado). Botão e link do card ficam com `position: relative; z-index` acima, continuam independentes — sem link dentro de link. Foco visível no card (`:focus-within`). Sem `url`, nada muda.

### 5.4 inChurch — unidade do evento
Achado na API real (2026-10-03): `responsible_church` vem `null` em todos os eventos, mas o filtro `GET /v1/event/?church_id=<id>` funciona (Campestre devolve os eventos daquela igreja). Eventos criados na denominação não aparecem em nenhum `church_id`.

A inChurch não tem endpoint que liste as igrejas; a lista vem do Strapi.

- `lib/strapi/queries/unidades.ts`: `getIgrejasInchurch(): Promise<number[]>` — IDs de todas as Unidades (ordenados, sem repetição; Strapi fora → `[]`).
- `getEventosInchurch(igrejas: number[])`: os IDs entram como argumento do `unstable_cache` (fazem parte da chave). `carregarEventos(igrejas)` faz, em paralelo com as buscas atuais, uma `listarEventos([['church_id', id]])` por igreja (mesmo padrão da busca de GCs) e monta `Map<idEvento, idIgreja>`. Se uma dessas buscas falhar, a recarga inteira falha e vale o stale-if-error (nunca mapa parcial).
- `normalizeEventos` recebe esse mapa e grava `igrejaId: number | null` em cada `EventoSite` (`null` = geral; o agrupamento de recorrências é por nome **e** igreja — mesmo nome em igrejas diferentes = cards separados; ajuste da revisão final).
- `proximosEventos(dados, { igrejaId })`: com `igrejaId`, mantém `evento.igrejaId === igrejaId || evento.igrejaId === null`. Sem `igrejaId`, todos (Home).
- `EventosInchurch` muda de formato → `VERSAO_CACHE_INCHURCH = 2`.
- Custo: 1 requisição a mais por unidade cadastrada a cada 30 min (5 hoje) — dentro do limite de 200/min.
- Unidade nova cadastrada no Strapi: a chave do cache muda (novos IDs) e a próxima renderização já busca a igreja nova; o webhook de revalidação do Strapi atualiza as páginas.

### 5.5 Próximos eventos
`proximosEventosPopulate` inclui `unidade: { fields: ['nome', 'igreja_inchurch_id'] }`. `ProximosEventosSection` busca `getIgrejasInchurch()`, garante que o ID da própria seção está na lista e chama `getEventosInchurch(igrejas)` e `proximosEventos(..., { igrejaId })`. ID ausente/inválido (não inteiro positivo) → sem filtro (mostra todos; nunca esconde a agenda). `paraCarrossel` usa `posicao_imagem: 'abaixo'`.

## 6. SEO e acessibilidade
Um `h1` por página (o título do Hero, ex.: "Campestre"); demais seções `h2`, cards `h3`. `seo` de cada página no seed (título e descrição). Link esticado com nome acessível = nome da unidade; "Como chegar" mantém seu próprio texto. Foto do hero com `alt` descritivo.

## 7. Medição
Avaliar no código do `RastreadorAnalytics` se o clique no card (título-link) já gera `clique_cta` com `unidade`. Se sim: "Medição: coberto por `clique_cta`". Se não, ajustar o rastreador (sem evento novo, salvo se a análise mostrar necessidade). Decisão registrada nos docs dos componentes.

## 8. Testes
- `eventos.test.ts`: unidade gravada pelo mapa; filtro com evento da unidade, geral e de outra unidade; sem `unidade` = todos.
- `eventos-cache.test.ts`: uma busca por `church_id` por unidade; formato v2.
- Normalize + render: Hero (`subtitulo`, `preto_e_branco`), Ministérios (`cards`), Card com `url` (um link principal cobrindo o card; "Como chegar" independente), Próximos eventos (`unidade`, arte abaixo).
- Integração: página de unidade montada a partir do Strapi.
- Vitrine `/componentes`: variações novas nos showcases e mocks.
- Gates: `yarn quality`, `yarn build` (Next e Strapi), `yarn smoke`, navegador em 375/768/1440.

## 9. Documentação
Atualizar `docs/componentes/` (hero, carrossel-cards, ministerios, proximos-eventos) e o handoff do `AGENTS.md`.

## 10. Riscos e pendências
- ID errado cadastrado numa Unidade: os eventos daquela igreja passam a contar como "gerais" (aparecem em todas as páginas) e a agenda da unidade mostra só os gerais. O guia do editor explica onde copiar o ID; o log do cache informa quantos eventos vieram por igreja.
- Hoje nenhum evento do site está ligado a uma unidade na inChurch: todas as páginas mostrarão a agenda completa até o time cadastrar eventos na igreja da unidade.
- Textos e fotos de Anália Franco, São Bernardo, Santos e ADAI On são provisórios.
- Layout mobile das seções novas segue o padrão das seções existentes (o Figma só tem desktop).
