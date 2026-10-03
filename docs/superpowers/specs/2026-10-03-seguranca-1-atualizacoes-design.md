# Segurança — entrega 1: atualizações urgentes de dependências

> Método: superpowers (`.agents/rules/Metodo-Superpowers.md`) · Caminho: *architectural* (parte 1 de 4 do tema segurança)
> Branch: `fix/seguranca-atualizacoes` (a partir da `main` com o PR #3) · Data: 2026-10-03

## 1. Objetivo

Eliminar as vulnerabilidades **conhecidas e publicadas** nas dependências que vão para produção, antes de qualquer outra camada de segurança. Um site com cabeçalhos perfeitos e um Strapi com SQL injection conhecido continua vulnerável.

**Sucesso =**

1. `yarn audit --groups dependencies` sem **critical** nem **high** no `next/`.
2. No `strapi/`, nenhuma critical/high em pacote que roda no servidor de produção; o que sobrar (ferramentas de build/CLI que não rodam em produção) fica listado com o motivo em `docs/seguranca/README.md`.
3. Site, painel e conteúdo funcionando igual a antes: `yarn quality`, `yarn build` (next e strapi), `yarn smoke`, painel do Strapi abrindo, conteúdo intacto, pré-visualização funcionando.
4. Um teste impede voltar para versões vulneráveis.

## 2. Contexto (diagnóstico de 2026-10-03)

| Pacote | Hoje | Alvo | Por quê |
| --- | --- | --- | --- |
| `@strapi/strapi` + `@strapi/plugin-users-permissions` | 5.17.0 | **5.56.0** (última 5.x) | 13 críticas, entre elas: **vazamento de dados sensíveis por filtro relacional na API pública** (corrigido em 5.37.0) e **SQL injection no Content-Type Builder** (5.33.2); `@casl/ability` com prototype pollution (permissões do admin) |
| `@strapi/plugin-seo` | `^2.0.4` | **2.0.9 fixo** | A ferramenta de upgrade tenta fixá-lo em "5.17.0", versão que **não existe** (o plugin é 2.x) — quebraria a instalação |
| `next` | `^16.3.6` | **16.3.8** | Patch mais recente da 16.3 |
| `sharp` | `^0.34.0` | **`^0.35.4`** | 2 altas (libvips CVE-2026-33327/33328/35590; libheif). O Next 16.3.8 já exige `^0.35.4` |

Node local: 22.20.0 (Strapi 5.56 aceita 20–26).

## 3. Abordagem escolhida

**Ferramenta oficial `npx @strapi/upgrade minor`** (5.17 → 5.56 de uma vez), que atualiza as dependências `@strapi/*` e aplica os *codemods* das versões intermediárias.

Alternativas descartadas:
- *Trocar a versão no `package.json` à mão* — pula os codemods; risco de quebrar config/código silenciosamente.
- *Subir de minor em minor* — 39 versões; muito trabalho sem ganho (a ferramenta já aplica os codemods em sequência).

## 4. Passos

1. **Backup** (fora do Git): cópia de `strapi/.tmp/data.db` e de `strapi/public/uploads` em `documents/backup-strapi-2026-10-03/`; o snapshot versionado `strapi/data/adai-conteudo.tar.gz` também serve de volta.
2. **Linha de base:** `yarn quality` + `yarn smoke` verdes na branch antes de mexer (prova de que qualquer falha depois é da atualização).
3. **Teste primeiro (TDD):** `next/src/__tests__/caracteristicas/dependencias-seguras.test.ts` lê os `package.json` e falha se as versões estiverem abaixo do mínimo seguro (Strapi ≥ 5.37.0, plugin-seo fixo em 2.x, Next ≥ 16.3.8, sharp ≥ 0.35.4). Ver falhar com as versões de hoje.
4. **Strapi:** fixar `@strapi/plugin-seo` em `2.0.9` → `npx @strapi/upgrade minor --yes` → revisar o diff dos codemods arquivo a arquivo → `yarn install` → `yarn build` → `yarn develop`.
5. **Conferência do Strapi** com o servidor rodando:
   - migrações rodaram sem erro (log);
   - painel abre; guias do editor aplicados (descrições nos campos);
   - API `/api/pages` e `/api/global` devolvem o mesmo conteúdo (Home, Política, exemplos);
   - permissões públicas só de leitura (`find`/`findOne`) continuam;
   - botão **Pré-visualizar** abre o rascunho no site;
   - `types/generated` regenerados.
6. **Next:** `next@16.3.8` e `sharp@^0.35.4` → `yarn install`.
7. **Ver o teste do passo 3 passar** e rodar `yarn audit` nos dois apps; para o que restar no Strapi, decidir caso a caso: `resolutions` do Yarn quando a correção é compatível, ou registrar como risco aceito (pacote só de build/CLI) com o motivo.
8. **Gates:** `yarn quality`, `yarn build` (next e strapi), `yarn smoke` com Strapi e Next atualizados, navegador em 375/768/1440.
9. **Snapshot:** `yarn data:export` com o Strapi novo (o snapshot precisa ser importável pela 5.56); conferir que não contém admins nem tokens.
10. **Docs:** `docs/seguranca/README.md` (novo: diagnóstico, o que foi feito, riscos aceitos, como auditar) e `Stack-Fontes-e-Bibliotecas.md` (versões).

## 5. Riscos e volta

| Risco | Mitigação |
| --- | --- |
| Codemod altera config/código de forma indesejada | Revisar o diff completo antes do `yarn install`; nada vai para commit sem revisão |
| Migração do banco falha ou altera dados | Backup do passo 1; conferência de conteúdo do passo 5 |
| `better-sqlite3` incompatível | Manter 11.7.0 (tem binário para Node 22); só atualizar se a instalação falhar |
| Plugin de SEO incompatível com a 5.56 | 2.0.9 declara `@strapi/strapi ^5.0.6`; conferir o painel de SEO no passo 5 |
| Mudança de comportamento da API REST | `yarn smoke` + testes de integração + conferência do JSON no passo 5 |

**Volta:** `git restore`/`git revert` dos arquivos + restaurar `data.db` e `uploads` do backup + `yarn install`.

## 6. Fora do escopo (próximas entregas)

- Entrega 2 — cabeçalhos HTTP e CSP com nonce no site.
- Entrega 3 — endurecimento do Strapi (chaves sem valor de reserva, CORS, cabeçalhos, limite de login, permissões).
- Entrega 4 — processo e código (comparação de segredo em tempo constante, `security.txt`, `yarn audit` no checklist de PR, regra de segurança nos MDs).

## 7. Testes

- **Novo:** `dependencias-seguras.test.ts` (característica) — versões mínimas seguras.
- **Existentes:** todos os 634 testes do Next sem alteração + smoke (`yarn smoke`) contra o Strapi atualizado.
- **Manual (com evidência):** painel do Strapi, pré-visualização, conteúdo e guias do editor (passo 5).
