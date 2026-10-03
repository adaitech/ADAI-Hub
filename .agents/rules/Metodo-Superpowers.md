---
description: Método de trabalho obrigatório — superpowers (brainstorming → plano → TDD → verificação → revisão → finalização), adaptado às regras do ADAI Hub
alwaysApply: true
---

# Método de trabalho — superpowers (sempre)

> **Regra:** todo trabalho neste repositório — feature, componente, correção, refatoração, documentação técnica — segue o **modelo e o método do [superpowers](https://github.com/obra/superpowers)**. Vale para agentes de IA (Claude Code, Cursor, Codex) e para devs. Agente com o plugin instalado **usa as skills**; quem não tem o plugin (ou é humano) segue **as mesmas etapas** descritas aqui.
>
> **Testes obrigatórios antes de qualquer Pull Request:** o método já é *test-first* (TDD). Ver [`Testes.md`](./Testes.md) e o checklist [`Pull-Request.md`](./Pull-Request.md).

## 1. Por que

O superpowers troca "sair escrevendo código" por um processo com evidência em cada passo: entender antes de desenhar, desenhar antes de planejar, teste antes de código, verificação antes de dizer "pronto". É o mesmo espírito das regras do projeto (5 pilares, nenhum PR sem teste, nunca afirmar o que não foi executado) — o superpowers dá o roteiro e as regras do ADAI dão o padrão de qualidade.

## 2. Instalação (uma vez por ferramenta)

| Ferramenta | Como |
| --- | --- |
| **Claude desktop (aba Code)** | Já vem carregado na sessão (verificar: a primeira mensagem da sessão diz "You have superpowers") |
| **Claude Code (terminal)** | `/plugin install superpowers@claude-plugins-official` |
| **Cursor** | No chat do agente: `/add-plugin superpowers` |
| **Codex (app ou CLI)** | Plugins → Coding → Superpowers (`/plugins` no CLI) |
| **Outras** | Instruções em https://github.com/obra/superpowers#installation |

Se o agente não tiver o plugin: ler este arquivo e seguir as etapas da §3 manualmente, anunciando cada etapa.

## 3. O fluxo (obrigatório, nesta ordem)

| # | Etapa | Skill do superpowers | Complemento do ADAI Hub | Saída |
| --- | --- | --- | --- | --- |
| 0 | **Checar skills antes de qualquer resposta** | `using-superpowers` | Skills do projeto em `.agents/skills/` (ver `AGENTS.md`) | Anunciar: "Usando [skill] para [objetivo]" |
| 1 | **Entender e desenhar** — classificar em *spike*, *bounded* ou *architectural* e dizer a classificação em voz alta | `brainstorming` | Filtro da visão (`Visao-do-Projeto.md`), 5 pilares, `Componentes-e-CMS.md` | Bounded: desenho curto no chat, **aprovado**. Architectural: spec em `docs/superpowers/specs/AAAA-MM-DD-<tema>-design.md`, **aprovada** |
| 2 | **Isolar o trabalho** | `using-git-worktrees` | Branch própria (`feat/…`, `fix/…`), nunca na `main` — `Pull-Request.md` A1 | Branch/worktree com testes verdes de partida (`yarn quality`) |
| 3 | **Planejar** (architectural) | `writing-plans` | Tarefas cobrindo os 5 pilares e os testes de `Testes.md` §2 | Plano em `docs/superpowers/plans/AAAA-MM-DD-<tema>.md`, **revisado pelo usuário** |
| 4 | **Executar o plano** | `subagent-driven-development` (mais revisão) ou `executing-plans` (mais barato) | Uma tarefa por vez; Strapi + Next rodando quando a tarefa toca componente | Tarefas marcadas no plano |
| 5 | **Implementar com TDD** — RED → GREEN → REFACTOR: teste falhando, ver falhar, código mínimo, ver passar | `test-driven-development` | Tipos e padrões de teste do projeto: `Testes.md` | Teste + código no mesmo passo |
| 6 | **Bug ou teste falhando** — causa raiz antes de qualquer correção | `systematic-debugging` | Teste que reproduz o bug **antes** da correção (`Testes.md` §2) | Causa documentada + teste de regressão |
| 7 | **Verificar antes de dizer "pronto"** | `verification-before-completion` | `yarn quality`, `yarn build` (+ Strapi), `yarn smoke`, navegador 375/768/1440 — `Pull-Request.md` Parte A | Evidência (saída dos comandos) — nunca "deve funcionar" |
| 8 | **Revisar** | `requesting-code-review` · `receiving-code-review` (ao receber comentários) | Skill `pr-code-review` (lente do ADAI) | Achados por severidade; críticos bloqueiam |
| 9 | **Finalizar a branch** | `finishing-a-development-branch` | `Pull-Request.md` Parte B, skills `generate-pr-description` / `push-changes` / `pre-merge` | PR aberto (com pedido explícito) ou branch mantida |

Etapas que podem ser puladas: só as que o próprio superpowers dispensa para o caminho escolhido (ex.: *bounded* não tem spec nem plano escrito). **TDD (5) e verificação (7) nunca são puladas.**

Outras skills úteis: `dispatching-parallel-agents` (tarefas independentes em paralelo), `writing-skills` (criar skill nova para o projeto — salvar em `.agents/skills/` **e** `.claude/skills/`), `diagnosing-superpowers` (quando o método se comportou mal numa sessão).

## 4. Onde as regras do ADAI Hub prevalecem

Ordem de precedência: **pedido do usuário** → `AGENTS.md` e `.agents/rules/` → skills do superpowers → comportamento padrão do agente.

| Ponto | Superpowers sugere | No ADAI Hub |
| --- | --- | --- |
| Commits | Commit frequente a cada tarefa | Commit **só com pedido/autorização explícita** do usuário (aprovar a execução de um plano "com commits" conta como autorização para os commits **locais** daquele plano). `git add` com caminhos explícitos; Conventional Commits em pt-BR |
| Push, PR, merge | `finishing-a-development-branch` oferece merge/PR | Push e PR **só com pedido explícito**; **merge nunca** sem o usuário; nunca auto-merge |
| Spec e plano | `docs/superpowers/specs/` e `docs/superpowers/plans/` | Mesmos caminhos, versionados (outro dev/IA continua de onde parou), **em português** |
| Plano de ação | `writing-plans` | É o padrão. A skill do projeto `action-plan` (em `documents/planos/`, fora do Git) só quando o usuário pedir explicitamente esse formato |
| Testes | TDD | TDD + tipos do projeto (funcionalidade, característica, integração, smoke) + piso de cobertura — `Testes.md` |
| "Pronto" | Verificação com evidência | Verificação + 5 pilares com Strapi e Next rodando + DoD (`Definition-of-Done.md`) |
| Segredos | — | Nunca ler/repetir valores de `.env`; nunca `NEXT_PUBLIC_` em chave de API |

## 5. Para devs (sem agente)

1. Escreva o desenho (bounded: 3–5 frases no PR/issue; architectural: spec em `docs/superpowers/specs/`) e combine com o time antes de codar.
2. Branch própria; `yarn quality` verde antes de começar.
3. Teste primeiro, veja falhar, implemente o mínimo, veja passar, refatore.
4. Bug: reproduza com teste, ache a causa raiz, corrija.
5. Antes de push/PR: `Pull-Request.md` inteiro, com evidência.

## 6. Como o agente deve se comportar (resumo)

- Antes de qualquer ação: checar se alguma skill se aplica e anunciar qual está usando.
- Não implementar sem o desenho aprovado (bounded) ou spec + plano aprovados (architectural).
- Escrever o teste antes do código; mostrar a falha e depois o sucesso.
- Nunca dizer que terminou sem a saída de `yarn quality` / `yarn build` / `yarn smoke` nesta sessão.
- Ao final, apresentar as opções de finalização (manter branch, commit, PR) e **esperar o usuário**.
