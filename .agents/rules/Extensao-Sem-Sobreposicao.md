---
description: Open/Closed — estender e fazer override escopado, nunca sobrescrever código compartilhado
alwaysApply: true
---

# Extensão sem sobreposição (Open/Closed, SOLID)

> **Testes obrigatórios antes de qualquer Pull Request:** todo código novo ou alterado chega ao PR com teste unitário escrito e passando (`yarn quality`). Tipos e exigências: [`Testes.md`](./Testes.md) · checklist antes de subir e de abrir o PR: [`Pull-Request.md`](./Pull-Request.md).
>
> **Método de trabalho:** sempre o do **superpowers** (brainstorming → plano → TDD → verificação → revisão → finalização) — [`Metodo-Superpowers.md`](./Metodo-Superpowers.md).

**Adaptado de:** vitru-portal.

Princípio inegociável: **aberto para extensão, fechado para modificação**. Para atender uma necessidade de uma seção ou página, **estenda** ou crie um **override escopado**; **nunca** reescreva um componente compartilhado para servir a um único caso.

Isso é o que permite reutilizar a mesma seção na Home, nas páginas de ministério e em campanhas sem que uma mudança quebre as outras.

## O que é compartilhado

- `src/components/ui/*` (Button, Heading, Card, RichText…)
- `src/components/layout/*` (Header, Footer)
- `src/components/sections/*` quando usada por mais de uma página (a regra: **toda seção é potencialmente compartilhada**)
- `src/styles/tokens.css`, `src/lib/*`, `src/utils/*`

## Regras

- **Não modifique código compartilhado para resolver uma necessidade local.** Mudar comportamento/estilo dele para servir a uma tela acopla features e quebra outros usos.
- **Para adaptar um componente compartilhado, escolha (nesta ordem):**
  1. **Props/extensão:** se aceita configuração (`variante`, `tamanho`, `className`, slot), use-a. Se falta um ponto de extensão, **adicione uma prop opcional e retrocompatível** (default = comportamento atual) — isso é extensão.
  2. **Nova opção no CMS:** se a variação é editorial (ex.: fundo escuro), adicionar valor de enumeration no Strapi com default atual, atualizar doc, mock, normalize e vitrine.
  3. **Override escopado por CSS:** envolver o uso com uma classe própria e sobrepor via seletor de maior especificidade **sem `!important`** (ex.: `.contexto .botao { … }`). O arquivo compartilhado fica intacto.
  4. **Wrapper/composição:** criar um componente que compõe o compartilhado e aplica a regra, deixando o original inalterado.
- **Nunca** usar `!important` para vencer estilo alheio.
- **Retrocompatibilidade:** extensão não pode mudar o comportamento de quem já consome. Default = comportamento atual. A vitrine `/componentes` deve continuar mostrando as variantes antigas iguais.
- **Tokens:** não alterar o valor de um token para "consertar" um componente — isso muda todos. Criar token novo (e documentar em `Design-Tokens.md`) ou usar outro existente.

## Checklist antes de editar um arquivo existente

1. É **compartilhado**? (quase tudo em `components/` é)
2. Existe ponto de extensão (prop/variante/opção no CMS)? Use-o.
3. Não existe? Adicione prop opcional retrocompatível **ou** faça override escopado.
4. Vou mudar comportamento/estilo de que outro uso depende? Se sim, **pare** e pergunte.
5. Conferir na vitrine que as variantes existentes continuam iguais.
