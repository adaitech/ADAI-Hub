<!--
Antes de abrir este PR, rode o checklist de .agents/rules/Pull-Request.md (Parte A e B).
Nenhum PR sem teste: todo código novo ou alterado tem teste unitário (.agents/rules/Testes.md).
Marque ✅ só o que rodou nesta sessão; o resto é ⏳ com o motivo.
-->

> ⚠️ **Tamanho:** o ideal é até ~40 arquivos e um assunto só. Passou disso? Explique abaixo por que não dá para dividir.

## O que mudou

<!-- Comportamento em linguagem natural, decisões e trade-offs. Componente novo: rota da vitrine (/componentes/<slug>) e o que o editor passa a poder fazer no Strapi. -->

## Testes

<!-- Quais testes foram escritos ou alterados, e de que tipo. -->

- Funcionalidade (unitário):
- Característica:
- Integração:
- Bug corrigido → teste que reproduz:

## Como validar

```bash
cd next && yarn quality && yarn build
cd strapi && yarn build        # se mexeu no Strapi
cd next && yarn smoke          # com Strapi e Next rodando
```

Rotas para abrir (375 / 768 / 1440):

## Validações

- [ ] Autorrevisão: `/pr-code-review` rodado na minha máquina, 🔴/🟡 corrigidos — veredicto 🎯: ___
- [ ] `yarn quality` (lint + typecheck + testes + cobertura)
- [ ] `yarn build` (next)
- [ ] `yarn build` (strapi) — ou não se aplica
- [ ] `yarn smoke`
- [ ] Navegador: console sem erros, sem scroll lateral em 375, teclado ok
- [ ] Design system (`docs/design-system.md`; checklist A4.1 de `Pull-Request.md`) — ou não se aplica:
  - [ ] só tokens canônicos (sem alias de migração nem valor inventado)
  - [ ] tipografia do Figma: título de seção em H1, Bold em títulos/números/ações, Book em textos
  - [ ] contraste AA: texto secundário em #6B6B6B, nada de texto suave sobre #E8E8E8
  - [ ] anatomia e estados dos componentes conforme o doc; o que não está no Figma marcado como Proposto (nunca como Observado)
  - [ ] alvos ≥ 44 × 44, foco visível, hover/ativo/desabilitado conferidos
- [ ] 5 pilares (Dados no CMS, Página, Componente, SEO, Medição) — ou não se aplica
- [ ] Medição validada: cada página, botão e link novo/alterado clicado com os eventos conferidos no `window.dataLayer` (`clique_cta` + evento específico, `ver_secao` nas seções novas) — listar o que foi visto
- [ ] Snapshot do Strapi (`strapi/data/adai-conteudo.tar.gz`) exportado e revisado — obrigatório quando mexer no Strapi, enquanto o projeto usar o Strapi local; ou não se aplica
- [ ] Sem segredos no diff
- [ ] Docs atualizados (componente: Medição e Testes)
- [ ] ⏳ Validação humana (leitor de tela, celular real) — quando houver UI

## Pendências e riscos

<!-- O que ficou de fora, o que depende de humano/produção, impacto em outras páginas. -->
