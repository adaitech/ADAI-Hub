# ADAI Hub — orientações para agentes e devs

> **Princípio central:** Amar a Deus. Servir as pessoas. Influenciar o mundo.
>
> Toda decisão passa pela pergunta: **"Isso nos ajuda a Amar a Deus, Servir as Pessoas e Influenciar o Mundo?"**
> Se a resposta for não, não faz parte do projeto — mesmo que seja moderno, bonito ou tecnicamente possível.
>
> Visão completa: [`.agents/rules/Visao-do-Projeto.md`](.agents/rules/Visao-do-Projeto.md)

## ⚠️ Método de trabalho: superpowers (sempre)

Todo trabalho segue o modelo e o método do **[superpowers](https://github.com/obra/superpowers)** — agente com o plugin usa as skills; quem não tem (ou é dev) segue as mesmas etapas. Detalhes, instalação por ferramenta e onde as regras do ADAI prevalecem: [`.agents/rules/Metodo-Superpowers.md`](.agents/rules/Metodo-Superpowers.md).

1. **Checar skills** antes de qualquer resposta e anunciar qual está usando (`using-superpowers`).
2. **Desenhar antes de codar** (`brainstorming`): classificar em spike/bounded/architectural; bounded → desenho curto aprovado no chat; architectural → spec em `docs/superpowers/specs/` aprovada.
3. **Planejar** (`writing-plans`) em `docs/superpowers/plans/` e **executar** (`subagent-driven-development` ou `executing-plans`).
4. **TDD** (`test-driven-development`): teste falhando primeiro, depois o código. Bug → `systematic-debugging`.
5. **Verificar com evidência** (`verification-before-completion`) → **revisar** (`requesting-code-review`) → **finalizar** (`finishing-a-development-branch`) seguindo `Pull-Request.md`.

Commit, push e PR **só com pedido explícito**; merge nunca sem o usuário — mesmo que uma skill sugira.

## ⚠️ Nenhum Pull Request sem teste (obrigatório)

Todo código novo ou alterado — componente, função de `lib/`, rota, integração, correção de bug — chega ao PR com **teste unitário escrito e passando**. Vale para dev e para agente de IA, sem exceção:

1. **Escrever o teste** junto com o código (o que cada mudança exige: [`.agents/rules/Testes.md`](.agents/rules/Testes.md) §2). Bug corrigido → primeiro o teste que reproduz o bug.
2. **Antes de cada `git push` e antes de abrir o PR**, rodar o checklist [`.agents/rules/Pull-Request.md`](.agents/rules/Pull-Request.md): `yarn quality` → `yarn build` (+ Strapi) → `yarn smoke` com os servidores rodando → navegador em 375/768/1440 → 5 pilares → sem segredo → docs.
3. O `yarn test` **falha sozinho** se um componente, módulo de `lib/` ou rota não tiver teste, se a cobertura cair abaixo do piso, ou se uma regra do projeto for quebrada (testes de característica em `next/src/__tests__/caracteristicas/`). Corrigir o código — nunca o teste para "passar".

## ⚠️ Regra dos 5 pilares — todo componente (obrigatório)

Nenhum componente está pronto enquanto os **cinco pilares** não estiverem verificados, com o Strapi e o Next rodando. Os três primeiros são o antigo "tripé"; SEO e Medição valem para **toda** criação ou alteração:

| # | Pilar | O que precisa existir | Como verificar |
| --- | --- | --- | --- |
| 1 | **Dados no CMS (Strapi)** | Schema do componente, guia do editor (`strapi/src/editor-guide/*.json`), componente liberado na dynamic zone e **conteúdo real cadastrado** (seed de dev em `strapi/src/bootstrap/seed.ts`). Componente sem dado editorial (ex.: aviso de cookies) registra no doc **por que** não está no Strapi | `cd strapi && yarn develop` → painel mostra os campos com descrição; API devolve o JSON |
| 2 | **Página (Next)** | Componente registrado no `sectionRegistry` e aparecendo numa página real montada no Strapi (ex.: Home) | `cd next && yarn dev` → abrir a página e ver a seção com o conteúdo do Strapi |
| 3 | **Componente (vitrine)** | `.showcase.tsx` (variações + `controles`) + `.mock.json` (JSON real da API) + guia do editor exibido em `/componentes/<slug>` | abrir `/componentes/<slug>`, conferir as abas de exemplo e os **controles** em 375 / 768 / 1440 |
| 4 | **SEO** | Conteúdo renderizado no servidor; um único `h1` por página e hierarquia de títulos correta; `alt` em imagem informativa (vazio em decorativa); links com texto que faz sentido sozinho; metadados da página (`seo` do Strapi) | `Arquitetura-e-Governanca.md` §9; Lighthouse SEO ≥ 90 quando tocar página |
| 5 | **Medição (DataLayer)** | **Dev e IA analisam se o componente precisa de um evento novo de `data_layer`** ou se um existente já cobre (`clique_cta`, `ver_secao`…). A decisão fica registrada no doc do componente ("Medição: coberto por `…`" ou o evento novo). Eventos **nunca** vêm do Strapi: só dev/IA criam | `docs/analytics/README.md` §5; `next/src/lib/analytics/eventos.test.ts` |

**Sempre executar** `strapi develop` + `next dev` e conferir os pilares antes de dizer que terminou. Detalhes: `.agents/rules/Componentes-e-CMS.md` §7, `.agents/rules/Definition-of-Done.md` §2 e `docs/analytics/README.md`.

## Escopo do projeto

- Monorepo com dois apps:
  - **`next/`** — site da ADAI em **Next.js 16 + React 19 + TypeScript + CSS Modules** (App Router, `src/`).
  - **`strapi/`** — CMS **Strapi 5**, onde ministérios e o time Criativo mantêm páginas, seções e conteúdos.
- Site **somente em pt-BR** (sem roteamento por idioma).
- Todo conteúdo editorial vem do Strapi como **JSON**; o front apenas **renderiza** esse JSON com componentes reutilizáveis.
- Dados que já existem em outro sistema **não** são duplicados no Strapi: dados da igreja vêm da **inChurch** (fonte prioritária) e mensagens do **YouTube**. O Strapi guarda só a configuração editorial dessas seções (ver "Fontes de dados" abaixo).
- Trabalhar somente dentro do contexto solicitado e das regras documentadas. **Não inventar** requisitos, comportamento de produto, tokens nem evidências de validação.
- Preservar alterações locais não relacionadas. Antes de editar, inspecionar `git status` e o diff relevante.
- Não reproduzir tokens, chaves, senhas ou valores de `.env` no código, em relatórios ou no chat.

## Estado atual do repositório (ler antes de codar)

O repositório nasceu do template **Strapi Launchpad**; a fundação (2026-09-27) removeu todo o legado (Next 14, Tailwind, demos, i18n, content types demo do Strapi). Hoje existem:

- **Strapi:** `page` (dynamic zone `sections`), `global` (cabeçalho, rodapé, SEO), seções `hero`, `carrossel-cards`, `imagem-texto`, `serie-atual`, `proximos-eventos`, `ministerios`, `texto-botoes`, `perguntas-frequentes` e `texto-rico` (Markdown) em `strapi/src/components/sections/`; bootstrap que aplica o guia do editor, libera leitura pública e semeia a Home, `/exemplos` e `/politica-de-privacidade`.
- **Next:** Home vinda do Strapi (Header, Hero, Neste domingo, Primeira vez, Pastores Líderes, Série atual, Próximos eventos, Encontre seu lugar, Contribua, A igreja no seu bolso, FAQ, Footer); integração inChurch Public API em `src/lib/inchurch/` (eventos, cache 30 min); integração YouTube Data API em `src/lib/youtube/` (série com cache 4h/5 min; botão “Ao vivo” no Header só com live confirmada recentemente); medição em `src/lib/analytics/` (DataLayer → GTM → GA4, só depois do aceite no `BannerCookies`; ver `docs/analytics/README.md`); Política de Privacidade e Cookies em `/politica-de-privacidade`; favicon em `src/app/icon.svg`; `/exemplos`; vitrine `/componentes`; preview de rascunho; webhook de revalidação.
- **Dados de dev do Strapi:** criados pelo seed v15 (`strapi/src/bootstrap/seed.ts`, versionado por `SEED_VERSION`) ou importados do snapshot `strapi/data/adai-conteudo.tar.gz` (`yarn data:import`, com Strapi parado). O snapshot contém conteúdo, mídias e papéis/permissões públicos, sem contas administrativas e tokens; o banco SQLite (`strapi/.tmp/`) nunca vai para o Git. O seed reconstrói as seções da Home quando sua versão aumenta; para preservar edições feitas no painel, exportar um novo snapshot e revisar seu conteúdo antes de versioná-lo.
- **Pendentes conhecidos:** ver "Como continuar" no fim deste arquivo.

## Leitura direcionada

Antes de alterar código, ler as referências materiais para a tarefa:

| Contexto | Referência |
| --- | --- |
| **Método de trabalho (sempre): superpowers** — etapas, instalação, precedência das regras do ADAI | `.agents/rules/Metodo-Superpowers.md` |
| Propósito, visão e filtro de decisões | `.agents/rules/Visao-do-Projeto.md` |
| **Segurança** — diagnóstico, versões mínimas, riscos aceitos, como auditar, plugin Security Guidance | `docs/seguranca/README.md` |
| Dados da igreja (eventos, células, grupos, doações, pessoas) — **inChurch Public API é a fonte prioritária** | `.agents/rules/Stack-Fontes-e-Bibliotecas.md` §3.6 · contexto para IA: `https://docs.inchurch.com.br/llms.txt` e `https://docs.inchurch.com.br/openapi.json` |
| Camadas (Strapi/Next/React), SSR, a11y, pastas | `.agents/rules/Arquitetura-e-Governanca.md` |
| **Medição** (DataLayer, GTM, GA4, aviso de cookies) — criar ou não um evento | `docs/analytics/README.md` |
| **Componentes alimentados pelo CMS** (registry, normalize, mock) | `.agents/rules/Componentes-e-CMS.md` |
| **Vitrine `/componentes`** (obrigatória a cada componente) | `.agents/rules/Vitrine-de-Componentes.md` |
| Fontes e bibliotecas — qual usar, como e por quê | `.agents/rules/Stack-Fontes-e-Bibliotecas.md` |
| Cores, tipografia, espaçamento, raios | `.agents/rules/Design-Tokens.md` |
| CSS, layout e responsividade | `.agents/rules/CSS-Mobile-First.md` |
| Alterar código compartilhado | `.agents/rules/Extensao-Sem-Sobreposicao.md` |
| Critérios para considerar trabalho concluído | `.agents/rules/Definition-of-Done.md` |
| **Testes** — tipos (funcionalidade, característica, integração, smoke), onde ficam, o que cada mudança exige | `.agents/rules/Testes.md` |
| **Antes de subir e antes de abrir um Pull Request** (checklist) | `.agents/rules/Pull-Request.md` · modelo `.github/pull_request_template.md` |
| Documentação de um componente específico | `docs/componentes/<nome>.md` |

Os documentos em `.agents/rules` são referências condicionais: não presumir que foram carregados. Ler integralmente as regras curtas que governam o escopo atual.

## Fontes de dados e APIs externas

| Fonte | Uso | Variáveis (só servidor) | Cache | Referência |
| --- | --- | --- | --- | --- |
| **Strapi 5** | Conteúdo editorial e configuração das seções | `NEXT_PUBLIC_STRAPI_URL`, `STRAPI_API_TOKEN` (opcional), `PREVIEW_SECRET`, `REVALIDATE_SECRET` | `fetch` 60 s + tag `strapi` (webhook `/api/revalidate`) | `src/lib/strapi/` · `Componentes-e-CMS.md` |
| **inChurch Public API** (prioritária para dados da igreja) | Próximos eventos; próximas: células/GCs, grupos | `INCHURCH_API_BASE_PUBLIC`, `INCHURCH_API_KEY`, `INCHURCH_API_SECRET` (Basic auth) | `unstable_cache` 30 min, tag `inchurch` | `src/lib/inchurch/` · `docs/componentes/proximos-eventos.md` · `Stack-Fontes-e-Bibliotecas.md` §3.6 · IA: `https://docs.inchurch.com.br/llms.txt` |
| **YouTube Data API v3** | Série atual / mensagens (a inChurch não tem vídeos) | `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_HANDLE` | `unstable_cache` 4h (5 min com live), tag `youtube` | `src/lib/youtube/` · `docs/componentes/serie-atual.md` |

Padrão obrigatório para qualquer nova integração: `Arquitetura-e-Governanca.md` §4.1 (client único com segredo em header, tipos crus, regras puras testadas com fixtures reais, cache com resultado normalizado, stale-if-error, função pública que nunca lança). **Nunca** `NEXT_PUBLIC_` em chave de API, nunca login com usuário/senha pessoal, nunca scraping.

## Implementação — regras de ouro

1. **Server Component por padrão.** `'use client'` só para interação real (carrossel, menu mobile). Nunca `ssr: false` em seção de conteúdo.
2. **Componente de apresentação não busca dados.** Fetch só em `src/lib/<fonte>/` (`strapi/`, `inchurch/`, `youtube/`). Conteúdo do Strapi é buscado pela página (`page.tsx`); seção que depende de API externa é um Server Component `async` que chama a função de `lib/` (com cache e fallback) e entrega o view model a um componente só de apresentação (ex.: `SerieAtualSection` → `SerieAtual`).
3. **Toda seção do CMS** tem: `types.ts` + `normalize.ts` + `.mock.json` + `.showcase.ts` + teste + doc em `docs/componentes/`, e está registrada no `sectionRegistry`.
4. **Toda criação ou alteração de componente atualiza a vitrine `/componentes`** (showcase + mock). Sem isso o trabalho não está pronto.
5. **CSS Modules + tokens.** Nada de valor solto (hex, px de espaçamento) fora de `src/styles/tokens.css`. Valor inexistente → `[VALOR NÃO ENCONTRADO]: <descrição>`, nunca inventar.
6. **Mobile-first:** base mobile, `@media (min-width: 769px)` tablet, `@media (min-width: 1024px)` desktop.
7. **Acessibilidade WCAG 2.2 AA** desde o primeiro componente.
8. **Antes de criar** componente, hook ou token, procurar equivalente existente.
9. **Não afirmar** que testes, build, Lighthouse, axe ou validação humana passaram sem execução ou evidência explícita.
10. **Método superpowers sempre** (`Metodo-Superpowers.md`): desenho antes de código, TDD, verificação com evidência.
11. **Teste junto com o código.** Nada vai para PR sem teste unitário do que mudou (`Testes.md`); antes de push/PR, checklist `Pull-Request.md`.

## Validação (proporcional ao diff)

Na pasta `next/`:

- Gate estático: `yarn quality` (lint + typecheck + testes de funcionalidade, característica e integração + piso de cobertura).
- Build: `yarn build`.
- Site no ar (Strapi + Next rodando): `yarn smoke`.
- Performance mobile, quando tocar página/LCP: skill `lighthouse-performance-mcp`.
- A11y no browser, quando tocar UI interativa: skill `playwright-mcp-a11y`.

Na pasta `strapi/`: `yarn build` quando alterar schemas, componentes ou configuração.

Se um gate não puder ser executado, registrar o motivo e o que permanece pendente.

## Git e ações externas

- Não executar commit, push, merge, criação de PR ou outra ação remota sem pedido explícito.
- Antes de **qualquer** push ou PR: checklist [`.agents/rules/Pull-Request.md`](.agents/rules/Pull-Request.md) (Parte A antes de subir, Parte B antes de abrir o PR).
- Ao adicionar arquivos, usar caminhos explícitos ou `git add -p`; nunca `git add .` ou `git add --all`.
- Não descartar, sobrescrever ou incluir alterações do usuário fora do escopo.
- `documents/` guarda artefatos locais (PR.md, relatórios) e está no `.gitignore`; não forçar sua inclusão.
- **Nunca trocar de branch, fazer `git pull` ou `checkout` com o `strapi develop` rodando:** o Strapi sincroniza o banco com o schema do código naquele instante e apaga os dados de componentes que a branch não tem. Parar o Strapi antes (`docs/seguranca/README.md` §5).

## Skills do repositório

Ficam em `.agents/skills/` e são espelhadas em `.claude/skills/` (carregadas automaticamente pelo Claude Code). **Toda edição vale para os dois diretórios no mesmo PR** — divergência entre os espelhos é defeito de review.

| Skill | Quando usar |
| --- | --- |
| `create-strapi-doc` | Documentar/estruturar um componente no Strapi (schema, campos, JSON, passo a passo) |
| `action-plan` | Plano de ação com soluções, checklist e DoD |
| `pre-merge` | Gates locais antes de merge (quality + build + opcional Lighthouse) |
| `test-fix` | Rodar e corrigir testes |
| `generate-pr-description` | Gerar `documents/PR.md` |
| `pr-code-review` | Code review de branch/PR → `documents/github/CODE_REVIEW.md` |
| `push-changes` | Preparar PR.md + commit + push (só com pedido explícito) |
| `playwright-mcp-a11y` | Validação de a11y no browser (axe + teclado + mobile) |
| `lighthouse-performance-mcp` | Performance mobile e oportunidades |

Ler o `SKILL.md` integralmente quando uma skill for selecionada.

Além delas, **sempre** as skills do **superpowers** (plugin, não ficam no repositório): `brainstorming`, `writing-plans`, `executing-plans` / `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `requesting-code-review` / `receiving-code-review`, `finishing-a-development-branch`, `using-git-worktrees`. As skills do projeto complementam o método (ex.: `pre-merge` e `push-changes` na finalização). Ver `.agents/rules/Metodo-Superpowers.md`.

**Plugin Security Guidance** (Anthropic, ativo na conta): alerta padrões perigosos na edição e revisa diffs e commits. Alerta dele é achado de revisão — corrigir ou registrar por que não se aplica; nunca ignorar em silêncio (`docs/seguranca/README.md` §6).

## MCPs sob demanda

- **Figma:** usar só com pedido de design, link do Figma ou sincronização design↔código. O arquivo de referência é `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`). Há **limite de chamadas** por seat: extrair uma seção por vez e reaproveitar o resultado (não repetir chamadas).
  - Se o MCP estiver no limite, dá para abrir o arquivo no **Chrome do usuário** (extensão Claude in Chrome, já logado): textos pelo zoom no canvas; foto original pelo link do nome da imagem no painel Properties (baixa o fill); o que aparece no layout pelo **Export 2x** do nó. Confira se o fill baixado é o mesmo que aparece no canvas — um nó pode ter uma imagem escondida por baixo.
- **Playwright / Lighthouse:** só durante a validação que depender deles.
- Não inicializar MCP sem relação material com a tarefa.

## Como continuar (handoff — atualizado em 2026-09-28)

**Pronto e verificado localmente** (Strapi + página + vitrine; quality e builds executados): Header, Hero, Carrossel de cards ("Neste domingo"; cores por card; foto acima/abaixo; foto P&B ou arte 16:9), Imagem e texto (Primeira vez, Pastores Líderes e Contribua), Série atual (YouTube), Próximos eventos (inChurch), Lista de ministérios (Encontre seu lugar), Texto e botões (app), Perguntas frequentes, Footer e favicon. Vitrine com abas e controles. A exibição do Header durante uma live foi coberta por teste automatizado; uma transmissão real ainda precisa ser observada para validação ponta a ponta.

**Testes (2026-10-03):** quatro tipos — funcionalidade (ao lado do código), característica (`next/src/__tests__/caracteristicas/`: 5 pilares, a11y/SEO de toda variante, CSS, segurança, cache versionado, testes obrigatórios), integração (`next/src/__tests__/integracao/`: página → Strapi → seções, rotas da API, vitrine) e smoke (`yarn smoke`). Cobertura com piso no `jest.config.mjs`. A revisão do site que originou esses testes corrigiu: scroll lateral no celular (carrossel), cache do YouTube sem versão (player fora do youtube-nocookie), `priority` deprecado no Next 16 e `getSection('constructor')`; a 404 passou a aparecer dentro do site (cabeçalho e rodapé). Pendente: o conteúdo da 404 vem do RSC e só aparece com JavaScript (status 404 correto; comportamento de streaming do Next 16) — avaliar checar o slug no `proxy` se for preciso HTML sem JS.

**Medição (2026-10-02):** DataLayer com 13 eventos, GTM por ambiente (homologação `GTM-5945V9DQ`, produção `GTM-5MGM7CK2`), GA4 `G-SCG09PWV8B` configurado no GTM, Consent Mode v2 e aviso de cookies próprio. Container de **homologação publicado** e verificado (GA4 recebendo); **produção importado e não publicado** de propósito — ver `README.md` → "Antes de subir para produção". Dimensões personalizadas criadas no GA4 e Política de Privacidade publicada em `/politica-de-privacidade`; falta marcar `planejar_visita` e `contribuir` como eventos-chave e a revisão jurídica da política (`docs/analytics/README.md` §7).

**Próximos passos sugeridos**, na ordem do Figma (`Home / Desktop`, node 1:3):

1. **Top bar** — node 1:4; ainda não extraída.
2. **Página de contribuição** — criar o destino `/contribua` quando o link público de doação estiver definido. O botão da Home já aponta para essa rota, que pode responder 404 até lá.
3. **Destinos dos ministérios** — cadastrar URLs próprias no Strapi quando existirem; a lista da Home já está pronta e fica como texto sem URL.
4. **Células/GCs perto de você** (se o time quiser): avaliar `GET /v1/cell/` com `lat`/`lng`.

**Decisões pendentes com o time/design:**

- Link público da página do evento na inChurch (formato não documentado; a API traz `short_url_code`) e destino do "Agenda completa".
- Aprovação visual: layouts mobile, carrossel, paleta de cores dos cards, foto abaixo, cards de evento com arte (Figma usa bloco de data), dialog do player, selo "Ao vivo agora", cinza `#6B6B6B`.
- Série atual: o destaque de mensagens ainda pode atrasar até 4h para perceber uma live adicionada à playlist; o botão “Ao vivo” do Header faz uma checagem independente a cada 5 min. Validar o comportamento ponta a ponta durante uma transmissão real.
- Produção: restringir a chave do YouTube à Data API v3; cliente de API da inChurch só leitura (`event:GET`, `event_categories:GET`).

**Como o time mantém o conteúdo sem dev:** eventos → marcar "Mostrar no site" na inChurch (GC nunca aparece); mensagens → publicar no YouTube no padrão `Série | Tema | Pr. Nome` e manter a live na playlist da série; textos e seções → Strapi (guia do editor em cada campo e na vitrine).

