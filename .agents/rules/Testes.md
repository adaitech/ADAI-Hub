---
description: Testes obrigatórios — tipos (funcionalidade, característica, integração, smoke), onde ficam, padrões e o que cada mudança exige antes do Pull Request
alwaysApply: true
---

# Testes — ADAI Hub

> **Regra de ouro: nenhum Pull Request sem teste.** Todo código novo ou alterado chega ao PR com teste unitário escrito **e passando** (`yarn quality`). Vale para dev e para agente de IA, sem exceção. O próprio `yarn test` falha se um componente, módulo de `lib/` ou rota não tiver teste (`testes-obrigatorios.test.ts`) ou se a cobertura cair abaixo do piso (`jest.config.mjs`).

Checklist de envio: [`Pull-Request.md`](./Pull-Request.md).

> **Como escrever:** TDD do superpowers (`test-driven-development`) — teste primeiro, ver falhar (RED), código mínimo, ver passar (GREEN), refatorar. Bug: `systematic-debugging` e teste que reproduz antes da correção. Método completo: [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

## 1. Os quatro tipos de teste

| Tipo | Pergunta que responde | Onde fica | Exemplo |
| --- | --- | --- | --- |
| **Funcionalidade** (unitário) | Esta função/componente faz o que promete, inclusive com dado ruim do CMS? | Ao lado do código: `X.test.ts(x)` | `HeroSection.test.tsx`, `lib/strapi/links.test.ts` |
| **Característica** | O projeto inteiro continua seguindo as regras (5 pilares, a11y, SEO, CSS, segurança)? | `next/src/__tests__/caracteristicas/` | `cinco-pilares.test.ts`, `acessibilidade-e-seo.test.tsx` |
| **Integração** | As camadas funcionam juntas (página → Strapi → registry → seção → HTML; rotas da API)? | `next/src/__tests__/integracao/` | `paginas.test.tsx`, `rotas-api.test.ts` |
| **Smoke** (site no ar) | O site rodando, com o Strapi real, responde certo? | `next/scripts/smoke.mjs` (`yarn smoke`) | 200/404/307, h1, SEO, imagens, APIs protegidas |

Funcionalidade, característica e integração rodam no `yarn test` (Jest, sem rede). O smoke precisa do site e do Strapi rodando.

### 1.1 Funcionalidade (unitário)

- Um `*.test.ts(x)` **na mesma pasta** do arquivo testado.
- `normalize.ts`: casos de borda do CMS — campo vazio, lista vazia, imagem sem alt, link inválido (`javascript:`), texto longo.
- Componente: renderiza as variantes do `.mock.json` e confere o que o usuário percebe (papel, nome acessível, texto, `href`) com Testing Library (`getByRole`), não detalhes de implementação.
- Integração externa (`lib/youtube`, `lib/inchurch`): regras puras com **fixtures reais** em `__fixtures__/` (sem segredos), erros da API (401/403/429/timeout/JSON inválido), cache e stale-if-error.

### 1.2 Característica

Testes que varrem **todo** o projeto. Componente ou arquivo novo entra neles sozinho — não editar estes testes para "passar"; corrigir o código.

| Arquivo | Garante |
| --- | --- |
| `cinco-pilares.test.ts` | Schema do Strapi ↔ guia do editor (mesmos campos) ↔ dynamic zone ↔ `sectionRegistry` ↔ vitrine ↔ doc com "Medição" e "Testes" |
| `acessibilidade-e-seo.test.tsx` | Toda variante de todo componente: imagem com alt, link/botão com nome, nova aba com aviso e `noopener`, id único, ARIA válido, nada de `undefined`/`NaN` na tela. Páginas: um `h1`, sem salto de título, conteúdo no HTML do servidor |
| `css.test.ts` | Só `min-width` 769/1024; cor só por token; `var(--x)` existe; contêiner com scroll é posicionado (evita scroll lateral no celular) |
| `seguranca-e-privacidade.test.ts` | Nada de `NEXT_PUBLIC_` com segredo; `.env.example` sem segredo; chave de API fora da URL e dos logs; Client Component não importa código de servidor; `dangerouslySetInnerHTML` só no GTM; links dos MDs não quebrados |
| `cache-versionado.test.ts` | Formato guardado no `unstable_cache` × versão da chave (`VERSAO_CACHE_*`); player em youtube-nocookie.com |
| `testes-obrigatorios.test.ts` | Todo componente, módulo de `lib/`/`utils/` e rota do `app/` tem teste |

### 1.3 Integração

- Sem rede: o Strapi é simulado por `test-utils/strapi-fake.ts`, que responde com o **mesmo JSON** dos `.mock.json`.
- YouTube e inChurch entram por `jest.mock` das funções de cache com fixtures reais já normalizadas (as regras delas têm testes próprios).
- Server Components `async` (página, layout, seções que buscam dados): `renderizarServidor()` de `test-utils/servidor.tsx` renderiza como o Next faz no servidor e devolve o HTML no `document`.
- Rotas da API (`route.ts`): arquivo com `@jest-environment node`, chamando o handler com `new Request(...)`.
- Relógio: `fixarRelogio(iso)` fixa só o `Date` (eventos e série dependem do dia).

### 1.4 Smoke

```bash
# com Strapi e Next rodando (yarn dev, ou yarn build && yarn start)
cd next && yarn smoke                      # http://localhost:3000
cd next && yarn smoke https://homologacao…  # outro ambiente
```

Confere páginas do site (200, um `h1`, `lang="pt-BR"`, title, description, canonical, sem `noindex`, sem texto quebrado), imagens da Home carregando, 404, `/home` → `/`, APIs recusando sem segredo, páginas internas e vitrine com `noindex` (ou 404 quando desligada), `robots.txt` coerente com o ambiente e `sitemap.xml` válido — em produção, cada URL do sitemap respondendo 200.

## 2. O que cada mudança exige

| Mudança | Testes obrigatórios no mesmo PR |
| --- | --- |
| Componente novo (seção/layout/ui) | `X.test.tsx` (variantes + estados incompletos) + `normalize.test.ts` (se houver normalize). As características pegam vitrine, a11y, pilares e CSS sozinhas |
| Componente alterado | Teste novo ou ajustado cobrindo o comportamento novo; os antigos continuam passando |
| Campo novo no Strapi | Caso no `normalize.test` (campo vazio e preenchido) + mock + guia do editor (o `cinco-pilares` confere) |
| Função em `lib/` ou `utils/` | `X.test.ts` ao lado, com casos de borda |
| Integração externa nova | Testes do client (header com segredo, erros, timeout), das regras puras (fixtures reais) e do cache (stale-if-error); se o resultado normalizado vai para cache, entrar em `cache-versionado.test.ts` |
| Rota nova (`page.tsx`, `route.ts`) | Teste de integração em `__tests__/integracao/` que importa a rota |
| Evento novo de DataLayer | Catálogo + regra + teste (`docs/analytics/README.md` §5) |
| Bug corrigido | **Primeiro** um teste que reproduz o bug (falha), depois a correção (passa) |
| Só documentação/estilo de texto | `yarn quality` mesmo assim (links dos MDs são testados) |

## 3. Padrões

- **Nomes em português**, descrevendo o comportamento: `it('sem texto, sem destino ou destino inseguro → null (o link não aparece)')`.
- **Fixtures reais** (JSON copiado da API, sem tokens nem dados pessoais) em vez de objetos inventados.
- **Nunca rede de verdade** no Jest: `fetch` simulado. Segredos em teste são valores falsos (`'segredo-de-teste'`).
- **Ambiente:** restaurar `process.env` e relógio (`afterEach`/`afterAll`).
- **Não ajustar teste para passar.** Se um teste quebrou, decidir primeiro: o código regrediu (corrigir o código) ou a expectativa mudou de propósito (atualizar o teste e explicar no PR).
- **Não baixar o piso de cobertura** (`coverageThreshold` em `jest.config.mjs`) para o PR passar. Só sobe.
- Teste lento ou instável é defeito: corrigir (relógio fixo, sem `sleep`), não pular. `it.skip`/`it.only` não entram no PR.

## 4. Comandos

```bash
cd next
yarn test                         # tudo (Jest)
yarn test src/lib/strapi          # uma pasta ou arquivo
yarn test --watch                 # durante o desenvolvimento
yarn quality                      # lint + typecheck + testes com cobertura (gate do PR)
yarn smoke                        # site no ar (Strapi + Next rodando)
```

## 5. Limites (o que estes testes não substituem)

- Contraste, foco visível, ordem real de tabulação, leitor de tela e celular real → validação no navegador (skill `playwright-mcp-a11y`) e humana (`Definition-of-Done.md` §6).
- Performance → Lighthouse (skill `lighthouse-performance-mcp`).
- Layout fiel ao Figma → conferência visual na vitrine em 375 / 768 / 1440.
