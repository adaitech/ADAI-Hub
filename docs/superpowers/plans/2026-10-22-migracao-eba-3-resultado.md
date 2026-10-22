# Página de resultado dos testes da EBA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/eba/resultado/<codigo>` mostra os resultados salvos dos testes do CDV sem expor dado pessoal; entra desligada, até as decisões da spec §7.

**Architecture:** código opaco (AES-256-GCM) → página do servidor com limite por IP → `lib/eba-api/resultados.ts` pelo APIM → `ConteudoResultado` do Questionário.

**Spec:** `docs/superpowers/specs/2026-10-22-migracao-eba-3-resultado-design.md`. Branch: `feat/eba-resultado` (a partir de `feat/eba-testes`). Regras: `AGENTS.md`, `.agents/rules/Testes.md`, `.agents/rules/Pull-Request.md`.

## Global Constraints

- Variável nova, só servidor: `EBA_RESULTADO_SEGREDO` (32+ caracteres). Nunca `NEXT_PUBLIC_`. Ausente → 404.
- Validade máxima do link: 30 dias. A emissão exige a validade explícita (spec §7, pergunta 2).
- Limite: 20 aberturas por minuto por IP, antes de decifrar.
- Resposta única (404) para: sem segredo, limite, código inválido/expirado, aluno sem resultado.
- Logs: só a classe do erro; nunca id, código, IP ou corpo.
- Nada de nome, e-mail, turma ou id no HTML.

## Tasks

### Task 1: Código opaco
**Files:** `next/src/lib/eba/link-resultado.ts` + `.test.ts`
- [x] Teste: ida e volta, opacidade, adulteração, outro segredo, expiração, teto, tolerância de relógio, cookie de sessão rejeitado.
- [x] Implementar `segredoDoResultado`, `emitirLinkResultado`, `lerLinkResultado`.

### Task 2: Busca dos resultados salvos
**Files:** `next/src/lib/eba-api/resultados.ts` + `.test.ts`, `respostas.ts` (extrai `resultadoDeItens`), fixture `survey-result-aluno-nota.json`
- [x] Teste: 5 chamadas, 404 omite, `result` vigente, estilo sem somas, temperamento por `message`, erros lançam, id inválido não chama a rede.
- [x] Implementar; `Resultado.estilo` aceita `null` nas somas.

### Task 3: Componente
**Files:** `next/src/components/eba/Questionario/Resultado.tsx` + `.test.tsx`
- [x] Teste: `ConteudoResultado` sem botões; estilo sem somas; `sem-resultado`.
- [x] Exportar `ConteudoResultado`; omitir a lista Motivação/Organização quando `null`.

### Task 4: Página
**Files:** `next/src/app/(site)/eba/resultado/[codigo]/page.tsx` + `page.module.css`, `next/src/__tests__/integracao/eba-resultado.test.tsx`
- [x] Teste de integração (privacidade, 404 único, limite por IP, indisponível, metadata, logs).
- [x] Implementar a página.

### Task 5: Documentação e smoke
- [x] `next/.env.example`, `README.md`, `docs/componentes/questionario-eba.md`, `docs/projeto/CONTROLE.md`, smoke (`/eba/resultado/codigo-invalido-smoke` → 404).

### Task 6: Verificação
- [ ] `yarn quality` e `yarn build` em `next/`.
- [ ] `yarn smoke` com o site no ar (⏳ se Strapi não puder subir).

### Task 6a: Pedido do link por e-mail
**Files:** `lib/eba/email-resultado.ts`, `lib/eba/codigo-email.ts` (finalidade), `app/(site)/eba/resultado/{acoes.ts,validade.ts,page.tsx,resultado.module.css}`, `components/eba/PedirResultado/*`, `Resultado.tsx`/`Questionario.tsx` (prop `linkResultado`), `app/(site)/eba/{pagina-eba.tsx,testes/page.tsx}`
- [x] Testes e implementação do e-mail do link e do e-mail do código ("resultado").
- [x] Ações `pedirCodigoResultado` e `confirmarLinkResultado` (mesma resposta com e sem cadastro, falha fechada, limite por IP).
- [x] `PedirResultado` (e-mail → código → confira seu e-mail) e a página `/eba/resultado` (404 sem o segredo).
- [x] Entradas: faixa em `/eba/testes` e botão na tela de resultado, só com o recurso ligado.
- [ ] Botão "Consultar meus resultados" no CTA de `/eba` (Strapi: seed + snapshot), pendente.

## Fora deste plano (depende da spec §7)
Autorização da API para `SurveyResult`, fechar `GET Student/{id}` anônimo, confirmação do campo `result` em homologação.
