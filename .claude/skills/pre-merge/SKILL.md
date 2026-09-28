---
name: pre-merge
description: Executa os gates locais do ADAI Hub antes de um merge — quality (lint + typecheck + testes) e build do Next, build do Strapi quando aplicável e Lighthouse quando pedido. Use para pedidos de pré-merge, validação final, check antes do merge ou verificação completa da branch.
---

# Pré-merge — validação local antes do merge

Adaptada da skill `pre-merge` do vitru-portal.

**Objetivo:** rodar o pacote mínimo que o projeto exige **antes do merge**, sem substituir code review nem CI. É o último check na máquina de quem vai mergear.

**Como invocar:** `/pre-merge`, `/pre-merge completo` ou pedidos equivalentes ("check antes do merge").

**Fonte de verdade:** `.agents/rules/Definition-of-Done.md`.

---

## Legenda (usar na resposta)

| Símbolo | Significado |
| --- | --- |
| ✅ | Rodou com sucesso nesta máquina |
| ❌ | Falhou — não sugerir merge |
| ⏭️ | Não rodado / não aplicável nesta execução |
| ⏳ | Pendente (usuário, outro comando, CI) |
| 🧪 | Lint + typecheck + testes (`yarn quality`) |
| 🏗️ | Build (`yarn build`) |
| 🗄️ | Build do Strapi |
| 📊 | Lighthouse / performance |
| ♿ | Acessibilidade (axe, teclado, leitor de tela) |
| 🎯 | Veredicto |

Tom claro e caloroso: o usuário deve sentir progresso, não só ver uma lista de comandos.

---

## Núcleo (obrigatório)

| Passo | Comando | Onde |
| --- | --- | --- |
| 🧪 1 | `yarn quality` | `next/` |
| 🏗️ 2 | `yarn build` | `next/` |
| 🗄️ 3 | `yarn build` — **só se o diff tocar `strapi/`** | `strapi/` |

Opcional: 📦 `yarn install` só se pedido ou erro de módulo; 📊 Lighthouse só com "completo", URL ou rota na mensagem.

## O que isto **não** é

- ❌ Code review de diff → skill `pr-code-review`.
- ❌ Garantia de WCAG completa → fase humana do DoD ♿.
- ❌ Substituto de CI.

---

## Fluxo

0. **Contexto:** `git status` e `git diff --stat` contra a base (`main`, salvo indicação). Se o diff toca `next/src/components/`, lembrar da vitrine (`catalog.test.ts` roda dentro do `yarn quality`).
1. **🧪** `cd next && yarn quality` → ❌ para aqui, resumir erros por arquivo.
2. **🏗️** `cd next && yarn build` → ❌ para aqui.
3. **🗄️** se o diff tocar `strapi/`: `cd strapi && yarn build`.
4. **📊 (opcional)** skill `lighthouse-performance-mcp` na rota indicada.
5. Montar a resposta.

Se algum script ainda não existir (repositório em migração), marcar ⏳ com o motivo — **nunca** ✅.

---

## Saída

1. **Resumo** (1–2 frases): pronto para merge localmente ou não.
2. **Checklist** com ícones.
3. Se ❌: próximo passo concreto.
4. Se tudo ✅: bloco **"✨ Quer ir além?"** com comandos prontos:

```bash
# 📊 Performance mobile na Home (servidor de produção local)
cd next && yarn build && yarn start
# em outro terminal:
npx lighthouse http://127.0.0.1:3000 --only-categories=performance --form-factor=mobile --screenEmulation.mobile --output=json --output-path=../documents/lighthouse/home-mobile.json --chrome-flags="--headless=new"
```

Convites: *"Quer axe + teclado na rota? Uso a skill `playwright-mcp-a11y`."* / *"Quer revisão do diff? `pr-code-review`."*

5. **🎯 Veredicto** (uma linha). Ex.: *"🎯 Núcleo verde — pode mergear."* / *"🎯 Quase: corrija o ❌ acima e rodamos de novo."*
6. **`### Legenda`** no final, só com os ícones usados.

Não fazer `git merge` nem `push` sem pedido explícito.
