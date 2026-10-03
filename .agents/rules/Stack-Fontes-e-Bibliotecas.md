---
description: Fontes e bibliotecas oficiais — qual usar, como usar e por quê; o que é proibido e como propor uma nova
alwaysApply: true
---

# Stack, Fontes e Bibliotecas — ADAI Hub

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`yarn quality`). Tipos e exigências: [`Testes.md`](./Testes.md) · checklist antes de subir e de abrir o PR: [`Pull-Request.md`](./Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

Formato de cada item: **Qual** → **Como** → **Por quê**. Se algo não está aqui, **não use sem aprovação** (ver §5).

---

## 1. Plataforma

| Qual | Versão | Como | Por quê |
| --- | --- | --- | --- |
| **Node.js** | 22 LTS | `.nvmrc` na raiz | Suportado por Next 16 e Strapi 5 (Strapi aceita até Node 22) |
| **Yarn** | 1.x (classic) | `yarn` em `next/` e `strapi/` | Já usado pelo repositório; um lockfile por app |
| **Next.js** | 16.x | App Router, `src/` | Framework de arquitetura: SSR/SSG, cache, SEO, imagens e fontes otimizadas |
| **React** | 19.x | Server Components por padrão | UI; Server Components reduzem JS no cliente |
| **TypeScript** | 5.x | `strict: true` | Contrato entre Strapi (JSON) e componentes |
| **Strapi** | 5.x | `strapi/` | CMS: autonomia para ministérios e Criativo |

> **Next 16 tem mudanças incompatíveis com versões anteriores** (APIs assíncronas como `params`, `cookies()`, `draftMode()`; convenções de cache). Antes de escrever código de rota/cache, consultar a documentação da versão instalada em `next/node_modules/next/dist/docs/` — não confiar em exemplos do Next 13/14.

---

## 2. Fontes

O Figma usa **Inter** e **Suisse Int'l**. A Suisse Int'l é paga e **não há licença**, então foi substituída por **Inter Tight** (Google Fonts, gratuita), a variante compacta da própria Inter — mantém a família coesa e aguenta o tracking bem negativo dos títulos gigantes.

| Papel | Fonte | Pesos | Onde aparece no Figma | Token CSS |
| --- | --- | --- | --- | --- |
| **Texto / UI** | Inter | 300 (Light), 400 (Regular), 700 (Bold) | Menu, botões, parágrafos, footer | `--font-body` |
| **Display / títulos** | Inter Tight | 400 (substitui Suisse Book), 700 (substitui Suisse Bold) | "Amar. Servir. Influenciar.", títulos de seção, "ADAI" do footer, texto de apoio do hero | `--font-display` |

### Como

```ts
// src/app/fonts.ts
import { Inter, Inter_Tight } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  display: 'swap',
  variable: '--font-body',
});

export const interTight = Inter_Tight({
  subsets: ['latin'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-display',
});
```

```tsx
// src/app/layout.tsx
<html lang="pt-BR" className={`${inter.variable} ${interTight.variable}`}>
```

```css
/* nos módulos CSS, sempre via token */
.titulo { font-family: var(--font-display); font-weight: var(--font-weight-bold); }
```

### Por quê

- `next/font` **auto-hospeda** os arquivos no build: nenhuma requisição ao Google em runtime (privacidade + performance), sem layout shift (CLS).
- Só os pesos usados no Figma → menos bytes.

### Proibido

- `<link>` para Google Fonts, `@import url(...)` de fontes, fontes em `public/` sem `next/font/local`.
- Pesos fora da tabela sem atualizar este documento e os tokens.
- Voltar à Suisse Int'l sem licença web comprovada. **Se a licença vier:** trocar `Inter_Tight` por `next/font/local` com os `.woff2` e manter o mesmo `--font-display` — nenhum componente muda.

---

## 3. Bibliotecas do front (`next/`)

### 3.1 Em uso

| Qual | Como | Por quê |
| --- | --- | --- |
| `next`, `react`, `react-dom` | — | Base |
| `qs` | Só em `src/lib/strapi/` para montar `filters`/`populate` | Formato de query exigido pela API REST do Strapi |
| `clsx` | Compor classes de CSS Modules condicionais | Pequena, legível; evita concatenação manual |
| `sharp` | Dependência de produção | Otimização de imagens do `next/image` em produção |
| `react-markdown` + `remark-gfm` | Só em `TextoRicoSection` (`sections.texto-rico`), no servidor, com `skipHtml` e links por `sanitizeHref` | O campo `richtext` do Strapi é Markdown; documentos longos (Política de Privacidade) precisam de títulos, listas e **tabelas** (GFM). Renderiza sem `dangerouslySetInnerHTML` e não vai para o bundle do cliente (Server Component). São só ESM: o Jest os transforma via `transformIgnorePatterns` em `jest.config.mjs` |

### 3.2 Qualidade e testes (devDependencies)

| Qual | Como | Por quê |
| --- | --- | --- |
| `typescript` | `yarn typecheck` (`tsc --noEmit`) | Pega contrato quebrado entre CMS e UI |
| `eslint` 9 + `eslint-config-next` | `yarn lint` (flat config) | Regras do Next/React/a11y |
| `jest` + `@testing-library/react` + `@testing-library/jest-dom` + `jest-environment-jsdom` | `yarn test` / `yarn test:ci`; config `jest.config.mjs` com `next/jest` (SWC, mocks de CSS Modules e `next/font`) | Mesmo stack do vitru-portal (skills reaproveitadas) |
| Utilitários próprios de teste (sem lib nova) | `src/test-utils/`: `renderizarServidor` (Server Components `async` via `react-dom/static`), `strapi-fake`, `auditoria`; `scripts/smoke.mjs` (`yarn smoke`, `fetch` nativo do Node) | Testar página inteira, a11y estrutural e o site no ar sem adicionar dependência — ver `Testes.md` |
| `@playwright/test` + `@axe-core/playwright` | Quando os E2E forem criados (hoje a11y é validada pela skill `playwright-mcp-a11y`) | Validação real no browser |
| `lighthouse` | via `npx` na skill `lighthouse-performance-mcp` (não instalado) | Performance mobile |

### 3.3 Decididas para quando precisar (não instalar antes)

| Qual | Gatilho | Por quê |
| --- | --- | --- |
| `react-hook-form` + `zod` + `@hookform/resolvers` | Primeiro formulário (ex.: "Planeje sua visita") | Validação acessível e tipada; padrão do vitru |
| `@strapi/blocks-react-renderer` | Primeiro campo de rich text **Blocks** (o Markdown já usa `react-markdown`, §3.1). Criar `<RichText>` em `src/components/ui/RichText/` com mapa de elementos permitidos | Renderiza o rich text do Strapi 5 sem `dangerouslySetInnerHTML` |
| `date-fns` + locale `ptBR` | Primeira data exibida (Agenda/Próximos eventos), em `src/utils/datas.ts` | Datas em pt-BR corretas; tree-shakeable |

### 3.4 Soluções sem biblioteca (padrão)

| Necessidade | Solução | Por quê |
| --- | --- | --- |
| **Ícones** | SVG exportado do Figma → componente em `src/components/icons/` com `aria-hidden` por padrão | Poucos ícones no design; zero dependência |
| **Carrossel** (Próximos eventos) | CSS `scroll-snap` + Client Component pequeno para as setas | Acessível, leve, sem lib |
| **Accordion** (FAQ) | `<details>` / `<summary>` nativos | Teclado e leitor de tela de graça, zero JS |
| **Animações** | CSS (`transition`, `@keyframes`) com `prefers-reduced-motion` | Visão: tecnologia a serviço do conteúdo |
| **Menu mobile** | Client Component com `<button aria-expanded>` + `<dialog>` ou `<nav>` | Controle total de foco/Esc |
| **Classes utilitárias** | CSS Modules + tokens | Estilo escopado, tokens centralizados |
| **YouTube** (Série atual) | YouTube Data API v3 via `fetch` em `src/lib/youtube/client.ts` (`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_HANDLE`, só servidor) | Sem SDK do Google: 4 endpoints GET; nunca scraping |
| **Player de vídeo** | `<dialog>` nativo + `<iframe>` do YouTube criado só no clique | Sem lib de modal/player; nada carrega antes da interação |
| **Cache de dados externos** | `unstable_cache` do Next (resultado normalizado) | Sem Redis/infra nova |
| **Analytics** (GTM/GA4) | Snippet oficial do GTM via `next/script` + `window.dataLayer` (`src/lib/analytics/`) | Sem `@next/third-parties` nem SDK: o GA4 é configurado no GTM; ver `docs/analytics/README.md` |
| **Aviso de cookies** | Componente próprio `BannerCookies` + Consent Mode v2 | Sem CMP paga; simples e acessível |

### 3.5 Removidas do template (não reinstalar)

| Pacote(s) | Motivo |
| --- | --- |
| `tailwindcss`, `tailwind-merge`, `tailwindcss-animate`, `@tailwindcss/typography`, `class-variance-authority`, `mini-svg-data-uri` | Stack de estilo oficial é CSS Modules + tokens |
| `framer-motion` | Animação via CSS; peso alto de JS |
| `three`, `three-globe`, `@react-three/fiber`, `@react-three/drei`, `@types/three` | Demos do template (globo 3D) sem propósito no site |
| `@tsparticles/*` | Efeito decorativo sem propósito |
| `react-fast-marquee`, `next-view-transitions`, `react-wrap-balancer` | Efeitos do template; CSS resolve (`text-wrap: balance`) |
| `@headlessui/react` | Substituído por HTML nativo acessível |
| `@tabler/icons-react`, `react-icons` | Ícones via SVG do Figma |
| `negotiator`, `@formatjs/intl-localematcher`, `@types/negotiator` | Site só pt-BR, sem i18n |
| `fuzzy-search`, `@types/fuzzy-search`, `@mapbox/rehype-prism`, `@emotion/is-prop-valid` | Funcionalidades demo removidas |

---

### 3.6 Fontes de dados externas — prioridade

**Regra:** dado que existe na **inChurch** (plataforma de gestão da ADAI) vem da **inChurch Public API**. Só use outra fonte quando a inChurch não tiver o dado (ex.: mensagens/vídeos → YouTube, ver `docs/componentes/serie-atual.md`). Nunca duplicar no Strapi o que a inChurch já tem; o Strapi fica com configuração editorial.

| Item | Valor |
| --- | --- |
| Documentação | `https://docs.inchurch.com.br` · para IA: `llms.txt` (índice), `llms-full.txt` (tudo em texto), `openapi.json` (contrato) — **ler antes de codar qualquer integração** |
| Base | `INCHURCH_API_BASE_PUBLIC` = `https://api.inchurch.com.br/public` (endpoints em `/v1/...`) |
| Autenticação | `Authorization: Basic base64(INCHURCH_API_KEY:INCHURCH_API_SECRET)` — só no servidor. O "PUBLIC" do nome é da *Public API*: **nunca** usar prefixo `NEXT_PUBLIC_` |
| Limite | 200 req/min por cliente (429 + `Retry-After`) → sempre com cache server-side (padrão de `Arquitetura-e-Governanca.md` §4.1) |
| Paginação | `limit` (máx. 100) / `offset`; resposta `{ count, next, previous, results }` |
| Permissões do cliente de API do site | Mínimo necessário e só leitura: `event:GET`, `event_categories:GET`, `cell:GET`, `cell_category:GET` (conforme as seções forem criadas). **Nunca** dar ao site acesso a `people`, `donation`, `financial_*` |
| Proibido | Login com e-mail/senha do painel admin (`inradar.com.br`, `INCHURCH_EMAIL`/`INCHURCH_PASSWORD`): API não oficial, pode mudar sem aviso e exige credencial pessoal. Scraping |

Mapa inicial (Figma → endpoint): Próximos eventos (1:173) → `GET /v1/event/` (`show_on_site`, `highlighted`, `public`, `start_after`, `image`, `public_url`, `external_subscription_url`);

**Regras de eventos no site** (validadas com a API real em 27/09/2026, decisão do time; implementadas em `next/src/lib/inchurch/eventos.ts`, seção `sections.proximos-eventos`):
- Mostrar só `active && enabled && show_on_site`, a partir de hoje (`start_after`).
- **Excluir GCs** (Grupos de Conexão, ~90% dos eventos): categoria "Grupo de Conexão" (id 8776, via `category_id`) **ou** nome começando com "GC". A categoria nem sempre é preenchida no painel, por isso o nome também conta.
- Ignorar `recurrence_model: true` (modelo da recorrência; as datas vêm como eventos próprios) e juntar mesmo nome + mesmo início (cópias antigas).
- Evento recorrente (mesmo nome, várias datas) aparece uma vez, com a próxima data.
- `event_url` pode ser exibido (ex.: Zoom aberto da Semana de Jejum & Oração). células/GCs → `GET /v1/cell/` (`lat`/`lng`/`distance`, `weekdays`, `categories`). Contribua → link para a página de doação da inChurch (o site não lê dados financeiros).

## 4. Bibliotecas do CMS (`strapi/`)

| Qual | Como | Por quê |
| --- | --- | --- |
| `@strapi/strapi` 5.x | Núcleo | CMS |
| `@strapi/plugin-users-permissions` | Tokens de API de leitura para o Next | Acesso controlado à API |
| `@strapi/plugin-seo` | Componente/validações de SEO por página | SEO editável pelo time |
| `better-sqlite3` | **Só desenvolvimento local** | Produção usará Postgres (decisão de infra pendente) |
| ~~`@strapi/plugin-cloud`, `patch-package`, `pluralize`, `uuid`~~ | Removidos na fundação | Herança do Launchpad sem uso |

---

## 5. Como propor uma nova biblioteca

Antes de `yarn add`, responder no PR (ou perguntar ao time):

1. **Propósito:** isso ajuda a Amar a Deus, Servir as Pessoas ou Influenciar o Mundo, ou é só efeito? (`Visao-do-Projeto.md`)
2. **Alternativa nativa:** HTML/CSS/Next já resolve? (ver §3.4)
3. **Custo:** peso no bundle do cliente (preferir o que roda só no servidor), manutenção, licença.
4. **Segurança:** pacote mantido, sem vulnerabilidade `high/critical` (`yarn audit`).
5. **Documentação:** adicionar a linha na tabela certa deste arquivo, no mesmo PR.

Sem essas respostas, a IA **não instala** dependência — pergunta.
