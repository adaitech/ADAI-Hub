# Action Plan — Referência

## Documentos do projeto

- Template (estrutura e processo): `.agents/skills/action-plan/TEMPLATE_PLANO_ACAO.md`
- Definition of Done (validação e resumo de PR): `.agents/rules/Definition-of-Done.md`

## Nomes de arquivo

- Plano: `documents/planos/PLANO_[NOME]_YYYY-MM-DD_HH-mm-ss.md`
- Checklist: `documents/planos/CHECKLIST_EXECUCAO_[NOME]_YYYY-MM-DD_HH-mm-ss.md`

Mesmo timestamp e mesmo `[NOME]` nos dois.

## DoD (resumo)

Ao concluir o plano:

1. **IA (automático):** `cd next && yarn quality && yarn build`; `cd strapi && yarn build` se o CMS mudou.
2. **IA (análise):** a11y e HTML semântico no código alterado; vitrine, mock, guia do editor e docs coerentes.
3. **Humano (sugerir):** teclado, leitor de tela, Lighthouse, celular real, página montada no Strapi.
4. **Doc:** resumo para PR conforme template do DoD.
