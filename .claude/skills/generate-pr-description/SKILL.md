---
name: generate-pr-description
description: Gera ou atualiza documents/PR.md a partir do diff e do histórico Git, em português e em formato humano. Use quando o usuário pedir descrição, corpo, resumo ou texto de Pull Request, sem pedir commit ou push.
---

# Gerar descrição de Pull Request

Adaptada da skill `generate-pr-description` do vitru-portal.

Gera ou atualiza **`documents/PR.md`** (pasta ignorada pelo Git) para **copiar** para o corpo do PR no GitHub. **Sem** commit nem push.

## Tom

Para revisores humanos: direto, sem repetição, sem "voz de relatório de agente" (nada de "este documento segue X", timestamps de script, tabelas de metadado).

## Estrutura (nesta ordem)

1. **`# Título`** curto — o que o PR faz.
2. **Uma linha** `branch → base` (ex.: `feature/home-hero` → `main`).
3. **Título sugerido** para o GitHub em Conventional Commits (ex.: `feat(home): hero, header e footer vindos do Strapi`).
4. **`## O que mudou`** — linguagem natural: comportamento, decisões, trade-offs. Se houver componente novo, citar a rota da vitrine (`/componentes/<slug>`) e o que o editor passa a poder fazer no Strapi.
5. **`## Arquivos`** — lista **completa** de caminhos (`git diff --name-only <base>...HEAD`). PR com 40+ arquivos: tabela `Caminho | Tipo (Novo/Modificado/Removido)`, cada caminho uma vez.
6. **`## Como validar`** — comandos reais:
   - `cd next && yarn quality && yarn build`
   - `cd strapi && yarn build` (se mexeu no CMS)
   - rotas para conferir (página e vitrine) e passos no Strapi, se aplicável.
7. **`## Checklist`** — 3 a 6 itens que o autor marca (ex.: vitrine conferida em 375/768/1440; guia do editor revisado).

## Não incluir (salvo pedido explícito)

- Legenda de ícones, blocos para agente, metadados de script.
- Seções genéricas "Observações/Links" só para preencher.

## Fonte

`git log <base>..HEAD`, `git diff <base>...HEAD`, `git diff --name-only <base>...HEAD`. Base padrão: **`main`** (confirmar se o time usar outra).

**Relacionado:** `push-changes` (mesmo formato de PR.md + commit/push).
