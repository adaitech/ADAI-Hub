---
name: pr-code-review
description: Revisa uma Pull Request ou branch contra a base, cruza descrição, diff, impacto, testes, acessibilidade e as regras do ADAI Hub, e grava documents/github/CODE_REVIEW.md. Use para pedidos de code review, revisão de PR, análise de branch ou avaliação antes de aprovar.
---

# Code review de Pull Request

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`cd next && yarn quality`). Ver `.agents/rules/Testes.md` e o checklist `.agents/rules/Pull-Request.md` (antes de subir e antes de abrir o PR).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — `.agents/rules/Metodo-Superpowers.md`. Esta skill é um complemento do método, não um substituto.

Adaptada (versão condensada) da skill `pr-code-review` do vitru-portal.

## Papel

Atuar como **dev sênior frontend** do ADAI Hub (Next 16, React 19, TypeScript, CSS Modules + tokens, Strapi 5, WCAG 2.2 AA, performance mobile). Cruzar descrição × diff × código, apontar riscos e lacunas frente às regras do projeto e escrever **`documents/github/CODE_REVIEW.md`** acionável.

- Não inventar regra de produto fora do PR, de `.agents/rules/` e de `Visao-do-Projeto.md`.
- O que só CI, browser ou leitor de tela confirmam → **⏳ pendente**, nunca "ok".
- Sempre avaliar **impacto**: quem mais consome o que mudou (toda seção é potencialmente usada em várias páginas).
- **Não copiar** segredos do diff (tokens, `.env`) para o relatório ou chat.
- Tom humano, dev-para-dev, com reforço positivo quando merecido.
- **A revisão por IA complementa, não substitui o aprovador humano.** O veredicto 🎯 é uma recomendação; a aprovação final do PR é da coordenação do Tech (CODEOWNERS). Nunca aprovar, mergear nem postar no PR sem pedido explícito.
- **Dois momentos, dois papéis.** (1) **Antes de abrir o PR, o próprio autor roda esta skill na sua máquina** (autorrevisão obrigatória, §0) e corrige o que ela apontar. (2) **Depois de aberto, outra pessoa roda de novo** como revisão oficial. A autorrevisão nunca conta como a revisão oficial.

## 0. Autorrevisão local (obrigatória antes de abrir o PR)

Todo dev, antes de `git push` do PR ou de `gh pr create`, roda `/pr-code-review` **na própria máquina** e **corrige o que pegar**, sem esperar o revisor:

1. Rodar a skill contra `origin/main` (modo escolhido pela §3).
2. **🔴 e 🟡 viram correção** (com teste, quando for comportamento). 💡 é opcional. ⏳ vira item na seção Validações do PR.
3. Rodar de novo até **não restar 🔴 nem 🟡**. O veredicto final deve ser ✅ ou 🟡 justificado por escrito.
4. No PR, uma linha: *"Autorrevisão: pr-code-review rodado em <data>, veredicto 🎯 <X>; corrigidos: …; aceitos: …"*.
5. `documents/github/CODE_REVIEW.md` fica local (a pasta é ignorada pelo Git). Não commitar.

Se o autor pulou a autorrevisão, o revisor oficial devolve o PR sem revisar (🔴 "rodar a §0").

## 1. Dados

- **Head:** branch citada no chat; se nenhuma, a branch atual (`git symbolic-ref --short HEAD`).
- **Base:** `main`, salvo indicação.
- Artefatos (gerar em `documents/github/`):

```bash
mkdir -p documents/github
git fetch origin
git diff --name-status origin/main...HEAD > documents/github/pr-diff-files.txt
git diff origin/main...HEAD > documents/github/pr-diff.patch
```

Diff vazio → confirmar branch/base antes de escrever.

### 1.1 Contexto do time

- Identificar **autor e frente** em `docs/projeto/CONTROLE.md` (§1) e citar na Meta. PR de frente que não é do autor, ou fora do escopo da frente, vira 🟡 (escopo).
- **CI:** conferir `gh pr checks <n>`. CI vermelho → veredicto no máximo 🔴 "Não mergear até o CI ficar verde"; não reescrever o que o CI já mostra, só apontar.
- **Tamanho:** mais de ~40 arquivos → 🟡 salvo justificativa na descrição; sugerir como dividir (por assunto, não por pasta). O CI só alerta, não bloqueia.
- **Trilha pelo tipo de PR** (escolher antes de revisar, com uma linha no chat):

| Trilha | Quando | Lente |
| --- | --- | --- |
| **Site / Strapi** | `next/`, `strapi/`, `docs/componentes/` | Tabela da §2 completa |
| **Infra** | Terraform/Bicep, Helm/K8s, Dockerfile, `.github/workflows/` | §2.1 |
| **Dados** | dashboards, Silver, ETL, Power BI/admin de dados | §2.2 |
| **Docs / chore** | só `docs/`, `.agents/`, config sem runtime | Enxuto: links válidos, regra coerente com `AGENTS.md`, sem segredo |

## 2. Lente de revisão (o que o projeto exige)

| Área | O que procurar | Regra |
| --- | --- | --- |
| **Arquitetura** | Server Component por padrão; `'use client'` justificado; nada de `ssr: false`; fetch só em `src/lib/strapi/` | `Arquitetura-e-Governanca.md` |
| **Componentes/CMS** | Anatomia completa (types, normalize, populate, mock, showcase, teste, doc); normalize trata CMS incompleto; chave do registry = nome técnico no Strapi; mock bate com a API | `Componentes-e-CMS.md` |
| **Vitrine** | Componente novo/alterado tem `.showcase` + entrada no catálogo; variantes completo/minimo | `Vitrine-de-Componentes.md` |
| **Guia do editor** | `strapi/src/editor-guide/*.json` cobre todos os campos; textos claros para não-dev | skill `create-strapi-doc` |
| **Governança** | Nenhum campo de cor/HTML/CSS livre no Strapi | `Componentes-e-CMS.md` §2.4 |
| **Tokens/CSS** | Sem hex/px soltos; mobile-first com `min-width` 769/1024; sem scroll horizontal em 375 | `Design-Tokens.md`, `CSS-Mobile-First.md` |
| **Compartilhado** | Alteração em ui/layout/sections preserva comportamento antigo (prop opcional, override escopado) | `Extensao-Sem-Sobreposicao.md` |
| **A11y** | Semântica, uma `h1`, `aria-labelledby`, teclado/foco, `alt`, `aria-label` em ícones, reduced motion | `Arquitetura-e-Governanca.md` §7 |
| **Performance** | `next/image` com `sizes`/`priority`; `next/font`; JS no cliente mínimo | `Arquitetura-e-Governanca.md` §8 |
| **Dependências** | Lib nova justificada e documentada | `Stack-Fontes-e-Bibliotecas.md` §5 |
| **Visão** | A mudança serve a Amar/Servir/Influenciar, ou é efeito sem propósito? | `Visao-do-Projeto.md` |
| **Testes** | Todo código novo/alterado tem teste no diff; bug corrigido tem teste que o reproduz; nada de `it.skip`/`it.only`; piso de cobertura não baixou; teste não foi "ajustado para passar" | `Testes.md` |
| **Escopo e tamanho** | Um assunto só; dentro da frente do autor; ≤ ~40 arquivos ou justificado; sem arquivo alheio (ex.: tipos gerados do Strapi por engano) | `Pull-Request.md` A1, B2 |
| **SEO** | Página/rota nova: `generateMetadata` com `title` e `description` únicos, canonical, Open Graph; um `h1`; entra no sitemap (e fora dele se for interna); conteúdo no HTML do servidor; `robots` coerente; URL nova com redirect da antiga, se houver | `Definition-of-Done.md`, `docs/componentes/*` (SEO) |
| **Medição (GA4/GTM)** | Página/seção/botão/link novo tem `data-section`, `clique_cta` e o evento específico do plano (`docs/analytics/README.md` §3); `ver_secao` nas seções novas; **sem dado pessoal** em `texto`/`destino`/parâmetros (e-mail, telefone, nome); sem evento duplicado; teste de analytics para comportamento novo. Os eventos vistos no `dataLayer` estão **descritos** no PR (o que foi clicado → o que chegou); "testei" sem lista é 🟡. Print não é obrigatório | `Pull-Request.md` A4 |
| **Segurança** | Nenhum segredo no diff (`.env`, tokens, chaves, e-mails/telefones pessoais); nada de `NEXT_PUBLIC_` com segredo; chave de API só no header; `'use client'` sem código de servidor; `dangerouslySetInnerHTML` só no GTM; mudança em `proxy`, `next.config`, CSP, CORS, `middlewares.ts` do Strapi ou `package.json` exige 🟡 de atenção e revisão do dono; dependência nova passa em `yarn audit`; entrada de usuário (formulário de oração/testemunho/GC) validada no servidor, com anti-spam e consentimento LGPD | `docs/seguranca/README.md`, `Pull-Request.md` A5 |
| **CI** | Checks do GitHub Actions verdes; falha não é "flaky" sem prova | `.github/workflows/ci.yml` |
| **Gates** | `yarn quality`, `yarn build` (next), `yarn build` (strapi se tocado), `yarn smoke` | `Definition-of-Done.md`, `Pull-Request.md` |

### 2.1 Lente de Infra (Azure / CI-CD)

- Plano da mudança anexado ou descrito (`terraform plan`, `helm template`/`lint`, `az` dry-run) — sem plano é ⏳.
- Segredos só no Key Vault/GitHub Secrets; nenhum valor no diff, em `values.yaml` ou em logs do workflow.
- Separação **hml × prod**: mudança em prod exige aprovação humana no pipeline; namespace e domínio corretos.
- HPA, limites de CPU/memória, probes e réplicas definidos; rollback descrito (como voltar em minutos).
- Imagens com versão fixa (nunca `latest`); permissões do workflow mínimas (`permissions:`).
- Custo: recurso novo ou maior declara o impacto estimado.

### 2.2 Lente de Dados (dashboards / Silver)

- Cada indicador tem **definição escrita** (o que conta, fonte, período) e um dono do dado que validou os números.
- Sem dado pessoal exposto (nome, telefone, e-mail, pedido de oração/testemunho identificável); LGPD respeitada e agregação mínima definida.
- Fonte única: indicador da igreja vem do inChurch/Silver; nada de planilha paralela sem justificativa.
- Números conferem com a fonte (amostra comparada, não só "carregou"); filtros e período padrão claros.
- Acesso: quem vê o quê está definido; credenciais fora do repositório.

## 3. Proporcionalidade

Escolher o modo **antes** de escrever, com uma linha no chat: *"Modo X porque…"*.

| Modo | Quando | Tamanho |
| --- | --- | --- |
| **Enxuto** | Diff pequeno, um tema, sem 🔴/🟡, sem arquivo de alto impacto | Leitura de 1–2 min |
| **Médio** | Vários arquivos ou só 💡/⏳ | Seções curtas |
| **Completo** | Qualquer 🔴/🟡; layout raiz, `next.config`, `lib/strapi`, registry, schema do Strapi, `package.json`, tokens | Detalhado onde agrega |

Encontrou 🔴/🟡 no meio de um enxuto → escalar o modo.

## 4. Estrutura do `CODE_REVIEW.md`

1. `# 📋 Code review — <branch>`
2. `## Legenda` — uma linha: **✨** destaque · **✅** ok no diff/gate executado · **⏳** falta CI/humano/browser (Nota com gatilho) · **🔭** N/A · **🟡** importante · **🔴** bloqueante · **💡** sugestão · **🎯** veredicto.
3. `## Saudação ao autor` — 2–5 frases dev-para-dev: o que a branch faz, leitura de risco, gates.
4. `## 1. Meta` — head, base, **autor e frente** (do `CONTROLE.md`), trilha, modo, risco (baixo/médio/alto + motivo), contagem de arquivos (A/M/D), **estado do CI**.
5. `## 2. ✨ Destaques` — específicos e honestos (uma frase se o PR for mínimo).
6. `## 3. Impacto` — quem consome o que mudou (páginas/seções), quando aplicável.
7. `## 4. Descrição × código` — promessas do PR vs. diff.
8. `## 5. 🔍 Achados` — 🔴 → 🟡 → 💡. Cada um: **o quê** (arquivo/trecho) → **por quê importa** (regra) → **o que quebra** → **o que fazer**. Sem achados: *"Sem 🔴 nem 🟡."*
9. `## 6. Checklist ADAI` — tabela `Área | Estado | Nota` (Estado sempre com ícone; 🔭 com "N/A: motivo"), com as áreas da §2.
10. `## 7. Próximos passos` — gates pendentes, `pre-merge`, `playwright-mcp-a11y`/`lighthouse-performance-mcp` se houver UI/rota.
11. `## Conclusão` — **🎯 veredicto acionável** (*"✅ Mergear após CI"* / *"🟡 Mergear após ajustar X em `path`"* / *"🔴 Não mergear até Y"*) + **um** próximo passo.

Gates: marcar ✅ **só** se executados nesta sessão ou com evidência explícita; senão ⏳ com gatilho.

## 5. Chat

Curto e proporcional: 3–6 frases no enxuto, veredicto 🎯, próximo passo, e `### Legenda` no final só com os ícones usados.

## 6. Depois da revisão (só com pedido do usuário)

- **Postar no PR:** `gh pr comment <n> --body-file documents/github/CODE_REVIEW.md` — comenta, **não** aprova nem pede mudanças. Postar é ação externa: confirmar antes.
- **Registrar** a linha do PR na tabela de `docs/projeto/CONTROLE.md` (§5): PR, autor, frente, veredicto 🎯, merge.
- **Aprovação e merge** são humanos (coordenação do Tech). A IA não aprova nem mergeia.
- Autor corrige com teste, roda de novo a Parte A de `Pull-Request.md`, dá push; nova revisão só do que mudou.

Não fazer commit nem push. Para rodar os gates, recomendar a skill `pre-merge`.
