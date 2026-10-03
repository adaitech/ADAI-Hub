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
| **Gates** | `yarn quality`, `yarn build` (next), `yarn build` (strapi se tocado), `yarn smoke` | `Definition-of-Done.md`, `Pull-Request.md` |

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
4. `## 1. Meta` — head, base, modo, risco (baixo/médio/alto + motivo), contagem de arquivos (A/M/D).
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

Não fazer commit nem push. Para rodar os gates, recomendar a skill `pre-merge`.
