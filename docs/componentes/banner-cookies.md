# Aviso de cookies — `BannerCookies`

> **Status:** `IMPLEMENTADO` · validação humana e jurídica pendentes
> **Figma:** não existe — proposta 🟡 com os tokens do site
> **Vitrine:** `/componentes/banner-cookies`
> **Código:** `next/src/components/layout/BannerCookies/`

## 1. O que é

Aviso próprio e simples de cookies (LGPD). A pessoa escolhe **Aceitar** ou **Recusar** os cookies de análise (Google Analytics). Sem aceite, o GA4 não grava cookies (Consent Mode v2 — ver `docs/analytics/README.md`).

**Onde aparece:** todas as páginas do site (`app/(site)/layout.tsx`), fixo no canto inferior. Não aparece na vitrine real (lá, só a demonstração).

## 2. Por que não está no Strapi

Texto legal e regra de consentimento são responsabilidade de dev (mudar o texto pode exigir pedir o consentimento de novo). Pilares: **Dados no CMS** — não se aplica; **Página** — layout do site; **Componente** — vitrine; **SEO** — não indexável (aviso fora do `<main>`); **Medição** — evento `consentimento_cookies`.

## 3. Comportamento

| Situação | Resultado |
| --- | --- |
| Primeira visita (sem escolha) | Aviso aparece; analytics **negado** |
| Primeira visita, antes de escolher | **Nenhuma** requisição ao Google: o GTM não é carregado |
| Aceitar | Salva `{ analytics: true, versao, data }` em `localStorage` (`adai-consentimento-cookies`), envia `consent update` (analytics granted), **carrega o GTM** e registra `consentimento_cookies: aceito` |
| Recusar | Salva `analytics: false`; o GTM não carrega (nada vai ao Google) |
| Visita seguinte | Aviso não aparece; com aceite salvo (mesma versão do aviso) o GTM carrega direto; com recusa, não carrega |
| "Preferências de cookies" (botão na Política de Privacidade: link `#preferencias-cookies` no Markdown) | Reabre o aviso e leva o foco até ele |
| Texto do aviso mudou | Subir `VERSAO_CONSENTIMENTO` (`lib/analytics/consentimento.ts`) → todos veem o aviso de novo |
| `localStorage` bloqueado | A escolha vale só na página atual |

Anúncios (`ad_storage`, `ad_user_data`, `ad_personalization`) ficam sempre negados: o site não usa publicidade.

## 4. Acessibilidade

- Região (`<section>`) com título "Sua privacidade" — **não é modal**: não bloqueia a página nem prende o foco.
- Botões nativos com nome visível; anel de foco claro sobre o fundo escuro; alvo ≥ 44 px.
- Não rouba o foco na primeira visita; só ao reabrir pelo rodapé (ação do usuário).

## 5. Layout (🟡 proposta)

Fundo `--color-bg-inverse`, texto branco, raio `--radius-lg`, botões pílula (`buttonClassName`, superfície escura). Mobile: largura toda com margem `--space-gutter`. Tablet/desktop: canto inferior direito, até `--banner-cookies-max` (40rem). Camada `--z-banner-cookies`.

## 6. Pendências

- Página de **Política de Privacidade** e link no aviso.
- Revisão do texto pelo jurídico/liderança.
- Aprovação visual do design.

## Medição (DataLayer)

Evento próprio `consentimento_cookies` com `escolha: 'aceito' | 'recusado'`, disparado pelo `BannerCookies` ao aceitar ou recusar (no aviso ou ao rever em "Preferências de cookies"). Só chega ao GA4 depois do aceite. Plano: `docs/analytics/README.md`.

## Testes

Na pasta `next/` (`yarn test` ou `yarn test <caminho>`):

- `next/src/components/layout/BannerCookies/BannerCookies.test.tsx`
- `next/src/lib/analytics/consentimento.test.ts`
- `next/src/lib/analytics/gtm.test.ts`

Também cobrem este componente, sem precisar editar nada:

- `src/lib/showcase/catalog.test.tsx` — todas as variantes e controles da vitrine renderizam; guia do editor × mock.
- `src/__tests__/caracteristicas/` — 5 pilares (Strapi ↔ registry ↔ vitrine ↔ doc), acessibilidade/SEO de cada variante, CSS, segurança.
- `src/__tests__/integracao/paginas.test.tsx` — página montada do Strapi (quando a seção está na Home).

**Regra:** alterou o componente → atualize ou crie o teste no mesmo PR, antes de abrir (`.agents/rules/Testes.md` e `.agents/rules/Pull-Request.md`).
