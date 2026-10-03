---
description: Definition of Done — critérios para considerar qualquer atividade concluída
alwaysApply: true
---

# Definition of Done (DoD) — ADAI Hub

**Adaptado de:** vitru-portal (sem multi-marca, com Strapi e vitrine de componentes).

Uma atividade só está **DONE** quando:

- ✅ Código compila, lint e testes passam
- ✅ Acessibilidade verificada (WCAG 2.2 AA)
- ✅ Performance adequada (mobile primeiro)
- ✅ Validado em mobile e desktop
- ✅ **Vitrine `/componentes` e docs do componente atualizados**
- ✅ Resumo para PR criado

---

## 1. Validações da IA — automáticas

Na pasta `next/`:

```bash
yarn quality      # lint + typecheck + testes (gate estático)
yarn build        # build de produção
```

- [ ] TypeScript sem erros (sem `any` novo)
- [ ] Lint sem erros
- [ ] Testes passando (inclui `catalog.test.ts` da vitrine)
- [ ] Build de produção sem erros

Se alterou `strapi/` (schemas/componentes/config): `yarn build` em `strapi/`.

## 2. Componentes e CMS (específico do ADAI Hub)

Para **cada componente criado ou alterado**:

- [ ] **5 pilares verificados com Strapi e Next rodando** (`AGENTS.md` → Regra dos 5 pilares):
  - [ ] **Dados no CMS:** schema + guia do editor no painel + conteúdo cadastrado (seed de dev atualizado) — ou o motivo de não estar no Strapi no doc
  - [ ] **Página:** seção aparece numa página real vinda do Strapi (ex.: Home)
  - [ ] **Componente:** `/componentes/<slug>` com variações e guia do editor
  - [ ] **SEO:** conteúdo no HTML do servidor, `h1` único, hierarquia de títulos, `alt` e textos de link corretos
  - [ ] **Medição:** analisado se precisa de evento novo de `data_layer`; decisão registrada no doc; evento novo no catálogo + teste + plano (`docs/analytics/README.md`) + GTM
- [ ] Segue a anatomia de `Componentes-e-CMS.md` (types, normalize, populate, mock, showcase, teste, index)
- [ ] `normalize` cobre CMS incompleto (campo vazio, lista vazia, imagem sem alt) — com teste
- [ ] `.mock.json` idêntico ao JSON real do Strapi, com variantes `completo`, `minimo` (e `texto_longo` quando couber)
- [ ] Registrado no `sectionRegistry` (seções) — chave = nome técnico no Strapi
- [ ] **Vitrine atualizada**: `.showcase.ts` + `catalog.ts`; conferido em `/componentes/<slug>` em 375 / 768 / 1440
- [ ] **Controles na vitrine** para cada opção nova do Strapi (campo opcional, enum, booleano), ver `Vitrine-de-Componentes.md` §3.2
- [ ] Doc `docs/componentes/<nome>.md` criado/atualizado (skill `create-strapi-doc`), com status honesto (proposto / implementado / publicado no Strapi)
- [ ] Tokens: nenhum valor visual solto; tokens novos documentados em `Design-Tokens.md`
- [ ] Nenhuma dependência nova sem a justificativa de `Stack-Fontes-e-Bibliotecas.md` §5

## 3. Acessibilidade (análise da IA)

- [ ] HTML semântico (`<header>`, `<nav>`, `<main>`, `<footer>`, `<section aria-labelledby>`)
- [ ] Uma única `<h1>` por página; hierarquia de headings sem saltos
- [ ] Tudo interativo acessível por teclado, com foco visível
- [ ] `aria-label` em controles só com ícone
- [ ] `alt` descritivo (vindo do Strapi) ou `alt=""` se decorativa
- [ ] Contraste AA (texto sobre foto usa o degradê do token)
- [ ] `prefers-reduced-motion` respeitado

Validação no browser (quando houver UI interativa): skill `playwright-mcp-a11y` (axe + teclado + mobile).

## 4. Responsivo — mobile-first

- [ ] CSS base = mobile; apenas `min-width: 769px` / `1024px`
- [ ] Sem scroll horizontal em 375px
- [ ] Touch targets ≥ 44×44px
- [ ] Se não há Figma mobile: PR diz *"layout mobile proposto"* e o time validou

## 5. Performance

Quando o PR tocar página, imagem acima da dobra ou bundle:

- [ ] `next/image` com `sizes`; hero com `priority`
- [ ] `next/font` (sem fontes externas)
- [ ] Client Components mínimos
- [ ] Lighthouse **mobile ≥ 80** (skill `lighthouse-performance-mcp`), LCP < 2,5 s, CLS < 0,1

## 6. Validações do humano

A IA **não** executa estes testes completos; deve sugeri-los:

- [ ] Navegação completa só com teclado (Tab, Shift+Tab, Enter, Esc)
- [ ] Leitor de tela (NVDA no Windows / VoiceOver no iPhone)
- [ ] Dispositivo real (celular) nos fluxos principais
- [ ] Página montada **no Strapi** com a seção, conferindo que o editor entende os campos (labels/descrições)
- [ ] Lighthouse completo: Performance ≥ 80 (mobile), Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 90

## 7. Critérios de bloqueio

Uma atividade **NÃO** está pronta se:

- ❌ Erro de TypeScript, lint, teste ou build
- ❌ Componente novo/alterado **sem vitrine, mock ou doc**
- ❌ Componente que não está **no Strapi (com conteúdo), numa página e na vitrine** — os pilares não foram verificados com os dois servidores rodando
- ❌ Componente sem a decisão de **Medição** registrada no doc (evento existente ou novo de `data_layer`)
- ❌ Componente que faz fetch ou usa `ssr: false`
- ❌ Valor visual solto (hex/px) fora dos tokens
- ❌ CSS desktop-first (`max-width`) em código novo
- ❌ A11y abaixo de WCAG 2.2 AA
- ❌ Console do browser com erros

## 8. Resumo para PR (template)

```markdown
## O que mudou
- [comportamento/feature em linguagem natural]

## Componentes
- `next/src/components/sections/HeroSection/` — novo (vitrine: /componentes/hero)
- `strapi/src/components/sections/hero.json` — novo schema

## Como validar
- `cd next && yarn quality && yarn build`
- Abrir `/componentes/hero` e conferir 375 / 768 / 1440
- Página `/` montada no Strapi com a seção

## Validações realizadas
- ✅ quality / build (executados nesta sessão)
- ⏳ Leitor de tela e dispositivo real (humano)

## Observações
- [ex.: layout mobile proposto, sem Figma mobile]
```

**Nunca** marcar ✅ o que não foi executado nesta sessão — usar ⏳ com o que falta.
