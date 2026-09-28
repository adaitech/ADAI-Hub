# ADAI Hub — orientações para agentes e devs

> **Princípio central:** Amar a Deus. Servir as pessoas. Influenciar o mundo.
>
> Toda decisão passa pela pergunta: **"Isso nos ajuda a Amar a Deus, Servir as Pessoas e Influenciar o Mundo?"**
> Se a resposta for não, não faz parte do projeto — mesmo que seja moderno, bonito ou tecnicamente possível.
>
> Visão completa: [`.agents/rules/Visao-do-Projeto.md`](.agents/rules/Visao-do-Projeto.md)

## ⚠️ Regra do tripé — todo componente existe em 3 lugares (obrigatório)

Nenhum componente está pronto enquanto não estiver **funcionando nos três lugares**, verificado com o Strapi e o Next rodando:

| # | Onde | O que precisa existir | Como verificar |
| --- | --- | --- | --- |
| 1 | **Strapi** | Schema do componente, guia do editor (`strapi/src/editor-guide/*.json`), componente liberado na dynamic zone e **conteúdo real cadastrado** (seed de dev em `strapi/src/bootstrap/seed.ts`) | `cd strapi && yarn develop` → painel mostra os campos com descrição; API devolve o JSON |
| 2 | **Página** | Componente registrado no `sectionRegistry` e aparecendo numa página real montada no Strapi (ex.: Home) | `cd next && yarn dev` → abrir a página e ver a seção com o conteúdo do Strapi |
| 3 | **Vitrine** | `.showcase.tsx` (variações + `controles`) + `.mock.json` (JSON real da API) + guia do editor exibido em `/componentes/<slug>` | abrir `/componentes/<slug>`, conferir as abas de exemplo e os **controles** (liga/desliga de cada opção do Strapi) em 375 / 768 / 1440 |

**Sempre executar** `strapi develop` + `next dev` e conferir os três antes de dizer que terminou. Detalhes: `.agents/rules/Componentes-e-CMS.md` §7 e `.agents/rules/Definition-of-Done.md` §2.

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

- **Strapi:** `page` (dynamic zone `sections`), `global` (cabeçalho, rodapé, SEO), seções `hero`, `carrossel-cards`, `imagem-texto`, `serie-atual`, `proximos-eventos`, `ministerios`, `texto-botoes` e `perguntas-frequentes` em `strapi/src/components/sections/`; bootstrap que aplica o guia do editor, libera leitura pública e semeia a Home e `/exemplos`.
- **Next:** Home vinda do Strapi (Header, Hero, Neste domingo, Primeira vez, Pastores Líderes, Série atual, Próximos eventos, Encontre seu lugar, Contribua, A igreja no seu bolso, FAQ, Footer); integração inChurch Public API em `src/lib/inchurch/` (eventos, cache 30 min); integração YouTube Data API em `src/lib/youtube/` (série com cache 4h/5 min; botão “Ao vivo” no Header só com live confirmada recentemente); favicon em `src/app/icon.svg`; `/exemplos`; vitrine `/componentes`; preview de rascunho; webhook de revalidação.
- **Dados de dev do Strapi:** criados pelo seed v14 (`strapi/src/bootstrap/seed.ts`, versionado por `SEED_VERSION`) ou importados do snapshot `strapi/data/adai-conteudo.tar.gz` (`yarn data:import`, com Strapi parado). O snapshot contém conteúdo, mídias e papéis/permissões públicos, sem contas administrativas e tokens; o banco SQLite (`strapi/.tmp/`) nunca vai para o Git. O seed reconstrói as seções da Home quando sua versão aumenta; para preservar edições feitas no painel, exportar um novo snapshot e revisar seu conteúdo antes de versioná-lo.
- **Pendentes conhecidos:** ver "Como continuar" no fim deste arquivo.

## Leitura direcionada

Antes de alterar código, ler as referências materiais para a tarefa:

| Contexto | Referência |
| --- | --- |
| Propósito, visão e filtro de decisões | `.agents/rules/Visao-do-Projeto.md` |
| Dados da igreja (eventos, células, grupos, doações, pessoas) — **inChurch Public API é a fonte prioritária** | `.agents/rules/Stack-Fontes-e-Bibliotecas.md` §3.6 · contexto para IA: `https://docs.inchurch.com.br/llms.txt` e `https://docs.inchurch.com.br/openapi.json` |
| Camadas (Strapi/Next/React), SSR, a11y, pastas | `.agents/rules/Arquitetura-e-Governanca.md` |
| **Componentes alimentados pelo CMS** (registry, normalize, mock) | `.agents/rules/Componentes-e-CMS.md` |
| **Vitrine `/componentes`** (obrigatória a cada componente) | `.agents/rules/Vitrine-de-Componentes.md` |
| Fontes e bibliotecas — qual usar, como e por quê | `.agents/rules/Stack-Fontes-e-Bibliotecas.md` |
| Cores, tipografia, espaçamento, raios | `.agents/rules/Design-Tokens.md` |
| CSS, layout e responsividade | `.agents/rules/CSS-Mobile-First.md` |
| Alterar código compartilhado | `.agents/rules/Extensao-Sem-Sobreposicao.md` |
| Critérios para considerar trabalho concluído | `.agents/rules/Definition-of-Done.md` |
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

## Validação (proporcional ao diff)

Na pasta `next/`:

- Gate estático: `yarn quality` (lint + typecheck + testes).
- Build: `yarn build`.
- Performance mobile, quando tocar página/LCP: skill `lighthouse-performance-mcp`.
- A11y no browser, quando tocar UI interativa: skill `playwright-mcp-a11y`.

Na pasta `strapi/`: `yarn build` quando alterar schemas, componentes ou configuração.

Se um gate não puder ser executado, registrar o motivo e o que permanece pendente.

## Git e ações externas

- Não executar commit, push, merge, criação de PR ou outra ação remota sem pedido explícito.
- Ao adicionar arquivos, usar caminhos explícitos ou `git add -p`; nunca `git add .` ou `git add --all`.
- Não descartar, sobrescrever ou incluir alterações do usuário fora do escopo.
- `documents/` guarda artefatos locais (PR.md, relatórios) e está no `.gitignore`; não forçar sua inclusão.

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

## MCPs sob demanda

- **Figma:** usar só com pedido de design, link do Figma ou sincronização design↔código. O arquivo de referência é `adai.com.br` (fileKey `cN5RwPRMA6zw5oLoeXidk7`). Há **limite de chamadas** por seat: extrair uma seção por vez e reaproveitar o resultado (não repetir chamadas).
  - Se o MCP estiver no limite, dá para abrir o arquivo no **Chrome do usuário** (extensão Claude in Chrome, já logado): textos pelo zoom no canvas; foto original pelo link do nome da imagem no painel Properties (baixa o fill); o que aparece no layout pelo **Export 2x** do nó. Confira se o fill baixado é o mesmo que aparece no canvas — um nó pode ter uma imagem escondida por baixo.
- **Playwright / Lighthouse:** só durante a validação que depender deles.
- Não inicializar MCP sem relação material com a tarefa.

## Como continuar (handoff — atualizado em 2026-09-28)

**Pronto e verificado localmente** (tripé Strapi + página + vitrine; quality e builds executados): Header, Hero, Carrossel de cards ("Neste domingo"; cores por card; foto acima/abaixo; foto P&B ou arte 16:9), Imagem e texto (Primeira vez, Pastores Líderes e Contribua), Série atual (YouTube), Próximos eventos (inChurch), Lista de ministérios (Encontre seu lugar), Texto e botões (app), Perguntas frequentes, Footer e favicon. Vitrine com abas e controles. A exibição do Header durante uma live foi coberta por teste automatizado; uma transmissão real ainda precisa ser observada para validação ponta a ponta.

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

