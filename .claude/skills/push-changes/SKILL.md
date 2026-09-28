---
name: push-changes
description: Analisa alterações Git, prepara documents/PR.md e publica somente os arquivos autorizados via commit e push. Use apenas quando o usuário pedir explicitamente para preparar e enviar alterações, fazer commit e push ou publicar a branch atual.
---

# Publicar alterações

Adaptada da skill `push-changes` do vitru-portal. **Só executar com pedido explícito** de commit/push.

1. Analisar `git status` e `git diff` (staged e unstaged). Confirmar com o usuário quais arquivos entram se houver algo fora do escopo.
2. Gerar `documents/PR.md` seguindo **exatamente** `.agents/skills/generate-pr-description/SKILL.md`.
3. Gates antes do commit (ou registrar ⏳ se não for possível): `cd next && yarn quality && yarn build`; `cd strapi && yarn build` se o CMS mudou.
4. Conferir que não há segredo no diff (`.env`, tokens, chaves de API). Se houver, **parar** e avisar.
5. `git add` com **caminhos explícitos** (ou `git add -p`) — nunca `git add .` / `git add --all`.
6. `git commit` em **Conventional Commits** em português (ex.: `feat(home): adiciona hero vindo do Strapi`).
7. `git push` (com `-u origin <branch>` na primeira vez). **Nunca** force push em `main`.
8. `documents/PR.md` fica fora do commit (pasta ignorada) — serve para colar no GitHub.

Se usar ícones na mensagem ao usuário, terminar com um bloco curto `### Legenda`.
