# Próximos eventos — componente `sections.proximos-eventos`

> **Status:** `IMPLEMENTADO` · `PUBLICADO NO STRAPI` (dev local: Home e `/exemplos`, seed v10) · validação humana pendente
> **Figma:** [Próximos eventos — node 1:173](https://www.figma.com/design/cN5RwPRMA6zw5oLoeXidk7/adai.com.br?node-id=1-173)
> **Vitrine:** `/componentes/proximos-eventos`
> **Guia do editor:** `strapi/src/editor-guide/sections.proximos-eventos.json`

## 1. O que é

Os próximos eventos da ADAI em cards que passam para o lado. **Os eventos vêm da inChurch** (fonte prioritária de dados da igreja, `.agents/rules/Stack-Fontes-e-Bibliotecas.md` §3.6). O Strapi guarda só a apresentação. A seção **reaproveita o Carrossel de cards** (`CarrosselCardsSection`): mesmo card, setas, retorno ao início, cores e acessibilidade.

| Camada | Responsabilidade |
| --- | --- |
| **inChurch** (Public API) | Eventos: nome, datas, arte, descrição, link online/inscrição, "mostrar no site", destaque |
| **Strapi** | Título, texto de apoio, quantidade, cor dos cards, link "agenda completa" |
| **Next** (`src/lib/inchurch/`) | Integração, cache, regras (site × GC × recorrência), normalização |
| **Componente** | `ProximosEventosSection` (servidor) → JSON do Carrossel → `CarrosselCardsSection` |

## 2. Contrato no Strapi

```text
sections.proximos-eventos         (dynamic zone `sections` de `page`)
├── titulo        Text (short) · obrigatório · máx. 60 · padrão "Próximos eventos"
├── texto_apoio   Text (long) · máx. 200
├── quantidade    Integer · 1 a 12 · padrão 8
├── cor_cards     Enumeration · cinza | branco | preto | azul | verde | laranja | vinho · padrão cinza
├── link          Component (shared.link) · opcional ("Agenda completa")
└── unidade       Relation (oneToOne → api::unidade.unidade) · opcional · vazio = todos os eventos

api::unidade.unidade              (collection type "Unidades", sem rascunho)
├── nome                Text (short) · obrigatório · máx. 60
└── igreja_inchurch_id  Integer · obrigatório · único · ≥ 1 (coluna ID da lista de igrejas da inChurch)
```

Nenhum evento é cadastrado no Strapi. As Unidades e seus IDs ficam no Strapi (nunca fixos no código): o time abre uma unidade nova sem dev.

## 3. Regras (`src/lib/inchurch/eventos.ts`)

Validadas com a API real e comparadas com a tela "Próximos Eventos" do painel (`admin.inchurch.com.br/programacao/next`) em 27–28/09/2026: mesma lista, menos o que não está marcado para o site.

| Regra | Decisão |
| --- | --- |
| Aparecer no site | `active && enabled && show_on_site` ("Mostrar no site" no painel manda) |
| GCs | Nunca aparecem: categoria "Grupo de Conexão" (id 8776, buscada por `category_id`) **ou** nome começando com "GC". A categoria nem sempre é preenchida no painel |
| Recorrência | `recurrence_model: true` é o modelo (ignorado); as datas vêm como eventos próprios e viram **um** card com todas as datas |
| Cópias | Mesmo nome + mesmo início = uma só (ex.: GC recriado) |
| Datas | A API manda horário local sem fuso → tratado como America/Sao_Paulo (−03:00) |
| Ordem | Destaques do painel (`highlighted`) primeiro; depois do mais próximo para o mais distante |
| Passado | A cada renderização, datas já encerradas somem; evento sem data futura some |
| Link do card | Inscrição externa ("Inscreva-se") → link online ("Participar online", ex.: Zoom aberto de oração) → nenhum. Só `http(s)` (bloqueia `javascript:`) |
| Imagem | `image_webp` → `image` (arte 1280×720) com `alt=""` (o nome do evento já é o título do card) |
| Unidade | O JSON do evento não traz a igreja (`responsible_church` vem `null`, verificado em 03/10/2026), mas o filtro `church_id` funciona: uma busca por igreja cadastrada em Unidades grava `igrejaId` no evento. Evento sem igreja = **geral**. Agrupamento por nome **e** igreja: "Batismo" do Campestre e "Batismo" de Santos são cards separados, cada um na sua unidade (a Home mostra os dois) |
| Filtro por unidade | Seção com Unidade: eventos da igreja dela + gerais; eventos de outras unidades saem. Sem Unidade (Home) ou ID inválido: todos |

**Card** (`normalize.ts` `paraCarrossel`): foto = arte; título = nome; destaques = data + hora ("14 de Outubro · 20h", "05 a 09 de Outubro · 5h", ou a próxima data + "Também em …"); texto = primeiro parágrafo da descrição (≤ 140 caracteres); link; cor do CMS. O Carrossel recebe `estilo_imagem: 'arte'` (16:9, colorida) e `posicao_imagem: 'apos_titulo'` (arte logo após o título do card, Home e unidades; decisão de 04/10/2026) — opção criada no Carrossel para artes de divulgação (ver `carrossel-cards.md`).

## 4. Integração e cache

- `client.ts` `inchurchFetch`: `Authorization: Basic base64(INCHURCH_API_KEY:INCHURCH_API_SECRET)` só no servidor (header, nunca URL), `INCHURCH_API_BASE_PUBLIC`, timeout 8 s, `InchurchError` (`config` · `limite` 429 · `http` · `timeout` · `rede` · `resposta`) sem credenciais na mensagem.
- `eventos-cache.ts` `getEventosInchurch(igrejas)`: busca os eventos a partir de hoje (paginado, 100 por página) + os da categoria GC + um `church_id` por igreja (IDs das Unidades, via `lib/strapi/queries/unidades.ts`; entram na chave do cache) → `normalizeEventos` → `unstable_cache` **30 min**, tag `inchurch`, formato v2. ~2 + 1 por unidade chamadas por atualização (limite: 200/min). Se a busca de uma igreja falhar, a atualização inteira falha (nunca mapa parcial). Falha → versão anterior (stale-if-error do Next) → último válido em memória → `null` (seção some). Log só em cache miss: `[inchurch] Eventos atualizados: N futuros → M no site.`
- Mudanças no Strapi usam o webhook atual (tag `strapi`); mudanças na inChurch aparecem em até 30 min.

## 5. Variações

| Variação | Onde ver |
| --- | --- |
| 8 eventos, cinza (padrão) | Home · vitrine `minimo` |
| 4 eventos, cards pretos, texto de apoio | `/exemplos` · vitrine `completo` |
| Página da unidade ("No Campestre") | `/campestre` · vitrine `unidade` |

Controles na vitrine: quantidade, cor dos cards, texto de apoio, link. Dados: fixture **real** da API (`src/lib/inchurch/__fixtures__/eventos.json`, sem contatos e sem credenciais).

## 6. Estados

| Situação | Resultado |
| --- | --- |
| Nenhum evento futuro no site | Seção não aparece |
| inChurch fora, sem cache | Seção não aparece; página normal |
| Evento sem arte | Card sem imagem (alinhamento mantido) |
| Evento sem link | Card sem link |

## 7. Pendências

- Link público da página do evento na inChurch: a API traz `public_url`/`short_url_code`, mas a documentação não informa o formato do endereço. Quando confirmado, vira o link padrão do card.
- Link "Agenda completa": definir o destino (app ou página de eventos da ADAI).
- ⏳ Validação do design (cards com arte 16:9 no lugar do bloco de data do Figma).

## Medição (DataLayer)

Sem evento novo — coberto por eventos do catálogo (`docs/analytics/README.md`): `selecionar_evento` (`evento` = nome, `acao` = texto do link); `clique_cta`; `ver_secao`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/sections/ProximosEventosSection/ProximosEventosSection.test.tsx`
- `next/src/lib/inchurch/eventos.test.ts`
- `next/src/lib/inchurch/eventos-cache.test.ts`
- `next/src/lib/inchurch/client.test.ts`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
