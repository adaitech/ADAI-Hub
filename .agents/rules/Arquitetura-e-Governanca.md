---
description: Contrato arquitetural do front — camadas Strapi/Next/React, renderização, fetch, a11y, pastas e SEO
alwaysApply: true
---

# Arquitetura e Governança Frontend — ADAI Hub

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`yarn quality`). Tipos e exigências: [`Testes.md`](./Testes.md) · checklist antes de subir e de abrir o PR: [`Pull-Request.md`](./Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

**Stack oficial:** Next.js 16 (App Router) + React 19 + TypeScript + CSS Modules + Strapi 5
**Adaptado de:** Guia de Governança Frontend do vitru-portal (mesmos princípios, sem multi-marca e sem BFF).

Este documento **não é sugestão — é contrato**. Código fora destes limites deve ser corrigido antes do merge.

---

## 1. Princípios fundamentais (não negociáveis)

### 1.1 React não é framework de arquitetura

React é biblioteca de UI: composição visual e estado local. React **não** busca dados, **não** integra com APIs e **não** contém regra de negócio.

### 1.2 Next.js é o framework de arquitetura

Next define renderização, roteamento, cache, SEO e performance. É proibido:

- Criar SPA pura ou `useEffect` + `fetch` para conteúdo.
- Ignorar SSR/SSG em página com SEO.
- Forçar Client Component por conveniência.
- Usar `dynamic(..., { ssr: false })` em seção de conteúdo (herança do template — remover).

### 1.3 Acessibilidade é requisito de fundação

Meta mínima: **WCAG 2.2 AA**, desde o primeiro componente. Regressão de a11y bloqueia merge.

---

## 2. Fronteiras de responsabilidade

| Camada | Responsabilidade | Proibido |
| --- | --- | --- |
| **Strapi** | Conteúdo, estrutura editorial, SEO por página, mídia | Estilo livre (cor, fonte, HTML), lógica |
| **Next (`src/app`, `src/lib`)** | Rotas, fetch no servidor, cache/revalidação, metadata, integrações | Markup de UI complexo dentro de `page.tsx` |
| **Componentes (`src/components`)** | Renderizar props, estado local de interação | Fetch, acesso a `process.env` de servidor, regra de negócio |
| **Integrações futuras** (YouTube, Connect, agenda externa) | Módulo server-side em `src/lib/<integracao>/` | Chamada direta do componente |

---

## 3. Renderização

Estratégias oficiais, em ordem de preferência:

1. **Server Components** (padrão).
2. **Static Rendering + revalidação** (ISR): conteúdo do Strapi com `revalidate` por tag; o Strapi dispara webhook → `src/app/api/revalidate/route.ts` → `revalidateTag`.
3. **Dynamic SSR** só quando a página depender de dados por requisição (ex.: preview/draft mode).

**Client Components são exceção** e precisam de justificativa (interação real). Quando necessário, isolar a menor parte possível:

```tsx
// ✅ Seção server; só o controle do carrossel é client
export function EventosSection({ data }: SectionProps<EventosData>) {
  const view = normalizeEventos(data);
  return (
    <section aria-labelledby="eventos-titulo">
      <h2 id="eventos-titulo">{view.titulo}</h2>
      <EventosCarousel eventos={view.eventos} /> {/* 'use client' só aqui */}
    </section>
  );
}
```

```tsx
// ❌ Seção inteira client + fetch no browser
'use client';
export function EventosSection() {
  const [data, setData] = useState();
  useEffect(() => { fetch('/api/eventos').then(r => r.json()).then(setData); }, []);
}
```

---

## 4. Data fetching

- Fetch **somente no servidor**, **somente** via `src/lib/strapi/`.
- Toda chamada define cache explícito: `next: { revalidate, tags: ['page:<slug>'] }`.
- Draft mode (preview do Strapi) troca para `status=draft` e `cache: 'no-store'`.
- Resposta do Strapi é tipada em `src/lib/strapi/types.ts`; nada de `any`.
- Falha do CMS: página conhecida sem conteúdo → `notFound()`; erro de rede → `error.tsx` do segmento (não engolir o erro silenciosamente).

### 4.1 Integrações externas (ex.: YouTube em `src/lib/youtube/`)

Mesmo desenho do `lib/strapi/`, com uma diferença: dado externo **complementa** a página e nunca pode derrubá-la.

| Peça | Regra |
| --- | --- |
| `client.ts` | Único ponto que fala com o serviço. Segredo só no servidor (sem `NEXT_PUBLIC_`), de preferência em **header**, nunca na URL. Timeout. Erro tipado com endpoint/status/motivo — nunca URL completa, headers ou chave |
| `types.ts` | Tipos crus da API externa (só os campos usados) |
| Funções puras | Parsing, datas, normalização e regras de negócio sem rede nem React → testáveis com fixtures reais (`__fixtures__/`, sem segredos) |
| Orquestração com cache | `unstable_cache` (não usamos `cacheComponents`) guardando o resultado **normalizado**, tag própria (não misturar com `strapi`), TTL explícito. A função cacheada **lança** em falha (erro não entra no cache; o Next devolve a entrada anterior = stale-if-error) + último resultado válido em memória. A função pública **nunca lança**: devolve `null` e a seção some |
| Seção | Server Component `async` que lê a config do Strapi, chama a orquestração e passa o view model para um componente só de apresentação. Client Component só para a interação (ex.: player) |
| Logs | `console.warn/info('[servico] …')` só no servidor e só em cache miss/erro; nunca segredos |

Referência completa: `docs/componentes/serie-atual.md`.

---

## 5. Estrutura de pastas — contrato fixo (`next/`)

```
next/
├─ public/                      # estáticos (favicons, og default)
└─ src/
   ├─ app/
   │  ├─ layout.tsx             # html lang="pt-BR", fontes, globals.css (sem visual do site)
   │  ├─ (site)/                # grupo do site público
   │  │  ├─ layout.tsx          # skip link, aviso de rascunho, Header/Footer (global do Strapi), <main>
   │  │  ├─ page.tsx            # Home → page slug "home"
   │  │  ├─ [slug]/page.tsx     # páginas montadas no Strapi (slug inexistente → 404 com título próprio e noindex)
   │  │  └─ not-found.tsx       # 404 dentro do layout do site (cabeçalho/rodapé; sem <main> próprio)
   │  ├─ componentes/           # vitrine (ver Vitrine-de-Componentes.md)
   │  ├─ api/
   │  │  ├─ preview/route.ts    # draft mode
   │  │  └─ revalidate/route.ts # webhook do Strapi
   │  ├─ sitemap.ts             # /sitemap.xml (páginas publicadas no Strapi) — §9
   │  ├─ robots.ts              # /robots.txt (só produção libera o Google) — §9
   │  ├─ not-found.tsx
   │  └─ error.tsx
   ├─ components/
   │  ├─ ui/                    # átomos: Button, Heading, Card, Container… (sem Strapi)
   │  ├─ analytics/             # GoogleTagManager, RastreadorAnalytics (único client de medição)
   │  ├─ layout/                # Header, Footer, SkipLink, BannerCookies
   │  ├─ sections/              # seções do CMS (ver Componentes-e-CMS.md)
   │  └─ icons/                 # SVGs do Figma como componentes
   ├─ lib/
   │  ├─ strapi/                # client, queries, tipos crus, helpers de imagem
   │  ├─ youtube/               # integração YouTube Data API (client, regras, cache) — ver §4.1
   │  ├─ inchurch/              # integração inChurch Public API (eventos) — fonte prioritária, ver §4.1
   │  ├─ analytics/             # DataLayer: catálogo de eventos, regras de clique, GTM, consentimento (docs/analytics)
   │  ├─ registry/              # sectionRegistry.ts
   │  ├─ seo/                   # regras puras de robots.txt e sitemap (ambiente indexável, URLs) — §9
   │  └─ showcase/              # catálogo da vitrine
   ├─ hooks/                    # hooks reutilizáveis (client)
   ├─ types/                    # tipos globais (SectionProps etc.)
   ├─ utils/                    # funções puras
   ├─ styles/                   # tokens.css, globals.css
   ├─ __tests__/                # testes que cruzam camadas (ver Testes.md)
   │  ├─ caracteristicas/       # 5 pilares, a11y/SEO, CSS, segurança, cache, testes obrigatórios
   │  └─ integracao/            # página → Strapi → registry → seções; rotas da API; vitrine
   └─ test-utils/               # renderizarServidor, strapi-fake, auditoria (só testes)
```

❌ É proibido criar:

- services/fetch dentro de `components/`;
- lógica de transformação dentro de `page.tsx` (vai para `normalize.ts` ou `lib/`);
- componente de seção fora de `components/sections/`.

---

## 6. Componentização

- Componentes são **"burros" por padrão**: recebem props, renderizam.
- Seções do CMS seguem o padrão completo de `Componentes-e-CMS.md`.
- Estado permitido: `useState`, `useReducer`, Context com parcimônia. Proibido: Redux/Zustand sem justificativa, estado global para dados de CMS, duplicar estado do servidor.

```tsx
// ❌ Antipadrão grave
export function Button() {
  const data = await fetchSomething();
  if (window.location.search.includes('utm')) { /* ... */ }
}
```

---

## 7. Acessibilidade (A11y) — base do projeto

Regras de ouro:

1. HTML semântico primeiro; ARIA é complemento.
2. Tudo interativo acessível por teclado.
3. Estados (erro, carregando, sucesso) anunciados para leitores de tela.
4. Navegação previsível com landmarks e skip link.
5. Formulários com label, instrução e erro acessíveis.

### 7.1 Landmarks e skip link (obrigatório no layout)

```tsx
<a href="#conteudo" className={styles.skipLink}>Pular para o conteúdo principal</a>
<Header />
<main id="conteudo" tabIndex={-1}>{children}</main>
<Footer />
```

Proibido: layout sem `<main>`, múltiplos `<main>`, navegação com `<div>` clicável.

### 7.2 Teclado e foco

- Tudo clicável alcançável por Tab; nunca `tabIndex > 0`.
- Não remover `outline` sem substituto equivalente (`:focus-visible` com token).
- `<button type="button">` para ação; `<a href>` para navegação.

### 7.3 Imagens e ícones

- Imagem informativa: `alt` descritivo **vindo do Strapi** (campo `alternativeText` obrigatório no editorial).
- Decorativa: `alt=""`.
- Botão só com ícone: `aria-label`. Ex.: setas do carrossel de eventos → `aria-label="Próximos eventos"`.

### 7.4 Cor, contraste e movimento

- Cor nunca é o único sinal. Texto sobre foto usa o degradê do token para garantir contraste.
- Respeitar `prefers-reduced-motion` em qualquer transição/animação.

### 7.5 Anti-padrões proibidos

❌ Div simulando botão/link · ❌ Placeholder como label · ❌ Erro só por cor · ❌ Modal sem foco/Esc/retorno de foco · ❌ Ícone clicável sem `aria-label` · ❌ `tabIndex > 0`

### 7.6 Testes de a11y

No `yarn test`: `src/__tests__/caracteristicas/acessibilidade-e-seo.test.tsx` audita **toda variante de todo componente** e as páginas montadas (alt, nome de link/botão, nova aba, ids, ARIA, um `h1`, hierarquia de títulos). No navegador: Lighthouse (a11y ≥ 95), axe (skill `playwright-mcp-a11y`), teste manual de teclado e smoke com leitor de tela (NVDA/VoiceOver). Detalhes: `Testes.md`.

---

## 8. Performance e Core Web Vitals

Obrigatório:

- `next/image` para toda imagem (com `sizes` correto; hero com `loading="eager"` + `fetchPriority="high"`; `priority` está deprecado no Next 16).
- `next/font` para fontes (ver `Stack-Fontes-e-Bibliotecas.md`).
- Lazy loading consciente; nada de bibliotecas de efeito pesado.
- Evitar hydration desnecessária (Client Components pequenos).
- Metas (mobile): Lighthouse Performance ≥ 80, LCP < 2,5 s, CLS < 0,1, INP < 200 ms.

---

## 9. SEO técnico

- `generateMetadata` em toda rota, a partir do componente `seo` da página no Strapi (title, description, og image, canonical).
- `NEXT_PUBLIC_SITE_URL` resolve URLs absolutas.
- **`/robots.txt`** (`src/app/robots.ts` + `src/lib/seo/robots.ts`): só com `SITE_INDEXAVEL=true` **e** `NEXT_PUBLIC_SITE_URL` válida o site é liberado — bloqueando `/api/`, `/componentes` e `/exemplos` — e o sitemap é divulgado. Qualquer outro ambiente: `Disallow: /`. Na dúvida, fora do Google.
- **`/sitemap.xml`** (`src/app/sitemap.ts` + `src/lib/seo/sitemap.ts` + `src/lib/strapi/queries/paginas.ts`): páginas **publicadas** no Strapi (Home = `/`, prioridade 1; demais `/<slug>`, 0,8; `lastModified` = atualização no Strapi). Ficam de fora `exemplos`, páginas com `noindex` no "Meta robots" e páginas com canonical para outra URL. Segue o cache do Strapi (60 s + webhook). Página nova publicada entra sozinha; rota nova que **não** vem do Strapi (ex.: futura página de evento) precisa ser somada em `app/sitemap.ts` com teste.
- **"Meta robots"** do SEO da página no Strapi vira `<meta name="robots">` (o mesmo critério do sitemap). O SEO padrão do site (global) nunca aplica `noindex`.
- Slugs vêm do Strapi; nunca hardcoded.
- Dados estruturados (JSON-LD: `Church`, `Event`) gerados a partir do conteúdo do Strapi quando a página tiver esse conteúdo.

---

## 10. Regras absolutas para IA

A IA ❌ **não** decide arquitetura sozinha, ❌ não cria "soluções criativas" fora do padrão, ❌ não ignora SSR, ❌ não mistura camadas.

A IA ✅ segue este documento, ✅ pergunta quando houver dúvida, ✅ implementa incrementalmente.

---

## 11. Checklist de conformidade

- [ ] Server Component por padrão; `'use client'` justificado
- [ ] Fetch só em `src/lib/strapi/`, no servidor, com cache explícito
- [ ] Sem lógica de negócio/transformação em UI ou `page.tsx`
- [ ] Tipagem completa (sem `any`)
- [ ] Landmarks, skip link, teclado e `alt` corretos
- [ ] `generateMetadata` a partir do Strapi
- [ ] CSS mobile-first com tokens
