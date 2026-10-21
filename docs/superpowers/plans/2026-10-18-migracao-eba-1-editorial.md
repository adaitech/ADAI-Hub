# Migração da EBA — entrega 1 (editorial) — plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: `superpowers:subagent-driven-development` (recomendado) ou `superpowers:executing-plans`, tarefa por tarefa. Passos com checkbox (`- [ ]`).

**Objetivo:** `/eba`, `/eba/cursos` e `/eba/cursos/<slug>` no ADAI Hub, com cursos como collection type do Strapi, catálogo automático, SEO, medição e redirecionamentos do site atual prontos (desligados).

**Arquitetura:** tudo vem do Strapi pelo `src/lib/strapi/` existente (cache 60 s + tag `strapi`). Regras puras do curso em `src/lib/eba/`; seção nova `sections.catalogo-cursos`; três rotas em `app/(site)/eba/`. Nenhuma integração nova, nenhum dado pessoal.

**Stack:** Next 16.3.8 · React 19 · TypeScript strict · CSS Modules + tokens · Strapi 5.56 · Jest + Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-18-migracao-eba-1-editorial-design.md` (ler inteira antes da tarefa 1). Protótipo aprovado: `docs/prototipo/eba/` (navegação A).

## Restrições globais

- Regras de `AGENTS.md` e `.agents/rules/` valem em toda tarefa (5 pilares, TDD, tokens, mobile-first 769/1024, WCAG 2.2 AA, Server Components por padrão).
- **Servidores:** o usuário inicia e encerra o `strapi develop` e o `next dev`. O agente não inicia, reinicia nem encerra esses processos; quando precisar deles, pede.
- **Snapshot** `strapi/data/adai-conteudo.tar.gz`: não gerar nem exportar sem pedido explícito.
- **Git:** branch própria `feat/eba-editorial`; `git add` com caminhos explícitos; commit só se o usuário autorizou commits ao aprovar o plano; push e PR só com pedido explícito. Nunca trocar de branch com o Strapi rodando.
- **Base:** a branch sai da `main` **depois** do merge do design system (tokens e títulos novos) e da agenda; se ainda não tiverem entrado, perguntar ao usuário de onde partir.
- URLs: `/eba`, `/eba/cursos`, `/eba/cursos/<slug>`; slug válido = `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
- Textos fixos: chips "Para quem", "Duração", "Formato", "Quando entrar"; formato `presencial` → "Presencial", `online` → "On-line", `presencial_ou_online` → "Presencial ou on-line"; vertente `integracao` → "Curso de integração", `consolidacao` → "Curso de consolidação"; estado vazio "Novos cursos em breve".
- Evento novo: `inscrever_curso` com `{ origem: string; curso: string }` (slug). Nenhum dado pessoal no DataLayer.
- Vídeo: só YouTube (`youtube.com`, `www.youtube.com`, `m.youtube.com`, `youtu.be`), embed youtube-nocookie pelo `AssistirVideo` existente. Nenhuma origem nova na CSP.

## Pontos de revisão (o que a spec implica e pode quebrar)

1. **Curso publicado sem capa ou com capa sem alt** → aparece no catálogo como card sem foto; a página do curso abre sem foto (teste no `normalize`, tarefa 3).
2. **Endereço de curso fora do padrão** (`/eba/cursos/Reset`, `/eba/cursos/a%2F..`, acento) → 404 sem chamar o Strapi (teste de integração, tarefa 7).
3. **Strapi fora do ar na página do curso** → `error.tsx` (erro transitório), nunca uma 404 que fica em cache (teste de integração, tarefa 7).
4. **Link de vídeo em formatos variados** (`youtu.be/ID`, `watch?v=ID&t=30`, `shorts/ID`, Vimeo, texto solto) → YouTube vira player; o resto é ignorado sem quebrar (teste no `normalize`, tarefa 3).
5. **Curso com `noindex` ou canonical para outra URL** → fora do sitemap e com `<meta name="robots">` (testes nas tarefas 7 e 8).

---

## Mapa de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `strapi/src/api/curso/**` | Collection type `curso` (schema, controller/routes/services padrão) |
| `strapi/src/components/sections/catalogo-cursos.json` | Seção nova |
| `strapi/src/api/page/content-types/page/schema.json` | `sections.catalogo-cursos` na dynamic zone |
| `strapi/src/editor-guide/api.curso.json`, `sections.catalogo-cursos.json` | Guias do editor |
| `strapi/src/index.ts` (ou onde o bootstrap libera leitura pública) | `api::curso.curso.find/findOne` públicos |
| `strapi/config/admin.ts` | Preview de curso |
| `strapi/src/bootstrap/seed.ts`, `strapi/seed/eba/*` | Conteúdo de dev (v19) |
| `next/src/lib/eba/types.ts` · `curso.ts` · `dados-estruturados.ts` | Tipos crus, view models, regras puras, JSON-LD |
| `next/src/lib/strapi/queries/cursos.ts` | Busca de cursos |
| `next/src/lib/paginas/caminho.ts` | Prefixo `eba-` e caminho do curso |
| `next/src/lib/seo/sitemap.ts`, `next/src/app/sitemap.ts` | Cursos no sitemap |
| `next/src/lib/seo/json-ld.ts` | Serialização segura de JSON-LD |
| `next/src/components/ui/{Chips,Trilha,CardCurso}/` | UI |
| `next/src/components/sections/CatalogoCursosSection/` | Seção do CMS |
| `next/src/components/layout/CursoCabecalho/` | Topo do curso |
| `next/src/app/(site)/eba/{page.tsx,cursos/page.tsx,cursos/[slug]/page.tsx}` | Rotas |
| `next/src/app/(site)/[slug]/page.tsx`, `app/api/preview/route.ts` | Redirecionamento 308 e preview |
| `next/src/components/layout/Header/Header.module.css` | 6º link sem quebra em 1024 px |
| `next/src/lib/analytics/{eventos.ts,cliques.ts}`, `components/analytics/RastreadorAnalytics.tsx`, `docs/analytics/*` | `inscrever_curso` |
| `docs/componentes/{catalogo-cursos,card-curso,chips,trilha,curso-cabecalho}.md`, `docs/componentes/README.md` | Contratos |
| `eba-adai/redirecionamentos.mjs`, `eba-adai/next.config.mjs` | Redirecionamentos no site atual |

---

### Tarefa 0: Preparação

- [ ] **Passo 1:** Confirmar com o usuário que o Strapi está parado e de qual branch partir (Restrições globais → Base). Criar `feat/eba-editorial`.
- [ ] **Passo 2:** `cd next && yarn quality` → verde (linha de base). Se falhar, parar e reportar: não é desta tarefa.

### Tarefa 1: Collection type `curso` no Strapi

**Arquivos:** criar `strapi/src/api/curso/content-types/curso/schema.json` (+ `controllers/curso.ts`, `routes/curso.ts`, `services/curso.ts` com as factories padrão do Strapi 5), `strapi/src/editor-guide/api.curso.json`; modificar a liberação de leitura pública no bootstrap e `strapi/config/admin.ts`.

**Interfaces — produz:** API REST `GET /api/cursos` com os campos exatos da spec §4.2 (`nome`, `slug`, `resumo`, `capa`, `vertente`, `publico_alvo`, `duracao`, `formato`, `entrada`, `inscricao` = `shared.botao`, `video_apresentacao`, `ordem`, `secoes`, `seo`), `draftAndPublish: true`, collectionName `cursos`, singular `curso`, display "Cursos da EBA". `secoes` aceita só `sections.imagem-texto`, `sections.texto-rico`, `sections.perguntas-frequentes`, `sections.texto-botoes`.

- [ ] **Passo 1:** Escrever o schema com os limites da spec (`nome` 40, `resumo` 160, `publico_alvo` 80, `duracao` 60, `entrada` 60, `video_apresentacao` 300, `ordem` integer min 0 default 100, `vertente` default `integracao`).
- [ ] **Passo 2:** Guia do editor `api.curso.json` no formato dos outros `api.*.json`, cobrindo todos os campos; no `slug`: "Não mude o endereço de um curso publicado: links e QR codes quebram. Se precisar, peça um redirecionamento ao time de dev."
- [ ] **Passo 3:** Leitura pública `api::curso.curso.find` e `findOne` no mesmo ponto em que o bootstrap libera `page`.
- [ ] **Passo 4:** Preview em `strapi/config/admin.ts`: para `api::curso.curso`, montar `/api/preview?secret=…&tipo=curso&slug=<slug>&status=…` (mesmo padrão de `api::page.page`).
- [ ] **Passo 5:** `cd strapi && yarn build` → sem erro. `cd next && yarn test src/__tests__/caracteristicas/cinco-pilares.test.ts` → verde (guia cobre o schema).
- [ ] **Passo 6:** Pedir ao usuário para subir o Strapi; conferir no painel os campos com descrição e `GET http://localhost:1337/api/cursos` → `200 {"data":[]}`.
- [ ] **Passo 7:** Commit `feat(strapi): tipo Cursos da EBA`.

### Tarefa 2: Caminhos, redirecionamento 308 e preview de curso

**Arquivos:** modificar `next/src/lib/paginas/caminho.ts` (+ teste), `next/src/app/(site)/[slug]/page.tsx`, `next/src/app/api/preview/route.ts`; testes em `next/src/__tests__/integracao/rotas-api.test.ts` e `paginas.test.tsx`.

**Interfaces — produz:** `PREFIXO_EBA = 'eba-'`; `caminhoDaPagina('eba') === '/eba'`, `caminhoDaPagina('eba-cursos') === '/eba/cursos'`; `caminhoDoCurso(slug: string): string` → `/eba/cursos/<slug>`; `slugDoCurso(segmento: string): string | null` (null fora do padrão).

- [ ] **Passo 1: testes falhando** em `caminho.test.ts`: os três casos acima; `slugDoCurso('Reset') === null`; `slugDoCurso('a..b') === null`; `slugDoCurso('reset') === 'reset'`. Em `paginas.test.tsx`: `/eba-cursos` (slug do `[slug]`) → `permanentRedirect('/eba/cursos')`. Em `rotas-api.test.ts`: `/api/preview?secret=ok&tipo=curso&slug=reset&status=draft` → redireciona para `/eba/cursos/reset` com draft ligado; `tipo=curso&slug=Reset` → 400.
- [ ] **Passo 2:** `cd next && yarn test src/lib/paginas src/__tests__/integracao` → FAIL nos casos novos.
- [ ] **Passo 3:** Implementar. No `[slug]`, `startsWith(PREFIXO_EBA)` → `permanentRedirect(caminhoDaPagina(slug))` (a página `eba` sem hífen não redireciona: ela é servida em `/eba` pela rota da tarefa 7). No preview, `tipo === 'curso'` usa `caminhoDoCurso`.
- [ ] **Passo 4:** Mesmos testes → PASS; `yarn test` inteiro verde.
- [ ] **Passo 5:** Commit `feat(eba): caminhos /eba e preview de curso`.

### Tarefa 3: Regras puras do curso e busca no Strapi

**Arquivos:** criar `next/src/lib/eba/types.ts`, `next/src/lib/eba/curso.ts` (+ `curso.test.ts`), `next/src/lib/eba/__fixtures__/cursos.json` (resposta real de `GET /api/cursos?populate=…` copiada do Strapi de dev depois da tarefa 11, sem tokens; até lá, JSON no mesmo formato), `next/src/lib/strapi/queries/cursos.ts` (+ `cursos.test.ts`).

**Interfaces — produz:**

```ts
// lib/eba/types.ts
export type Vertente = 'integracao' | 'consolidacao';
export type Formato = 'presencial' | 'online' | 'presencial_ou_online';
export interface StrapiCurso {
  id: number; documentId: string; nome?: string | null; slug?: string | null; resumo?: string | null;
  capa?: StrapiMedia | null; vertente?: Vertente | null; publico_alvo?: string | null; duracao?: string | null;
  formato?: Formato | null; entrada?: string | null; inscricao?: StrapiBotao | null;
  video_apresentacao?: string | null; ordem?: number | null; secoes?: StrapiSection[] | null;
  seo?: StrapiSeo | null; updatedAt?: string | null;
}
export interface ChipView { rotulo: string; valor: string }
export interface CursoResumoView {
  slug: string; nome: string; resumo: string; href: string; vertente: Vertente; rotuloVertente: string;
  capa: MediaView | null; chips: ChipView[]; ordem: number;
}
export interface CursoView extends CursoResumoView {
  inscricao: BotaoView | null; video: VideoSerie | null; secoes: StrapiSection[];
  temPerguntasFrequentes: boolean; seo: StrapiSeo | null; atualizadoEm: string | null;
}
```

```ts
// lib/eba/curso.ts
export function normalizeCursoResumo(c: StrapiCurso): CursoResumoView | null;
export function normalizeCurso(c: StrapiCurso): CursoView | null;
export function videoDoYoutube(url: string | null | undefined): VideoSerie | null;
export function filtrarCursos(cursos: CursoResumoView[], o: { vertente?: 'todas' | Vertente; quantidade?: number | null; excluirSlug?: string }): CursoResumoView[];
// lib/strapi/queries/cursos.ts
export async function listarCursosPublicados(): Promise<CursoResumoView[]>;      // ordenados; tag 'cursos'
export async function getCursoBySlug(slug: string): Promise<CursoView | null>;   // draft-aware; tag `curso:<slug>`
export async function listarCursosParaSitemap(): Promise<PaginaSitemap[]>;       // slug, updatedAt, seo.metaRobots/canonicalURL
```

- [ ] **Passo 1: testes falhando** em `curso.test.ts` (nomes em português, descrevendo o comportamento):
  - sem `nome`, `slug` ou `resumo` → `null`; slug fora do padrão → `null`;
  - campos com espaços → aparados; `href === '/eba/cursos/reset'`;
  - sem capa, ou capa sem `alternativeText` → `capa === null` (ponto de revisão 1);
  - chips só dos campos preenchidos, nesta ordem e com estes rótulos: "Para quem", "Duração", "Formato" (texto do enum), "Quando entrar";
  - `vertente` ausente → `integracao` e `rotuloVertente === 'Curso de integração'`; `ordem` ausente → 100;
  - inscrição com `url: 'javascript:alert(1)'` → `inscricao === null`;
  - `videoDoYoutube`: `https://youtu.be/dQw4w9WgXcQ`, `https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30`, `https://m.youtube.com/shorts/dQw4w9WgXcQ` → `videoId 'dQw4w9WgXcQ'`, `embedUrl` em `https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ`, `embeddable: true`, `thumbnail: null`; `https://vimeo.com/1`, `'texto'`, `''`, `null`, ID com 10 caracteres → `null` (ponto de revisão 4);
  - `temPerguntasFrequentes` verdadeiro só com uma seção `sections.perguntas-frequentes` em `secoes`;
  - `filtrarCursos`: ordena por `ordem` e desempata por `nome` (pt-BR); `vertente: 'consolidacao'` sem cursos → `[]`; `quantidade: 2` corta; `quantidade` maior que a lista → lista inteira; `excluirSlug` remove o curso.
- [ ] **Passo 2: testes falhando** em `cursos.test.ts` (fetch simulado, padrão de `paginas.test.ts`): `listarCursosPublicados` pede `cursos` com `populate` de `capa` e `inscricao`, descarta inválidos e devolve ordenado; `getCursoBySlug('reset')` filtra `slug $eq`, popula `secoes` com os fragmentos `on` das 4 seções permitidas (`sectionsPopulate()` filtrado) e `seo.metaImage`; lista vazia → `null`; Strapi 500 → lança `StrapiError` (não devolve `null`).
- [ ] **Passo 3:** `yarn test src/lib/eba src/lib/strapi/queries/cursos` → FAIL.
- [ ] **Passo 4:** Implementar (normalizes com `resolveStrapiMedia` e `normalizeBotoes` existentes; queries com `strapiFetch` e as tags acima).
- [ ] **Passo 5:** Mesmos testes → PASS.
- [ ] **Passo 6:** Commit `feat(eba): regras e busca dos cursos`.

### Tarefa 4: UI — `Chips`, `Trilha`, `CardCurso`

**Arquivos:** criar `next/src/components/ui/Chips/`, `Trilha/`, `CardCurso/` (cada um: `.tsx`, `.module.css`, `.showcase.tsx`, `.test.tsx`, `index.ts`); registrar no `lib/showcase/catalog.ts`; docs `docs/componentes/chips.md`, `trilha.md`, `card-curso.md` (seção Medição e Testes) e linhas no índice `docs/componentes/README.md`.

**Interfaces — produz:**

```ts
Chips({ itens: ChipView[]; tom?: 'claro' | 'inverso' })                      // null se vazio; <ul role="list">
Trilha({ itens: { texto: string; href?: string }[] })                         // último = aria-current="page"
CardCurso({ curso: CursoResumoView; nivelTitulo?: 2 | 3 })                    // padrão 3
```

- [ ] **Passo 1: testes falhando:** `Chips` com 0 itens → nada; com itens → lista com rótulo visível e valor. `Trilha` → `navigation` com nome "Trilha", lista ordenada, último sem link com `aria-current="page"`. `CardCurso` → um único link com nome igual ao nome do curso e `href` do curso; sem capa → bloco com o nome (`aria-hidden`), sem `<img>`; `nivelTitulo={2}` → `h2`.
- [ ] **Passo 2:** `yarn test src/components/ui` → FAIL.
- [ ] **Passo 3:** Implementar com o CSS do protótipo (`docs/prototipo/eba/eba.css`: `.chips`, `.trilha`, `.card-curso`) traduzido para CSS Modules e os tokens do design system em `tokens.css` (sem valor solto). Trilha: no celular só "‹ <nível anterior>"; a partir de 769 px completa com "›".
- [ ] **Passo 4:** `yarn test src/components/ui src/lib/showcase src/__tests__/caracteristicas` → PASS.
- [ ] **Passo 5:** Commit `feat(ui): chips, trilha e card de curso`.

### Tarefa 5: Seção `sections.catalogo-cursos`

**Arquivos:** criar `strapi/src/components/sections/catalogo-cursos.json`, `strapi/src/editor-guide/sections.catalogo-cursos.json`; modificar a dynamic zone em `strapi/src/api/page/content-types/page/schema.json`; criar `next/src/components/sections/CatalogoCursosSection/` com a anatomia completa (`CatalogoCursosSection.tsx` async, `CatalogoCursos.tsx` apresentação, `types.ts`, `normalize.ts`, `populate.ts` = `true`, `.mock.json` com `completo`/`minimo`/`texto_longo`, `.showcase.tsx` com controles para `vertente`, `quantidade`, `link_ver_todos`, testes, `index.ts`); registrar em `sectionRegistry`; doc `docs/componentes/catalogo-cursos.md` (Medição: coberto por `clique_cta` e `ver_secao`).

**Interfaces:** consome `listarCursosPublicados`, `filtrarCursos`, `CardCurso`. Produz:

```ts
normalizeCatalogoCursos(data: CatalogoCursosData): { titulo: string; textoApoio?: string; vertente: 'todas' | Vertente; quantidade: number | null; verTodos: boolean } | null
CatalogoCursos({ id: string; titulo: string; textoApoio?: string; cursos: CursoResumoView[]; verTodos: boolean; nivelTitulo: 1 | 2; mostrarVazio: boolean })
```

- [ ] **Passo 1: testes falhando:** `normalize` sem título → `null`; `quantidade` fora de 1–12 → `null`; defaults `todas`/`true`. Seção (com `listarCursosPublicados` mockado pela fixture): renderiza os cards filtrados, `data-section="catalogo-cursos"`, "Ver todos os cursos" → `/eba/cursos` quando ligado; `index === 0` → título `h1` e cards `h2`; sem cursos e `index > 0` → nada; sem cursos e `index === 0` → "Novos cursos em breve" com link de e-mail; erro do Strapi na lista → a seção some (não derruba a página).
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar. **Passo 4:** `yarn test` inteiro (cinco-pilares, vitrine, a11y) → PASS; `cd strapi && yarn build` → OK.
- [ ] **Passo 5:** Com os servidores do usuário: `/componentes/catalogo-cursos` em 375/768/1440; painel do Strapi mostra a seção com descrições.
- [ ] **Passo 6:** Commit `feat(eba): seção Catálogo de cursos`.

### Tarefa 6: `CursoCabecalho`

**Arquivos:** criar `next/src/components/layout/CursoCabecalho/` (`.tsx`, `.module.css`, `.showcase.tsx` com variantes `completo` = Talmidim com vídeo, `minimo` = Start sem inscrição nem vídeo, `sem_capa`; `.test.tsx`, `index.ts`), registrar no catálogo da vitrine (categoria `layout`), doc `docs/componentes/curso-cabecalho.md` (Medição: `clique_cta` + `inscrever_curso`).

**Interfaces:** consome `CursoView`, `Chips`, `Trilha`, `AssistirVideo` (de `SerieAtualSection`). Produz `CursoCabecalho({ curso: CursoView; trilha: { texto: string; href?: string }[] })`.

- [ ] **Passo 1: testes falhando:** um `h1` com o nome; rótulo da vertente; chips; botão de inscrição com `data-curso="<slug>"`, `target="_blank"` + `rel="noopener noreferrer"` + aviso visível "abre em nova aba" quando `nova_aba`; botão "Perguntas frequentes" só com `temPerguntasFrequentes` (âncora para a seção); com `video` → gatilho do `AssistirVideo` com nome "Assistir à apresentação do <nome>"; sem capa → sem `<img>`; capa com `loading="eager"` + `fetchPriority="high"`.
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar (layout de duas colunas ≥ 1024 px, como `.curso-topo` do protótipo). **Passo 4:** PASS + características.
- [ ] **Passo 5:** Commit `feat(eba): topo da página do curso`.

### Tarefa 7: Rotas `/eba`, `/eba/cursos`, `/eba/cursos/[slug]` e JSON-LD

**Arquivos:** criar `next/src/app/(site)/eba/page.tsx`, `eba/cursos/page.tsx`, `eba/cursos/[slug]/page.tsx`, `next/src/lib/eba/dados-estruturados.ts` (+ teste), `next/src/lib/seo/json-ld.ts` (+ teste); teste de integração `next/src/__tests__/integracao/eba.test.tsx`.

**Interfaces:**

```ts
jsonLdSeguro(dados: object): string                         // JSON com '<' → '\u003c'
schemaDoCurso(curso: CursoView, site: string): object       // @type Course; provider Organization "ADAI"
schemaDoCatalogo(cursos: CursoResumoView[], site: string): object   // @type ItemList
schemaDaTrilha(itens: { texto: string; href?: string }[], site: string): object // @type BreadcrumbList
```

- [ ] **Passo 0:** Ler em `next/node_modules/next/dist/docs/` como o App Router resolve pasta estática (`eba/`) × segmento dinâmico (`[slug]`) e `generateMetadata` com `params` assíncrono.
- [ ] **Passo 1: testes falhando** (`renderizarServidor` + `strapi-fake`, padrão de `paginas.test.tsx`):
  - `/eba` renderiza a página `eba` com um `h1`; sem página → `notFound`;
  - `/eba/cursos` renderiza a trilha (ADAI › EBA › Cursos) e a página `eba-cursos` + `<script type="application/ld+json">` com `ItemList`;
  - `/eba/cursos/talmidim`: trilha, `CursoCabecalho`, seções do curso, bloco final de inscrição, "Outros cursos" (até 3, sem o atual, mesma vertente), JSON-LD `Course` e `BreadcrumbList`;
  - `generateMetadata` do curso: `title` com o nome, canonical `/eba/cursos/talmidim`, `seo.metaRobots: 'noindex'` → `robots.index === false` (ponto de revisão 5);
  - slug `Reset`, `a..b`, `á` → `notFound` **sem** chamar o Strapi (ponto de revisão 2);
  - curso inexistente → `notFound`; Strapi 500 → a página lança (vai para `error.tsx`), não chama `notFound` (ponto de revisão 3).
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar. Metadata do curso: `buildMetadata(curso.seo ?? { metaTitle: '<nome> — Cursos da EBA | ADAI', metaDescription: resumo, metaImage: capa }, global?.seo, caminhoDoCurso(slug))`.
- [ ] **Passo 4:** `yarn test` → PASS.
- [ ] **Passo 5:** Commit `feat(eba): rotas da EBA e dados estruturados`.

### Tarefa 8: Cursos no sitemap

**Arquivos:** modificar `next/src/lib/seo/sitemap.ts` (+ teste), `next/src/app/sitemap.ts`.

**Interfaces:** `paginaNoSitemap(pagina, site, caminho = caminhoDaPagina(pagina.slug))` (parâmetro novo, retrocompatível); `montarSitemapCursos(cursos: PaginaSitemap[], site: string): MetadataRoute.Sitemap` (prioridade 0,7, `lastModified` `AAAA-MM-DD`).

- [ ] **Passo 1: testes falhando:** página `eba-cursos` → URL `<site>/eba/cursos`; curso → `<site>/eba/cursos/reset`; curso com `noindex` ou canonical para outra URL → fora; slug inválido → fora; testes atuais continuam iguais.
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar e somar `montarSitemapCursos(await listarCursosParaSitemap(), url)` em `app/sitemap.ts`. **Passo 4:** PASS.
- [ ] **Passo 5:** Commit `feat(seo): cursos da EBA no sitemap`.

### Tarefa 9: Cabeçalho com 6 links

**Arquivos:** modificar `next/src/components/layout/Header/Header.module.css` (+ teste do Header se houver asserção de layout), `docs/componentes/header.md`.

- [ ] **Passo 1:** Teste no `Header.test.tsx`: com 6 links, todos renderizam (o limite já é 6) e o último pode ter `aria-current`.
- [ ] **Passo 2:** No tier desktop: espaço entre links `clamp(1rem, 2.2vw, 2rem)` (token novo em `tokens.css` + `Design-Tokens.md`, marcado como proposta) e botões sem quebra (`flex-wrap: nowrap`). Com 5 links o resultado fica igual ao atual.
- [ ] **Passo 3:** `yarn test` → PASS; vitrine `/componentes/header` em 1024 e 1440 com 5 e 6 links: botões numa linha só, sem rolagem lateral.
- [ ] **Passo 4:** Commit `fix(header): espaço fluido para o 6º link do menu`.

### Tarefa 10: Evento `inscrever_curso`

**Arquivos:** modificar `next/src/lib/analytics/eventos.ts`, `cliques.ts` (+ `cliques.test.ts`), `next/src/components/analytics/RastreadorAnalytics.tsx`, `docs/analytics/README.md` (§3), `docs/analytics/gtm-container-adai.json` (regex e variável `DLV - curso`).

**Interfaces:** `EventosAnalytics.inscrever_curso: Origem & { curso: string }`; `ContextoClique.curso?: string | null` = `data-curso` **do próprio link clicado** (não do ancestral).

- [ ] **Passo 1: testes falhando** em `cliques.test.ts`: clique com `curso: 'talmidim'` em `secao: 'curso-cabecalho'` → `[['inscrever_curso', { origem: 'curso-cabecalho', curso: 'talmidim' }], ['clique_cta', …]]`; sem `curso` → só `clique_cta`. `eventos.test.ts` (já existente) falha até catálogo, plano e GTM estarem coerentes.
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar. **Passo 4:** `yarn test src/lib/analytics` → PASS.
- [ ] **Passo 5:** Commit `feat(analytics): evento inscrever_curso`.

### Tarefa 11: Conteúdo de dev (seed v19)

**Arquivos:** modificar `strapi/src/bootstrap/seed.ts`; criar `strapi/seed/eba/` com as imagens (as mesmas reduzidas do protótipo: `eba-hero.webp`, `eba-biblia.webp`, `logo-eba.webp`, `<curso>-capa.webp`, `<curso>-info.webp`); modificar `README.md` (checklist de produção: item novo "EBA").

**Interfaces:** `ensureCursos(strapi: Core.Strapi): Promise<void>` (cria ou atualiza por slug, publica); `ebaSections(strapi)`, `ebaCursosSections(strapi)` (montam as páginas `eba` e `eba-cursos`); `SEED_VERSION = 19`.

- [ ] **Passo 1:** Conteúdo exatamente como no protótipo aprovado (`docs/prototipo/eba/*.html`): 4 cursos (ordem 10 Reset, 20 Start, 30 CDV, 40 Talmidim) com chips, inscrição (Reset e Talmidim: Google Forms em nova aba; Start e CDV: "Falar com a EBA" → `mailto:contato@adai.com.br`), corpo (Imagem e texto "Sobre o curso"; Texto com Objetivos, Quem pode fazer, Como funciona; Perguntas frequentes em todos os cursos com as perguntas do protótipo — Reset 6, Start 4, CDV 4, Talmidim 6; no CDV, Texto e botões "Os testes do CDV"); páginas `eba` (com Perguntas frequentes: 5 perguntas) e `eba-cursos` com as seções do protótipo; header com "EBA" → `/eba` (6º link) e rodapé "Escola Bíblica (EBA)" → `/eba` na coluna Participe.
- [ ] **Passo 2:** Idempotência: rodar o seed duas vezes não duplica cursos nem páginas (conferir com `GET /api/cursos` → 4). Conferir também que cada curso e a página `eba` trazem uma seção `sections.perguntas-frequentes` com o número de perguntas acima, e que os 4 cursos mostram o botão "Perguntas frequentes" no topo.
- [ ] **Passo 3:** `cd strapi && yarn build` → OK. Pedir ao usuário para reiniciar o Strapi; conferir as 3 rotas no Next do usuário.
- [ ] **Passo 4:** Atualizar a fixture `next/src/lib/eba/__fixtures__/cursos.json` com a resposta real anonimizada; `yarn test` → PASS.
- [ ] **Passo 5:** Snapshot do Strapi: **perguntar ao usuário** se deve exportar (`yarn data:export`, Strapi parado). Sem autorização, registrar como pendente no PR.
- [ ] **Passo 6:** Commit `feat(strapi): conteúdo da EBA no seed v19`.

### Tarefa 12: Redirecionamentos no site atual (`adaitech/eba-adai`)

**Arquivos (outro repositório, `C:\ADAI\eba-adai`, branch própria `feat/redirecionar-para-hub`):** criar `redirecionamentos.mjs` e `redirecionamentos.test.mjs`; modificar `next.config.mjs`.

**Interfaces:** `redirecionamentosParaHub({ ativo: boolean, hub: string }): { source: string; destination: string; permanent: true }[]`; `next.config.mjs` usa `ativo = process.env.REDIRECIONAR_PARA_HUB === 'true'`, `hub = process.env.HUB_URL ?? 'https://adai.com.br'`.

- [ ] **Passo 1: teste falhando** (`node --test redirecionamentos.test.mjs`): `ativo: false` → `[]`; `ativo: true` → `/` → `<hub>/eba`, `/reset|/start|/cdv|/talmidim` → `<hub>/eba/cursos/<mesmo>`, todos `permanent: true`; nenhuma regra para `/dna`, `/teste/:path*`, `/login`, `/dashboard/:path*`.
- [ ] **Passo 2:** FAIL. **Passo 3:** implementar e ligar em `next.config.mjs` (`async redirects()`). **Passo 4:** PASS; `corepack pnpm@9.15.9 build` → OK.
- [ ] **Passo 5:** Commit `feat: redirecionamentos para o ADAI Hub (desligados)` com a conta `jonatanc`. PR só com pedido explícito.

### Tarefa 13: Verificação final

- [ ] `cd next && yarn quality` → verde (inclui características e cobertura).
- [ ] `cd next && yarn build` e `cd strapi && yarn build` → verdes (se o build do Next falhar por causa conhecida do design system — Turbopack e fontes do Google —, registrar e usar a mesma alternativa definida naquela entrega).
- [ ] `yarn smoke` com os servidores do usuário, após somar `/eba`, `/eba/cursos` e `/eba/cursos/reset` em `PAGINAS_DO_SITE` de `next/scripts/smoke.mjs` → tudo verde; `/eba/cursos/nao-existe` → 404.
- [ ] Navegador em 375/768/1440: sem rolagem lateral (`document.documentElement.scrollWidth <= innerWidth`), console sem erros, teclado (Tab, Enter, Esc no player).
- [ ] DataLayer: clicar num card de curso → `clique_cta` com `origem: 'catalogo-cursos'`; clicar em "Quero me inscrever" → `inscrever_curso` + `clique_cta`; `ver_secao` das seções novas.
- [ ] 5 pilares conferidos para Catálogo de cursos, Card de curso, Chips, Trilha e Cabeçalho do curso.
- [ ] `yarn audit --groups dependencies` sem crítica nova (nenhuma dependência nova é esperada).
- [ ] Revisão (`superpowers:requesting-code-review` + skill `pr-code-review`) e checklist `Pull-Request.md` partes A e B; PR só com pedido explícito.
