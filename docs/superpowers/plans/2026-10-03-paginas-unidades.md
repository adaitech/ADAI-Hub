# Páginas das unidades — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Páginas `/campestre`, `/analia-franco`, `/sao-bernardo`, `/santos` e `/adai-on` montadas no Strapi com as seções existentes; cards da Home clicáveis; agenda filtrada por unidade.

**Architecture:** Nenhum componente visual novo. Campos opcionais em `sections.hero`, `sections.ministerios`, `sections.proximos-eventos` e `items.card`; collection type **Unidades** no Strapi (nome + ID da igreja na inChurch); a igreja de cada evento vem de buscas `church_id` na inChurch para os IDs cadastrados, gravadas no resultado cacheado; o seed v16 cria as Unidades e as 5 páginas.

**Tech Stack:** Next.js 16 + React 19 + TypeScript + CSS Modules, Jest + Testing Library, Strapi 5.

**Spec:** `docs/superpowers/specs/2026-10-03-paginas-unidades-design.md`

## Global Constraints

- Regras do `AGENTS.md`: Server Components, CSS Modules + tokens (`src/styles/tokens.css`, nada de hex/px solto), mobile-first (`769px` tablet, `1024px` desktop), WCAG 2.2 AA, um `h1` por página.
- Toda seção alterada: `types.ts` + `normalize.ts` + teste + `.showcase.tsx` + `.mock.json` + guia do editor (`strapi/src/editor-guide/<uid>.json`) + doc em `docs/componentes/`.
- IDs inChurch **só no Strapi** (seed e painel), nunca fixos no código do Next: Campestre 30146, Anália Franco 31875, São Bernardo 31874, Santos 31876, ADAI On 31879.
- Slugs das páginas: `campestre`, `analia-franco`, `sao-bernardo`, `santos`, `adai-on`. `VERSAO_CACHE_INCHURCH = 2`. `SEED_VERSION = 16`.
- Arte dos eventos: `posicao_imagem: 'abaixo'` (Home e unidade).
- Commit/push só com pedido explícito do usuário (os passos "Commit" abaixo ficam como pontos de checagem; não executar `git commit` sem o pedido). `git add` só com caminhos explícitos.
- Nunca trocar de branch com `strapi develop` rodando.

## Review Focus

1. **Evento com o mesmo nome em igrejas diferentes** — um card por igreja (agrupamento por nome + igreja; revisão final). Teste em Task 1.
2. **Unidade apagada ou sem ID válido** (relação `null`, `igreja_inchurch_id` 0/negativo/texto) — sem filtro (mostra todos), nunca esconde a agenda. Teste em Task 2.
3. **Card com `url` e "Como chegar" juntos** — os dois clicáveis, links distintos, nenhum `<a>` dentro de `<a>`. Teste em Task 3.
4. **`url` perigoso no card** (`javascript:`) — `sanitizeHref` devolve `null` e o card fica como hoje. Teste em Task 3.
5. **Busca `church_id` falhando para uma unidade** — a recarga inteira falha e cai no stale-if-error já existente (não gravar mapa parcial que tornaria eventos de unidade "gerais"). Teste em Task 1.
6. **Strapi sem Unidades / fora** — `getIgrejasInchurch()` devolve `[]`, Home segue com todos os eventos. Teste em Task 2.

---

### Task 0: Branch

- [ ] Com Strapi parado: `git switch -c feat/paginas-unidades` a partir do branch atual (`feat/seguranca-cabecalhos-csp-cors`, ainda não mergeado) e confirmar `git status` limpo além de `docs/superpowers/specs/2026-10-03-paginas-unidades-design.md` e deste plano.

### Task 1: Strapi — tipo Unidades + inChurch com igreja por evento

**Files:**
- Create: `strapi/src/api/unidade/content-types/unidade/schema.json`, `strapi/src/api/unidade/{controllers,routes,services}/unidade.ts` (factories padrão, como `api/page`), `strapi/src/editor-guide/api.unidade.json`, `next/src/lib/strapi/queries/unidades.ts`
- Modify: `strapi/src/bootstrap/public-permissions.ts`, `strapi/src/editor-guide/index.ts` (se registra os guias por lista), `next/src/lib/inchurch/eventos.ts`, `next/src/lib/inchurch/eventos-cache.ts`
- Test: `next/src/lib/strapi/queries/unidades.test.ts`, `next/src/lib/inchurch/eventos.test.ts`, `next/src/lib/inchurch/eventos-cache.test.ts`, `next/src/__tests__/caracteristicas/cache-versionado.test.ts`

**Interfaces — Produces:**
- Strapi `api::unidade.unidade` (`draftAndPublish: false`): `nome` (string, obrigatório, máx. 60), `igreja_inchurch_id` (integer, obrigatório, único, mín. 1). Leitura pública: `api::unidade.unidade.find` e `.findOne`.
- `getIgrejasInchurch(): Promise<number[]>` — `GET /api/unidades?fields[0]=igreja_inchurch_id&pagination[pageSize]=100`, mesmo client/cache/tag `strapi` das outras queries; devolve inteiros positivos únicos e ordenados; erro → `[]`.
- `export function idIgrejaValido(valor: unknown): number | null` (em `eventos.ts`: inteiro ≥ 1 ou `null`).
- `EventoSite.igrejaId: number | null` (`null` = geral).
- `normalizeEventos(eventos, idsCategoriaGc, agora = new Date(), igrejaPorEvento: ReadonlyMap<number, number> = new Map())`
- `proximosEventos(dados, { agora?, limite?, igrejaId?: number | null })`
- `getEventosInchurch(igrejas: readonly number[] = []): Promise<EventosInchurch | null>`

- [ ] **Step 1: testes que falham**
  - `unidades.test.ts`: resposta `[{igreja_inchurch_id: 31876}, {igreja_inchurch_id: 30146}, {igreja_inchurch_id: 30146}, {igreja_inchurch_id: 0}]` → `[30146, 31876]`; fetch rejeitado → `[]`.
  - `eventos.test.ts`: mapa `new Map([[idX, 31876]])` → evento X `igrejaId: 31876`, demais `null`; recorrente com só a 2ª ocorrência no mapa (30146) → grupo `igrejaId: 30146`; `proximosEventos(dados, { igrejaId: 30146 })` com eventos (30146, geral, 31876) → `[30146, geral]`; sem `igrejaId` → os 3; `idIgrejaValido('30146') === null`, `idIgrejaValido(0) === null`, `idIgrejaValido(30146) === 30146`.
  - `eventos-cache.test.ts`: `getEventosInchurch([30146, 31876])` chama `inchurchFetch` com `['church_id', 30146]` e `['church_id', 31876]`; evento só na busca 31876 sai com `igrejaId: 31876`; busca de uma igreja rejeitada → último válido (ou `null`); `getEventosInchurch()` sem igrejas → nenhuma busca `church_id`.
- [ ] **Step 2:** `cd next && yarn jest src/lib/strapi/queries/unidades.test.ts src/lib/inchurch` → FAIL.
- [ ] **Step 3:** criar o tipo no Strapi (schema + factories), liberar as duas ações públicas, guia do editor ("Unidades": "Cada unidade da ADAI e o ID da igreja dela na inChurch. O ID está no painel da inChurch, na lista de igrejas, coluna ID (ex.: ADAI CAMPESTRE = 30146). Ele liga a agenda da página da unidade aos eventos cadastrados naquela igreja; ID errado faz os eventos da unidade aparecerem como gerais.").
- [ ] **Step 4:** implementar `unidades.ts`, `eventos.ts` e `eventos-cache.ts` (`unstable_cache` recebe `igrejas` como argumento → entra na chave; `VERSAO_CACHE_INCHURCH = 2`; `console.info` com a contagem por igreja).
- [ ] **Step 5:** atualizar `cache-versionado.test.ts` (versão 2 + campo `igrejaId`). `yarn jest src/lib src/__tests__/caracteristicas/cache-versionado.test.ts` → PASS; `cd strapi && yarn build` → sucesso.
- [ ] **Step 6:** Commit (`feat(unidades): tipo Unidades no Strapi e igreja do evento via church_id`).

### Task 2: Próximos eventos — relação `unidade` e arte abaixo

**Files:**
- Modify: `strapi/src/components/sections/proximos-eventos.json`, `strapi/src/editor-guide/sections.proximos-eventos.json`, `next/src/components/sections/ProximosEventosSection/{types.ts,normalize.ts,populate.ts,ProximosEventosSection.tsx,ProximosEventosSection.mock.json,ProximosEventosSection.showcase.tsx}`, `docs/componentes/proximos-eventos.md`
- Test: `next/src/components/sections/ProximosEventosSection/ProximosEventosSection.test.tsx`

**Interfaces — Consumes:** `getIgrejasInchurch`, `getEventosInchurch(igrejas)`, `proximosEventos(..., { igrejaId })`, `idIgrejaValido` (Task 1). **Produces:** `ProximosEventosData.unidade?: { id: number; nome?: string | null; igreja_inchurch_id?: number | null } | null`; `export function igrejaDe(data: ProximosEventosData): number | null` em `normalize.ts`.

- [ ] **Step 1: testes que falham:** `igrejaDe({ unidade: { id: 1, igreja_inchurch_id: 30146 } }) === 30146`; `igrejaDe({ unidade: null }) === null`; `igrejaDe({ unidade: { id: 1, igreja_inchurch_id: 0 } }) === null`; `paraCarrossel(...).posicao_imagem === 'abaixo'`; render com unidade 30146, `getIgrejasInchurch` mockado `[]` → `getEventosInchurch` chamado com `[30146]`; eventos (30146, geral, 31876) → aparecem só os dois primeiros; sem unidade → os 3.
- [ ] **Step 2:** `yarn jest src/components/sections/ProximosEventosSection` → FAIL.
- [ ] **Step 3:** schema Strapi: `"unidade": { "type": "relation", "relation": "oneToOne", "target": "api::unidade.unidade" }`; populate `unidade: { fields: ['nome', 'igreja_inchurch_id'] }`; guia: label "Unidade", descrição "Deixe vazio para mostrar todos os eventos (Home). Escolhendo uma unidade, aparecem os eventos gerais da ADAI e os da igreja dessa unidade na inChurch; eventos das outras unidades ficam de fora.". Implementar `igrejaDe`, a seção (`igrejas = [...new Set([...await getIgrejasInchurch(), ...(id ? [id] : [])])].sort()`), `posicao_imagem: 'abaixo'`.
- [ ] **Step 4:** mock + showcase "Unidade (Campestre)"; doc: "Filtro por unidade" + arte abaixo + "Medição: coberto por `selecionar_evento`/`clique_cta`". Testes → PASS.
- [ ] **Step 5:** Commit.

### Task 3: Card clicável (`items.card.url`)

**Files:**
- Modify: `strapi/src/components/items/card.json`, `strapi/src/editor-guide/items.card.json`, `next/src/components/sections/CarrosselCardsSection/{types.ts,normalize.ts,CarrosselCardsSection.tsx,CarrosselCardsSection.module.css,CarrosselCardsSection.mock.json,CarrosselCardsSection.showcase.tsx}`, `docs/componentes/carrossel-cards.md`
- Test: `normalize.test.ts`, `CarrosselCardsSection.test.tsx` (mesma pasta)

**Interfaces — Produces:** `CardData.url?: string | null`; `CardView.href: string | null` (via `sanitizeHref`).

- [ ] **Step 1: testes que falham:**
  - normalize: `url: '/campestre'` → `href: '/campestre'`; `url: 'javascript:alert(1)'` → `href: null`; sem `url` → `null`.
  - render: card com `url: '/campestre'` e link "Como chegar" → `getByRole('link', { name: 'Campestre' })` tem `href="/campestre"` e está dentro do `h3`; `getByRole('link', { name: /Como chegar/ })` continua com o href do mapa; `container.querySelectorAll('a a').length === 0`.
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Strapi `"url": { "type": "string", "maxLength": 255 }`; guia: label "Página do card", descrição "Endereço que abre ao clicar em qualquer parte do card (ex.: /campestre). Botão e link do card continuam funcionando separados.". No componente, com `card.href` o conteúdo do título vira `<SmartLink href className={styles.linkCard}>`. CSS: `.card` `position: relative`; `.linkCard::after { content: ''; position: absolute; inset: 0; }`; `.acoes` `position: relative; z-index: 1`; `.card:has(.linkCard)` com `cursor: pointer` e `:focus-within` com o outline de foco já usado nos tokens.
- [ ] **Step 4:** mock/showcase: exemplo "Neste domingo com páginas" (cards com `url`) e controle se o showcase tiver `controles`. Doc: campo novo + "Medição: coberto por `clique_cta` (texto = nome da unidade, destino = página)". Testes → PASS.
- [ ] **Step 5:** Commit.

### Task 4: Hero — `subtitulo` e `preto_e_branco`

**Files:**
- Modify: `strapi/src/components/sections/hero.json`, `strapi/src/editor-guide/sections.hero.json`, `next/src/components/sections/HeroSection/{types.ts,normalize.ts,HeroSection.tsx,HeroSection.module.css,HeroSection.mock.json,HeroSection.showcase.tsx}`, `docs/componentes/hero.md`
- Test: `HeroSection/normalize.test.ts`, `HeroSection/HeroSection.test.tsx`

**Interfaces — Produces:** `HeroData.subtitulo?: string | null`, `HeroData.preto_e_branco?: boolean | null`; `HeroView.subtitulo: string[]` (linhas), `HeroView.pretoEBranco: boolean` (`data.preto_e_branco !== false`).

- [ ] **Step 1: testes que falham:** normalize sem os campos → `subtitulo: []`, `pretoEBranco: true`; com `preto_e_branco: false` → `false`; render com `subtitulo` → texto aparece dentro do bloco do título (coluna esquerda, depois do `h1`); `preto_e_branco: false` → `<img>` sem a classe P&B (`data-cor="colorida"` no cartão, testável).
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Strapi: `subtitulo` (`text`, `maxLength` 220), `preto_e_branco` (`boolean`, `default` true). Guia: "Texto abaixo da frase principal" ("Aparece embaixo do título grande, à esquerda — ex.: apresentação da unidade.") e "Foto em preto e branco" ("Desligue para mostrar a foto colorida, como nas páginas das unidades."); ajustar a boa prática que diz que a foto "fica em preto e branco automaticamente". CSS: o filtro `grayscale` passa a valer só em `[data-cor="pb"]`; `subtitulo` com o estilo de texto de apoio e largura máxima do Figma (≈ 560px → usar token de largura existente ou `[VALOR NÃO ENCONTRADO]`).
- [ ] **Step 4:** mock/showcase: variante "Unidade (Campestre)" (colorida + subtítulo). Testes → PASS.
- [ ] **Step 5:** Commit.

### Task 5: Lista de ministérios — `exibicao: cards`

**Files:**
- Modify: `strapi/src/components/sections/ministerios.json`, `strapi/src/editor-guide/sections.ministerios.json`, `next/src/components/sections/MinisteriosSection/{types.ts,normalize.ts,MinisteriosSection.tsx,MinisteriosSection.module.css,MinisteriosSection.mock.json,MinisteriosSection.showcase.tsx}`, `docs/componentes/ministerios.md`
- Test: `MinisteriosSection.test.tsx` (+ `normalize.test.ts` novo, na mesma pasta)

**Interfaces — Produces:** `MinisteriosData.exibicao?: 'lista' | 'cards' | null`; `MinisteriosView.exibicao: 'lista' | 'cards'` (desconhecido → `lista`).

- [ ] **Step 1: testes que falham:** normalize `exibicao: 'cards'` → `'cards'`, `'grade'`/ausente → `'lista'`; render `cards` → `section` com `data-exibicao="cards"`, mesma `ul role="list"` com os 4 itens, título `h2` e texto de apoio acima da grade (não ao lado).
- [ ] **Step 2:** rodar → FAIL.
- [ ] **Step 3:** Strapi `"exibicao": { "type": "enumeration", "enum": ["lista","cards"], "default": "lista", "required": true }`; guia: "Lista (Home: nomes à direita do convite) ou Cards (páginas das unidades: um card cinza por ministério)". CSS `[data-exibicao='cards']`: intro em bloco, lista em grade (2 colunas mobile, 4 no desktop), item com fundo/raio dos cards cinza do Carrossel, nome no tamanho de display atual, público abaixo.
- [ ] **Step 4:** mock/showcase "Pra todas as idades (unidade)". Doc atualizado ("Medição: coberto por `selecionar_ministerio`"). Testes → PASS.
- [ ] **Step 5:** Commit.

### Task 6: Seed v16 — páginas das unidades e cards da Home

**Files:**
- Create: `strapi/seed/unidade-campestre.jpg` (fill do nó `31:216` "IMG_9655 1" do Figma `urakbIdwJndRKp3Qg7d439`; conferir se é a foto que aparece no canvas)
- Modify: `strapi/src/bootstrap/seed.ts`
- Test: `next/src/__tests__/integracao/paginas.test.tsx`

**Interfaces — Consumes:** tipo Unidades (Task 1) e campos das Tasks 2–5.

- [ ] **Step 1: teste de integração que falha:** com o JSON de uma página de unidade (mock do Strapi como os demais casos do arquivo) → página renderiza `h1` "Campestre", seções O que esperar, Pra todas as idades (`data-exibicao="cards"`), Seu próximo passo, agenda com a unidade Campestre (30146) e Outras unidades sem o card "Campestre".
- [ ] **Step 2:** rodar → FAIL; implementar o que faltar no Next (se nada faltar, o teste passa — ele guarda a composição).
- [ ] **Step 3: seed** (`SEED_VERSION = 16`):
  - Criar as 5 Unidades (se não existirem, por `igreja_inchurch_id`): ADAI Campestre 30146, ADAI Anália Franco 31875, ADAI São Bernardo 31874, ADAI Santos 31876, ADAI On 31879.
  - `unidade()` da Home ganha `url` (`/campestre`, `/analia-franco`, `/sao-bernardo`, `/santos`); ADAI On → `/adai-on`.
  - `const UNIDADES_SITE` com, por unidade: nome, slug, horários, endereço (linhas da Home), endereço do mapa e o `igreja_inchurch_id` (para ligar a seção de agenda à Unidade criada).
  - `unidadeSections(strapi, u)` monta, nesta ordem: Hero (`preto_e_branco: false`, título = nome, `subtitulo`, `texto_apoio`, botões "Planeje sua visita" sólido e "Como chegar" contorno → mapa) · Carrossel "O que esperar" · Ministérios `exibicao: 'cards'` "Pra todas as idades" · Carrossel "Seu próximo passo" · Próximos eventos `titulo: "No <nome>"` + `unidade` (documentId/id da Unidade) · Carrossel "Outras unidades" (as outras 4, com `url` e "Como chegar"/"Assistir").
  - Campestre usa exatamente os textos do Figma (nós 28:420–28:665): hero "A unidade Campestre reúne cultos, ministérios e momentos de conexão em Santo André, com uma presença acolhedora e familiar." / "Venha conhecer a unidade, participar do culto e encontrar pessoas prontas para te receber bem.\nTem lugar pra você e sua família aqui."; cards O que esperar ("Como chegar" + endereço + "Terreno plano…" + link "Ver no mapa"; "Como é o culto" com os dois parágrafos + link "Planeje sua visita"; "Seus filhos" com os dois parágrafos + link "Conheça o ADAI Kids" → `/kids`); ministérios ADAI KIDS/Crianças, INPULSE/Adolescentes, PULSE/Jovens, 50+/50 anos ou mais; os 5 cards de "Seu próximo passo" com os textos do Figma.
  - Outras unidades: mesmos textos trocando o nome/cidade; o card "Como chegar" do O que esperar usa o endereço da unidade e omite "Terreno plano…" (texto específico do Campestre). ADAI On: hero "Como participar" → YouTube, card "Como participar" ("11h no YouTube\n15h no Zoom", link "Assistir"), sem "Ver no mapa".
  - Foto do hero: `unidade-campestre.jpg` no Campestre; demais usam `hero-adai.jpg` com `preto_e_branco: false` até o time enviar fotos (registrar no doc).
  - `seo` por página: `metaTitle: "<Nome> | ADAI"`, `metaDescription` = subtítulo do hero.
  - Em `seedInitialContent`: para cada unidade, criar a página se não existir; reconstruir as seções quando `storedVersion < SEED_VERSION` (mesmo padrão da Home) e publicar.
- [ ] **Step 4:** `cd strapi && yarn build` → sucesso. Com Strapi parado, subir `yarn develop`, conferir no log "[seed] Página "campestre" criada…" e `GET /api/pages?filters[slug][$eq]=campestre&populate=…` devolvendo as seções. Teste de integração → PASS.
- [ ] **Step 5:** Commit.

### Task 7: Verificação, vitrine e documentação

- [ ] `cd next && yarn quality` → verde (lint, typecheck, testes, cobertura).
- [ ] `cd next && yarn build` e `cd strapi && yarn build` → sucesso.
- [ ] Strapi + Next rodando: `cd next && yarn smoke` → verde.
- [ ] Navegador (in-app) em 375 / 768 / 1440: `/`, `/campestre`, `/adai-on`, `/santos` — card da Home leva à unidade e "Como chegar" abre o mapa; agenda com arte abaixo; um `h1`; sem scroll lateral. `/componentes/hero`, `/componentes/carrossel-cards`, `/componentes/ministerios`, `/componentes/proximos-eventos` com as variações novas.
- [ ] Comparar `/campestre` em 1440 com o screenshot do frame 4:270 (diferença esperada: agenda com arte em vez do bloco de data; top bar ausente).
- [ ] Atualizar o handoff do `AGENTS.md` (pronto: páginas das unidades; pendente: fotos/textos das 4 unidades, eventos ainda sem unidade na inChurch, top bar) e `README`/docs que listam seções se citarem campos.
- [ ] Relatar ao usuário com evidências; perguntar sobre commit/PR.
