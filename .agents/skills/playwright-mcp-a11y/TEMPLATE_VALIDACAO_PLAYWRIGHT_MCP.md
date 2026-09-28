# Validação de A11y no browser — [NOME]

**Timestamp:** YYYY-MM-DD_HH-mm-ss
**Ambiente:** [URL base] · `next start` / `next dev`
**Rota(s):** [ex.: / e /componentes/hero/preview?variante=completo]
**Responsável:** [agente / pessoa]

## Resumo

- **Objetivo:** [1–3 frases]
- **Resultado:** ✅ Aprovado / ⚠️ Aprovado com ressalvas / ❌ Bloqueado
- **Bloqueadores:** [ou "Nenhum"]

## Cenários

| # | Cenário | Status |
| --- | --- | --- |
| 1 | [ex.: navegar do skip link até os CTAs do hero só com teclado] | ✅ / ⚠️ / ❌ |

## Evidências

| Arquivo | Descrição |
| --- | --- |
| [caminho] | [estado] |

## Console

- Erros: [ou "Nenhum"]
- Warnings: [ou "Nenhum relevante"]

## axe-core

| Campo | Valor |
| --- | --- |
| Estado auditado | [ex.: home carregada, menu fechado] |
| Execução | Playwright / browser integrado / fallback manual |
| Total de violations | [n] |
| Critical / Serious | [n / n] |

```
[id] impact — help — trecho html
```

## Mobile + ordem de foco

| Campo | Valor |
| --- | --- |
| Viewport | [375×812] |
| Ponto de partida | [topo / skip link] |

| # | tag | role | id | nome |
| --- | --- | --- | --- | --- |
| 1 | | | | |

- [ ] Ordem coerente com a leitura visual (WCAG 2.4.3)
- [ ] Menu mobile: abre por teclado, `Esc` fecha e devolve o foco
- **Notas:**

## Checklist — navegação e foco

- [ ] Tab até o alvo e interação sem mouse — **Teste:** · **Validação:**
- [ ] Foco visível em todos os estados — **Teste:** · **Validação:**
- [ ] `Esc` / fechamento devolve foco (se aplicável) — **Teste:** · **Validação:**

## Checklist — semântica

- [ ] Landmarks (`header`, `nav`, `main`, `footer`) e uma `h1` — **Teste:** · **Validação:**
- [ ] Nomes acessíveis (links, botões, ícones) — **Teste:** · **Validação:**
- [ ] `alt` das imagens — **Teste:** · **Validação:**

## Coberto vs. pendente humano

| Verificação | Automático | Humano |
| --- | --- | --- |
| Snapshot / semântica | ✅ / ❌ | |
| Teclado sintético | ✅ / ❌ | |
| axe | ✅ / ❌ | |
| Ordem de Tab | ✅ / ❌ | Confirmar com leitor de tela |
| Lighthouse A11y ≥ 95 | N/A | ⬜ |
| Leitor de tela | N/A | ⬜ |

## DoD técnico (se executado nesta sessão)

- [ ] `cd next && yarn quality`
- [ ] `cd next && yarn build`

## Notas e problemas

[...]
