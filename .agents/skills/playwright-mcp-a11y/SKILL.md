---
name: playwright-mcp-a11y
description: Valida UI e acessibilidade no browser (Playwright MCP ou browser integrado do agente) com axe-core (contraste/ARIA), snapshot, teclado e ordem de foco em viewport mobile. Alinhada a WCAG 2.2 AA e ao Definition of Done. Use para validação de a11y, axe numa rota, ordem de foco mobile, ou relatórios em documents/playwright.
---

# Validação de UI e Acessibilidade no browser

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`cd next && yarn quality`). Ver `.agents/rules/Testes.md` e o checklist `.agents/rules/Pull-Request.md` (antes de subir e antes de abrir o PR).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — `.agents/rules/Metodo-Superpowers.md`. Esta skill é um complemento do método, não um substituto.

Adaptada da skill `playwright-mcp-a11y` do vitru-portal. Mesmo espírito do `action-plan`: relatório com **timestamp**, checklist **Teste/Validação** e fechamento pelo **DoD**.

## Pré-requisitos

1. Aplicação acessível (ex.: `http://localhost:3000`). Para números próximos de produção: `cd next && yarn build && yarn start`.
2. Uma ferramenta de browser disponível na sessão: **Playwright MCP** (`browser_navigate`, `browser_snapshot`, `browser_run_code`…) **ou** o **browser integrado** do agente (navegar, ler página, executar JavaScript, redimensionar). Confirmar nomes e parâmetros no schema exposto antes de chamar.
3. Rotas típicas: página real (`/`) e a vitrine do componente (`/componentes/<slug>/preview?variante=completo`) — a vitrine isola o componente e facilita a auditoria.

## Referências

| Fonte | Resumo |
| --- | --- |
| `.agents/rules/Arquitetura-e-Governanca.md` §7 | WCAG 2.2 AA; teclado + foco visível; landmarks; ordem previsível |
| `.agents/rules/Definition-of-Done.md` | axe sem violação crítica; Lighthouse A11y ≥ 95; leitor de tela humano |
| [`reference.md`](reference.md) | Receitas: axe, ordem de Tab, ids duplicados |

## Onde gravar

| Tipo | Local |
| --- | --- |
| Relatório | `documents/playwright/VALIDACAO_[SLUG]_YYYY-MM-DD_HH-mm-ss.md` (copiar [`TEMPLATE_VALIDACAO_PLAYWRIGHT_MCP.md`](TEMPLATE_VALIDACAO_PLAYWRIGHT_MCP.md)) |
| Evidências | `documents/playwright/evidence/[TIMESTAMP]/` |

`documents/` é ignorado pelo Git — compartilhar achados na descrição do PR.

## Camadas (executar nesta ordem)

### A — Desktop (baseline, 1440px)

1. Navegar até a URL e aguardar carregar.
2. Snapshot/árvore de acessibilidade: roles, nomes, estados (`expanded`, `disabled`).
3. Teclado no alvo: `Tab`, `Shift+Tab`, `Enter`, `Esc`, setas; conferir `document.activeElement` quando útil.
4. Screenshots dos estados críticos; mensagens do console.

### B — axe-core (obrigatória)

5. Na mesma URL e estado, rodar axe conforme `reference.md` (tags WCAG 2 A/AA + 2.1 + 2.2).
6. Registrar total de violations por `impact`, lista resumida (`id`, `impact`, `help`, trecho do html) e `incomplete` se relevante.
7. Se CSP bloquear o script: registrar e usar fallback (extensão axe DevTools manual).

### C — Mobile + ordem de foco

8. Redimensionar para **375×812** (ou 390×844); nova snapshot.
9. Percorrer `Tab` desde o topo (skip link primeiro) e registrar a sequência (receita em `reference.md`). A ordem deve seguir a leitura visual (WCAG 2.4.3).
10. Menu mobile: abre com teclado, foco entra no menu, `Esc` fecha e devolve o foco ao botão.
11. Carrossel/listas horizontais: o foco não pula itens visíveis focáveis.

### D — Encerramento

12. Preencher o relatório (axe + mobile/Tab).
13. Declarar o que fica **só humano**: leitor de tela completo, Lighthouse completo, dispositivo real.

## Checklist antes de fechar

- [ ] axe executado (ou fallback documentado) — **0 critical** ou justificativa
- [ ] Desktop: Tab/foco no alvo; skip link funciona
- [ ] Mobile: resize + sequência de Tab registrada
- [ ] Screenshots e console referenciados
- [ ] DoD técnico: `yarn quality` / `yarn build` executados nesta sessão ou marcados ⏳
