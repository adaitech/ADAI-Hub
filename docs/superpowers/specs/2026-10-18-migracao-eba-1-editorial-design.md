# Migração da EBA — entrega 1 (editorial) — design

> **Tipo:** `architectural` · **Status:** aguardando aprovação do usuário · **Data:** 18/10/2026
> **Origem:** brainstorm de 18/10/2026. Descoberta e briefing em `documents/eba/` (fora do Git); protótipo aprovado em `docs/prototipo/eba/` (navegação **A**).
> **Série:** esta é a 1ª de 4 entregas da migração da EBA (Escola Bíblica ADAI) para o ADAI Hub: **1 editorial** · 2 testes · 3 resultados · 4 área logada. Cada uma tem spec e plano próprios.

## 1. Objetivo

A EBA passa a ter sua "segunda home" dentro do site da ADAI, com o visual, o cabeçalho, o rodapé, o SEO e a medição do Hub. A home da EBA, o catálogo e as páginas dos cursos ficam editáveis no Strapi.

**Critério central de sucesso:** um editor publica no Strapi um curso novo, equivalente aos atuais, e ele aparece no catálogo, na home da EBA e no sitemap, sem nenhuma mudança de código.

## 2. Fora do escopo

- Testes, resultados e área logada: continuam em `eba.adai.com.br` até as entregas 2, 3 e 4.
- Curso DNA e cursos de consolidação: não entram no catálogo. Nada do DNA é apagado; ele continua no site atual.
- Aulas gravadas (Vimeo).
- Inscrição própria: cada curso continua com o seu link (hoje Google Forms ou e-mail).
- Barra de navegação da área (opção B do protótipo): descartada nesta entrega. Pode voltar na entrega 2, quando os testes chegarem ao Hub.
- Qualquer mudança na API da EBA (`eba-ada-api`).

## 3. Decisões do brainstorm

| # | Decisão | Escolha |
| --- | --- | --- |
| D1 | Fatiamento | 4 entregas com spec e plano próprios |
| D2 | URLs | `/eba` · `/eba/cursos` · `/eba/cursos/<slug>` |
| D3 | Modelo no Strapi | Collection type `curso` com campos fixos + corpo com as seções existentes |
| D4 | Identidade visual | 100% do Hub (fontes, tokens, componentes); logo da EBA como imagem no conteúdo |
| D5 | Navegação interna | **A**: pelo conteúdo + trilha (breadcrumb) nas páginas internas |
| D6 | Lançamento | Construída e validada em homologação; entra no ar junto com o lançamento do Hub |

## 4. Arquitetura

Nenhuma integração nova: tudo vem do Strapi, pelo `src/lib/strapi/` que já existe, com o mesmo cache (60 s + tag `strapi` + webhook de revalidação).

```text
Strapi                                   Next (app/(site))
 page "eba"         ───────────────────▶  eba/page.tsx              /eba
 page "eba-cursos"  ───────────────────▶  eba/cursos/page.tsx       /eba/cursos
 curso (collection) ─┬─────────────────▶  eba/cursos/[slug]/page.tsx /eba/cursos/<slug>
                     └─ sections.catalogo-cursos (em qualquer página) lista os cursos publicados
```

### 4.1 Rotas

| Rota | Arquivo | Dados | Sem conteúdo |
| --- | --- | --- | --- |
| `/eba` | `app/(site)/eba/page.tsx` | `page` com slug `eba` | 404 `noindex` |
| `/eba/cursos` | `app/(site)/eba/cursos/page.tsx` | `page` com slug `eba-cursos` | 404 `noindex` |
| `/eba/cursos/[slug]` | `app/(site)/eba/cursos/[slug]/page.tsx` | `curso` publicado com o slug | 404 `noindex` (inexistente, despublicado ou fora do padrão de slug) |

- A pasta `eba/` é necessária para `/eba/cursos/...`. Por isso `/eba` ganha um `page.tsx` próprio em vez de cair no `[slug]` genérico (confirmar a precedência de rotas na documentação do Next 16 instalada, `node_modules/next/dist/docs/`, antes de implementar).
- **Prefixo de slug**, no mesmo padrão de `/sobre-nos`: em `lib/paginas/caminho.ts`, `PREFIXO_EBA = 'eba-'`; `caminhoDaPagina('eba-cursos')` → `/eba/cursos`. O `[slug]` genérico redireciona com 308 o endereço plano (`/eba-cursos` → `/eba/cursos`), como já faz com `sobre-nos-`.
- **Pré-visualização de rascunho:** `api/preview` passa a aceitar cursos (`tipo=curso`) e redireciona para `/eba/cursos/<slug>` em draft mode.

### 4.2 Strapi — collection type `curso`

`api::curso.curso` · display name **Cursos da EBA** · Draft & Publish **ligado**.

| Campo (UID) | Nome no painel | Tipo | Obrigatório | Limite | Uso |
| --- | --- | --- | --- | --- | --- |
| `nome` | Nome do curso | string | sim | 40 | card, `h1`, título da página |
| `slug` | Endereço | uid (de `nome`) | sim | — | `/eba/cursos/<slug>` |
| `resumo` | Resumo | text | sim | 160 | card, topo, meta description padrão |
| `capa` | Foto de capa | media (imagem) | sim | — | card, topo, Open Graph |
| `vertente` | Vertente | enum `integracao` · `consolidacao` | sim (padrão `integracao`) | — | rótulo do topo e do card; filtro do catálogo |
| `publico_alvo` | Para quem | string | não | 80 | chip |
| `duracao` | Duração | string | não | 60 | chip |
| `formato` | Formato | enum `presencial` · `online` · `presencial_ou_online` | não | — | chip (textos: "Presencial", "On-line", "Presencial ou on-line") |
| `entrada` | Quando entrar | string | não | 60 | chip ("A qualquer momento", "Só no início de cada turma") |
| `inscricao` | Botão de inscrição | `shared.botao` | não | — | CTA do topo e do bloco final |
| `video_apresentacao` | Vídeo de apresentação (YouTube) | string (URL) | não | 300 | player do topo (só YouTube; outro domínio é ignorado no normalize) |
| `ordem` | Ordem no catálogo | integer | não (padrão 100) | ≥ 0 | ordenação (empate: nome) |
| `secoes` | Conteúdo da página | dynamic zone: `sections.imagem-texto`, `sections.texto-rico`, `sections.perguntas-frequentes`, `sections.texto-botoes` | não | — | corpo da página |
| `seo` | SEO | `shared.seo` | não | — | metadata, canonical, robots |

Guia do editor em `strapi/src/editor-guide/api.curso.json` (fonte única dos textos de ajuda, aplicado no bootstrap), com a orientação: **não mudar o endereço (slug) de um curso publicado** — mudar quebra links e QR codes; se for preciso, pedir ao time de dev um redirecionamento.

Permissões: leitura pública de `curso` (`find`, `findOne`), como `page`. O Next usa o token de leitura que já existe.

### 4.3 Strapi — seção nova `sections.catalogo-cursos`

Display name **Catálogo de cursos**. Entra na dynamic zone de `page`.

| Campo | Nome no painel | Tipo | Padrão | Uso |
| --- | --- | --- | --- | --- |
| `titulo` | Título | string (80) | — (obrigatório) | `h2` da seção (ou `h1` se for a primeira seção da página) |
| `texto_apoio` | Texto de apoio | text (240) | — | abaixo do título |
| `vertente` | Quais cursos | enum `todas` · `integracao` · `consolidacao` | `todas` | filtro |
| `quantidade` | Quantos cursos mostrar | integer (1–12) | vazio = todos | limite |
| `link_ver_todos` | Mostrar "Ver todos os cursos" | boolean | `true` | link para `/eba/cursos` |

Os cursos **não** são escolhidos à mão: a seção lista os publicados, filtrados e ordenados. Sem nenhum curso publicado, a seção não aparece; na página `eba-cursos`, aparece a mensagem "Novos cursos em breve" com contato (estado vazio do protótipo).

### 4.4 Next — componentes

| Componente | Pasta | Tipo | Observação |
| --- | --- | --- | --- |
| `CatalogoCursosSection` | `components/sections/CatalogoCursosSection/` | Seção do CMS (Server Component `async`) | Lê a config do bloco e chama `listarCursosPublicados()` em `lib/strapi/queries/cursos.ts`; entrega o view model para `CatalogoCursos` (apresentação). Anatomia completa: types, normalize, populate, mock, showcase, teste, doc |
| `CardCurso` | `components/ui/CardCurso/` | UI | Card inteiro clicável com **um** link; foto 4:3 com raio 20; sem capa → bloco cinza com o nome |
| `CursoCabecalho` | `components/layout/CursoCabecalho/` | Layout (não entra no registry) | Topo da página do curso: trilha, vertente, `h1`, resumo, chips, botões, capa, player opcional |
| `Trilha` | `components/ui/Trilha/` | UI | `<nav aria-label="Trilha">` + `<ol>` + `aria-current="page"`; completa a partir de 769 px; no celular só "‹ <nível anterior>" |
| `Chips` | `components/ui/Chips/` | UI | Lista com rótulo visível ("Para quem", "Duração", "Formato", "Quando entrar") |

Reaproveitados sem mudança: `HeroSection`, `ImagemTextoSection`, `TextoRicoSection`, `TextoBotoesSection`, `PerguntasFrequentesSection`, `ButtonLink`, `SmartLink`, `TextLink`, o player da Série atual (diálogo + iframe youtube-nocookie só no clique). Header e Footer ganham os links pelo Strapi, sem código.

**Ajuste compartilhado necessário (Extensão sem sobreposição):** com o 6º link no menu, o cabeçalho quebra os botões em duas linhas a 1024 px (visto no protótipo). Correção proposta: espaço entre os links fluido (`clamp(1rem, 2.2vw, 2rem)`) e botões sem quebra no tier desktop. É retrocompatível (com 5 links fica igual) e precisa de conferência na vitrine do Header.

### 4.5 Página do curso — composição

1. `Trilha`: ADAI › EBA › Cursos › <nome>.
2. `CursoCabecalho`: vertente, `h1` (escala display), resumo, chips, botão de inscrição (+ "Perguntas frequentes" quando o corpo tem essa seção), aviso "abre em nova aba" quando `nova_aba`, capa; player quando houver vídeo.
3. `secoes` do curso, na ordem do editor (todas como `h2`: o `h1` já é do topo).
4. Bloco final de inscrição: aparece só quando há `inscricao`, repetindo o botão.
5. "Outros cursos": `CatalogoCursos` com até 3 cursos da mesma vertente, sem o atual (gerado pelo código, não pelo editor).

### 4.6 Fonte da verdade

| Dado | Fonte | Observação |
| --- | --- | --- |
| Home da EBA, catálogo (textos, imagens, CTAs, SEO) | Strapi `page` | Slugs `eba` e `eba-cursos` |
| Cursos | Strapi `curso` | Única fonte; nada fica fixo no código |
| Inscrição | Link externo no `curso` | Google Forms / e-mail; o Hub não guarda dados |
| Vídeo de apresentação | YouTube (URL no `curso`) | Opcional |
| Testes, resultados, alunos, turmas | API da EBA (entregas 2–4) | Fora desta entrega |

Não há contrato de API, dado pessoal, autenticação nem papel de usuário nesta entrega.

## 5. Fluxos

1. **Menu → curso → inscrição:** Home ADAI → "EBA" (6º link do menu) → `/eba` → card do curso → `/eba/cursos/reset` → "Quero me inscrever" (formulário externo, nova aba).
2. **Link antigo:** `eba.adai.com.br/talmidim` → 301 → `adai.com.br/eba/cursos/talmidim` (depois do lançamento).
3. **Editor:** Strapi → Cursos da EBA → criar → preencher → montar o corpo → pré-visualizar → publicar → aparece no catálogo, na home da EBA e no sitemap (até 60 s, ou na hora pelo webhook).
4. **Despublicar:** o curso some do catálogo e do sitemap; o endereço responde 404 `noindex`.

## 6. Migração de conteúdo

**Dev/homologação — seed do Strapi** (`strapi/src/bootstrap/seed.ts`, `SEED_VERSION` 18 → 19), idempotente por slug (cria ou atualiza; nunca duplica):

| Conteúdo | Origem (site atual) |
| --- | --- |
| 4 cursos (Reset, Start, CDV, Talmidim): nome, slug, resumo, vertente, chips, inscrição, ordem 10/20/30/40 | `eba-adai/src/utils/content/institutional/courses/*.ts` |
| Corpo de cada curso: "Sobre o curso" (Imagem e texto), "Objetivos / Quem pode fazer / Como funciona" (Texto), Perguntas frequentes em todos os cursos (Reset 6, Start 4, CDV 4, Talmidim 6) | idem, HTML convertido para Markdown/campos (sem HTML livre) |
| Página `eba`: Hero, Imagem e texto com o logo da EBA e as duas vertentes, Catálogo de cursos, Texto e botões (testes), Perguntas frequentes (5), Texto e botões (entrar) | `app/(institutional)/page.tsx` |
| Página `eba-cursos`: catálogo, "Por onde começar", dúvidas | protótipo aprovado |
| Imagens | `eba-adai/public/assets/{eba,courses,logo-eba.webp}` → `strapi/seed/eba/` (reduzidas, webp) |
| Link "EBA" no cabeçalho (6º) e "Escola Bíblica (EBA)" no rodapé (coluna Participe, 5º link) | — |

Textos com promessas que o site não cumpre (e-mail de confirmação, "sete semanas" no Talmidim) ficam de fora até a EBA revisar. As perguntas frequentes do protótipo aprovado (home da EBA e os 4 cursos) são as que vão para o seed. As do Reset vêm das perguntas desativadas no site atual, sem as que contradizem o texto do curso (idade mínima de 12 anos e aulas pelo Zoom); as do Start, do CDV e da home foram escritas a partir dos textos atuais dos cursos e precisam da validação da EBA antes da produção.

**Produção:** o seed não roda em produção. O conteúdo entra pelo painel do Strapi de produção ou por um snapshot novo — o snapshot (`strapi/data/adai-conteudo.tar.gz`) **só é gerado ou exportado com autorização explícita do usuário** (`AGENTS.md`). Item novo no checklist "Antes de subir para produção" do `README.md`.

Não há migração de dados.

## 7. SEO

- `generateMetadata` nas três rotas: `seo` do Strapi; sem ele, `nome`/`resumo`/`capa` do curso. Canonical absoluto com `NEXT_PUBLIC_SITE_URL`; Open Graph e Twitter com a capa.
- Um `h1` por página: Hero (`/eba`), primeira seção (`/eba/cursos`), `CursoCabecalho` (curso). Hierarquia sem saltos (cards de curso como `h2` quando a página não tem outro `h2` antes; `h3` dentro de seção).
- **Dados estruturados (JSON-LD, gerados no servidor):** `Course` (name, description, url, provider = Organization ADAI) em cada curso — sem prometer resultado enriquecido; `ItemList` no catálogo; `BreadcrumbList` nas páginas com trilha. `FAQPage` não é gerado.
- **Sitemap:** `/eba` e `/eba/cursos` entram como páginas do Strapi (já funciona com o prefixo novo); os cursos publicados são somados em `app/sitemap.ts` (prioridade 0,7; `lastModified` do Strapi; fora os com `noindex` ou canonical para outra URL).
- Curso despublicado ou inexistente → 404 com `noindex`.
- Links internos: menu e rodapé → `/eba`; home da EBA ↔ catálogo ↔ cursos; "Outros cursos".

## 8. Redirecionamentos

| De | Para | Onde | Quando |
| --- | --- | --- | --- |
| `adai.com.br/eba-cursos` | `/eba/cursos` (308) | Hub (`[slug]`) | Desde já |
| `eba.adai.com.br/` | `adai.com.br/eba` (301) | Site atual (`eba-adai`, `next.config` redirects) | No lançamento do Hub |
| `eba.adai.com.br/reset`, `/start`, `/cdv`, `/talmidim` | `adai.com.br/eba/cursos/<mesmo slug>` (301) | Site atual | No lançamento do Hub |
| `/dna`, `/teste/*`, `/login`, `/dashboard/*` | — (continuam no site atual; QR codes funcionam) | — | — |

No site atual, os redirecionamentos ficam atrás da variável `REDIRECIONAR_PARA_HUB` (ligada só no lançamento). Essa mudança é feita no repositório `adaitech/eba-adai`, em PR próprio.

## 9. Medição (GA4/GTM/DataLayer)

| Pergunta | Coberto por | Evento novo |
| --- | --- | --- |
| Visitas à EBA e a cada curso | `page_view` | Não |
| Quais cursos despertam interesse | `clique_cta` (`origem=catalogo-cursos`, `destino=/eba/cursos/<slug>`) | Não |
| Seções vistas | `ver_secao` (toda seção com `data-section`) | Não |
| Quantas pessoas começam uma inscrição, por curso | — | **`inscrever_curso`** (`curso` = slug, `origem`) — evento-chave, no padrão de `planejar_visita` |

`inscrever_curso` dispara no clique do botão de inscrição de um curso (topo ou bloco final). Segue `docs/analytics/README.md` §5: catálogo (`eventos.ts`) → regra em `cliques.ts` (link com `data-curso`) → teste → linha no plano §3 → regex do `gtm-container-adai.json` → dimensão `curso` no GA4 → marcar como evento-chave. Nenhum dado pessoal: a entrega não tem formulário.

## 10. Segurança e LGPD

- Sem dado pessoal, formulário, login ou origem nova na CSP (vídeo só YouTube, já liberado).
- Links de inscrição externos com `rel="noopener noreferrer"`; URL validada pelo normalize (`sanitizeHref` do projeto: sem `javascript:`).
- `video_apresentacao`: aceita só `youtube.com`/`youtu.be`; vira embed youtube-nocookie.
- Uploads continuam no fluxo atual do Strapi (alt obrigatório).
- Permissão pública nova só de leitura (`curso.find`/`findOne`).

## 11. Acessibilidade

WCAG 2.2 AA. Card com um único link e nome acessível igual ao nome do curso; chips como lista com rótulo visível; trilha com `aria-current`; aviso de nova aba no texto (visível e `sr-only`); player só no clique, em `<dialog>` com foco preso e retorno ao botão; alvo de toque ≥ 44 px; foco visível; `prefers-reduced-motion`. Layout mobile proposto (o Figma só tem desktop), validado no protótipo em 375/768/1024/1440.

## 12. Testes (TDD)

| Tipo | O que |
| --- | --- |
| Funcionalidade | `normalize` do curso e do catálogo (campos vazios, sem capa, capa sem alt, vídeo fora do YouTube, URL `javascript:`, chips vazios, ordem e desempate); `CardCurso`, `Chips`, `Trilha`, `CursoCabecalho` (variantes e estados); `caminhoDaPagina` com `eba-`; `lib/strapi/queries/cursos.ts` (filtros, publicados, erro); sitemap com cursos; regra de clique `inscrever_curso` |
| Característica | Os existentes cobrem: 5 pilares, a11y/SEO de toda variante, CSS, segurança, testes obrigatórios |
| Integração | As 3 rotas (200 com conteúdo, 404 sem), `/eba-cursos` → 308, preview de curso, JSON-LD presente |
| Smoke | `/eba`, `/eba/cursos`, `/eba/cursos/reset` com 200, um `h1`, canonical; curso inexistente 404 |
| Navegador | 375/768/1440 sem rolagem lateral; teclado; `window.dataLayer` com `clique_cta`, `ver_secao` e `inscrever_curso` |

Fechamento: `yarn quality`, `yarn build` (Next e Strapi), `yarn smoke` com os servidores rodando (iniciados pelo usuário), 5 pilares e checklist de `Pull-Request.md`.

## 13. Rollout e rollback

| Etapa | O quê | Volta |
| --- | --- | --- |
| 1 | PR no Hub (código + Strapi + seed) → homologação | Reverter o PR; nada no site atual muda |
| 2 | Conteúdo no Strapi de produção (painel ou snapshot autorizado) | Despublicar |
| 3 | Lançamento do Hub com o link "EBA" | Remover o link no Strapi |
| 4 | `REDIRECIONAR_PARA_HUB=true` no site atual | Desligar a variável (redeploy na Vercel) |

Sem feature flag no Hub: até o lançamento, as rotas só existem em homologação.

## 14. Riscos

| Risco | Mitigação |
| --- | --- |
| Precedência de rota `eba/` × `[slug]` no Next 16 | Teste de integração das 3 rotas + leitura da doc instalada antes de codar |
| Cabeçalho com 6 links quebra em 1024 px | Ajuste fluido retrocompatível (§4.4) conferido na vitrine |
| Editor muda o slug de um curso publicado | Guia do editor avisa; redirecionamento pedido ao dev |
| Conteúdo desatualizado/contraditório no site atual | Só os textos revisados entram; lista de pendências para a EBA |
| Fotos do site atual pesadas (até 5 MB) | Reduzidas para webp no seed; `next/image` com `sizes` |
| Strapi de produção/Postgres ainda indefinidos | Mesma pendência do Hub; entrega não depende disso para homologação |

## 15. Critérios de aceite

1. `/eba`, `/eba/cursos` e as páginas dos 4 cursos renderizam no servidor com o conteúdo do Strapi, em 375/768/1440, sem rolagem lateral e sem erro no console.
2. Um curso novo publicado no Strapi aparece no catálogo, na home da EBA e no sitemap sem mudança de código; despublicado, some e responde 404.
3. Cada página tem um `h1`, metadata e canonical corretos, e o JSON-LD previsto.
4. `/eba-cursos` redireciona com 308 para `/eba/cursos`.
5. O cabeçalho mostra "EBA" (6º link) sem quebrar em 1024 px; o rodapé mostra "Escola Bíblica (EBA)".
6. Clique em curso gera `clique_cta`; clique em inscrição gera `clique_cta` + `inscrever_curso` com o slug.
7. Vitrine `/componentes` com Catálogo de cursos, Card de curso, Chips, Trilha e Cabeçalho do curso; docs em `docs/componentes/`.
8. `yarn quality`, builds e `yarn smoke` verdes nesta sessão de trabalho; 5 pilares conferidos.
9. Redirecionamentos do site atual prontos em PR no `eba-adai`, desligados por `REDIRECIONAR_PARA_HUB`.
