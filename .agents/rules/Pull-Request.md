---
description: Checklist obrigatório antes de subir (push) e antes de abrir um Pull Request — testes, gates, site no ar, 5 pilares, segredos, docs e descrição do PR
alwaysApply: true
---

# Pull Request — checklist antes de subir e antes de abrir

> **Para quem:** todo dev e todo agente de IA (Claude Code, Cursor, Codex) que mexe neste repositório.
> **Quando:** **antes de cada `git push`** (Parte A) e **antes de abrir ou atualizar um PR** (Parte B).
> **Regra:** nenhum item marcado ✅ sem ter rodado **nesta sessão**. O que não deu para rodar vira ⏳ com o motivo, no PR. Mentir num checklist é pior que não ter checklist.

Regras relacionadas: [`Metodo-Superpowers.md`](./Metodo-Superpowers.md) (método de trabalho — este checklist é a etapa 7 "verificar" e 9 "finalizar") · [`Testes.md`](./Testes.md) (tipos de teste e o que cada mudança exige) · [`Definition-of-Done.md`](./Definition-of-Done.md) (quando a atividade está pronta) · `AGENTS.md` (Regra dos 5 pilares).

---

## Parte A — antes de subir (`git push`)

### A1. Branch e escopo

- [ ] Estou numa branch própria, **nunca** na `main`: `feat/…`, `fix/…`, `docs/…`, `test/…`, `chore/…` (ex.: `feat/agenda-inchurch`).
- [ ] Branch atualizada com a `main` (`git fetch origin && git merge origin/main`), conflitos resolvidos e testes rodados de novo.
- [ ] `git status` e `git diff` revisados: **só** o que pertence a esta tarefa. Alteração de outra pessoa ou fora do escopo fica de fora.

### A2. Testes escritos (obrigatório)

- [ ] Trabalho feito pelo método superpowers: desenho aprovado (bounded) ou spec + plano aprovados em `docs/superpowers/` (architectural).
- [ ] Testes escritos **antes** do código (TDD — `test-driven-development`).
- [ ] **Todo código novo ou alterado tem teste unitário** no mesmo commit (tabela "O que cada mudança exige" em `Testes.md` §2).
- [ ] Bug corrigido → existe um teste que falhava antes da correção.
- [ ] Nenhum `it.only`, `it.skip`, `console.log` de depuração ou teste comentado.
- [ ] Nenhum teste "ajustado para passar" sem entender por que quebrou.

### A3. Gates locais (todos verdes)

Etapa `verification-before-completion` do superpowers: só vale com a saída dos comandos **desta sessão**.

Na pasta `next/`:

```bash
yarn quality      # lint + typecheck + testes (funcionalidade, característica, integração) + piso de cobertura
yarn build        # build de produção
```

Se o diff tocar `strapi/` (schema, componente, guia do editor, seed, config):

```bash
cd strapi && yarn build
```

- [ ] `yarn quality` ✅ — **inclui** os testes de característica (5 pilares, a11y/SEO, CSS, segurança, cache, testes obrigatórios). Se um deles falhou, o problema está no código/doc, não no teste.
- [ ] `yarn build` (next) ✅
- [ ] `yarn build` (strapi) ✅ ou ⏭️ "não toquei no Strapi"

### A4. Site no ar (Strapi + Next rodando)

```bash
# terminal 1: cd strapi && yarn develop      terminal 2: cd next && yarn dev
cd next && yarn smoke
```

- [ ] `yarn smoke` ✅ (páginas, SEO, imagens, 404, redirecionamento, APIs protegidas, vitrine).
- [ ] Abri no navegador as páginas e a vitrine do que mudou, em **375 / 768 / 1440**:
  - [ ] console do navegador **sem erros**;
  - [ ] **sem scroll lateral** em 375 — no console: `document.documentElement.scrollWidth <= innerWidth` deve dar `true`;
  - [ ] interações do componente funcionando (teclado: Tab, Enter, Esc).
- [ ] Se mudou componente: **5 pilares** conferidos com os dois servidores rodando (Dados no CMS, Página, Componente, SEO, Medição — `AGENTS.md`).

### A5. Segurança

- [ ] Nenhum segredo no diff: `.env`, tokens, chaves de API, senhas, e-mails/telefones pessoais. Conferir com:
  ```bash
  git diff --cached | grep -inE "(api[_-]?key|secret|token|password|senha)\s*[:=]"
  ```
  (o `.env` nunca entra; o `.env.example` só tem valores vazios ou `tobemodified` — testado em `seguranca-e-privacidade.test.ts`).
- [ ] Nenhuma variável `NEXT_PUBLIC_` com segredo.
- [ ] Nenhum alerta do plugin **Security Guidance** pendente (corrigido ou com o motivo registrado no PR).
- [ ] Mexeu em dependências? `yarn audit --groups dependencies` nos dois apps sem crítica nova e `dependencias-seguras.test.ts` verde (`docs/seguranca/README.md` §4).
- [ ] Snapshot do Strapi (`strapi/data/adai-conteudo.tar.gz`), se atualizado com `yarn data:export`, revisado: só conteúdo, mídias e papéis públicos — sem admins nem tokens.

### A6. Documentação junto com o código

- [ ] Doc do componente (`docs/componentes/<nome>.md`) atualizado: status honesto, **Medição (DataLayer)** e **Testes**.
- [ ] Regra, README ou `AGENTS.md` atualizados se a mudança altera como o time trabalha (novo comando, nova variável de ambiente, nova integração).
- [ ] Variável de ambiente nova → `next/.env.example` (ou `strapi/.env.example`) + tabela do `README.md`.
- [ ] Mudou o seed do Strapi → subiu `SEED_VERSION`; mudou o formato de um resultado em cache → subiu `VERSAO_CACHE_*`.

### A7. Commit e push

- [ ] `git add` com **caminhos explícitos** (ou `git add -p`) — **nunca** `git add .` / `git add --all`.
- [ ] Mensagem em **Conventional Commits, em português**: `feat(agenda): lista eventos da inChurch`, `fix(carrossel): impede scroll lateral no celular`, `test: cobre rotas da API`.
- [ ] Agente de IA: commit/push **só com pedido explícito** do usuário; mensagem termina com a linha `Co-Authored-By:` do agente.
- [ ] `git push -u origin <branch>` (primeira vez) / `git push`. **Nunca** `--force` na `main`.

---

## Parte B — antes de abrir (ou atualizar) o Pull Request

### B1. Revisão do próprio diff

- [ ] Li o diff inteiro contra a `main` (`git diff origin/main...HEAD`) como se fosse o revisor.
- [ ] Revisão do superpowers (`requesting-code-review`) feita; achados críticos resolvidos.
- [ ] Skill `pr-code-review` rodada (agente) ou checklist da §2 dela conferido (dev): arquitetura, componentes/CMS, vitrine, guia do editor, tokens/CSS, a11y, performance, dependências, visão.
- [ ] Dependência nova? Justificada em `Stack-Fontes-e-Bibliotecas.md` §5.

### B2. Descrição do PR

- [ ] `documents/PR.md` gerado (skill `generate-pr-description`) — a pasta `documents/` é ignorada pelo Git; serve para colar no GitHub.
- [ ] O corpo do PR segue o modelo `.github/pull_request_template.md` (o GitHub já preenche):
  - **O que mudou** (comportamento, decisões, trade-offs; rota da vitrine se houver componente);
  - **Testes** — quais foram escritos/alterados e de que tipo (funcionalidade, característica, integração);
  - **Como validar** — comandos reais e rotas para abrir;
  - **Validações** — ✅ só o que rodou nesta sessão; ⏳ o que falta (humano, produção);
  - **Pendências / riscos**.
- [ ] Título em Conventional Commits, em português.
- [ ] Base: `main`. PR pequeno e de um assunto só; se passou de ~40 arquivos sem necessidade, dividir.

### B3. Abrir

Etapa `finishing-a-development-branch` do superpowers: apresentar as opções (manter branch, PR) e **esperar o usuário** — merge nunca sem ele.

```bash
gh pr create --repo adaitech/ADAI-Hub --base main --title "<tipo>(<escopo>): <resumo>" --body-file documents/PR.md
```

- [ ] Agente de IA: abrir PR **só com pedido explícito**; nunca fazer merge nem ligar auto-merge sem o usuário.
- [ ] Depois de abrir: conferir que o PR mostra os arquivos esperados e que a descrição renderizou.

### B4. Depois de abrir

- [ ] Comentário de revisão → corrigir **com teste** quando for comportamento, rodar a Parte A de novo e dar push.
- [ ] Antes do merge, quem mergeia roda a skill `pre-merge` (quality + build + strapi build quando aplicável).
- [ ] Nada vai para produção sem o checklist "Antes de subir para produção" do `README.md`.

---

## Resumo de uma linha (para colar no chat do agente)

> Testes escritos → `yarn quality` → `yarn build` (+ strapi) → `yarn smoke` com os servidores rodando → navegador em 375/768/1440 sem erro no console nem scroll lateral → 5 pilares → sem segredo no diff → docs atualizados → `git add` explícito → commit em pt-BR → push → `documents/PR.md` → PR para a `main`.
