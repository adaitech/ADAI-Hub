---
name: action-plan
description: Cria e executa planos de ação estruturados com os documentos PLANO e CHECKLIST_EXECUCAO, no mínimo 3 soluções comparadas e validação final pelo Definition of Done. Use quando o usuário pedir "plano de ação", "action plan", "plano de trabalho" ou um plano estruturado para implementar uma feature ou projeto.
---

# Plano de Ação

Adaptada da skill `action-plan` do vitru-portal. Gera dois documentos com **timestamp** no nome (nunca sobrescrever planos existentes) e fecha com o **Definition of Done**.

## 1. Gerar timestamp

Formato `YYYY-MM-DD_HH-mm-ss`.

```powershell
Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
```

```bash
date +%Y-%m-%d_%H-%M-%S
```

Usar o **mesmo** valor nos dois arquivos.

## 2. Criar os dois documentos

**Local:** `documents/planos/` na raiz do repositório (pasta ignorada pelo Git).

| Documento | Nome do arquivo | Conteúdo |
| --- | --- | --- |
| Plano de trabalho | `PLANO_[NOME]_[TIMESTAMP].md` | Contexto, 3+ soluções, comparação, recomendação, segurança, testes |
| Checklist de execução | `CHECKLIST_EXECUCAO_[NOME]_[TIMESTAMP].md` | Fases, tarefas com Teste/Validação, progresso, notas, problemas |

`[NOME]` = slug curto em maiúsculas (ex.: `HOME_HERO`, `AGENDA`, `MINISTERIOS`), igual nos dois.

## 3. Plano de trabalho — seções obrigatórias

- **Contexto e requisitos** — o que será feito e **por quê**, incluindo como serve à visão (`Visao-do-Projeto.md`: Amar a Deus, Servir as Pessoas, Influenciar o Mundo).
- **Mínimo de 3 soluções propostas**.
- **Comparação** — tabela (complexidade, a11y, performance, manutenção, autonomia do editor no Strapi, custo).
- **Detalhamento técnico da recomendada** — arquivos, contrato Strapi (se houver), componentes, vitrine.
- **Considerações de segurança**.
- **Dependências** — justificar qualquer lib nova (`Stack-Fontes-e-Bibliotecas.md` §5).
- **Próximos passos**.
- **Plano de testes** — unitários (normalize, componentes), vitrine (variantes), manuais (teclado, mobile), Lighthouse (Performance/A11y/Best Practices/SEO).

Apresentar o plano e **aguardar aprovação** antes de executar.

## 4. Checklist de execução — estrutura

- **Status geral** (ex.: 0/4 fases).
- **Fases** com sub-tarefas; cada tarefa tem:
  - `- [ ]` checkbox
  - **Teste:** o que testar depois
  - **Validação:** como confirmar que está certo
- **Status de cada fase** (Pendente / Em andamento / Concluída + data).
- **Checklist final de validação** (inclui DoD).
- **Notas de execução** e **Problemas encontrados**.

## 5. Execução

**Antes:** plano + checklist criados, **aprovação do usuário**.

**Durante:** uma tarefa por vez → testar → marcar no checklist → registrar problemas → atualizar "Última atualização".

**Ao fim de cada fase:** revisar tarefas, rodar testes da fase, atualizar status e data.

**Ao concluir tudo (obrigatório):**

1. Checklist final.
2. **Definition of Done completo** (`.agents/rules/Definition-of-Done.md`):
   - IA: `cd next && yarn quality && yarn build` (e `cd strapi && yarn build` se mexeu no CMS); análise estática de a11y e HTML semântico; vitrine e docs atualizados.
   - Sugerir ao humano: teclado, leitor de tela, Lighthouse, dispositivo real, página montada no Strapi.
3. Documentar pendências.
4. Atualizar docs do projeto.
5. **Resumo para PR** (template do DoD §8).

## 6. Checklist de qualidade do plano (antes de apresentar)

- [ ] 3+ soluções com comparação clara e recomendação justificada
- [ ] Segurança e dependências cobertas
- [ ] Toda tarefa tem **Teste** e **Validação**
- [ ] Testes unitários, vitrine, manuais e Lighthouse previstos
- [ ] Timestamp nos dois arquivos; salvos em `documents/planos/`
- [ ] Checklist termina com validação do DoD

## 7. Referência

Template completo: [`TEMPLATE_PLANO_ACAO.md`](TEMPLATE_PLANO_ACAO.md). Resumo do DoD: [`reference.md`](reference.md).
