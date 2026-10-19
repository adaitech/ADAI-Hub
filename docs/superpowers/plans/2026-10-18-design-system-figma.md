# Design system do Figma — plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Levar o design system do Figma `adai.com.br` para o ADAI Hub: tokens canônicos em `tokens.css`, consumidores incompatíveis migrados, referência em Markdown, style guide HTML e template de página, com testes de contrato.

**Architecture:** `next/src/styles/tokens.css` é a fonte executável; os dois HTMLs autocontidos repetem o mesmo conjunto canônico de custom properties e um teste de característica (`design-system.test.ts`) garante que nomes e valores não divergem. Os HTMLs nascem do protótipo aprovado (`docs/prototipo/index.html`, 2026-10-18), com os nomes de token trocados pelos canônicos.

**Tech Stack:** CSS custom properties, CSS Modules (Next 16), HTML5 estático, Jest (`next/jest`) para testes de característica em Node.

**Spec:** `docs/superpowers/specs/2026-10-18-design-system-figma-design.md`

## Global Constraints

- Não commitar, não fazer push, não abrir PR sem pedido explícito do usuário (AGENTS.md). Os passos "Commit" deste plano viram "não commitar".
- Não iniciar, encerrar nem reiniciar os servidores do Next/Strapi; não exportar o snapshot do Strapi. `yarn build` e `yarn quality` são permitidos.
- Preservar as alterações locais da branch `codex/agenda`; não usar stash/reset.
- Não baixar, versionar nem incorporar arquivos da Suisse Intl. Pilha dos HTMLs: `"Suisse Intl", "SuisseIntl-Book", "Inter Tight", Inter, Arial, Helvetica, sans-serif` (pilha do protótipo aprovado; a spec citava só Arial/Helvetica como fallback).
- Breakpoints só `@media (min-width: 769px)` e `(min-width: 1024px)`, mobile-first; nenhuma cor fora de `tokens.css` nos `.module.css`.
- Classificação obrigatória em tudo que for documentado: **Observado**, **Derivado**, **Proposto**; valor ausente = **não identificado**.
- O Figma MCP está bloqueado (limite do assento View, 2026-10-18). Não há nova extração neste plano; o inventário registra o nível de leitura de cada prancha e as pendências.
- HTMLs sem dependência de rede: nenhum `src`/`href` de `<script>`, `<link>`, `<img>` com `http(s)://`, nenhum `@import`/`url(http…)`.

## Valores canônicos (fonte para todas as tasks)

Observados nas variáveis/estilos do Figma em 2026-10-18 (tracking do Figma em % = `em`):

| Token | Valor em `tokens.css` | Origem |
| --- | --- | --- |
| `--gray-200` (novo) | `#e8e8e8` | O `cor/superficie-2` |
| `--color-bg-subtle-2` (novo) | `var(--gray-200)` | O cor · P uso (hover de card) |
| `--font-size-display` | `clamp(48px, 9.03vw, 130px)` | O 130 · P mínimo |
| `--font-size-h1` (novo) | `clamp(2.5rem, 5.417vw, 4.875rem)` | O 78 · P mínimo |
| `--font-size-h2` (redefinido) | `clamp(2rem, 3.333vw, 3rem)` | O 48 · P mínimo |
| `--font-size-h3` | `1.75rem` | O 28 |
| `--font-size-h4` (novo) | `1.25rem` | O 20 |
| `--font-size-numero` (novo) | `clamp(4rem, 5.972vw, 5.375rem)` | O 86 · P mínimo |
| `--font-size-marca` (novo) | `clamp(96px, 30vw, 432px)` | O 432 · P mínimo |
| `--font-size-corpo` (novo) | `1.125rem` | O 18 |
| `--font-size-corpo-pequeno` (novo) | `1rem` | O 16 |
| `--font-size-legenda` (novo) | `0.9375rem` | O 15 |
| `--font-size-micro` (novo) | `0.8125rem` | O 13 |
| `--font-size-botao` (novo) | `1rem` | O 16 Bold |
| `--font-size-link-menu` (novo) | `var(--font-size-corpo-pequeno)` | D (menu usa Corpo pequeno) |
| `--line-height-display` / `--letter-spacing-display` | `0.88` / `-0.055em` | O |
| `--line-height-h1` / `--letter-spacing-h1` (novos) | `0.95` / `-0.045em` | O |
| `--line-height-h2` / `--letter-spacing-h2` | `0.98` / `-0.04em` | O |
| `--line-height-h3` / `--letter-spacing-h3` (novo) | `1.1` / `-0.03em` | O |
| `--line-height-h4` / `--letter-spacing-h4` (novos) | `1.15` / `-0.02em` | O |
| `--line-height-numero` / `--letter-spacing-numero` (novos) | `0.85` / `-0.06em` | O |
| `--line-height-marca` / `--letter-spacing-marca` (novos) | `0.78` / `-0.07em` | O |
| `--line-height-legenda` (novo) | `1.45` | O |
| `--radius-sm` | `14px` | O `raio/pequeno` |
| `--radius-md` / `--radius-lg` / `--radius-pill` | `20px` / `28px` / `999px` | O |
| `--space-section` | `clamp(64px, 8.333vw, 120px)` | D 120 · P mínimo |
| `--content-max` (novo) | `80rem` | O 1280 |
| `--space-page-margin` (novo) | `clamp(16px, 5.556vw, 80px)` | O 80 · P mínimo |
| `--container-max` | `90rem` (inalterado: shell de 1440) | O |

Aliases de migração (comentário `/* alias: migrar para --x */` em cada um): `--font-size-mega → var(--font-size-marca)`, `--line-height-mega → var(--line-height-marca)`, `--letter-spacing-mega → var(--letter-spacing-marca)`, `--font-size-lead → var(--font-size-corpo)`, `--font-size-body → var(--font-size-corpo-pequeno)`, `--font-size-xs → var(--font-size-micro)`, `--font-size-chamada → var(--font-size-h1)`, `--line-height-chamada → var(--line-height-h1)`, `--letter-spacing-chamada → var(--letter-spacing-h1)`. Permanecem como estão, documentados como Derivado/Proposto do projeto: `--font-size-body-lg` (17), `--font-size-sm` (14), `--font-size-destaque` (32), `--font-size-chamada-apoio` (20). **Abertura** não foi identificado: nenhum token é criado; fica como pendência.

## Review Focus

1. Título de seção de 78px em 375px: `--font-size-h1` cai para 40px; palavras longas ("Programação", "Ministérios") não podem estourar — verificação no browser (Task 5) e `overflow-wrap` já presente nos módulos.
2. Cadeia de alias quebrada: um alias apontando para token inexistente quebraria em silêncio — coberto pelo teste existente "todo var(--token) usado existe" (Task 1 roda a suíte inteira).
3. `--color-text-muted` sobre `--color-bg-subtle-2` dá 4,35:1 (falha AA): o teste de contraste da Task 1 registra o par como **proibido** e a documentação o declara.
4. Footer: `line-height` do "ADAI" muda de 0,72 para 0,78 e pode reabrir sobreposição com o link da Política — verificar clique na Política em 375/1440 (Task 5).
5. Template copiado por outra equipe (EBA) sem os assets: referências de imagem relativas devem existir no repositório — teste da Task 3 confere que todo `src` local aponta para arquivo existente.

---

### Task 1: Tokens canônicos em `tokens.css`

**Files:**
- Create: `next/src/__tests__/caracteristicas/design-system.test.ts`
- Modify: `next/src/styles/tokens.css`

**Interfaces:**
- Produces: em `design-system.test.ts`, helpers exportáveis no próprio arquivo: `lerTokens(css: string): Map<string, string>` (custom properties do primeiro bloco `:root`, valor normalizado: espaços colapsados, minúsculas para hex), `resolver(tokens, nome): string` (segue `var()` até um literal), `contraste(hexA: string, hexB: string): number` (WCAG 2.2). Constante `TOKENS_CANONICOS: string[]` = todos os nomes da tabela "Valores canônicos" exceto aliases.

- [ ] **Step 1: Escrever os testes `describe('tokens canônicos')`**

```ts
it.each([
  ['--radius-sm', '14px'], ['--space-section', 'clamp(64px, 8.333vw, 120px)'],
  ['--content-max', '80rem'], ['--space-page-margin', 'clamp(16px, 5.556vw, 80px)'],
  ['--font-size-h1', 'clamp(2.5rem, 5.417vw, 4.875rem)'], ['--font-size-h2', 'clamp(2rem, 3.333vw, 3rem)'],
  ['--font-size-display', 'clamp(48px, 9.03vw, 130px)'], ['--gray-200', '#e8e8e8'],
])('%s = %s', (nome, valor) => expect(tokens.get(nome)).toBe(valor));

it('todo token canônico existe', () => expect(TOKENS_CANONICOS.filter((t) => !tokens.has(t))).toEqual([]));

it('aliases apontam para o canônico', () => {
  expect(tokens.get('--font-size-mega')).toBe('var(--font-size-marca)');
  expect(tokens.get('--font-size-lead')).toBe('var(--font-size-corpo)');
  expect(tokens.get('--font-size-chamada')).toBe('var(--font-size-h1)');
});

it.each([
  ['--color-text-muted', '--color-bg-page'], ['--color-text-muted', '--color-bg-subtle'],
  ['--color-text-primary', '--color-bg-subtle-2'], ['--color-text-inverse', '--color-bg-inverse'],
])('contraste AA: %s sobre %s', (t, f) => expect(contraste(resolver(tokens, t), resolver(tokens, f))).toBeGreaterThanOrEqual(4.5));

it('par proibido documentado: texto suave sobre superfície 2 falha AA', () =>
  expect(contraste(resolver(tokens, '--color-text-muted'), resolver(tokens, '--color-bg-subtle-2'))).toBeLessThan(4.5));
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd next && yarn jest src/__tests__/caracteristicas/design-system.test.ts`
Expected: FAIL — `--radius-sm` recebe `12px`, `--font-size-h1` indefinido.

- [ ] **Step 3: Atualizar `tokens.css`** com a tabela "Valores canônicos" e os aliases, cada valor com comentário curto de origem (`/* O Figma raio/pequeno */`, `/* P mínimo */`). Atualizar o cabeçalho do arquivo citando a spec.

- [ ] **Step 4: Rodar a suíte inteira**

Run: `cd next && yarn test`
Expected: PASS, inclusive `css.test.ts` ("todo var(--token) usado existe").

- [ ] **Step 5: Não commitar** (Global Constraints).

### Task 2: Migrar títulos de seção para H1

Os sete consumidores de `--font-size-h2` são títulos de seção/página que no Figma usam o estilo **H1** (linha de 74px). Com `--font-size-h2` redefinido para 48, eles precisam apontar para H1.

**Files:**
- Modify (regra de título com `--font-size-h2`, `--line-height-h2`, `--letter-spacing-h2` → `-h1`): `next/src/components/sections/AgendaEventosSection/AgendaEventosSection.module.css`, `.../AgendaEventosSection/EventoDetalhe.module.css`, `.../CarrosselCardsSection/CarrosselCardsSection.module.css`, `.../ImagemTextoSection/ImagemTextoSection.module.css`, `.../MinisteriosSection/MinisteriosSection.module.css`, `.../PerguntasFrequentesSection/PerguntasFrequentesSection.module.css`, `.../TextoRicoSection/TextoRicoSection.module.css`
- Modify: `next/src/components/layout/Footer/Footer.module.css` (`--font-size-mega` → `--font-size-marca`, idem line-height/letter-spacing), `next/src/components/sections/TextoBotoesSection/TextoBotoesSection.module.css` (`--*-chamada` → `--*-h1`)
- Test: `next/src/__tests__/caracteristicas/design-system.test.ts`

**Interfaces:**
- Consumes: tokens da Task 1.

- [ ] **Step 1: Teste `describe('migração')`**

```ts
it('nenhum módulo usa aliases de migração', () => {
  const ALIASES = ['--font-size-mega', '--line-height-mega', '--letter-spacing-mega', '--font-size-chamada', '--line-height-chamada', '--letter-spacing-chamada'];
  expect(modulos.flatMap(({ arquivo, fonte }) => ALIASES.filter((a) => fonte.includes(`var(${a})`)).map((a) => `${arquivo}: ${a}`))).toEqual([]);
});
it('títulos de seção usam H1: nenhum módulo usa --font-size-h2 com --line-height-h1', () => { /* regra com h2 e h1 misturados */ });
```

`modulos` = todos os `.module.css` de `src/` sem comentários (mesma leitura do `css.test.ts`). O segundo teste percorre cada regra `{…}` e falha se ela misturar tokens `-h1` e `-h2`.

- [ ] **Step 2: Rodar e ver falhar** (`yarn jest …/design-system.test.ts` → Footer e TextoBotoes listados).
- [ ] **Step 3: Trocar os tokens nos nove arquivos.** Só a tripla tamanho/linha/tracking da regra de título; nada mais muda. `--font-size-lead`, `--font-size-body` e `--font-size-xs` continuam permitidos (alias sem custo) e ficam como pendência de limpeza.
- [ ] **Step 4: `cd next && yarn test`** → PASS.
- [ ] **Step 5: Não commitar.**

### Task 3: Style guide e template HTML

**Files:**
- Create: `docs/design-system.html` (área "Design system" do protótipo + barra de navegação interna com skip link + grid 1280 dentro de shell 1440 demonstrado)
- Create: `templates/adai-page-template.html` (página típica do protótipo: anúncio, top bar, header, hero, editorial, grade de cards, próximos eventos, CTA, formulário, footer), com comentários `<!-- TROCAR: … -->` nos pontos de conteúdo, imagem e destino, e comentários `<!-- VARIAÇÃO: ministério | próximo passo | evento | mensagens | institucional -->` com a classe modificadora `pagina--<variacao>` no `<body>`
- Create: `docs/assets/design-system/` (mover de `docs/prototipo/assets/`: `hero-adai.jpg`, `primeira-vez-culto.jpg`, `card-2.jpg`, `lideranca-rodrigo-tati-soeiro.jpg`, `logo-a.svg`, `logo-adai.svg`)
- Delete: `docs/prototipo/` (conteúdo absorvido pelos dois arquivos; não versionado)
- Modify: `C:\ADAI\.claude\launch.json` — config `prototipo-ds` passa a servir `ADAI-Hub` (raiz) para abrir `/docs/design-system.html` e `/templates/adai-page-template.html`
- Test: `next/src/__tests__/caracteristicas/design-system.test.ts`

**Interfaces:**
- Consumes: `lerTokens`, `TOKENS_CANONICOS` (Task 1).
- Produces: `PRANCHAS` (15 IDs da spec §2.1) e `COMPONENTES` (12 IDs da spec §2.2) no arquivo de teste, usados também na Task 4.

- [ ] **Step 1: Testes `describe.each([docs/design-system.html, templates/adai-page-template.html])`**

```ts
it('tem lang pt-BR, viewport e um único h1', …);
it('todo input/select/textarea tem <label for> correspondente', …);
it('sem dependência de rede nem fonte proprietária', () => {
  expect(html).not.toMatch(/<(script|link|img)[^>]+(src|href)="https?:/i);
  expect(html).not.toMatch(/@import|url\(\s*['"]?https?:|@font-face|\.woff2?|\.otf|\.ttf/i);
});
it('todo src/href local aponta para arquivo existente', …); // ignora #âncoras, mailto: e rotas "/…" do site
it('sem placeholder: nada de TODO, TBD, lorem ipsum', () => expect(html).not.toMatch(/\bTODO\b|\bTBD\b|lorem ipsum/i));
it('tokens compartilhados iguais aos de tokens.css', () => {
  const doHtml = lerTokens(primeiroStyle(html));
  const divergentes = [...doHtml].filter(([n, v]) => tokens.has(n) && tokens.get(n) !== v);
  expect(divergentes).toEqual([]);
  expect(TOKENS_CANONICOS.filter((t) => !doHtml.has(t))).toEqual([]);
});
```

Só para `docs/design-system.html`: `it('cita as 15 pranchas e os 12 componentes', …)` com `PRANCHAS`/`COMPONENTES`; `it('tem as marcações Observado, Derivado e Proposto', …)`.

- [ ] **Step 2: Rodar e ver falhar** (arquivos inexistentes).
- [ ] **Step 3: Gerar os dois HTMLs a partir do protótipo.** Renomear os tokens do protótipo para os canônicos (ex.: `--cor-superficie` → `--gray-100`/`--color-bg-subtle`, `--fs-h1` → `--font-size-h1`, `--raio-pequeno` → `--radius-sm`, `--margem-pagina` → `--space-page-margin`, `--secao-y` → `--space-section`); tokens só de documentação (ex.: `--color-alert`, `--duration-*`) podem existir no HTML sem existir no `tokens.css`, mas nunca com o mesmo nome e valor diferente. Caminhos de imagem: `assets/design-system/…` (style guide) e `../docs/assets/design-system/…` (template). Manter JS só como melhoria progressiva (menu, setas, validação, marcações).
- [ ] **Step 4: `cd next && yarn jest …/design-system.test.ts`** → PASS.
- [ ] **Step 5: Não commitar.**

### Task 4: `docs/design-system.md` e regras do projeto

**Files:**
- Create: `docs/design-system.md` — seções na ordem: 1. Visão geral · 2. Evidências e inventário (15 pranchas, 12 componentes, nível de leitura de cada uma, bloqueio do Figma MCP) · 3. Tipografia (14 estilos da spec: 12 com valores, **Abertura** e **Link menu** com classificação; Book × Bold; licença e mapeamento Suisse Book → Inter/Inter Tight 400, Suisse Bold → 700) · 4. Cores e contraste (tabela com pares, incluindo o par proibido) · 5. Espaçamento · 6. Layout e breakpoints · 7. Formas · 8. Componentes (finalidade, anatomia, medidas, estados observados × propostos, uso/antiuso, a11y, para os 12 IDs) · 9. Padrões de página (5 variações do template) · 10. Boas práticas · 11. Inventário de propostas · 12. Pendências (licença Suisse, mobile, Abertura, cinza #6B6B6B, nós não extraídos)
- Modify: `.agents/rules/Design-Tokens.md` (tabelas §2–§5 com os tokens novos, aliases e status ✅/🟡 coerentes com a tabela "Valores canônicos"; §8 com as pendências reais)
- Modify: `.agents/rules/Stack-Fontes-e-Bibliotecas.md` §2 (mapeamento Book/Bold → Inter/Inter Tight; pilha dos HTMLs autocontidos)
- Test: `next/src/__tests__/caracteristicas/design-system.test.ts`

- [ ] **Step 1: Testes `describe('docs/design-system.md')`**

```ts
it('cita as 15 pranchas e os 12 componentes', …);
it('cita todos os TOKENS_CANONICOS com o mesmo valor de tokens.css', …); // procura a linha da tabela com `--nome` e o valor
it('nenhuma seção vazia: todo título tem conteúdo antes do próximo', …);
it('sem placeholder', …);
it('Design-Tokens.md cita todos os TOKENS_CANONICOS', …);
```

- [ ] **Step 2: Rodar e ver falhar.**
- [ ] **Step 3: Escrever o Markdown e atualizar as duas regras.**
- [ ] **Step 4: `cd next && yarn jest …/design-system.test.ts`** → PASS.
- [ ] **Step 5: Não commitar.**

### Task 5: Verificação final

- [ ] **Step 1:** `cd next && yarn quality` → lint, typecheck e `test:ci` passam, cobertura acima do piso.
- [ ] **Step 2:** `cd next && yarn build` → build conclui sem erro.
- [ ] **Step 3:** Abrir `docs/design-system.html` e `templates/adai-page-template.html` (config `prototipo-ds`) em 375, 768, 1024 e 1440: `document.documentElement.scrollWidth <= innerWidth`, nenhum título cortado, Tab percorre tudo com foco visível, menu abre/fecha com Enter/Esc, formulário mostra resumo de erros.
- [ ] **Step 4:** Páginas do Next já no ar no servidor do usuário (sem reiniciá-lo), se estiver rodando: conferir em 375 e 1440 os títulos de seção (78px no desktop), o footer (link da Política clicável) e um card com `--radius-sm`. Se o servidor não estiver rodando, registrar como pendente.
- [ ] **Step 5:** Relatório ao usuário: o que mudou visualmente (títulos 72 → 78, raio 12 → 14, respiro de seção 129,6 → 120), o que ficou pendente e que nada foi commitado.
