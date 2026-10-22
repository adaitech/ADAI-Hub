# Área logada da equipe da EBA — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A equipe da EBA entra no Hub, consulta alunos (com o resultado dos testes) e gerencia turmas, sem expor dado pessoal fora das telas da equipe. Tudo nasce **desligado** (sem `EBA_EQUIPE_SEGREDO`, 404).

**Architecture:** login numa Server Action (o bearer do Identity fica num cookie `httpOnly` cifrado) → guarda de sessão em toda rota de `/eba/equipe/*` → chamadas à API da EBA só do servidor, com o bearer → telas de apresentação. Rotas no grupo `(restrito)`, sem analytics.

**Spec:** `docs/superpowers/specs/2026-10-22-migracao-eba-4-area-logada-design.md`. Mesma branch da entrega 3 (`feat/eba-resultado`, decisão do Jonatan). Regras: `AGENTS.md`, `.agents/rules/Testes.md`, `.agents/rules/Pull-Request.md`.

## Global Constraints

- Variável nova, só servidor: `EBA_EQUIPE_SEGREDO` (32+ caracteres). Nunca `NEXT_PUBLIC_`. Ausente → 404.
- Senha e bearer nunca no navegador, `localStorage`, URL, log ou `dataLayer`.
- Toda ação confere a sessão **antes** de chamar a API; 401 da API encerra a sessão.
- Login: 5 tentativas por minuto por IP; mesma resposta para qualquer erro de credencial.
- Rotas em `app/(restrito)/`: sem GTM, rastreador nem aviso de cookies (teste de característica).
- Sem papéis: quem tem conta vê tudo (igual ao site atual; pergunta 3).

## Tasks

### Task 1: Cliente da API e sessão
**Files:** `lib/eba-api/client.ts` (bearer, `raiz`, PUT/DELETE), `lib/eba/selo.ts`, `lib/eba/equipe/{sessao,servidor,formato}.ts`, `lib/eba-api/equipe.ts`, `lib/eba-api/resultados.ts` (bearer)
- [x] Testes e implementação do selo AES-GCM genérico (o link do resultado passa a usá-lo).
- [x] Sessão da equipe (cookie cifrado, validade do token, teto de 8 h) e guarda do servidor (`exigirSessaoDaEquipe`).
- [x] `ebaFetch` com `bearer`, caminho na raiz e PUT/DELETE.
- [x] `entrar`, `listarAlunos` (paginado), `buscarAlunos`, `alunoDaEquipe`, turmas (listar todas as páginas, criar, editar, apagar), com validação igual à da API.

### Task 2: Ações
**Files:** `app/(restrito)/eba/equipe/acoes.ts`
- [x] `entrarNaEquipe` (limite, mesma resposta para credencial errada, cookie `httpOnly`), `sairDaEquipe`.
- [x] `buscarAlunosAcao`, `criarTurmaAcao`, `editarTurmaAcao`, `apagarTurmaAcao` (recusa turma com alunos).

### Task 3: Telas e rotas
**Files:** `components/eba/Equipe/*`, `app/(restrito)/eba/equipe/**`, `app/(restrito)/layout.tsx`
- [x] Login, menu, busca, tabela, paginação, detalhe do aluno, turmas (com confirmação).
- [x] Layout `(restrito)` sem GTM; rotas de `/eba/resultado` movidas para o grupo.
- [x] Teste de integração e teste de característica `area-restrita-sem-analytics`.

### Task 4: Documentação e verificação
- [x] `.env.example`, README, `docs/componentes/equipe-eba.md`, spec, plano, smoke.
- [ ] `yarn quality`, `yarn build` e `yarn smoke` (rodar a cada fatia).

## Próximas fatias (dependem das perguntas da spec §8)
- [ ] **Aulas em vídeo** (Strapi `aula`, 17 do DNA e 8 do Reset; Vimeo): depende da pergunta 2 (quem assiste) e da 6 (Vimeo).
- [ ] **QR codes dos testes** (lista de 5 QR com copiar): estático, sem pergunta aberta; precisa das imagens do site atual.
- [ ] **Ajuda**: página vazia no site atual, sem desenho.
- [ ] **Papéis** (pergunta 3) e **renovação da sessão com `/refresh`** (pergunta 5).
- [ ] Redirecionar `/dashboard/*` do site atual para o Hub, só na virada.
