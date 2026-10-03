# Segurança 1 — atualizações urgentes · Plano de implementação

> **Para agentes:** SUB-SKILL OBRIGATÓRIA: usar superpowers:subagent-driven-development (recomendado) ou superpowers:executing-plans para executar tarefa a tarefa. Passos com checkbox (`- [ ]`).

**Objetivo:** tirar as vulnerabilidades conhecidas das dependências de produção (Strapi 5.17 → 5.56, Next 16.3.8, sharp ≥ 0.35.4) sem mudar o comportamento do site, do painel nem do conteúdo.

**Arquitetura:** atualização pela ferramenta oficial `@strapi/upgrade` (com codemods), um teste de característica que trava versões mínimas seguras, e uma comparação do JSON da API antes/depois como prova de que o conteúdo não mudou.

**Stack:** Strapi 5 (SQLite local), Next 16, Yarn 1, Jest.

**Spec:** `docs/superpowers/specs/2026-10-03-seguranca-1-atualizacoes-design.md`

## Restrições globais

- Versões mínimas: `@strapi/strapi` e `@strapi/plugin-users-permissions` **5.56.0** (piso de segurança 5.37.0); `@strapi/plugin-seo` **2.0.9 fixo**; `next` **16.3.8**; `sharp` **^0.35.4**.
- `better-sqlite3` fica em **11.7.0**, salvo se a instalação falhar.
- Node 22 (Strapi 5.56 aceita 20–26).
- Nada de `git add .`; commit só com autorização do usuário; nunca ler/repetir valores de `.env`.
- Backup fora do Git em `documents/backup-strapi-2026-10-03/`.

## Foco da revisão

1. **Seções somem da página** depois da atualização (mudança de semântica do `populate`/`on` na API REST) → JSON de `/api/pages` (Home e Política) **idêntico** antes/depois — Tarefa 2, passo 7.
2. **Conteúdo ou permissões alterados pela migração do banco** (papel público perde `find`) → mesma comparação de JSON + `/api/global` 200 sem token — Tarefa 2, passo 7.
3. **Pré-visualização quebra** (codemod mexendo em `config/admin.ts`) → abrir "Pré-visualizar" no painel e ver o rascunho no site — Tarefa 2, passo 8.
4. **Guia do editor some do painel** (bootstrap `editor-guide` com API interna alterada) → descrição visível num campo do Hero no painel — Tarefa 2, passo 8.
5. **Imagens quebram** com o `sharp` novo (otimizador do Next) → `yarn smoke` checa as imagens da Home com `content-type image/*` — Tarefa 3, passo 5.

---

### Tarefa 1: Teste de versões seguras + linha de base

**Arquivos:**
- Criar: `next/src/__tests__/caracteristicas/dependencias-seguras.test.ts`

**Interfaces:**
- Produz: o teste que as Tarefas 2 e 3 fazem passar.

- [ ] **Passo 1: Linha de base.** `cd next && yarn quality` → 634 testes verdes; Strapi e Next rodando → `yarn smoke` 31/31. (Prova de que qualquer falha depois é da atualização.)
- [ ] **Passo 2: Escrever o teste** que lê `strapi/package.json` e `next/package.json` (via `fs`, como `cinco-pilares.test.ts`) e compara versões com um `semver` mínimo próprio (sem lib nova: função `menorQue(a, b)` com `split('.')`), aceitando faixa `^x.y.z` pela versão base:
  - `it('Strapi ≥ 5.37.0 (vazamento por filtro relacional e SQL injection corrigidos)')` → `@strapi/strapi` e `@strapi/plugin-users-permissions` ≥ `5.37.0`, e as duas **iguais**.
  - `it('plugin de SEO fixo em 2.x (a ferramenta de upgrade não pode trocá-lo por 5.x)')` → `@strapi/plugin-seo` casa `/^2\.\d+\.\d+$/` (sem `^`).
  - `it('Next ≥ 16.3.8')`, `it('sharp ≥ 0.35.4 (libvips/libheif)')`.
- [ ] **Passo 3: Ver falhar:** `cd next && yarn test src/__tests__/caracteristicas/dependencias-seguras.test.ts` → 4 falhas (versões de hoje: 5.17.0, `^2.0.4`, `^16.3.6`, `^0.34.0`).

### Tarefa 2: Strapi 5.17 → 5.56

**Arquivos:**
- Modificar: `strapi/package.json`, `strapi/yarn.lock`, arquivos que os codemods tocarem (revisar cada um), `strapi/types/generated/*`

**Interfaces:**
- Consome: teste da Tarefa 1 (passa a cobrir 2 dos 4 casos).

- [ ] **Passo 1: Parar o Strapi** e copiar `strapi/.tmp/data.db` e `strapi/public/uploads/` para `documents/backup-strapi-2026-10-03/`.
- [ ] **Passo 2: JSON de referência:** com o Strapi **antigo** rodando, salvar em `documents/backup-strapi-2026-10-03/` as respostas de `/api/global?populate=*`, `/api/pages?filters[slug][$eq]=home` e `...=politica-de-privacidade` com o mesmo `populate` que `next/src/lib/strapi/queries/page.ts` usa (copiar a URL do log de `strapiFetch`, ex.: via `curl` com a query gerada por `qs`). Parar o Strapi.
- [ ] **Passo 3:** `strapi/package.json`: `"@strapi/plugin-seo": "2.0.9"`.
- [ ] **Passo 4:** `cd strapi && npx @strapi/upgrade minor --yes` (repositório limpo: commitar ou stashear o que houver antes). Esperado: `Upgrading from v5.17.0 to v5.56.0` … `Completed`.
- [ ] **Passo 5: Revisar o diff** (`git diff -- strapi`) arquivo a arquivo; reverter qualquer codemod que mude comportamento sem necessidade e anotar no `docs/seguranca/README.md` o que foi aceito.
- [ ] **Passo 6:** `yarn install` → `yarn build` (sem erro) → `yarn develop`; log sem erro de migração.
- [ ] **Passo 7: Comparar JSON:** repetir as 3 chamadas do passo 2 e comparar com as de referência ignorando só `updatedAt`, `createdAt`, `publishedAt`. Esperado: **iguais** (seções, campos, mídias, SEO). `/api/global` responde 200 sem token.
- [ ] **Passo 8: Painel:** login no admin → editar a Home → um campo do Hero mostra a descrição do guia do editor → painel de SEO do plugin aparece → botão **Pré-visualizar** abre o rascunho no site com o aviso "Você está vendo o rascunho". `types/generated` regenerados pelo `develop`.
- [ ] **Passo 9:** `cd next && yarn test src/__tests__/caracteristicas/dependencias-seguras.test.ts` → casos de Strapi e plugin-seo passam; Next e sharp ainda falham.
- [ ] **Passo 10: Commit** (se autorizado): `fix(strapi): atualiza Strapi 5.17 → 5.56 (vulnerabilidades críticas)` com os caminhos de `strapi/` + o teste.

### Tarefa 3: Next 16.3.8 + sharp

**Arquivos:**
- Modificar: `next/package.json`, `next/yarn.lock`

- [ ] **Passo 1:** `cd next && yarn add next@16.3.8 sharp@^0.35.4` (e `eslint-config-next@16.3.8` se estiver na mesma versão do `next` no `package.json`).
- [ ] **Passo 2:** `yarn test src/__tests__/caracteristicas/dependencias-seguras.test.ts` → **4/4 passam**.
- [ ] **Passo 3:** `yarn audit --groups dependencies` → 0 critical e 0 high.
- [ ] **Passo 4:** `yarn quality` → 638 testes verdes (634 + os 4 do teste novo); `yarn build` sem erro.
- [ ] **Passo 5:** Strapi e Next rodando → `yarn smoke` → todas ok, inclusive "imagem de /" com `image/*`. Navegador em 375/768/1440 sem erro no console.
- [ ] **Passo 6: Commit** (se autorizado): `fix(next): atualiza Next 16.3.8 e sharp 0.35 (libvips/libheif)`.

### Tarefa 4: Auditoria residual, snapshot e documentação

**Arquivos:**
- Criar: `docs/seguranca/README.md`
- Modificar: `strapi/package.json` (só se houver `resolutions` compatíveis), `strapi/data/adai-conteudo.tar.gz`, `.agents/rules/Stack-Fontes-e-Bibliotecas.md`, `AGENTS.md`, `.agents/rules/Metodo-Superpowers.md`, `.agents/rules/Pull-Request.md`

- [ ] **Passo 1:** `cd strapi && yarn audit --groups dependencies --json` → para cada critical/high restante, classificar: **roda em produção** (servidor Strapi, admin) ou **só build/CLI** (`typedoc`, `cloud-cli`, `concurrently`…). Para os de produção, tentar `resolutions` com a versão corrigida → `yarn install` → `yarn build` + repetir Tarefa 2 passo 7. Se não houver correção compatível, registrar como risco com mitigação.
- [ ] **Passo 2:** `yarn data:export` com o Strapi parado; abrir o `.tar.gz` e conferir tipos de entidade (só `api::page`, `api::global`, upload, i18n, users-permissions role/permission — **sem** `admin::` nem tokens).
- [ ] **Passo 3:** `docs/seguranca/README.md` com: diagnóstico de 2026-10-03 (tabela da spec §2), o que foi atualizado, codemods aceitos, riscos aceitos com motivo, como auditar (`yarn audit --groups dependencies` nos dois apps) e o mapa das 4 entregas. Link a partir do `AGENTS.md` (tabela "Leitura direcionada").
- [ ] **Passo 4: Plugin Security Guidance** (Anthropic): registrar no `Metodo-Superpowers.md` (seção de ferramentas: alertas durante a edição, revisão do diff e dos commits — alerta é tratado como achado de revisão, nunca ignorado em silêncio), no `AGENTS.md` (seção de skills) e no `Pull-Request.md` Parte A5 (sem alerta do Security Guidance pendente). Instalação: claude.ai → plugins → "Security Guidance".
- [ ] **Passo 5:** `Stack-Fontes-e-Bibliotecas.md`: versões de Strapi/Next/sharp atualizadas.
- [ ] **Passo 6:** `cd next && yarn quality` (links dos MDs são testados) → verde.
- [ ] **Passo 7: Commit** (se autorizado): `docs(seguranca): diagnóstico, riscos aceitos e Security Guidance`; depois checklist `Pull-Request.md` Parte B e PR para a `main` (só com pedido).
