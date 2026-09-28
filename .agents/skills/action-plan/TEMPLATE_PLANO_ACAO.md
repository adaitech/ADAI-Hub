# Template de Plano de Ação

Usar sempre que o usuário pedir um plano de ação. Criar **novos** documentos com data e hora no nome.

---

## 1. `PLANO_[NOME]_YYYY-MM-DD_HH-mm-ss.md`

```markdown
# Plano — [Título]

**Data:** YYYY-MM-DD HH:mm · **Autor:** [agente/pessoa] · **Status:** Aguardando aprovação

## Contexto e requisitos
[O que, por quê, para quem. Como isso ajuda a Amar a Deus, Servir as Pessoas ou Influenciar o Mundo.]

## Soluções propostas
### Solução A — [nome]
[descrição, prós, contras]
### Solução B — [nome]
### Solução C — [nome]

## Comparação
| Critério | A | B | C |
|---|---|---|---|
| Complexidade | | | |
| Acessibilidade | | | |
| Performance (mobile) | | | |
| Autonomia do editor no Strapi | | | |
| Manutenção | | | |

## Recomendação
[Qual e por quê]

## Detalhamento técnico
- Contrato Strapi: [componentes/campos — ou N/A]
- Arquivos em `next/src/`: [...]
- Vitrine: [entradas novas/alteradas]
- Docs: [docs/componentes/...]

## Segurança
[...]

## Dependências
[Nenhuma nova / lib X — justificativa conforme Stack-Fontes-e-Bibliotecas.md §5]

## Plano de testes
- Unitários: [normalize, componentes]
- Vitrine: [variantes completo/minimo/texto_longo]
- Manuais: [teclado, 375/768/1440, página no Strapi]
- Lighthouse: [rota]

## Próximos passos
[...]
```

---

## 2. `CHECKLIST_EXECUCAO_[NOME]_YYYY-MM-DD_HH-mm-ss.md`

```markdown
# Checklist de execução — [Título]

**Status geral:** 0/N fases · **Última atualização:** YYYY-MM-DD HH:mm

## Fase 1 — [nome] · Status: Pendente
- [ ] [Tarefa]
  - **Teste:** [...]
  - **Validação:** [...]

## Fase 2 — [nome] · Status: Pendente
- [ ] [Tarefa]
  - **Teste:** [...]
  - **Validação:** [...]

## Checklist final
- [ ] `cd next && yarn quality`
- [ ] `cd next && yarn build`
- [ ] `cd strapi && yarn build` (se mexeu no CMS)
- [ ] Vitrine `/componentes` atualizada e conferida em 375/768/1440
- [ ] Docs `docs/componentes/` e guia do editor atualizados
- [ ] Definition of Done validado (`.agents/rules/Definition-of-Done.md`)
- [ ] Resumo para PR criado

## Notas de execução
[...]

## Problemas encontrados
| Problema | Solução | Data |
|---|---|---|
```

---

## Processo

**Antes:** plano com 3+ soluções → checklist → **aprovação do usuário**.
**Durante:** uma tarefa por vez, testar, marcar, registrar problemas, atualizar data.
**Após cada fase:** revisar, testar integração, atualizar status e data de conclusão.
**Após tudo:** checklist final → DoD completo → pendências documentadas → resumo para PR.
