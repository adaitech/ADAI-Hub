# Validação de A11y — Referência

## Ferramentas

- **Playwright MCP:** `browser_navigate`, `browser_snapshot`, `browser_press_key`, `browser_take_screenshot`, `browser_evaluate`, `browser_console_messages`, `browser_resize`, `browser_run_code` (recebe `async (page) => {...}`).
- **Browser integrado do agente:** navegar, ler árvore de acessibilidade, executar JavaScript na página, redimensionar viewport, ler console. Nas receitas abaixo, usar o **corpo** das funções `page.evaluate` diretamente no executor de JavaScript.

Confirmar nomes/parâmetros no schema da sessão antes de chamar.

---

## Receita: axe-core

Pré-condição: página no estado a auditar (ex.: menu mobile aberto **e** fechado, se ambos forem críticos).

**Playwright (`browser_run_code`):**

```javascript
async (page) => {
  await page.addScriptTag({ url: 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js' });
  return await page.evaluate(async () => {
    const results = await axe.run(document, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    });
    return {
      violationCount: results.violations.length,
      violations: results.violations.map((v) => ({
        id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
        firstHtml: v.nodes[0]?.html?.slice(0, 300),
      })),
      incompleteCount: results.incomplete.length,
    };
  });
}
```

**Executor de JavaScript (browser integrado):**

```javascript
await new Promise((resolve, reject) => {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';
  s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});
const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] } });
({ violations: r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length, firstHtml: v.nodes[0]?.html?.slice(0, 300) })), incomplete: r.incomplete.length })
```

CSP bloqueou → registrar "axe: fallback manual" e usar axe DevTools na mesma URL/estado.

---

## Receita: ordem de foco (Tab)

```javascript
async (page) => {
  const steps = [];
  let previous = null;
  for (let i = 0; i < 80; i++) {
    await page.keyboard.press('Tab');
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const name = el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 80) || '';
      return { tag: el.tagName, id: el.id || null, role: el.getAttribute('role'), name: name.replace(/\s+/g, ' ') };
    });
    if (!info) break;
    const sig = `${info.tag}#${info.id}|${info.name.slice(0, 40)}`;
    if (sig === previous && i > 2) break;
    previous = sig;
    steps.push({ step: i + 1, ...info });
  }
  return JSON.stringify(steps, null, 2);
}
```

Esperado no ADAI Hub: **skip link → logo → links do menu (ou botão do menu no mobile) → CTAs do header → conteúdo (CTAs do hero) → … → footer**.

Red flags: foco invisível; foco entrando em elemento escondido; CTA do hero antes do menu; menu mobile aberto sem prender foco.

---

## Receita: ids duplicados

```javascript
(() => {
  const seen = new Map();
  document.querySelectorAll('[id]').forEach((el) => seen.set(el.id, (seen.get(el.id) || 0) + 1));
  return [...seen.entries()].filter(([, n]) => n > 1);
})()
```

---

## Matriz

| Área | Ferramenta |
| --- | --- |
| Contraste / ARIA | axe |
| Ordem de foco | loop de Tab + análise |
| Layout mobile | resize + snapshot/screenshot |
| Leitor de tela | Humano (NVDA / VoiceOver) |

## Anti-padrões

- `tabindex > 0` para "corrigir" ordem.
- Ordem visual diferente da ordem do DOM (CSS `order`) sem ajuste.
- Múltiplos `<main>` ou nenhum.
